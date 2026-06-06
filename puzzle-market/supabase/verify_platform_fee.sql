select
  t.id as trade_id,
  t.created_at,
  t.price_cents,
  t.platform_fee_cents,
  t.seller_net_cents,
  round(t.price_cents * 0.10) as expected_fee_cents,
  t.platform_fee_cents = round(t.price_cents * 0.10) as fee_is_correct,
  p.email as platform_owner_email,
  l.amount_cents as credited_fee_cents
from public.piece_trades t
left join public.wallet_ledger_entries l
  on l.trade_id = t.id
 and l.entry_type = 'platform_fee'
left join public.market_profiles p
  on p.id = l.user_id
order by t.created_at desc
limit 50;
