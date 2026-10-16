-- Only the audited Water category and plain Spring Water recipe are in scope.
-- Before snapshots: docs/audits/plain-water-before-*-2026-10-17.json.
-- No flavoured waters, other recipes, user plans, or payment configuration change.
begin;
set local statement_timeout = '60s';
do $$
begin
  if not exists(select 1 from public.catalog_recipes where id='recipe_water' and is_group)
    or not exists(select 1 from public.catalog_recipes where id='recipe_spring_water' and not is_group and name_common='Spring Water') then
    raise exception 'Water identities changed; review before applying this repair';
  end if;
end $$;

-- Production lacks the existing staging spring-water ingredient. Supply only
-- justified zero energy-bearing macros, not invented minerals or hazard absence.
insert into public.catalog_ingredients(id,name_common,nutrition_per_100g)
values ('ing_spring_water','Spring Water', jsonb_build_object(
  'energy_kcal',0,'protein_g',0,'carbohydrates_g',0,'fats_g',0,
  'fiber_g',0,'sugar_g',0,'saturated_fat_g',0,
  '_source',jsonb_build_object('basis','plain unflavoured spring water',
    'method','justified zero energy-bearing macronutrients; mineral and contaminant composition unknown',
    'source_ref','https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html',
    'repair','plain-water-2026-10-17')))
on conflict (id) do nothing;

-- Water is a category, not an edible recipe. Its tea/salt links are not a formula.
delete from public.catalog_recipe_ingredients where recipe_id in ('recipe_water','recipe_spring_water');
insert into public.catalog_recipe_ingredients(recipe_id,ingredient_id,ingredient_name,amount_g,unit,is_primary)
values ('recipe_spring_water','ing_spring_water','Spring Water',1000,'g',true);

-- Rebuild stored serving nutrition as well as per-100g nutrition; the planner
-- reads serving values while ingredient insights read the canonical junction.
with water as (
 select jsonb_object_agg(e.key,e.value) as per100,
   jsonb_object_agg(e.key,to_jsonb((e.value #>> '{}')::numeric * 5)) as per500
 from public.catalog_ingredients i cross join lateral jsonb_each(i.nutrition_per_100g) e
 where i.id='ing_spring_water' and jsonb_typeof(e.value)='number'
)
update public.catalog_recipes r set
 nutrition_per_100g=water.per100 || jsonb_build_object('_derivation',jsonb_build_object(
   'source','catalog_recipe_ingredients x catalog_ingredients','ingredient_id','ing_spring_water',
   'total_mass_g',1000,'servings',2,'repair','plain-water-2026-10-17')),
 nutrition_per_serving=water.per500 || '{"calories":0}'::jsonb,
 calories_per_100g=0,servings=2,serving_size='500g',
 ingredients='[{"name":"Spring Water","amount_g":1000,"unit":"g"}]'::jsonb,
 description='Plain unflavoured spring water. Nutrition uses the linked reference ingredient; actual mineral and contaminant levels depend on the water source.',
 description_simple='Plain unflavoured spring water.',
 health_score=null,
 elements_hazardous=(select jsonb_object_agg(h.key,h.value) from jsonb_each(coalesce(r.elements_hazardous,'{}'::jsonb)) h
   where coalesce(h.value->>'source','') not in ('authored_no_ingredient_basis','existing_underivable')),
 dietary_info=coalesce(r.dietary_info,'{}'::jsonb) || '{"keto":true,"low_carb":true,"ingredient_count":1}'::jsonb,
 updated_at=now()
from water where r.id='recipe_spring_water';

update public.catalog_recipes set nutrition_per_100g=null,nutrition_per_serving=null,
 calories_per_100g=null,elements_beneficial=null,elements_hazardous=null,
 ingredients='[]'::jsonb,linked_ingredients='[]'::jsonb,serving_size=null,health_score=null,
 dietary_info='{"source":"category_not_recipe","needs_curation":true}'::jsonb,
 updated_at=now() where id='recipe_water' and is_group;
commit;
