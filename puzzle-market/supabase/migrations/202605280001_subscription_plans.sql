alter table public.market_profiles
  add column if not exists subscription_tier text not null default 'free',
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists subscription_updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'market_profiles_subscription_tier_check'
  ) then
    alter table public.market_profiles
      add constraint market_profiles_subscription_tier_check
      check (subscription_tier in ('free', 'starter', 'premium', 'creator'));
  end if;
end $$;

create unique index if not exists market_profiles_stripe_customer_id_idx
  on public.market_profiles(stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists market_profiles_stripe_subscription_id_idx
  on public.market_profiles(stripe_subscription_id)
  where stripe_subscription_id is not null;

create or replace function public.prevent_client_subscription_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() = old.id then
    if new.subscription_tier is distinct from old.subscription_tier
      or new.subscription_status is distinct from old.subscription_status
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
      or new.subscription_current_period_end is distinct from old.subscription_current_period_end then
      raise exception 'subscription fields are managed by server';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_client_subscription_edit on public.market_profiles;

create trigger prevent_client_subscription_edit
before update on public.market_profiles
for each row
execute procedure public.prevent_client_subscription_edit();
