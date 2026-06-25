-- ============================================================
-- Migration: admin write RLS for catalog_recipe_ingredients
-- Created: 2026-06-25
--
-- The admin "Merge 2 records" feature re-points recipe↔ingredient junction rows
-- from a duplicate onto the survivor, client-side via PostgREST using the logged
-- in admin's token. Those writes were denied by RLS (error 42501 "permission
-- denied for table catalog_recipe_ingredients") — the table allows public reads
-- but no token-based writes, so merge could only run through the service-role
-- edge function (which 404s when the function deploy is stale).
--
-- Fix: grant the HealthScan admins (same email allowlist) FULL read/write on the
-- junction table via their JWT email claim, so merge works client-side with no
-- edge dependency. Additive — the existing public read policy keeps working.
-- ============================================================

-- Admin check, mirrors validateAdminAccess in make-server-ed0fe4c2 (idempotent).
CREATE OR REPLACE FUNCTION public.is_healthscan_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    lower(coalesce(auth.jwt() ->> 'email', '')) IN ('johnferreira@gmail.com')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@healthscan.live'
    OR lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@healthscan.com';
$$;

ALTER TABLE catalog_recipe_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage all catalog_recipe_ingredients" ON catalog_recipe_ingredients;
CREATE POLICY "admins manage all catalog_recipe_ingredients" ON catalog_recipe_ingredients
  FOR ALL TO authenticated
  USING (public.is_healthscan_admin())
  WITH CHECK (public.is_healthscan_admin());
