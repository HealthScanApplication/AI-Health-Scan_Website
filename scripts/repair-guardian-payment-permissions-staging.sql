-- Apply ONLY with --project-ref mofhvoudjxinvpplsytd.
-- Existing backend needs offer pricing and Guardian name; no client grants or RLS changes.
begin;
grant select on public.guide_offers, public.guide_profiles to service_role;
do $$ begin
  if not has_table_privilege('service_role', 'public.guide_offers', 'select')
     or not has_table_privilege('service_role', 'public.guide_profiles', 'select') then
    raise exception 'Guardian backend read permissions missing';
  end if;
end $$;
commit;
