-- Add published status to separate preparation products from live Shopify products
-- published = true: Live on Shopify store, ready for customers
-- published = false: In preparation, not yet live

-- Add published column to hs_supplements
ALTER TABLE hs_supplements ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
COMMENT ON COLUMN hs_supplements.published IS 'True if live on Shopify store, false if in preparation';

-- Add published column to hs_tests
ALTER TABLE hs_tests ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
COMMENT ON COLUMN hs_tests.published IS 'True if live on Shopify store, false if in preparation';

-- Add published column to hs_products
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
COMMENT ON COLUMN hs_products.published IS 'True if live on Shopify store, false if in preparation';

-- Mark existing supplements as unpublished (preparation) by default
UPDATE hs_supplements SET published = false WHERE published IS NULL;

-- Mark existing tests as unpublished (preparation) by default
UPDATE hs_tests SET published = false WHERE published IS NULL;

-- Mark existing products as unpublished (preparation) by default
UPDATE hs_products SET published = false WHERE published IS NULL;

-- Example: Mark a few supplements as published (live on Shopify)
-- Uncomment these when products are actually live on Shopify:
-- UPDATE hs_supplements SET published = true WHERE slug IN ('vitamin-d3-5000iu-us', 'omega-3-fish-oil-us');
-- UPDATE hs_tests SET published = true WHERE slug IN ('gut-microbiome-test');
-- UPDATE hs_products SET published = true WHERE slug IN ('activated-carbon-filter');
