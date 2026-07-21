drop policy if exists "profiles readable" on public.market_profiles;
drop policy if exists "profiles own readable" on public.market_profiles;

create policy "profiles own readable" on public.market_profiles
for select
to authenticated
using (id = auth.uid());
