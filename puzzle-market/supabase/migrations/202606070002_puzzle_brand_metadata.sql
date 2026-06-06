alter table public.puzzle_catalog
  add column if not exists brand_name text,
  add column if not exists brand_country_code text,
  add column if not exists category text;

alter table public.puzzle_catalog
  drop constraint if exists puzzle_catalog_brand_name_length_check,
  add constraint puzzle_catalog_brand_name_length_check
    check (brand_name is null or char_length(brand_name) between 1 and 80);

alter table public.puzzle_catalog
  drop constraint if exists puzzle_catalog_brand_country_code_check,
  add constraint puzzle_catalog_brand_country_code_check
    check (
      brand_country_code is null
      or brand_country_code = 'GLOBAL'
      or brand_country_code ~ '^[A-Z]{2}$'
    );

create index if not exists puzzle_catalog_brand_country_idx
  on public.puzzle_catalog (brand_country_code);

create index if not exists puzzle_catalog_brand_name_idx
  on public.puzzle_catalog (lower(brand_name));
