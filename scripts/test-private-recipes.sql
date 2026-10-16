-- Transactional regression: no fixture survives either success or failure.
begin;
insert into public.catalog_recipes(id, name_common, servings, created_by_user_id, is_published)
values ('qa_private_recipe_fixture', 'Private recipe isolation fixture', 1, (select id from auth.users limit 1), false);
set local role anon;
do $$ begin
  if exists (select 1 from public.catalog_recipes where id = 'qa_private_recipe_fixture') then
    raise exception 'PRIVATE RECIPE LEAK: anonymous users can read an unpublished user recipe';
  end if;
end $$;
reset role;
rollback;
