alter table public.piece_listings
  add column if not exists price_growth_bps integer,
  add column if not exists last_indexed_month date;

create table if not exists public.piece_price_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.piece_listings(id) on delete cascade,
  piece_id uuid not null references public.puzzle_pieces(id) on delete cascade,
  price_cents bigint not null check (price_cents > 0),
  previous_price_cents bigint check (previous_price_cents is null or previous_price_cents > 0),
  growth_bps integer check (growth_bps is null or growth_bps >= 0),
  reason text not null check (reason in ('created', 'manual_update', 'resale', 'monthly_index', 'current')),
  effective_month date not null,
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists piece_price_history_once_per_reason
on public.piece_price_history (listing_id, effective_month, reason);

create index if not exists piece_price_history_listing_time
on public.piece_price_history (listing_id, effective_at);

create or replace function public.piece_price_growth_bps(
  p_price_cents bigint
)
returns integer
language sql
immutable
as $$
  select case
    when p_price_cents <= 1000 then 500
    when p_price_cents <= 10000 then 700
    else 900
  end
$$;

create or replace function public.record_piece_listing_price(
  p_listing_id uuid,
  p_reason text default 'manual_update'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_record public.piece_listings%rowtype;
begin
  select *
  into listing_record
  from public.piece_listings
  where id = p_listing_id;

  if listing_record.id is null then
    return;
  end if;

  insert into public.piece_price_history (
    listing_id,
    piece_id,
    price_cents,
    previous_price_cents,
    growth_bps,
    reason,
    effective_month,
    effective_at
  )
  values (
    listing_record.id,
    listing_record.piece_id,
    listing_record.price_cents,
    null,
    public.piece_price_growth_bps(listing_record.price_cents),
    p_reason,
    date_trunc('month', now())::date,
    now()
  )
  on conflict (listing_id, effective_month, reason)
  do update set
    price_cents = excluded.price_cents,
    growth_bps = excluded.growth_bps,
    effective_at = excluded.effective_at;
end;
$$;

create or replace function public.index_piece_listing_prices(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  indexed_count integer := 0;
  month_start date := date_trunc('month', p_now)::date;
begin
  with due as (
    select
      id,
      piece_id,
      price_cents as previous_price_cents,
      public.piece_price_growth_bps(price_cents) as growth_bps
    from public.piece_listings
    where status = 'active'
      and coalesce(
        last_indexed_month,
        date_trunc('month', created_at)::date
      ) < month_start
    for update
  ),
  updated as (
    update public.piece_listings listings
    set
      price_cents = greatest(
        due.previous_price_cents + 1,
        round(
          due.previous_price_cents *
          (1 + due.growth_bps::numeric / 10000)
        )::bigint
      ),
      price_growth_bps = due.growth_bps,
      last_indexed_month = month_start
    from due
    where listings.id = due.id
    returning
      listings.id,
      listings.piece_id,
      due.previous_price_cents,
      listings.price_cents,
      due.growth_bps
  ),
  inserted as (
    insert into public.piece_price_history (
      listing_id,
      piece_id,
      price_cents,
      previous_price_cents,
      growth_bps,
      reason,
      effective_month,
      effective_at
    )
    select
      id,
      piece_id,
      price_cents,
      previous_price_cents,
      growth_bps,
      'monthly_index',
      month_start,
      p_now
    from updated
    on conflict (listing_id, effective_month, reason)
    do nothing
    returning id
  )
  select count(*) into indexed_count
  from inserted;

  return indexed_count;
end;
$$;

insert into public.piece_price_history (
  listing_id,
  piece_id,
  price_cents,
  previous_price_cents,
  growth_bps,
  reason,
  effective_month,
  effective_at
)
select
  id,
  piece_id,
  price_cents,
  null,
  public.piece_price_growth_bps(price_cents),
  'created',
  date_trunc('month', created_at)::date,
  created_at
from public.piece_listings
on conflict (listing_id, effective_month, reason)
do nothing;

alter table public.piece_price_history enable row level security;

drop policy if exists "price history readable" on public.piece_price_history;
create policy "price history readable" on public.piece_price_history
for select to authenticated, anon using (true);

revoke all on function public.index_piece_listing_prices(timestamptz) from public;
revoke all on function public.record_piece_listing_price(uuid, text) from public;

