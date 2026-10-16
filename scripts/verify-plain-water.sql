-- Read-only assertions: deliberately fail against the original corrupt data.
do $$
begin
  if (select count(*) from public.catalog_recipes where id in ('recipe_purified_water','recipe_water_minimum')
    and (nutrition_per_serving->>'energy_kcal')::numeric=0
    and (nutrition_per_serving->>'protein_g')::numeric=0
    and (nutrition_per_serving->>'carbohydrates_g')::numeric=0
    and (nutrition_per_serving->>'fats_g')::numeric=0) <> 2 then
    raise exception 'Purified Water and Water Minimum must not carry fabricated macros';
  end if;
  if not exists (select 1 from public.catalog_recipes where id='recipe_spring_water'
    and not is_group and servings=2 and serving_size='500g'
    and (nutrition_per_serving->>'energy_kcal')::numeric=0
    and (nutrition_per_serving->>'protein_g')::numeric=0
    and (nutrition_per_serving->>'carbohydrates_g')::numeric=0
    and (nutrition_per_serving->>'fats_g')::numeric=0
    and (nutrition_per_100g->>'energy_kcal')::numeric=0) then
    raise exception 'Spring Water must have consistent zero macros and 500g servings';
  end if;
  if (select count(*) from public.catalog_recipe_ingredients where recipe_id='recipe_spring_water') <> 1
    or not exists (select 1 from public.catalog_recipe_ingredients where recipe_id='recipe_spring_water' and ingredient_id='ing_spring_water' and amount_g=1000) then
    raise exception 'Spring Water must contain only 1000g of spring water';
  end if;
  if not exists (select 1 from public.catalog_recipes where id='recipe_water' and is_group
    and nutrition_per_serving is null and nutrition_per_100g is null and calories_per_100g is null)
    or exists (select 1 from public.catalog_recipe_ingredients where recipe_id='recipe_water') then
    raise exception 'Water category must not carry a fabricated edible formula';
  end if;
end $$;
select id,is_group,serving_size,nutrition_per_serving from public.catalog_recipes where id in ('recipe_water','recipe_spring_water');
