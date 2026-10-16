-- Additional plain-water identities verified during the real picker search.
-- Recovery snapshots: docs/audits/additional-plain-water-before-*.json.
begin;
set local statement_timeout='60s';
insert into public.catalog_ingredients(id,name_common,nutrition_per_100g)
values ('ing_purified_water','Purified Water','{"energy_kcal":0,"protein_g":0,"carbohydrates_g":0,"fats_g":0,"fiber_g":0,"sugar_g":0,"saturated_fat_g":0,"_source":{"basis":"plain unflavoured purified water","method":"justified zero energy-bearing macros; minerals and contaminants unknown","source_ref":"https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html","repair":"plain-water-2026-10-17"}}'::jsonb)
on conflict(id) do nothing;
do $$ begin
 if (select count(*) from public.catalog_recipes where (id='recipe_purified_water' and name_common='Purified Water') or (id='recipe_water_minimum' and name_common='Water Minimum')) <> 2 then
   raise exception 'Additional water identities changed; review required';
 end if;
end $$;
delete from public.catalog_recipe_ingredients where recipe_id in ('recipe_purified_water','recipe_water_minimum');
insert into public.catalog_recipe_ingredients(recipe_id,ingredient_id,ingredient_name,amount_g,unit,is_primary)
values ('recipe_purified_water','ing_purified_water','Purified Water',1000,'g',true),
 ('recipe_water_minimum','ing_purified_water','Plain water (quantity unspecified)',null,'g',true);
with water as (
 select jsonb_object_agg(e.key,e.value) as per100,
   jsonb_object_agg(e.key,to_jsonb((e.value #>> '{}')::numeric * 1.25)) as per125
 from public.catalog_ingredients i cross join lateral jsonb_each(i.nutrition_per_100g) e
 where i.id='ing_purified_water' and jsonb_typeof(e.value)='number'
)
update public.catalog_recipes r set nutrition_per_100g=water.per100,
 nutrition_per_serving=water.per125 || '{"calories":0}'::jsonb,
 calories_per_100g=0,serving_size='125g',servings=8,
 ingredients='[{"name":"Purified Water","amount_g":1000,"unit":"g"}]'::jsonb,
 health_score=null,updated_at=now()
from water where r.id='recipe_purified_water';
-- An "as needed" instruction does not establish a volume. Zero energy-bearing
-- macros do not depend on volume; water mass and minerals must remain unknown.
update public.catalog_recipes set
 nutrition_per_100g='{"energy_kcal":0,"protein_g":0,"carbohydrates_g":0,"fats_g":0,"fiber_g":0,"sugar_g":0}'::jsonb,
 nutrition_per_serving='{"calories":0,"energy_kcal":0,"protein_g":0,"carbohydrates_g":0,"fats_g":0,"fiber_g":0,"sugar_g":0,"_derivation":{"note":"Plain water; quantity unspecified, mass and minerals unknown"}}'::jsonb,
 calories_per_100g=0,serving_size=null,health_score=null,updated_at=now()
where id='recipe_water_minimum';
update public.catalog_recipes r set
 elements_hazardous=(select jsonb_object_agg(h.key,h.value) from jsonb_each(coalesce(r.elements_hazardous,'{}'::jsonb)) h
   where coalesce(h.value->>'source','') not in ('authored_no_ingredient_basis','existing_underivable')),
 dietary_info=coalesce(r.dietary_info,'{}'::jsonb) || '{"keto":true,"low_carb":true,"ingredient_count":1}'::jsonb
where r.id in ('recipe_purified_water','recipe_water_minimum');
commit;
