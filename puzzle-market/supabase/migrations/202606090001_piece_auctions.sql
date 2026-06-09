create table if not exists public.auction_lots (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.puzzle_pieces(id) on delete cascade,
  seller_user_id uuid not null references public.market_profiles(id) on delete cascade,
  start_price_cents bigint not null check (start_price_cents > 0),
  status text not null default 'active' check (
    status in ('active', 'accepted', 'cancelled', 'expired')
  ),
  ends_at timestamptz not null,
  accepted_offer_id uuid,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create unique index if not exists active_auction_piece
  on public.auction_lots (piece_id)
  where status = 'active';

create index if not exists auction_lots_status_ends_idx
  on public.auction_lots (status, ends_at);

create table if not exists public.auction_offers (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.auction_lots(id) on delete cascade,
  bidder_user_id uuid not null references public.market_profiles(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'rejected', 'withdrawn')
  ),
  created_at timestamptz not null default now()
);

create unique index if not exists pending_auction_bidder_offer
  on public.auction_offers (lot_id, bidder_user_id)
  where status = 'pending';

create index if not exists auction_offers_lot_amount_idx
  on public.auction_offers (lot_id, amount_cents desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'auction_lots_accepted_offer_id_fkey'
  ) then
    alter table public.auction_lots
      add constraint auction_lots_accepted_offer_id_fkey
      foreign key (accepted_offer_id)
      references public.auction_offers(id);
  end if;
end
$$;

alter table public.auction_lots enable row level security;
alter table public.auction_offers enable row level security;

create or replace function public.accept_auction_offer(
  p_seller_id uuid,
  p_offer_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $accept_auction_offer$
declare
  offer_record public.auction_offers%rowtype;
  lot_record public.auction_lots%rowtype;
  buyer_balance bigint;
  platform_owner_id uuid;
  platform_fee_cents bigint;
  seller_net_cents bigint;
  listing_id uuid;
  trade_id uuid;
begin
  select *
  into offer_record
  from public.auction_offers
  where id = p_offer_id
    and status = 'pending'
  for update;

  if offer_record.id is null then
    raise exception 'offer unavailable';
  end if;

  select *
  into lot_record
  from public.auction_lots
  where id = offer_record.lot_id
    and status = 'active'
  for update;

  if lot_record.id is null then
    raise exception 'auction unavailable';
  end if;

  if lot_record.ends_at <= now() then
    raise exception 'auction has ended';
  end if;

  if lot_record.seller_user_id <> p_seller_id then
    raise exception 'seller mismatch';
  end if;

  if offer_record.bidder_user_id = p_seller_id then
    raise exception 'seller cannot accept own offer';
  end if;

  if offer_record.amount_cents < lot_record.start_price_cents then
    raise exception 'offer is below starting price';
  end if;

  perform 1
  from public.piece_ownership
  where piece_id = lot_record.piece_id
    and owner_user_id = p_seller_id
  for update;

  if not found then
    raise exception 'seller no longer owns piece';
  end if;

  select balance_cents
  into buyer_balance
  from public.wallet_accounts
  where user_id = offer_record.bidder_user_id
  for update;

  if buyer_balance is null or buyer_balance < offer_record.amount_cents then
    raise exception 'buyer has insufficient balance';
  end if;

  select id
  into platform_owner_id
  from public.market_profiles
  where lower(email) in (
    'islommatchanov888@gmail.com',
    'ismatchanov08@gmail.com'
  )
  order by case
    when lower(email) = 'islommatchanov888@gmail.com' then 0
    else 1
  end
  limit 1;

  if platform_owner_id is null then
    raise exception 'platform owner wallet is not configured';
  end if;

  platform_fee_cents := greatest(1, (offer_record.amount_cents + 5) / 10);
  seller_net_cents := offer_record.amount_cents - platform_fee_cents;

  if seller_net_cents <= 0 then
    raise exception 'offer amount is too low';
  end if;

  insert into public.wallet_accounts (user_id)
  values (p_seller_id), (platform_owner_id)
  on conflict (user_id) do nothing;

  update public.piece_listings
  set status = 'cancelled'
  where piece_id = lot_record.piece_id
    and status = 'active';

  insert into public.piece_listings (
    piece_id,
    seller_user_id,
    price_cents,
    status,
    sold_at
  )
  values (
    lot_record.piece_id,
    p_seller_id,
    offer_record.amount_cents,
    'sold',
    now()
  )
  returning id into listing_id;

  update public.wallet_accounts
  set balance_cents = balance_cents - offer_record.amount_cents
  where user_id = offer_record.bidder_user_id;

  update public.wallet_accounts
  set balance_cents = balance_cents + seller_net_cents
  where user_id = p_seller_id;

  update public.wallet_accounts
  set balance_cents = balance_cents + platform_fee_cents
  where user_id = platform_owner_id;

  update public.piece_ownership
  set owner_user_id = offer_record.bidder_user_id,
      acquired_at = now()
  where piece_id = lot_record.piece_id;

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
    listing_id,
    lot_record.piece_id,
    offer_record.bidder_user_id,
    p_seller_id,
    offer_record.amount_cents,
    platform_fee_cents,
    seller_net_cents
  )
  returning id into trade_id;

  update public.auction_offers
  set status = case
    when id = offer_record.id then 'accepted'
    else 'rejected'
  end
  where lot_id = lot_record.id
    and status = 'pending';

  update public.auction_lots
  set status = 'accepted',
      accepted_offer_id = offer_record.id,
      closed_at = now()
  where id = lot_record.id;

  insert into public.wallet_ledger_entries (
    user_id,
    amount_cents,
    entry_type,
    trade_id
  )
  values
    (
      offer_record.bidder_user_id,
      -offer_record.amount_cents,
      'piece_purchase',
      trade_id
    ),
    (
      p_seller_id,
      seller_net_cents,
      'piece_sale',
      trade_id
    ),
    (
      platform_owner_id,
      platform_fee_cents,
      'platform_fee',
      trade_id
    );

  return trade_id;
end;
$accept_auction_offer$;

revoke all on function public.accept_auction_offer(uuid, uuid) from public;
