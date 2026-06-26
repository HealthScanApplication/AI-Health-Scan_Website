-- ============================================================
-- Migration: is_healthscan_admin() also accepts the service role
-- Created: 2026-06-26
--
-- merge_catalog_records() (and the admin RLS policies) gate on
-- is_healthscan_admin(), which checked only the JWT email claim. The edge
-- function's prod-sync calls the RPC with the PROD service_role key — which has
-- NO email claim — so the call was rejected ("not authorized"). The service role
-- already bypasses RLS, so trusting it here is safe and is the only way the
-- server-side prod merge can run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_healthscan_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN ('johnferreira@gmail.com')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@healthscan.live'
    OR lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@healthscan.com';
$$;
