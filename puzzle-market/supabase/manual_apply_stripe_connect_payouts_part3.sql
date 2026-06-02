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
