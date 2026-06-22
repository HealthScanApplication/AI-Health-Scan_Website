-- ============================================================
-- Migration: admin write RLS for protocols + protocol_items
-- Created: 2026-06-22
--
-- The web admin Protocol Editor writes protocols/protocol_items directly via
-- PostgREST using the logged-in admin's access token. Those writes were denied
-- by RLS (error 42501 "new row violates row-level security policy") because the
-- suggested/template rows are not owned by the admin's auth.uid().
--
-- Fix: grant the HealthScan admins (same email allowlist the edge function uses)
-- FULL read/write on both tables via their JWT email claim. Additive — existing
-- per-user policies (user_id = auth.uid()) keep working; this OR's an admin path.
-- ============================================================

-- Admin check, mirrors validateAdminAccess in make-server-ed0fe4c2.
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

ALTER TABLE protocols       ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_items  ENABLE ROW LEVEL SECURITY;

-- protocols — admins manage all rows
DROP POLICY IF EXISTS "admins manage all protocols" ON protocols;
CREATE POLICY "admins manage all protocols" ON protocols
  FOR ALL TO authenticated
  USING (public.is_healthscan_admin())
  WITH CHECK (public.is_healthscan_admin());

-- protocol_items — admins manage all rows
DROP POLICY IF EXISTS "admins manage all protocol_items" ON protocol_items;
CREATE POLICY "admins manage all protocol_items" ON protocol_items
  FOR ALL TO authenticated
  USING (public.is_healthscan_admin())
  WITH CHECK (public.is_healthscan_admin());
