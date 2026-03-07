-- Add supplier contact, link type labels, and Shopify fields to HS tables

-- HS Products: Add supplier contact and Shopify fields
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS supplier_website TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS supplier_email TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS link_type TEXT CHECK (link_type IN ('dropship', 'affiliate', 'direct', 'mixed'));
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS shopify_product_url TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS shopify_product_id TEXT;

-- HS Tests: Add supplier contact and Shopify fields
ALTER TABLE hs_tests ADD COLUMN IF NOT EXISTS supplier_website TEXT;
ALTER TABLE hs_tests ADD COLUMN IF NOT EXISTS supplier_email TEXT;
ALTER TABLE hs_tests ADD COLUMN IF NOT EXISTS link_type TEXT CHECK (link_type IN ('dropship', 'affiliate', 'direct', 'mixed'));
ALTER TABLE hs_tests ADD COLUMN IF NOT EXISTS shopify_product_url TEXT;
ALTER TABLE hs_tests ADD COLUMN IF NOT EXISTS shopify_product_id TEXT;

-- HS Supplements: Add supplier contact and Shopify fields
ALTER TABLE hs_supplements ADD COLUMN IF NOT EXISTS supplier_website TEXT;
ALTER TABLE hs_supplements ADD COLUMN IF NOT EXISTS supplier_email TEXT;
ALTER TABLE hs_supplements ADD COLUMN IF NOT EXISTS link_type TEXT CHECK (link_type IN ('dropship', 'affiliate', 'direct', 'mixed'));
ALTER TABLE hs_supplements ADD COLUMN IF NOT EXISTS shopify_product_url TEXT;
ALTER TABLE hs_supplements ADD COLUMN IF NOT EXISTS shopify_product_id TEXT;

-- Update existing products with real supplier data
UPDATE hs_products SET
  supplier_website = 'https://www.amazon.de',
  supplier_email = 'seller-support@amazon.de',
  link_type = 'affiliate'
WHERE source_platform = 'amazon';

UPDATE hs_tests SET
  supplier_website = 'https://thriva.co',
  supplier_email = 'support@thriva.co',
  link_type = 'dropship'
WHERE provider_uk = 'Thriva' OR provider_eu = 'Thriva';

UPDATE hs_tests SET
  supplier_website = 'https://www.everlywell.com',
  supplier_email = 'support@everlywell.com',
  link_type = 'dropship'
WHERE provider_us = 'Everlywell';

-- Add comments for clarity
COMMENT ON COLUMN hs_products.link_type IS 'Type of purchase link: dropship (we fulfill), affiliate (commission), direct (we sell), mixed';
COMMENT ON COLUMN hs_products.shopify_product_url IS 'Public URL on our Shopify webstore';
COMMENT ON COLUMN hs_tests.link_type IS 'Type of purchase link: dropship (API/partner fulfills), affiliate (commission), direct (we sell)';
COMMENT ON COLUMN hs_supplements.link_type IS 'Type of purchase link: affiliate (Amazon/iHerb commission), direct (we sell)';
