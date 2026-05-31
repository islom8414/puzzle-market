create table if not exists public.chat (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.market_profiles(id) on delete set null,
  username text not null,
  message text not null check (char_length(message) <= 600),
  created_at timestamptz not null default now()
);

create index if not exists chat_created_at_idx
  on public.chat(created_at desc);

alter table public.chat enable row level security;

create policy "chat readable"
  on public.chat
  for select
  to authenticated
  using (true);

create policy "chat insert own"
  on public.chat
  for insert
  to authenticated
  with check (
    user_id is null
    or user_id = auth.uid()
  );
