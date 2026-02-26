-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/sql

-- Fix RLS policies for catalog_cooking_methods and catalog_equipment
-- Add authenticated user policies to allow admin panel updates

-- catalog_cooking_methods
DROP POLICY IF EXISTS "Authenticated users can update" ON catalog_cooking_methods;

CREATE POLICY "Authenticated users can update"
  ON catalog_cooking_methods
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- catalog_equipment  
DROP POLICY IF EXISTS "Authenticated users can update" ON catalog_equipment;

CREATE POLICY "Authenticated users can update"
  ON catalog_equipment
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
