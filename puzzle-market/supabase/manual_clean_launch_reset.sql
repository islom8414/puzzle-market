-- Manual launch cleanup.
-- Run this in Supabase SQL Editor only when you want to remove test content.
-- It keeps auth users and market_profiles, but clears test puzzles, listings,
-- ownership records, chats, support tickets, and test wallet balances.

begin;

delete from public.piece_trades;
delete from public.piece_listings;
delete from public.piece_ownership;
delete from public.puzzle_pieces;
delete from public.puzzle_catalog;

delete from public.wallet_ledger_entries;
update public.wallet_accounts
set balance_cents = 0;

do $$
begin
  if to_regclass('public.marketplace') is not null then
    delete from public.marketplace;
  end if;

  if to_regclass('public.inventory') is not null then
    delete from public.inventory;
  end if;

  if to_regclass('public.transactions') is not null then
    delete from public.transactions;
  end if;

  if to_regclass('public.activity') is not null then
    delete from public.activity;
  end if;

  if to_regclass('public.chat') is not null then
    delete from public.chat;
  end if;

  if to_regclass('public.support_messages') is not null then
    delete from public.support_messages;
  end if;

  if to_regclass('public.support_threads') is not null then
    delete from public.support_threads;
  end if;

  if to_regclass('public.wallets') is not null then
    update public.wallets
    set balance = 0;
  end if;
end $$;

commit;
