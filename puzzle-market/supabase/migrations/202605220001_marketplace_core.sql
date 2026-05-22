create extension if not exists pgcrypto;

create table if not exists public.market_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  username text not null unique,
  stripe_account_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_accounts (
  user_id uuid primary key references public.market_profiles(id) on delete cascade,
  balance_cents bigint not null default 0 check (balance_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.market_profiles(id) on delete cascade,
  amount_cents bigint not null check (amount_cents <> 0),
  entry_type text not null check (
    entry_type in (
      'stripe_topup',
      'piece_purchase',
      'piece_sale',
      'payout',
      'refund',
      'adjustment'
    )
  ),
  provider_reference text unique,
  trade_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.puzzle_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  image_url text not null,
  rows integer not null check (rows > 0),
  columns integer not null check (columns > 0),
  missing_piece_count integer not null default 1 check (missing_piece_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.puzzle_pieces (
  id uuid primary key default gen_random_uuid(),
  puzzle_id uuid not null references public.puzzle_catalog(id) on delete cascade,
  piece_index integer not null check (piece_index >= 0),
  shape_seed integer not null default 0,
  is_market_piece boolean not null default false,
  created_at timestamptz not null default now(),
  unique (puzzle_id, piece_index)
);

create table if not exists public.piece_ownership (
  piece_id uuid primary key references public.puzzle_pieces(id) on delete cascade,
  owner_user_id uuid not null references public.market_profiles(id) on delete cascade,
  acquired_at timestamptz not null default now()
);

create table if not exists public.piece_listings (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.puzzle_pieces(id) on delete cascade,
  seller_user_id uuid not null references public.market_profiles(id) on delete cascade,
  price_cents bigint not null check (price_cents > 0),
  status text not null default 'active' check (status in ('active', 'sold', 'cancelled')),
  created_at timestamptz not null default now(),
  sold_at timestamptz
);

create unique index if not exists active_piece_listing
on public.piece_listings (piece_id)
where status = 'active';

create table if not exists public.piece_trades (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.piece_listings(id),
  piece_id uuid not null references public.puzzle_pieces(id),
  buyer_user_id uuid not null references public.market_profiles(id),
  seller_user_id uuid not null references public.market_profiles(id),
  price_cents bigint not null check (price_cents > 0),
  created_at timestamptz not null default now()
);

create or replace function public.touch_wallet_account()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_wallet_account on public.wallet_accounts;
create trigger touch_wallet_account
before update on public.wallet_accounts
for each row execute procedure public.touch_wallet_account();

create or replace function public.ensure_wallet_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallet_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists ensure_wallet_account on public.market_profiles;
create trigger ensure_wallet_account
after insert on public.market_profiles
for each row execute procedure public.ensure_wallet_account();

create or replace function public.credit_wallet_topup(
  p_user_id uuid,
  p_amount_cents bigint,
  p_stripe_session_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_entry_id uuid;
begin
  if p_amount_cents <= 0 then
    raise exception 'topup amount must be positive';
  end if;

  insert into public.wallet_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  insert into public.wallet_ledger_entries (
    user_id,
    amount_cents,
    entry_type,
    provider_reference
  )
  values (
    p_user_id,
    p_amount_cents,
    'stripe_topup',
    p_stripe_session_id
  )
  on conflict (provider_reference) do nothing
  returning id into inserted_entry_id;

  if inserted_entry_id is null then
    return false;
  end if;

  update public.wallet_accounts
  set balance_cents = balance_cents + p_amount_cents
  where user_id = p_user_id;

  return true;
end;
$$;

create or replace function public.purchase_piece_listing(
  p_buyer_id uuid,
  p_listing_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_record public.piece_listings%rowtype;
  buyer_balance bigint;
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

  select balance_cents
  into buyer_balance
  from public.wallet_accounts
  where user_id = p_buyer_id
  for update;

  if buyer_balance is null or buyer_balance < listing_record.price_cents then
    raise exception 'insufficient balance';
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
  set balance_cents = balance_cents - listing_record.price_cents
  where user_id = p_buyer_id;

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
    price_cents
  )
  values (
    listing_record.id,
    listing_record.piece_id,
    p_buyer_id,
    listing_record.seller_user_id,
    listing_record.price_cents
  )
  returning id into trade_id;

  insert into public.wallet_ledger_entries (
    user_id,
    amount_cents,
    entry_type,
    trade_id
  )
  values
    (
      p_buyer_id,
      -listing_record.price_cents,
      'piece_purchase',
      trade_id
    ),
    (
      listing_record.seller_user_id,
      listing_record.price_cents,
      'piece_sale',
      trade_id
    );

  return trade_id;
end;
$$;

alter table public.market_profiles enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_ledger_entries enable row level security;
alter table public.puzzle_catalog enable row level security;
alter table public.puzzle_pieces enable row level security;
alter table public.piece_ownership enable row level security;
alter table public.piece_listings enable row level security;
alter table public.piece_trades enable row level security;

create policy "profiles readable" on public.market_profiles
for select to authenticated using (true);

create policy "profiles insert own row" on public.market_profiles
for insert to authenticated with check (id = auth.uid());

create policy "profiles update own row" on public.market_profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "wallet owner readable" on public.wallet_accounts
for select to authenticated using (user_id = auth.uid());

create policy "ledger owner readable" on public.wallet_ledger_entries
for select to authenticated using (user_id = auth.uid());

create policy "puzzles readable" on public.puzzle_catalog
for select to authenticated using (true);

create policy "pieces readable" on public.puzzle_pieces
for select to authenticated using (true);

create policy "ownership readable" on public.piece_ownership
for select to authenticated using (true);

create policy "listings readable" on public.piece_listings
for select to authenticated using (true);

create policy "trades participants readable" on public.piece_trades
for select to authenticated using (
  buyer_user_id = auth.uid()
  or seller_user_id = auth.uid()
);

revoke all on function public.credit_wallet_topup(uuid, bigint, text) from public;
revoke all on function public.purchase_piece_listing(uuid, uuid) from public;
