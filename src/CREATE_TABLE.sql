-- HealthScan Database Setup
-- Copy and paste this ENTIRE script into Supabase Dashboard → SQL Editor and click "RUN"

-- Step 1: Create the main table
CREATE TABLE IF NOT EXISTS kv_store_ed0fe4c2 (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_kv_store_ed0fe4c2_key_prefix 
ON kv_store_ed0fe4c2 USING btree (key text_pattern_ops);

-- Step 3: Disable Row Level Security
ALTER TABLE kv_store_ed0fe4c2 DISABLE ROW LEVEL SECURITY;

-- Step 4: Grant all necessary permissions
GRANT ALL PRIVILEGES ON TABLE kv_store_ed0fe4c2 TO service_role;
GRANT ALL PRIVILEGES ON TABLE kv_store_ed0fe4c2 TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE kv_store_ed0fe4c2 TO anon;

-- Step 5: Create trigger function for automatic updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Create trigger
DROP TRIGGER IF EXISTS update_kv_store_ed0fe4c2_updated_at ON kv_store_ed0fe4c2;
CREATE TRIGGER update_kv_store_ed0fe4c2_updated_at
  BEFORE UPDATE ON kv_store_ed0fe4c2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification: Insert a test record to verify everything works
INSERT INTO kv_store_ed0fe4c2 (key, value) 
VALUES ('setup_test', '{"setup": true, "timestamp": "' || now() || '"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Success message
SELECT 'HealthScan database setup completed successfully!' as status;