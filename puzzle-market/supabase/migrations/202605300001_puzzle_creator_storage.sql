-- Public fragments bucket for puzzle artwork (uploads use service role via API).
insert into storage.buckets (id, name, public)
values ('fragments', 'fragments', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "fragments public read" on storage.objects;

create policy "fragments public read"
on storage.objects
for select
using (bucket_id = 'fragments');
