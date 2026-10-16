-- These relationships are owned by the parent owner. A child belongs to one parent only.
-- Private copies may retain their original dish names. Curated names stay unique.
drop index if exists public.uq_recipes_normalized_name;
create unique index uq_recipes_normalized_name on public.catalog_recipes
  (lower(btrim(name_common::text)),coalesce(brand,''),coalesce(market,''))
  where coalesce(is_group,false)=false and created_by_user_id is null;
create table if not exists public.protocol_children (
  parent_protocol_id uuid not null references public.catalog_protocols(id) on delete cascade,
  child_protocol_id uuid primary key references public.catalog_protocols(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  kind text not null check (kind in ('diet','fitness')),
  check (parent_protocol_id <> child_protocol_id)
);
alter table public.protocol_children enable row level security;
alter table public.protocol_children add column if not exists source_protocol_id uuid references public.catalog_protocols(id) on delete set null;
grant select, insert, delete on public.protocol_children to authenticated;
drop policy if exists own_protocol_children on public.protocol_children;
create policy own_protocol_children on public.protocol_children for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()) and
  exists (select 1 from public.catalog_protocols p where p.id = parent_protocol_id and p.user_id = (select auth.uid())) and
  exists (select 1 from public.catalog_protocols c where c.id = child_protocol_id and c.user_id = (select auth.uid()) and c.is_public is false));
alter table public.protocol_items add column if not exists source_child_protocol_id uuid references public.catalog_protocols(id) on delete cascade;
create index if not exists protocol_items_child_source on public.protocol_items(source_child_protocol_id) where source_child_protocol_id is not null;

-- Atomic snapshot refresh: replace only this child's rows in its own parent.
create or replace function public.sync_protocol_child(p_child uuid) returns void
language plpgsql security invoker set search_path = public as $$
declare link public.protocol_children; row_data record; copied jsonb; ids jsonb := '{}'; next_order integer; new_id uuid;
begin
  select * into link from public.protocol_children where child_protocol_id = p_child;
  if not found then return; end if;
  if link.owner_id is distinct from auth.uid() or not exists (
    select 1 from public.catalog_protocols where id=p_child and user_id=auth.uid()
  ) then raise exception 'Child protocol is not owned by this user'; end if;
  perform 1 from public.catalog_protocols where id=link.parent_protocol_id and user_id=auth.uid() for update;
  if not found then raise exception 'Parent protocol is not owned by this user'; end if;
  delete from public.protocol_items where protocol_id=link.parent_protocol_id and source_child_protocol_id=p_child;
  select coalesce(max(sort_order),-1)+1 into next_order from public.protocol_items where protocol_id=link.parent_protocol_id;
  for row_data in select id from public.protocol_items where protocol_id=p_child loop
    ids := ids || jsonb_build_object(row_data.id::text, gen_random_uuid());
  end loop;
  for row_data in select * from public.protocol_items where protocol_id=p_child order by (parent_protocol_item_id is not null), sort_order loop
    new_id := (ids->>row_data.id::text)::uuid;
    copied := to_jsonb(row_data) || jsonb_build_object('id',new_id,'protocol_id',link.parent_protocol_id,
      'source_child_protocol_id',p_child,'sort_order',next_order,
      'parent_protocol_item_id',ids->>row_data.parent_protocol_item_id::text);
    insert into public.protocol_items select (jsonb_populate_record(null::public.protocol_items,copied)).*;
    next_order := next_order + 1;
  end loop;
end $$;
revoke all on function public.sync_protocol_child(uuid) from public, anon;
grant execute on function public.sync_protocol_child(uuid) to authenticated;

