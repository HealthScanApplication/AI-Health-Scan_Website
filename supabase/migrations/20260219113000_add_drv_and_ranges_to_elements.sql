-- Add DRV by population, deficiency ranges, and excess ranges to catalog_elements
ALTER TABLE catalog_elements
  ADD COLUMN IF NOT EXISTS drv_by_population jsonb DEFAULT 'null'::jsonb,
  ADD COLUMN IF NOT EXISTS deficiency_ranges  jsonb DEFAULT 'null'::jsonb,
  ADD COLUMN IF NOT EXISTS excess_ranges      jsonb DEFAULT 'null'::jsonb;
