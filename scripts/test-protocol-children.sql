begin;
select set_config('qa.started_at',clock_timestamp()::text,true);
do $$ declare owner uuid; parent uuid := gen_random_uuid(); source uuid; begin
  select user_id,id into owner,source from public.catalog_protocols where builder_kind='diet' and builder_config is not null limit 1;
  if source is null then raise exception 'Fixture needs a saved Diet template'; end if;
  insert into public.catalog_protocols(id,user_id,name,type,total_days,is_public,is_suggested)
    values(parent,owner,'QA isolated parent','daily',7,false,false);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',owner::text,true);
  perform set_config('qa.parent',parent::text,true);
  perform set_config('qa.source',source::text,true);
  perform set_config('qa.owner',owner::text,true);
end $$;
set local role authenticated;
do $$ declare child uuid; recipe_item uuid; parent_item uuid; parent2 uuid := gen_random_uuid(); legacy_parent uuid := gen_random_uuid(); legacy_child uuid; child2 uuid; draft_id uuid; draft_catalog text; private_recipe public.guide_recipes; reused public.guide_recipes; before_count integer; owner text := auth.uid()::text; begin
  child := public.clone_protocol_child(current_setting('qa.parent')::uuid,current_setting('qa.source')::uuid);
  if child=current_setting('qa.source')::uuid then raise exception 'Source reused instead of cloned'; end if;
  select count(*) into before_count from public.protocol_items where protocol_id=current_setting('qa.source')::uuid;
  if (select count(*) from public.protocol_items where protocol_id=child)<>before_count then raise exception 'Child lost source items'; end if;
  insert into public.catalog_protocols(id,user_id,name,type,total_days,is_public,is_suggested)
    values(legacy_parent,auth.uid(),'QA legacy flattened parent','daily',7,false,false);
  legacy_child := public.clone_protocol_child(legacy_parent,current_setting('qa.source')::uuid);
  update public.protocol_items set source_child_protocol_id=null where protocol_id=legacy_parent;
  delete from public.protocol_children where child_protocol_id=legacy_child;
  update public.catalog_protocols set source_protocol_ids=array[current_setting('qa.source')::uuid] where id=legacy_parent;
  legacy_child := public.clone_protocol_child(legacy_parent,current_setting('qa.source')::uuid);
  if (select count(*) from public.protocol_items where protocol_id=legacy_parent)<>before_count then raise exception 'Legacy conversion duplicated timeline steps'; end if;
  update public.protocol_items set display_name='QA changed child meal' where id=(select id from public.protocol_items where protocol_id=child and catalog_recipe_id is not null limit 1);
  perform public.sync_protocol_child(child);
  if exists(select 1 from public.protocol_items where protocol_id=current_setting('qa.source')::uuid and display_name='QA changed child meal') then raise exception 'Template was mutated'; end if;
  if not exists(select 1 from public.protocol_items where protocol_id=current_setting('qa.parent')::uuid and display_name='QA changed child meal') then raise exception 'Parent did not receive child change'; end if;
  select id into recipe_item from public.protocol_items where protocol_id=child and catalog_recipe_id is not null limit 1;
  if recipe_item is null then raise exception 'Fixture needs a linked meal'; end if;
  private_recipe := public.customize_protocol_recipe(child,recipe_item);
  if private_recipe.status<>'draft' then raise exception 'New recipe was published'; end if;
  if not exists(select 1 from public.catalog_recipes where id=private_recipe.catalog_recipe_id and created_by_user_id=auth.uid() and is_published is false) then raise exception 'Missing private catalogue copy'; end if;
  insert into public.guide_recipes(guide_id,title,ingredients,instructions,servings,nutrition_per_serving)
    values(auth.uid(),'QA standalone private guide recipe',private_recipe.ingredients,private_recipe.instructions,private_recipe.servings,private_recipe.nutrition_per_serving) returning id into draft_id;
  draft_catalog := public.ensure_guide_recipe_catalog(draft_id);
  if not exists(select 1 from public.catalog_recipe_ingredients where recipe_id=draft_catalog) then raise exception 'Own guide recipe lost its ingredient links'; end if;
  if not exists(select 1 from public.catalog_recipes where id=draft_catalog and is_published is false and created_by_user_id=auth.uid()) then raise exception 'Own guide recipe became public'; end if;
  update public.guide_recipes set title='QA private soup' where id=private_recipe.id;
  if not exists(select 1 from public.protocol_items where protocol_id=current_setting('qa.parent')::uuid and display_name='QA private soup') then raise exception 'Recipe edit did not reach parent'; end if;
  select id into parent_item from public.protocol_items where protocol_id=current_setting('qa.parent')::uuid and catalog_recipe_id=private_recipe.catalog_recipe_id limit 1;
  reused := public.customize_protocol_recipe(current_setting('qa.parent')::uuid,parent_item);
  if reused.id<>private_recipe.id then raise exception 'Reopening recipe made an unnecessary copy'; end if;
  insert into public.catalog_protocols(id,user_id,name,type,total_days,is_public,is_suggested)
    values(parent2,auth.uid(),'QA second isolated parent','daily',7,false,false);
  child2 := public.clone_protocol_child(parent2,child);
  if exists(select 1 from public.protocol_items where protocol_id=child2 and catalog_recipe_id=private_recipe.catalog_recipe_id) then raise exception 'A private recipe was shared between two parents'; end if;
  update public.guide_recipes set ingredients=jsonb_set(ingredients,'{0,grams}','123'::jsonb)
    where parent_protocol_id=parent2 and jsonb_array_length(ingredients)>0;
  if not exists(select 1 from public.catalog_recipe_ingredients j join public.guide_recipes g on g.catalog_recipe_id=j.recipe_id
    where g.parent_protocol_id=parent2 and j.amount_g=123) then raise exception 'Ingredient edits did not reach the private recipe junction'; end if;
  update public.guide_recipes set title='QA original parent only' where id=private_recipe.id;
  if exists(select 1 from public.protocol_items where protocol_id=parent2 and display_name='QA original parent only') then raise exception 'Recipe change escaped to another parent'; end if;
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('request.jwt.claim.sub'),'role','authenticated')::text,true);
  if exists(select 1 from public.catalog_recipes where id=private_recipe.catalog_recipe_id) then raise exception 'Private recipe leaked to another user'; end if;
  if exists(select 1 from public.protocol_children where child_protocol_id=child) then raise exception 'Another user can read the parent-child link'; end if;
  perform set_config('request.jwt.claim.sub',owner,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner,'role','authenticated')::text,true);
  perform set_config('qa.private',private_recipe.catalog_recipe_id,true);
  perform set_config('qa.guide',private_recipe.id::text,true);
end $$;
reset role;
select set_config('request.jwt.claims','{}',true),set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
  if exists(select 1 from public.catalog_recipes where id=current_setting('qa.private')) then raise exception 'Private copy leaked to anonymous reader'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('qa.owner'),true),
  set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('qa.owner'),'role','authenticated')::text,true);
set local role authenticated;
update public.guide_recipes set status='published' where id=current_setting('qa.guide')::uuid;
do $$ begin
  if not exists(select 1 from public.catalog_recipes where id=current_setting('qa.private') and is_published is true and publication_approved_at is not null) then
    raise exception 'Explicit recipe publication did not reach the catalogue';
  end if;
end $$;
reset role;
select set_config('request.jwt.claims','{}',true),set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
  if not exists(select 1 from public.catalog_recipes where id=current_setting('qa.private')) then raise exception 'Published recipe is still invisible'; end if;
end $$;
reset role;
select extract(epoch from clock_timestamp()-current_setting('qa.started_at')::timestamptz) as database_test_seconds;
rollback;
