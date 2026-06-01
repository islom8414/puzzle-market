create table if not exists public.wallet_withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.market_profiles(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  method text not null check (
    method in (
      'visa_card',
      'bank_transfer',
      'paypal',
      'usdt'
    )
  ),
  destination_label text not null,
  status text not null default 'pending' check (
    status in (
      'pending',
      'processing',
      'paid',
      'rejected',
      'cancelled'
    )
  ),
  ledger_entry_id uuid references public.wallet_ledger_entries(id),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_wallet_withdrawal_request()
returns trigger
language plpgsql
as $touch_wallet_withdrawal_request$
begin
  new.updated_at = now();
  return new;
end;
$touch_wallet_withdrawal_request$;

drop trigger if exists touch_wallet_withdrawal_request on public.wallet_withdrawal_requests;

create trigger touch_wallet_withdrawal_request
before update on public.wallet_withdrawal_requests
for each row execute procedure public.touch_wallet_withdrawal_request();

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

  if p_method not in ('visa_card', 'bank_transfer', 'paypal', 'usdt') then
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

alter table public.wallet_withdrawal_requests enable row level security;

drop policy if exists "withdrawal owner readable" on public.wallet_withdrawal_requests;

create policy "withdrawal owner readable" on public.wallet_withdrawal_requests
for select to authenticated using (user_id = auth.uid());

revoke all on function public.request_wallet_withdrawal(uuid, bigint, text, text) from public;
