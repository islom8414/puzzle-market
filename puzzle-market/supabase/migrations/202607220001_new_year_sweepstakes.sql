alter table public.market_profiles
  add column if not exists sweepstakes_entered_at timestamptz;

alter table public.market_profiles
  drop constraint if exists market_profiles_subscription_tier_check;

alter table public.market_profiles
  add constraint market_profiles_subscription_tier_check
  check (
    subscription_tier in (
      'free',
      'starter',
      'premium',
      'creator',
      'sweepstakes'
    )
  );

create index if not exists market_profiles_sweepstakes_entered_at_idx
  on public.market_profiles (sweepstakes_entered_at);
