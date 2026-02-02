-- Enable RLS on catalog_elements table
ALTER TABLE public.catalog_elements ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to read all elements
CREATE POLICY "Allow authenticated users to read elements" ON public.catalog_elements
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 2: Allow service role (admin) to read, insert, update, delete
CREATE POLICY "Allow service role full access" ON public.catalog_elements
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 3: Allow admins (via JWT) to manage elements
CREATE POLICY "Allow admin users to manage elements" ON public.catalog_elements
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND
    (
      -- Check if user email is in admin list
      auth.jwt() ->> 'email' IN (
        'johnferreira@gmail.com'
      ) OR
      -- Check if user domain is admin domain
      auth.jwt() ->> 'email' LIKE '%@healthscan.live' OR
      auth.jwt() ->> 'email' LIKE '%@healthscan.com'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    (
      auth.jwt() ->> 'email' IN (
        'johnferreira@gmail.com'
      ) OR
      auth.jwt() ->> 'email' LIKE '%@healthscan.live' OR
      auth.jwt() ->> 'email' LIKE '%@healthscan.com'
    )
  );

-- Grant permissions to authenticated role
GRANT SELECT ON public.catalog_elements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_elements TO authenticated;

-- Grant permissions to anon role (read-only)
GRANT SELECT ON public.catalog_elements TO anon;
