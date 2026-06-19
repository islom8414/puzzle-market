alter table public.market_profiles
  add column if not exists referral_code text,
  add column if not exists referred_by_user_id uuid references public.market_profiles(id),
  add column if not exists referral_applied_at timestamptz;

create unique index if not exists market_profiles_referral_code_idx
on public.market_profiles (referral_code)
where referral_code is not null;

create index if not exists market_profiles_referred_by_idx
on public.market_profiles (referred_by_user_id);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.market_profiles(id) on delete cascade,
  threshold_count integer not null check (threshold_count > 0),
  qualified_count integer not null default 0 check (qualified_count >= 0),
  reward_cents bigint not null check (reward_cents > 0),
  remaining_cents bigint not null check (remaining_cents >= 0),
  status text not null default 'active' check (status in ('active', 'used', 'cancelled')),
  used_trade_id uuid references public.piece_trades(id),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  unique (user_id, threshold_count)
);

create index if not exists referral_rewards_user_status_idx
on public.referral_rewards (user_id, status, created_at);

alter table public.referral_rewards enable row level security;

drop policy if exists "referral rewards own readable" on public.referral_rewards;
create policy "referral rewards own readable"
on public.referral_rewards
for select
using (user_id = auth.uid());

create or replace function public.purchase_piece_listing_with_referral_reward(
  p_buyer_id uuid,
  p_listing_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $purchase_piece_listing_with_referral_reward$
declare
  listing_record public.piece_listings%rowtype;
  reward_record public.referral_rewards%rowtype;
  trade_id uuid;
begin
  select *
  into listing_record
  from public.piece_listings
  where id = p_listing_id
    and status = 'active'
  for update;

  if listing_record.id is null then
    raise exception 'listing unavailable';
  end if;

  if listing_record.seller_user_id = p_buyer_id then
    raise exception 'seller cannot buy own piece';
  end if;

  select *
  into reward_record
  from public.referral_rewards
  where user_id = p_buyer_id
    and status = 'active'
    and remaining_cents >= listing_record.price_cents
  order by threshold_count asc, created_at asc
  limit 1
  for update;

  if reward_record.id is null then
    raise exception 'no referral reward available for this price';
  end if;

  perform 1
  from public.piece_ownership
  where piece_id = listing_record.piece_id
    and owner_user_id = listing_record.seller_user_id
  for update;

  if not found then
    raise exception 'seller no longer owns piece';
  end if;

  insert into public.wallet_accounts (user_id)
  values (listing_record.seller_user_id)
  on conflict (user_id) do nothing;

  update public.wallet_accounts
  set balance_cents = balance_cents + listing_record.price_cents
  where user_id = listing_record.seller_user_id;

  update public.piece_ownership
  set owner_user_id = p_buyer_id,
      acquired_at = now()
  where piece_id = listing_record.piece_id;

  update public.piece_listings
  set status = 'sold',
      sold_at = now()
  where id = listing_record.id;

  insert into public.piece_trades (
    listing_id,
    piece_id,
    buyer_user_id,
    seller_user_id,
    price_cents,
    platform_fee_cents,
    seller_net_cents
  )
  values (
    listing_record.id,
    listing_record.piece_id,
    p_buyer_id,
    listing_record.seller_user_id,
    listing_record.price_cents,
    0,
    listing_record.price_cents
  )
  returning id into trade_id;

  update public.referral_rewards
  set remaining_cents = remaining_cents - listing_record.price_cents,
      status = case
        when remaining_cents - listing_record.price_cents <= 0 then 'used'
        else 'active'
      end,
      used_trade_id = case
        when remaining_cents - listing_record.price_cents <= 0 then trade_id
        else used_trade_id
      end,
      used_at = case
        when remaining_cents - listing_record.price_cents <= 0 then now()
        else used_at
      end
  where id = reward_record.id;

  insert into public.wallet_ledger_entries (
    user_id,
    amount_cents,
    entry_type,
    trade_id
  )
  values (
    listing_record.seller_user_id,
    listing_record.price_cents,
    'piece_sale',
    trade_id
  );

  return trade_id;
end;
$purchase_piece_listing_with_referral_reward$;

revoke all on function public.purchase_piece_listing_with_referral_reward(uuid, uuid) from public;
