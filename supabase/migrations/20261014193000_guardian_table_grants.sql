-- Staging was created without Supabase's default table grants, so the Guardian
-- tables returned 403 before RLS ran. Grant the standard API roles; every table
-- below has RLS enabled and its own policies, which remain the access control.
grant select, insert, update, delete on
  public.guide_profiles, public.guide_offers, public.guide_leads, public.guide_recipes,
  public.guide_value_ramps, public.guide_brands, public.guide_library_folders, public.guide_library_items
  to anon, authenticated;
grant insert on public.guardian_suggestions to anon, authenticated;
