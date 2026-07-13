create or replace function public.handle_new_auth_user_market_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fallback_username text;
begin
  if new.email is null or length(trim(new.email)) = 0 then
    return new;
  end if;

  fallback_username :=
    'collector_' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.market_profiles (
    id,
    email,
    username,
    referral_code,
    created_at
  )
  values (
    new.id,
    trim(new.email),
    fallback_username,
    upper(substr(replace(fallback_username, '_', ''), 1, 12))
      || '-' ||
      upper(substr(replace(new.id::text, '-', ''), 1, 8)),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_market_profile_after_auth_signup on auth.users;
create trigger create_market_profile_after_auth_signup
after insert on auth.users
for each row execute procedure public.handle_new_auth_user_market_profile();
