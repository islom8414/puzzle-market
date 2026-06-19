create table if not exists public.piece_gifts (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.puzzle_pieces(id) on delete cascade,
  sender_user_id uuid not null references public.market_profiles(id) on delete cascade,
  recipient_email text not null,
  recipient_user_id uuid references public.market_profiles(id) on delete set null,
  gift_token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'cancelled', 'expired')),
  message text,
  claimed_trade_id uuid references public.piece_trades(id),
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  expires_at timestamptz not null default now() + interval '30 days'
);

create unique index if not exists piece_gifts_one_pending_piece_idx
on public.piece_gifts(piece_id)
where status = 'pending';

create index if not exists piece_gifts_recipient_email_idx
on public.piece_gifts(lower(recipient_email))
where status = 'pending';

alter table public.piece_gifts enable row level security;

drop policy if exists "gift sender readable" on public.piece_gifts;
create policy "gift sender readable"
on public.piece_gifts
for select
using (sender_user_id = auth.uid());

drop policy if exists "gift recipient readable" on public.piece_gifts;
create policy "gift recipient readable"
on public.piece_gifts
for select
using (recipient_user_id = auth.uid());

create or replace function public.claim_piece_gift(
  p_recipient_id uuid,
  p_recipient_email text,
  p_gift_token text
)
returns table (
  gift_id uuid,
  trade_id uuid,
  piece_id uuid,
  puzzle_title text,
  puzzle_slug text,
  piece_index integer
)
language plpgsql
security definer
set search_path = public
as $claim_piece_gift$
declare
  gift_record public.piece_gifts%rowtype;
  owner_record public.piece_ownership%rowtype;
  recipient_profile public.market_profiles%rowtype;
  gift_listing_id uuid;
  gift_trade_id uuid;
  catalog_record record;
begin
  select *
  into recipient_profile
  from public.market_profiles
  where id = p_recipient_id
    and subscription_tier in ('starter', 'premium', 'creator')
    and subscription_status in ('active', 'trialing');

  if not found then
    raise exception 'active subscription required';
  end if;

  select *
  into gift_record
  from public.piece_gifts
  where gift_token = p_gift_token
    and status = 'pending'
  for update;

  if not found then
    raise exception 'gift not found';
  end if;

  if gift_record.expires_at <= now() then
    update public.piece_gifts
    set status = 'expired'
    where id = gift_record.id;

    raise exception 'gift expired';
  end if;

  if lower(gift_record.recipient_email) <> lower(p_recipient_email) then
    raise exception 'gift email does not match this account';
  end if;

  select *
  into owner_record
  from public.piece_ownership
  where piece_id = gift_record.piece_id
  for update;

  if not found or owner_record.owner_user_id <> gift_record.sender_user_id then
    raise exception 'sender no longer owns this piece';
  end if;

  update public.piece_listings
  set status = 'cancelled'
  where piece_id = gift_record.piece_id
    and status = 'active';

  insert into public.piece_listings (
    piece_id,
    seller_user_id,
    price_cents,
    status,
    sold_at
  )
  values (
    gift_record.piece_id,
    gift_record.sender_user_id,
    1,
    'sold',
    now()
  )
  returning id into gift_listing_id;

  update public.piece_ownership
  set owner_user_id = p_recipient_id,
      acquired_at = now()
  where piece_id = gift_record.piece_id;

  insert into public.piece_trades (
    listing_id,
    piece_id,
    buyer_user_id,
    seller_user_id,
    price_cents
  )
  values (
    gift_listing_id,
    gift_record.piece_id,
    p_recipient_id,
    gift_record.sender_user_id,
    1
  )
  returning id into gift_trade_id;

  update public.piece_gifts
  set status = 'claimed',
      recipient_user_id = p_recipient_id,
      claimed_trade_id = gift_trade_id,
      claimed_at = now()
  where id = gift_record.id;

  select
    pc.title,
    pc.slug,
    pp.piece_index
  into catalog_record
  from public.puzzle_pieces pp
  join public.puzzle_catalog pc on pc.id = pp.puzzle_id
  where pp.id = gift_record.piece_id;

  return query
  select
    gift_record.id,
    gift_trade_id,
    gift_record.piece_id,
    catalog_record.title::text,
    catalog_record.slug::text,
    catalog_record.piece_index::integer;
end;
$claim_piece_gift$;

revoke all on function public.claim_piece_gift(uuid, text, text) from public;
grant execute
on function public.claim_piece_gift(uuid, text, text)
to service_role;
