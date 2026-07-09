-- ============================================================
-- Migration: RLS + audit for the protocol-kit tables (DEV — apply to BOTH envs)
-- Created: 2026-07-10
--
-- protocol_kits / protocol_kit_items / catalog_region_rules are the REAL
-- "buy this protocol's kit" feature the mobile app reads directly (via the
-- anon key, ProtocolKitButton.tsx) — distinct from the unused hs_packages/
-- package_items tables. They had RLS disabled entirely (any token could
-- write), and no admin UI existed to manage them. This migration:
--   1. Enables RLS with PUBLIC READ (mobile must keep reading via anon key)
--      and ADMIN-ONLY WRITE (is_healthscan_admin(), same pattern as protocols).
--   2. Attaches the audit_row_change() trigger so admin edits are logged,
--      matching every other admin-editable table.
-- ============================================================

do $$
declare t text;
begin
  foreach t in array array['protocol_kits','protocol_kit_items','catalog_region_rules'] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I_public_read on public.%I', t, t);
    execute format(
      'create policy %I_public_read on public.%I for select to anon, authenticated using (true)', t, t);

    execute format('drop policy if exists %I_admin_write on public.%I', t, t);
    execute format(
      'create policy %I_admin_write on public.%I for insert to authenticated with check (public.is_healthscan_admin())', t, t);
    execute format(
      'create policy %I_admin_update on public.%I for update to authenticated using (public.is_healthscan_admin()) with check (public.is_healthscan_admin())', t, t);
    execute format(
      'create policy %I_admin_delete on public.%I for delete to authenticated using (public.is_healthscan_admin())', t, t);

    execute format('drop trigger if exists audit_changes on public.%I', t);
    execute format(
      'create trigger audit_changes after insert or update or delete on public.%I for each row execute function public.audit_row_change()', t);
  end loop;
end $$;
