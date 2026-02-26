-- Fix RLS policies for catalog_cooking_methods and catalog_equipment
-- Add authenticated user policies to allow admin panel updates

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access" ON catalog_cooking_methods;
DROP POLICY IF EXISTS "Authenticated users can update" ON catalog_cooking_methods;

-- Recreate service role policy
CREATE POLICY "Service role full access"
  ON catalog_cooking_methods
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add authenticated user policy for admin panel
CREATE POLICY "Authenticated users can update"
  ON catalog_cooking_methods
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Same for catalog_equipment
DROP POLICY IF EXISTS "Service role full access" ON catalog_equipment;
DROP POLICY IF EXISTS "Authenticated users can update" ON catalog_equipment;

CREATE POLICY "Service role full access"
  ON catalog_equipment
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can update"
  ON catalog_equipment
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
