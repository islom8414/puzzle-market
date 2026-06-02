alter table public.piece_trades
  add column if not exists platform_fee_cents bigint not null default 0 check (platform_fee_cents >= 0),
  add column if not exists seller_net_cents bigint not null default 0 check (seller_net_cents >= 0);

alter table public.wallet_ledger_entries
  drop constraint if exists wallet_ledger_entries_entry_type_check;

alter table public.wallet_ledger_entries
  add constraint wallet_ledger_entries_entry_type_check check (
    entry_type in (
      'stripe_topup',
      'piece_purchase',
      'piece_sale',
      'platform_fee',
      'payout',
      'refund',
      'adjustment'
    )
  );

create or replace function public.purchase_piece_listing(
  p_buyer_id uuid,
  p_listing_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $purchase_piece_listing$
declare
  listing_record public.piece_listings%rowtype;
  buyer_balance bigint;
  trade_id uuid;
  platform_owner_id uuid;
  platform_fee_cents bigint;
  seller_net_cents bigint;
begin
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

  platform_fee_cents := greatest(
    1,
    listing_record.price_cents / 10
  );
  seller_net_cents := listing_record.price_cents - platform_fee_cents;

  if seller_net_cents <= 0 then
    raise exception 'listing price is too low';
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
  values (listing_record.seller_user_id), (platform_owner_id)
  on conflict (user_id) do nothing;

  update public.wallet_accounts
  set balance_cents = balance_cents - listing_record.price_cents
  where user_id = p_buyer_id;

  update public.wallet_accounts
  set balance_cents = balance_cents + seller_net_cents
  where user_id = listing_record.seller_user_id;

  update public.wallet_accounts
  set balance_cents = balance_cents + platform_fee_cents
  where user_id = platform_owner_id;

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
    platform_fee_cents,
    seller_net_cents
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
$purchase_piece_listing$;

revoke all on function public.purchase_piece_listing(uuid, uuid) from public;