create or replace function public.clone_protocol_child(p_parent uuid, p_source uuid) returns uuid
language plpgsql security invoker set search_path = public as $$
declare source public.catalog_protocols; child_id uuid := gen_random_uuid(); existing_child uuid; row_data record; ids jsonb := '{}'; copied jsonb;
begin
  perform 1 from public.catalog_protocols where id=p_parent and user_id=auth.uid() for update;
  if not found then raise exception 'Parent protocol is not owned by this user'; end if;
  select child_protocol_id into existing_child from public.protocol_children where parent_protocol_id=p_parent and source_protocol_id=p_source;
  if found then return existing_child; end if;
  select * into source from public.catalog_protocols where id=p_source;
  if not found or source.builder_kind not in ('diet','fitness') or source.builder_config is null then
    raise exception 'Select a saved Diet or Fitness plan';
  end if;
  if exists (select 1 from public.protocol_children where child_protocol_id=p_parent) then
    raise exception 'Attach plans to a parent Protocol, not another child';
  end if;
  -- Existing combined Protocols have flattened snapshots. Adopt only an exact,
  -- unambiguous snapshot; never replace a legacy plan that has personal edits.
  if exists(select 1 from public.catalog_protocols where id=p_parent and p_source=any(source_protocol_ids)) then
    if exists(select 1 from public.protocol_items s where s.protocol_id=p_source and
      (select count(*) from public.protocol_items p where p.protocol_id=p_parent and p.source_child_protocol_id is null and
        (to_jsonb(p)-array['id','protocol_id','sort_order','parent_protocol_item_id','created_at','updated_at','source_child_protocol_id']) =
        (to_jsonb(s)-array['id','protocol_id','sort_order','parent_protocol_item_id','created_at','updated_at','source_child_protocol_id']))<>1)
    then raise exception 'This older combined plan has edited steps. Automatic conversion stopped to preserve your changes.'; end if;
  end if;
  copied := to_jsonb(source) || jsonb_build_object('id',child_id,'user_id',auth.uid(),'is_public',false,
    'is_suggested',false,'is_personal_routine',false,'profile_id',null,'source_protocol_ids',null,
    'created_at',now(),'updated_at',now());
  insert into public.catalog_protocols select (jsonb_populate_record(null::public.catalog_protocols,copied)).*;
  insert into public.protocol_children(parent_protocol_id,child_protocol_id,owner_id,kind,source_protocol_id) values(p_parent,child_id,auth.uid(),source.builder_kind,p_source);
  if exists(select 1 from public.catalog_protocols where id=p_parent and p_source=any(source_protocol_ids)) then
    update public.protocol_items p set source_child_protocol_id=child_id where p.protocol_id=p_parent and exists(
      select 1 from public.protocol_items s where s.protocol_id=p_source and
        (to_jsonb(p)-array['id','protocol_id','sort_order','parent_protocol_item_id','created_at','updated_at','source_child_protocol_id']) =
        (to_jsonb(s)-array['id','protocol_id','sort_order','parent_protocol_item_id','created_at','updated_at','source_child_protocol_id']));
  end if;
  for row_data in select id from public.protocol_items where protocol_id=p_source loop
    ids := ids || jsonb_build_object(row_data.id::text,gen_random_uuid());
  end loop;
  for row_data in select * from public.protocol_items where protocol_id=p_source order by (parent_protocol_item_id is not null),sort_order loop
    copied := to_jsonb(row_data) || jsonb_build_object('id',ids->>row_data.id::text,'protocol_id',child_id,
      'source_child_protocol_id',null,'parent_protocol_item_id',ids->>row_data.parent_protocol_item_id::text);
    insert into public.protocol_items select (jsonb_populate_record(null::public.protocol_items,copied)).*;
  end loop;
  -- A source plan can already contain personal recipes from another parent.
  -- Fork those now so later edits in that parent cannot mutate this new copy.
  for row_data in select i.id from public.protocol_items i join public.catalog_recipes r on r.id=i.catalog_recipe_id
    where i.protocol_id=child_id and r.created_by_user_id is not null
  loop perform public.customize_protocol_recipe(child_id,row_data.id); end loop;
  perform public.sync_protocol_child(child_id);
  return child_id;
end $$;
revoke all on function public.clone_protocol_child(uuid,uuid) from public, anon;
grant execute on function public.clone_protocol_child(uuid,uuid) to authenticated;

alter table public.guide_recipes add column if not exists parent_protocol_id uuid references public.catalog_protocols(id) on delete set null;

create or replace function public.ensure_guide_recipe_catalog(p_guide uuid) returns text
language plpgsql security invoker set search_path = public as $$
declare recipe public.guide_recipes; new_id text := gen_random_uuid()::text;
begin
  select * into recipe from public.guide_recipes where id=p_guide and guide_id=auth.uid() for update;
  if not found then raise exception 'Recipe is not owned by this user'; end if;
  if recipe.catalog_recipe_id is not null and exists(select 1 from public.catalog_recipes where id=recipe.catalog_recipe_id and created_by_user_id=auth.uid()) then
    return recipe.catalog_recipe_id;
  end if;
  insert into public.catalog_recipes(id,name_common,description,category,meal_slot,servings,image_url,ingredients,instructions,nutrition_per_serving,created_by_user_id,is_published)
    values(new_id,recipe.title,recipe.description,'meal',recipe.meal_slot,greatest(coalesce(recipe.servings,1),1),recipe.image_url,
      recipe.ingredients,recipe.instructions,recipe.nutrition_per_serving,auth.uid(),false);
  update public.guide_recipes set catalog_recipe_id=new_id where id=p_guide;
  return new_id;
