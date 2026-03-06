-- Fix: "permission denied for table catalog_cooking_methods"
-- The table was created but PostgreSQL-level GRANT permissions were missing
-- for the roles used by Supabase PostgREST (service_role, authenticated, anon)
-- Run via: Supabase Dashboard SQL Editor or supabase db push

-- Grant full access to service_role (used by edge functions with service role key)
GRANT ALL ON catalog_cooking_methods TO service_role;

-- Grant full access to authenticated users (admin panel)
GRANT ALL ON catalog_cooking_methods TO authenticated;

-- Grant read-only to anon (public catalog data)
GRANT SELECT ON catalog_cooking_methods TO anon;

-- Also ensure the sequence/default permissions are correct
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
