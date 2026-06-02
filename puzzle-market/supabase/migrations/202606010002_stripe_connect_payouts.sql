alter table public.wallet_withdrawal_requests
  add column if not exists provider_reference text,
  add column if not exists provider_transfer_reference text,
  add column if not exists provider_error text,
  add column if not exists paid_at timestamptz;

alter table public.wallet_withdrawal_requests
  drop constraint if exists wallet_withdrawal_requests_method_check;

alter table public.wallet_withdrawal_requests
  add constraint wallet_withdrawal_requests_method_check check (
    method in (
      'visa_card',
      'bank_transfer',
      'paypal',
      'usdt',
      'stripe_instant',
      'stripe_standard'
    )
  );

alter table public.wallet_withdrawal_requests
  drop constraint if exists wallet_withdrawal_requests_status_check;

alter table public.wallet_withdrawal_requests
  add constraint wallet_withdrawal_requests_status_check check (
    status in (
      'pending',
      'processing',
      'paid',
      'rejected',
      'cancelled',
      'failed'
    )
  );

create or replace function public.request_wallet_withdrawal(
  p_user_id uuid,
  p_amount_cents bigint,
  p_method text,
  p_destination_label text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $request_wallet_withdrawal$
declare
  current_balance bigint;
  new_ledger_entry_id uuid;
  new_request_id uuid;
begin
  if p_amount_cents < 100 then
    raise exception 'minimum withdrawal is $1';
  end if;

  if p_method not in (
    'visa_card',
    'bank_transfer',
    'paypal',
    'usdt',
    'stripe_instant',
    'stripe_standard'
  ) then
    raise exception 'unsupported withdrawal method';
  end if;

  if length(trim(p_destination_label)) < 4 then
    raise exception 'withdrawal destination is required';
  end if;

  insert into public.wallet_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select balance_cents
  into current_balance
  from public.wallet_accounts
  where user_id = p_user_id
  for update;

  if current_balance is null or current_balance < p_amount_cents then
    raise exception 'insufficient balance';
  end if;

  update public.wallet_accounts
  set balance_cents = balance_cents - p_amount_cents
  where user_id = p_user_id;

  insert into public.wallet_ledger_entries (
    user_id,
    amount_cents,
    entry_type
  )
  values (
    p_user_id,
    -p_amount_cents,
    'payout'
  )
  returning id into new_ledger_entry_id;

  insert into public.wallet_withdrawal_requests (
    user_id,
    amount_cents,
    method,
    destination_label,
    ledger_entry_id
  )
  values (
    p_user_id,
    p_amount_cents,
    p_method,
    trim(p_destination_label),
    new_ledger_entry_id
  )
  returning id into new_request_id;

  return new_request_id;
end;
$request_wallet_withdrawal$;

create or replace function public.complete_wallet_withdrawal(
  p_withdrawal_id uuid,
  p_provider_reference text,
  p_provider_transfer_reference text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $complete_wallet_withdrawal$
begin
  update public.wallet_withdrawal_requests
  set status = 'paid',
      provider_reference = p_provider_reference,
      provider_transfer_reference = p_provider_transfer_reference,
      paid_at = now(),
      provider_error = null
  where id = p_withdrawal_id
    and status in ('pending', 'processing');

  return found;
end;
$complete_wallet_withdrawal$;

create or replace function public.fail_wallet_withdrawal_and_refund(
  p_withdrawal_id uuid,
  p_provider_error text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $fail_wallet_withdrawal_and_refund$
declare
  withdrawal_record public.wallet_withdrawal_requests%rowtype;
begin
  select *
  into withdrawal_record
  from public.wallet_withdrawal_requests
  where id = p_withdrawal_id
  for update;

  if withdrawal_record.id is null then
    return false;
  end if;

  if withdrawal_record.status not in ('pending', 'processing') then
    return false;
  end if;

  update public.wallet_withdrawal_requests
  set status = 'failed',
      provider_error = left(p_provider_error, 500)
  where id = p_withdrawal_id;

  update public.wallet_accounts
  set balance_cents = balance_cents + withdrawal_record.amount_cents
  where user_id = withdrawal_record.user_id;

  insert into public.wallet_ledger_entries (
    user_id,
    amount_cents,
    entry_type,
    provider_reference
  )
  values (
    withdrawal_record.user_id,
    withdrawal_record.amount_cents,
    'refund',
    'withdrawal_refund:' || withdrawal_record.id::text
  )
  on conflict (provider_reference) do nothing;

  return true;
end;
$fail_wallet_withdrawal_and_refund$;

revoke all on function public.complete_wallet_withdrawal(uuid, text, text) from public;
revoke all on function public.fail_wallet_withdrawal_and_refund(uuid, text) from public;
