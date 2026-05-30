alter table public.puzzle_catalog
  add column if not exists rarity text not null default 'Rare',
  add column if not exists missing_piece_index integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'puzzle_catalog_rarity_check'
  ) then
    alter table public.puzzle_catalog
      add constraint puzzle_catalog_rarity_check
      check (rarity in ('Rare', 'Epic', 'Legendary'));
  end if;
end $$;

update public.puzzle_catalog
set missing_piece_index = 0
where missing_piece_index is null
  and missing_piece_count = 1;

update public.puzzle_catalog
set missing_piece_count = 1
where missing_piece_count > 1;