end $$;
revoke all on function public.ensure_guide_recipe_catalog(uuid) from public,anon;
grant execute on function public.ensure_guide_recipe_catalog(uuid) to authenticated;

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
    'amount',j.amount_g,'grams',j.amount_g,'unit','g','per100',i.nutrition_per_100g)), source.ingredients, '[]'::jsonb)
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
revoke all on function public.customize_protocol_recipe(uuid,uuid) from public, anon;
grant execute on function public.customize_protocol_recipe(uuid,uuid) to authenticated;

-- Keep the private catalogue link target and its parent-specific recipe editor in sync.
create or replace function public.sync_private_guide_recipe() returns trigger
language plpgsql security invoker set search_path = public as $$
declare previous_skip text;
begin
  if new.catalog_recipe_id is null then return new; end if;
  if not exists(select 1 from public.catalog_recipes where id=new.catalog_recipe_id and created_by_user_id=auth.uid()) then
    if new.parent_protocol_id is not null then raise exception 'Private recipe is not owned by this user'; end if;
    return new;
  end if;
  update public.catalog_recipes set name_common=new.title, description=new.description, ingredients=new.ingredients,
    instructions=new.instructions, image_url=new.image_url, meal_slot=new.meal_slot, servings=new.servings,
    nutrition_per_serving=new.nutrition_per_serving, is_published=(new.status='published'),
    publication_approved_at=case when new.status='published' then now() else null end
    where id=new.catalog_recipe_id and created_by_user_id=auth.uid();
  if not found then raise exception 'Private recipe is not owned by this user'; end if;
  if new.ingredients is distinct from old.ingredients or new.catalog_recipe_id is distinct from old.catalog_recipe_id then
    update public.catalog_recipes set health_score=null, health_score_status='PROVISIONAL', nutrition_per_100g=
      coalesce((select jsonb_object_agg(key,to_jsonb((value::text)::numeric * 100 / nullif((new.nutrition_per_serving->>'serving_size_g')::numeric,0)))
        from jsonb_each(coalesce(new.nutrition_per_serving,'{}')) where jsonb_typeof(value)='number' and key<>'serving_size_g'),'{}'::jsonb)
      || '{"_derivation":{"needs_curation":true,"source":"guide_recipe_ingredients"}}'::jsonb
      where id=new.catalog_recipe_id;
    previous_skip := current_setting('fv1.skip_recipe_recompute',true);
    perform set_config('fv1.skip_recipe_recompute','on',true);
    delete from public.catalog_recipe_ingredients where recipe_id=new.catalog_recipe_id;
    insert into public.catalog_recipe_ingredients(recipe_id,ingredient_id,ingredient_name,amount_g,unit)
    select new.catalog_recipe_id,ingredient->>'ingredient_id',ingredient->>'name',
      (ingredient->>'grams')::numeric,'g'
    from jsonb_array_elements(new.ingredients) ingredient
    where ingredient->>'ingredient_id' is not null and (ingredient->>'grams')::numeric > 0;
    perform set_config('fv1.skip_recipe_recompute',coalesce(previous_skip,'off'),true);
    perform public.fn_recompute_recipe_elements(new.catalog_recipe_id);
  end if;
  update public.protocol_items set display_name=new.title, media_image_url=new.image_url
    where catalog_recipe_id=new.catalog_recipe_id and protocol_id in (select id from public.catalog_protocols where user_id=auth.uid());
  update public.catalog_protocols set builder_config=jsonb_set(builder_config,'{plan}',(
    select jsonb_object_agg(key,case when (value->>'id'=new.catalog_recipe_id and value->>'source'='catalog') or (value->>'id'=new.id::text and value->>'source'='guide')
      then value || jsonb_build_object('name',new.title,'image',new.image_url,'nutrition',new.nutrition_per_serving) else value end)
    from jsonb_each(builder_config->'plan')
  )) where user_id=auth.uid() and jsonb_typeof(builder_config->'plan')='object'
    and exists(select 1 from jsonb_each(builder_config->'plan') p where (p.value->>'id'=new.catalog_recipe_id and p.value->>'source'='catalog') or (p.value->>'id'=new.id::text and p.value->>'source'='guide'));
  return new;
end $$;
drop trigger if exists sync_private_guide_recipe on public.guide_recipes;
create trigger sync_private_guide_recipe after update on public.guide_recipes for each row execute function public.sync_private_guide_recipe();
notify pgrst, 'reload schema';
