create table if not exists public.custom_puzzle_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'in_review', 'published', 'cancelled', 'refunded')),
  amount_cents integer not null default 5000 check (amount_cents = 5000),
  stripe_session_id text unique,
  title text not null check (char_length(title) between 2 and 120),
  description text,
  image_url text,
  image_path text,
  category text not null default 'Other',
  rarity text not null default 'Rare' check (rarity in ('Rare', 'Epic', 'Legendary')),
  piece_price_cents integer not null check (piece_price_cents > 0),
  market_piece_count integer not null default 1 check (market_piece_count between 1 and 3),
  brand_name text,
  brand_country_code text,
  admin_notes text,
  published_puzzle_id uuid references public.puzzle_catalog(id) on delete set null
);

create index if not exists custom_puzzle_orders_user_id_idx
  on public.custom_puzzle_orders(user_id);

create index if not exists custom_puzzle_orders_status_created_at_idx
  on public.custom_puzzle_orders(status, created_at desc);

alter table public.custom_puzzle_orders enable row level security;

drop policy if exists "custom_puzzle_orders_select_own" on public.custom_puzzle_orders;
create policy "custom_puzzle_orders_select_own"
  on public.custom_puzzle_orders
  for select
  using (auth.uid() = user_id);

drop policy if exists "custom_puzzle_orders_insert_own" on public.custom_puzzle_orders;
create policy "custom_puzzle_orders_insert_own"
  on public.custom_puzzle_orders
  for insert
  with check (auth.uid() = user_id);
