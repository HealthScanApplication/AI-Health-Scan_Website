-- FIX: the kit tables had RLS enabled (20260710_protocol_kits_admin_rls) but the
-- `authenticated` role was never granted INSERT/UPDATE/DELETE — so admin writes
-- hit a table-level "permission denied" (42501) BEFORE RLS could allow them.
-- Grant DML to authenticated; the admin-only RLS policies gate which rows.
grant insert, update, delete on public.protocol_kits to authenticated;
grant insert, update, delete on public.protocol_kit_items to authenticated;
grant insert, update, delete on public.catalog_region_rules to authenticated;
