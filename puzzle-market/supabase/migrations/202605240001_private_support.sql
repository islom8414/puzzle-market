create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.market_profiles(id) on delete cascade,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads(id) on delete cascade,
  sender_user_id uuid references public.market_profiles(id) on delete set null,
  sender_role text not null check (sender_role in ('user', 'admin')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_threads_user_id_idx
on public.support_threads(user_id);

create index if not exists support_messages_thread_id_idx
on public.support_messages(thread_id);

create or replace function public.touch_support_thread()
returns trigger
language plpgsql
as $$
begin
  update public.support_threads
  set updated_at = now()
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists touch_support_thread on public.support_messages;
create trigger touch_support_thread
after insert on public.support_messages
for each row execute procedure public.touch_support_thread();

alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "support own threads readable" on public.support_threads;
create policy "support own threads readable" on public.support_threads
for select to authenticated using (
  user_id = auth.uid()
  or lower(auth.jwt() ->> 'email') in (
    'islommatchanov888@gmail.com',
    'ismatchanov08@gmail.com'
  )
);

drop policy if exists "support own threads insert" on public.support_threads;
create policy "support own threads insert" on public.support_threads
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "support own messages readable" on public.support_messages;
create policy "support own messages readable" on public.support_messages
for select to authenticated using (
  exists (
    select 1
    from public.support_threads thread
    where thread.id = support_messages.thread_id
      and (
        thread.user_id = auth.uid()
        or lower(auth.jwt() ->> 'email') in (
          'islommatchanov888@gmail.com',
          'ismatchanov08@gmail.com'
        )
      )
  )
);

drop policy if exists "support own messages insert" on public.support_messages;
create policy "support own messages insert" on public.support_messages
for insert to authenticated with check (
  sender_user_id = auth.uid()
  and exists (
    select 1
    from public.support_threads thread
    where thread.id = support_messages.thread_id
      and thread.user_id = auth.uid()
  )
);
