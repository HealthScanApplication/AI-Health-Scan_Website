-- Enable RLS on catalog_elements table
ALTER TABLE public.catalog_elements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read elements" ON public.catalog_elements;
DROP POLICY IF EXISTS "Allow service role full access" ON public.catalog_elements;
DROP POLICY IF EXISTS "Allow admin users to manage elements" ON public.catalog_elements;

-- Policy 1: Allow all authenticated users to read elements
CREATE POLICY "Enable read for authenticated users" ON public.catalog_elements
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 2: Allow authenticated users to insert/update/delete (for admin panel)
CREATE POLICY "Enable write for authenticated users" ON public.catalog_elements
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.catalog_elements
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.catalog_elements
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Policy 3: Allow anonymous users to read (public access)
CREATE POLICY "Enable read for anonymous users" ON public.catalog_elements
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT ON public.catalog_elements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_elements TO authenticated;
GRANT SELECT ON public.catalog_elements TO anon;
