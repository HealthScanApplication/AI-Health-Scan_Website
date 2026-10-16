-- Owner copies are link targets, never shared search results until published.
alter table public.catalog_recipes add column if not exists is_published boolean not null default true;
alter table public.catalog_recipes add column if not exists publication_approved_at timestamptz;
create index if not exists food_items_private_recipe_owner on public.food_items(matched_recipe_id,user_id) where matched_recipe_id is not null;
create or replace function public.private_user_recipe_on_insert() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.created_by_user_id is not null or coalesce(new.description,'') ilike 'Promoted from a scan%' then
    if tg_op='INSERT' then new.publication_approved_at := null; end if;
    if new.publication_approved_at is null then new.is_published := false; end if;
  end if;
  return new;
end $$;
drop trigger if exists private_user_recipe_on_insert on public.catalog_recipes;
drop trigger if exists zz_recipe_publication_boundary on public.catalog_recipes;
create trigger zz_recipe_publication_boundary before insert or update on public.catalog_recipes
for each row execute function public.private_user_recipe_on_insert();
alter table public.catalog_recipes enable row level security;
grant select, insert, update on public.catalog_recipes to authenticated;
-- Restrictive policies also constrain older permissive policies (including SELECT true).
drop policy if exists recipe_publication_boundary on public.catalog_recipes;
create policy recipe_publication_boundary on public.catalog_recipes as restrictive for select
using (is_published is true or created_by_user_id = (select auth.uid()) or public.is_catalog_admin());
alter table public.catalog_recipe_ingredients enable row level security;
grant select, insert, update, delete on public.catalog_recipe_ingredients to authenticated;
drop policy if exists recipe_ingredient_privacy_boundary on public.catalog_recipe_ingredients;
create policy recipe_ingredient_privacy_boundary on public.catalog_recipe_ingredients as restrictive for select
using (exists (select 1 from public.catalog_recipes r where r.id = recipe_id));
drop policy if exists own_private_recipe_ingredients on public.catalog_recipe_ingredients;
create policy own_private_recipe_ingredients on public.catalog_recipe_ingredients for all to authenticated
using (exists (select 1 from public.catalog_recipes r where r.id=recipe_id and r.created_by_user_id=auth.uid()))
with check (exists (select 1 from public.catalog_recipes r where r.id=recipe_id and r.created_by_user_id=auth.uid()));
-- Recover legacy scan ownership only when the scan history identifies one owner.
-- Never grant access merely because a caller puts a recipe id on a new scan row.
with owners as (
  select f.matched_recipe_id,min(f.user_id::text)::uuid as owner_id from public.food_items f
  join public.catalog_recipes r on r.id=f.matched_recipe_id
  where r.created_by_user_id is null and coalesce(r.description,'') ilike 'Promoted from a scan%' and f.user_id is not null
  group by f.matched_recipe_id having count(distinct f.user_id)=1
)
update public.catalog_recipes r set created_by_user_id=o.owner_id from owners o where r.id=o.matched_recipe_id;
update public.catalog_recipes set is_published=false where (created_by_user_id is not null or coalesce(description,'') ilike 'Promoted from a scan%') and publication_approved_at is null;

-- Views must honor the caller's recipe access rules too.
do $$ declare v record; begin
  for v in select distinct view_schema,view_name from information_schema.view_table_usage
    where table_schema='public' and table_name='catalog_recipes' and view_schema='public'
  loop execute format('alter view %I.%I set (security_invoker=true)',v.view_schema,v.view_name); end loop;
end $$;
alter table public.catalog_recipe_elements enable row level security;
grant select,insert,update,delete on public.catalog_recipe_elements to authenticated;
drop policy if exists own_private_recipe_elements on public.catalog_recipe_elements;
create policy own_private_recipe_elements on public.catalog_recipe_elements for all to authenticated
using (exists(select 1 from public.catalog_recipes r where r.id=recipe_id and r.created_by_user_id=auth.uid()))
with check (exists(select 1 from public.catalog_recipes r where r.id=recipe_id and r.created_by_user_id=auth.uid()));
drop policy if exists recipe_element_privacy_boundary on public.catalog_recipe_elements;
create policy recipe_element_privacy_boundary on public.catalog_recipe_elements as restrictive for select
using (exists(select 1 from public.catalog_recipes r where r.id=recipe_id));
do $$ declare t text; predicate text; begin
  foreach t in array array['catalog_recipe_ingredients','catalog_recipe_elements'] loop
    predicate := 'public.is_catalog_admin() or exists(select 1 from public.catalog_recipes r where r.id=recipe_id and r.created_by_user_id=(select auth.uid()))';
    execute format('drop policy if exists private_recipe_insert_boundary on public.%I',t);
    execute format('create policy private_recipe_insert_boundary on public.%I as restrictive for insert to authenticated with check (%s)',t,predicate);
    execute format('drop policy if exists private_recipe_update_boundary on public.%I',t);
    execute format('create policy private_recipe_update_boundary on public.%I as restrictive for update to authenticated using (%s) with check (%s)',t,predicate,predicate);
    execute format('drop policy if exists private_recipe_delete_boundary on public.%I',t);
    execute format('create policy private_recipe_delete_boundary on public.%I as restrictive for delete to authenticated using (%s)',t,predicate);
  end loop;
end $$;
notify pgrst, 'reload schema';
