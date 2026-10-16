-- Preserve catalogue nutrient/hazard data when opening a private recipe editor.
create or replace function public.customize_protocol_recipe(p_protocol uuid, p_item uuid) returns public.guide_recipes
language plpgsql security invoker set search_path = public as $$
declare item public.protocol_items; source public.catalog_recipes; result public.guide_recipes;
  scope_id uuid; new_recipe_id text := gen_random_uuid()::text; copied jsonb; ingredients_json jsonb; junction record; previous_skip text;
begin
  perform 1 from public.catalog_protocols where id=p_protocol and user_id=auth.uid() for update;
  if not found then raise exception 'Protocol is not owned by this user'; end if;
  select * into item from public.protocol_items where id=p_item and protocol_id=p_protocol;
  if not found or item.catalog_recipe_id is null then raise exception 'Select a linked recipe'; end if;
  if item.source_child_protocol_id is not null then
    if not exists(select 1 from public.protocol_children where child_protocol_id=item.source_child_protocol_id and parent_protocol_id=p_protocol and owner_id=auth.uid()) then
      raise exception 'Child recipe is not attached to this parent';
    end if;
    p_protocol := item.source_child_protocol_id;
  end if;
  select coalesce((select parent_protocol_id from public.protocol_children where child_protocol_id=p_protocol),p_protocol) into scope_id;
  select * into result from public.guide_recipes where catalog_recipe_id=item.catalog_recipe_id and guide_id=auth.uid() and parent_protocol_id=scope_id;
  if found then return result; end if;
  select * into source from public.catalog_recipes where id=item.catalog_recipe_id;
  if not found then raise exception 'Recipe is not available to this user'; end if;
  copied := to_jsonb(source) || jsonb_build_object('id',new_recipe_id,'created_by_user_id',auth.uid(),
    'cloned_from_recipe_id',source.id,'is_published',false,'publication_approved_at',null,'created_at',now(),'updated_at',now(),
    'health_score_status','PROVISIONAL','nutrition_per_100g',jsonb_set(case when jsonb_typeof(source.nutrition_per_100g)='object' then source.nutrition_per_100g else '{}'::jsonb end,'{_derivation}',
      (case when jsonb_typeof(source.nutrition_per_100g->'_derivation')='object' then source.nutrition_per_100g->'_derivation' else '{}'::jsonb end) || '{"needs_curation":true}'::jsonb));
  insert into public.catalog_recipes select (jsonb_populate_record(null::public.catalog_recipes,copied)).*;
  previous_skip := current_setting('fv1.skip_recipe_recompute',true);
  perform set_config('fv1.skip_recipe_recompute','on',true);
  for junction in select * from public.catalog_recipe_ingredients where recipe_id=source.id loop
    copied := to_jsonb(junction) || jsonb_build_object('id',gen_random_uuid(),'recipe_id',new_recipe_id);
    insert into public.catalog_recipe_ingredients select (jsonb_populate_record(null::public.catalog_recipe_ingredients,copied)).*;
  end loop;
  perform set_config('fv1.skip_recipe_recompute',coalesce(previous_skip,'off'),true);
  perform public.fn_recompute_recipe_elements(new_recipe_id);
  -- The copy has exactly the source ingredients; restore its original nutrition provenance.
  update public.catalog_recipes set health_score=source.health_score,health_score_status=source.health_score_status,nutrition_per_100g=source.nutrition_per_100g where id=new_recipe_id;
  select coalesce(jsonb_agg(jsonb_build_object('name',i.name_common,'catalog_name',i.name_common,'ingredient_id',i.id,
    'amount',j.amount_g,'grams',j.amount_g,'unit','g','per100',i.nutrition_per_100g,'per100_source',jsonb_build_object('nutrition_per_100g',i.nutrition_per_100g,'elements_beneficial',i.elements_beneficial,'elements_hazardous',i.elements_hazardous,'allergens',i.allergens,'calories_per_100g',i.calories_per_100g))), source.ingredients, '[]'::jsonb)
    into ingredients_json from public.catalog_recipe_ingredients j join public.catalog_ingredients i on i.id=j.ingredient_id where j.recipe_id=source.id;
  insert into public.guide_recipes(guide_id,title,description,meal_slot,image_url,ingredients,instructions,status,catalog_recipe_id,parent_protocol_id,servings,nutrition_per_serving)
  values(auth.uid(),source.name_common,source.description,source.meal_slot,source.image_url,ingredients_json,
    coalesce(to_jsonb(source.instructions),'[]'::jsonb),'draft',new_recipe_id,scope_id,greatest(coalesce(source.servings,1),1),source.nutrition_per_serving)
  returning * into result;
  update public.protocol_items set catalog_recipe_id=new_recipe_id where protocol_id=p_protocol and catalog_recipe_id=source.id;
  update public.catalog_protocols set builder_config=jsonb_set(builder_config,'{plan}',(
    select jsonb_object_agg(key,case when (value->>'id'=source.id and value->>'source'='catalog') or
      (value->>'source'='guide' and exists(select 1 from public.guide_recipes g where g.id::text=value->>'id' and g.catalog_recipe_id=source.id))
      then value || jsonb_build_object('id',new_recipe_id,'source','catalog') else value end)
    from jsonb_each(builder_config->'plan')
  )) where id=p_protocol and jsonb_typeof(builder_config->'plan')='object';
  perform public.sync_protocol_child(p_protocol);
  return result;
end $$;

notify pgrst, 'reload schema';
