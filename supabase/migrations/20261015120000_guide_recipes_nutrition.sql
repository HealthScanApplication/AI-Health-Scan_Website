-- AI recipe builder: servings, timings and database-calculated nutrition on Guardian recipes,
-- plus the recipe-book offers each recipe belongs to. Field names mirror catalog_recipes.
alter table public.guide_recipes
  add column if not exists servings integer,
  add column if not exists prep_time integer,
  add column if not exists cook_time integer,
  add column if not exists nutrition_per_serving jsonb,
  add column if not exists nutrition_total jsonb,
  add column if not exists offer_ids uuid[] not null default '{}';

create index if not exists guide_recipes_offer_ids_idx on public.guide_recipes using gin (offer_ids);
