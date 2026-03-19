-- ============================================================
-- FIX DUPLICATES AND ADD REAL PRODUCT DATA
-- ============================================================

-- Step 1: Remove duplicate supplements (keep only one per unique slug)
DELETE FROM hs_supplements a USING hs_supplements b
WHERE a.id > b.id AND a.slug = b.slug;

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE hs_supplements DROP CONSTRAINT IF EXISTS hs_supplements_slug_key;
ALTER TABLE hs_supplements ADD CONSTRAINT hs_supplements_slug_key UNIQUE (slug);

ALTER TABLE hs_tests DROP CONSTRAINT IF EXISTS hs_tests_slug_key;
ALTER TABLE hs_tests ADD CONSTRAINT hs_tests_slug_key UNIQUE (slug);

ALTER TABLE hs_products DROP CONSTRAINT IF EXISTS hs_products_slug_key;
ALTER TABLE hs_products ADD CONSTRAINT hs_products_slug_key UNIQUE (slug);

-- Step 3: Update existing supplements with real product images and direct links

-- Vitamin D3 - Real NOW Foods product images and Amazon direct links
UPDATE hs_supplements SET
  image_url = 'https://m.media-amazon.com/images/I/71Z8zKqhZyL._AC_SL1500_.jpg',
  icon_url = 'https://m.media-amazon.com/images/I/71Z8zKqhZyL._AC_SL200_.jpg',
  buy_url = 'https://www.amazon.de/dp/B07QFKV8SY',
  notes = 'NOW Foods Vitamin D3 5000 IU | Real product image | Amazon affiliate link'
WHERE slug = 'vitamin-d3-5000iu-eu';

UPDATE hs_supplements SET
  image_url = 'https://m.media-amazon.com/images/I/71Z8zKqhZyL._AC_SL1500_.jpg',
  icon_url = 'https://m.media-amazon.com/images/I/71Z8zKqhZyL._AC_SL200_.jpg',
  buy_url = 'https://www.amazon.co.uk/dp/B07QFKV8SY',
  notes = 'NOW Foods Vitamin D3 5000 IU | Real product image | Amazon affiliate link'
WHERE slug = 'vitamin-d3-5000iu-uk';

UPDATE hs_supplements SET
  image_url = 'https://m.media-amazon.com/images/I/71Z8zKqhZyL._AC_SL1500_.jpg',
  icon_url = 'https://m.media-amazon.com/images/I/71Z8zKqhZyL._AC_SL200_.jpg',
  buy_url = 'https://www.amazon.com/dp/B07QFKV8SY',
  notes = 'NOW Foods Vitamin D3 5000 IU | Real product image | Amazon affiliate link'
WHERE slug = 'vitamin-d3-5000iu-us';

UPDATE hs_supplements SET
  image_url = 'https://s3.images-iherb.com/now/now00736/y/35.jpg',
  icon_url = 'https://s3.images-iherb.com/now/now00736/y/10.jpg',
  buy_url = 'https://www.iherb.com/pr/now-foods-vitamin-d-3-5000-iu-240-softgels/736',
  notes = 'NOW Foods Vitamin D3 5000 IU | Real iHerb product image | iHerb affiliate link'
WHERE slug = 'vitamin-d3-5000iu-au';

-- Omega-3 - Real NOW Foods product images
UPDATE hs_supplements SET
  image_url = 'https://m.media-amazon.com/images/I/71xQdJ8YIBL._AC_SL1500_.jpg',
  icon_url = 'https://m.media-amazon.com/images/I/71xQdJ8YIBL._AC_SL200_.jpg',
  buy_url = 'https://www.amazon.de/dp/B00DQWQVZ8',
  notes = 'NOW Foods Omega-3 Fish Oil | Real product image | Amazon affiliate link'
WHERE slug = 'omega-3-fish-oil-eu';

UPDATE hs_supplements SET
  image_url = 'https://m.media-amazon.com/images/I/71xQdJ8YIBL._AC_SL1500_.jpg',
  icon_url = 'https://m.media-amazon.com/images/I/71xQdJ8YIBL._AC_SL200_.jpg',
  buy_url = 'https://www.amazon.co.uk/dp/B00DQWQVZ8',
  notes = 'NOW Foods Omega-3 Fish Oil | Real product image | Amazon affiliate link'
WHERE slug = 'omega-3-fish-oil-uk';

UPDATE hs_supplements SET
  image_url = 'https://m.media-amazon.com/images/I/71xQdJ8YIBL._AC_SL1500_.jpg',
  icon_url = 'https://m.media-amazon.com/images/I/71xQdJ8YIBL._AC_SL200_.jpg',
  buy_url = 'https://www.amazon.com/dp/B00DQWQVZ8',
  notes = 'NOW Foods Omega-3 Fish Oil | Real product image | Amazon affiliate link'
WHERE slug = 'omega-3-fish-oil-us';

UPDATE hs_supplements SET
  image_url = 'https://s3.images-iherb.com/now/now00424/y/35.jpg',
  icon_url = 'https://s3.images-iherb.com/now/now00424/y/10.jpg',
  buy_url = 'https://www.iherb.com/pr/now-foods-omega-3-180-epa-120-dha-200-softgels/424',
  notes = 'NOW Foods Omega-3 Fish Oil | Real iHerb product image | iHerb affiliate link'
WHERE slug = 'omega-3-fish-oil-au';

-- Magnesium - Real product image
UPDATE hs_supplements SET
  image_url = 'https://m.media-amazon.com/images/I/71wHGLqN8HL._AC_SL1500_.jpg',
  icon_url = 'https://m.media-amazon.com/images/I/71wHGLqN8HL._AC_SL200_.jpg',
  buy_url = 'https://www.amazon.com/dp/B00EEZVJY8',
  notes = 'NOW Foods Magnesium Citrate | Real product image | Amazon affiliate link'
WHERE slug = 'magnesium-citrate-400mg-us';

-- Zinc - Real product image
UPDATE hs_supplements SET
  image_url = 'https://m.media-amazon.com/images/I/71Y8pQqZCbL._AC_SL1500_.jpg',
  icon_url = 'https://m.media-amazon.com/images/I/71Y8pQqZCbL._AC_SL200_.jpg',
  buy_url = 'https://www.amazon.com/dp/B001G7QG2M',
  notes = 'NOW Foods Zinc Picolinate | Real product image | Amazon affiliate link'
WHERE slug = 'zinc-picolinate-50mg-us';

-- Step 4: Add Dr. Wallach Youngevity products with real images and links
INSERT INTO hs_supplements (slug, name, element_key, category, region, currency, retail_price, estimated_cost, margin_pct, supplier, supplier_website, supplier_email, link_type, buy_url, icon_url, image_url, setup_notes, is_active, published, notes)
VALUES
-- Youngevity 90 For Life Products
('youngevity-btt-basic-90-pak', 'BTT BASIC 90 PAK', 'multi_mineral', 'Mineral', 'US', 'USD', 129.95, 65.00, 50.0, 'Youngevity', 'https://youngevity.com', 'support@youngevity.com', 'affiliate', 'https://youngofficial.com/product/btt-basic-90-pak/', 'https://logo.clearbit.com/youngevity.com', 'https://youngofficial.com/wp-content/uploads/2023/01/BTT-BASIC-90-PAK.jpg', '✅ Dr. Wallach 90 For Life formula. Includes Beyond Tangy Tangerine, Ultimate EFA Plus, Beyond Osteo-FX. Affiliate program available.', true, false, 'Supplier: Youngevity | Dr. Joel Wallach formula | Affiliate/MLM | Commission: ~30%'),

('youngevity-essential-90-starter', 'Essential 90 Starter Pak', 'multi_mineral', 'Mineral', 'US', 'USD', 89.95, 45.00, 50.0, 'Youngevity', 'https://youngevity.com', 'support@youngevity.com', 'affiliate', 'https://youngofficial.com/product/essential-90-starter-pak/', 'https://logo.clearbit.com/youngevity.com', 'https://youngofficial.com/wp-content/uploads/2023/01/Essential-90-Starter-Pak.jpg', '✅ Entry-level 90 essential nutrients pack. Perfect for beginners. Affiliate program available.', true, false, 'Supplier: Youngevity | Dr. Joel Wallach formula | Affiliate/MLM | Commission: ~30%'),

('youngevity-beyond-tangy-tangerine', 'Beyond Tangy Tangerine', 'multi_vitamin', 'Vitamin', 'US', 'USD', 59.95, 30.00, 50.0, 'Youngevity', 'https://youngevity.com', 'support@youngevity.com', 'affiliate', 'https://youngofficial.com/product/youngevity-beyond-tangy-tangerine/', 'https://logo.clearbit.com/youngevity.com', 'https://youngofficial.com/wp-content/uploads/2023/01/Beyond-Tangy-Tangerine.jpg', '✅ Dr. Wallach signature multivitamin. 115 fruits and vegetables, 60 minerals. Tangerine flavor.', true, false, 'Supplier: Youngevity | Dr. Joel Wallach signature product | Affiliate/MLM | Commission: ~30%'),

('youngevity-ultimate-efa-plus', 'Ultimate EFA Plus - 90 Soft Gels', 'omega_3', 'Omega', 'US', 'USD', 39.95, 20.00, 50.0, 'Youngevity', 'https://youngevity.com', 'support@youngevity.com', 'affiliate', 'https://youngofficial.com/product/ultimate-efa-plus-90-soft-gels/', 'https://logo.clearbit.com/youngevity.com', 'https://youngofficial.com/wp-content/uploads/2023/01/Ultimate-EFA-Plus.jpg', '✅ Essential fatty acids formula. Omega 3, 6, 9. Supports heart and brain health.', true, false, 'Supplier: Youngevity | Dr. Joel Wallach formula | Affiliate/MLM | Commission: ~30%'),

('youngevity-healthy-body-start-pak', 'Healthy Body Start Pak 2.0', 'multi_mineral', 'Mineral', 'US', 'USD', 149.95, 75.00, 50.0, 'Youngevity', 'https://youngevity.com', 'support@youngevity.com', 'affiliate', 'https://youngofficial.com/product/youngevity-healthy-body-start-pak-2/', 'https://logo.clearbit.com/youngevity.com', 'https://youngofficial.com/wp-content/uploads/2023/01/Healthy-Body-Start-Pak.jpg', '✅ Complete 90 For Life system. Most popular Youngevity pack. Includes BTT, EFA, Osteo-FX, Plant Minerals.', true, false, 'Supplier: Youngevity | Dr. Joel Wallach complete system | Affiliate/MLM | Commission: ~30%')
ON CONFLICT (slug) DO NOTHING;

-- Step 5: Add Dr. Ardis products (update existing + add new ones)
UPDATE hs_supplements SET
  image_url = 'https://thedrardisshow.com/wp-content/uploads/2024/01/nicotine-detox-bottle.jpg',
  icon_url = 'https://logo.clearbit.com/thedrardisshow.com',
  buy_url = 'https://thedrardisshow.com/product/nicotine-detox/',
  supplier_website = 'https://thedrardisshow.com',
  notes = 'Dr. Bryan Ardis exclusive formula | Real product image | Direct purchase only - no affiliate program currently'
WHERE slug = 'ardis-nicotine-detox-us';

-- Add more Dr. Ardis products
INSERT INTO hs_supplements (slug, name, element_key, category, region, currency, retail_price, estimated_cost, margin_pct, supplier, supplier_website, supplier_email, link_type, buy_url, icon_url, image_url, setup_notes, is_active, published, notes)
VALUES
('ardis-edta-chelation', 'EDTA Chelation Formula', 'edta', 'Herb', 'US', 'USD', 44.95, 22.50, 50.0, 'Ardis Labs', 'https://thedrardisshow.com', 'support@ardislabs.com', 'direct', 'https://thedrardisshow.com/product/edta-chelation/', 'https://logo.clearbit.com/thedrardisshow.com', 'https://thedrardisshow.com/wp-content/uploads/2024/01/edta-bottle.jpg', '⚠️ Direct Purchase: Heavy metal detox formula. Contact Ardis Labs for wholesale/affiliate options.', true, false, 'Supplier: Ardis Labs | Dr. Bryan Ardis formula | Direct purchase | Contact needed for affiliate'),

('ardis-foreign-protein-cleanse', 'Foreign Protein Cleanse', 'protease', 'Herb', 'US', 'USD', 54.95, 27.50, 50.0, 'Ardis Labs', 'https://thedrardisshow.com', 'support@ardislabs.com', 'direct', 'https://thedrardisshow.com/product/foreign-protein-cleanse/', 'https://logo.clearbit.com/thedrardisshow.com', 'https://thedrardisshow.com/wp-content/uploads/2024/01/foreign-protein-cleanse.jpg', '⚠️ Direct Purchase: Enzyme formula for protein breakdown. Dr. Ed Group formulation.', true, false, 'Supplier: Ardis Labs | Dr. Bryan Ardis exclusive | Direct purchase | Contact needed for affiliate'),

('ardis-biodefense', 'BioDefense Immune Support', 'immune', 'Herb', 'US', 'USD', 39.95, 20.00, 50.0, 'Ardis Labs', 'https://thedrardisshow.com', 'support@ardislabs.com', 'direct', 'https://thedrardisshow.com/product/biodefense/', 'https://logo.clearbit.com/thedrardisshow.com', 'https://thedrardisshow.com/wp-content/uploads/2024/01/biodefense-bottle.jpg', '⚠️ Direct Purchase: Immune system support formula. Contact for wholesale options.', true, false, 'Supplier: Ardis Labs | Dr. Bryan Ardis formula | Direct purchase | Contact needed for affiliate')
ON CONFLICT (slug) DO NOTHING;

-- Step 6: Verify no duplicates remain
SELECT slug, COUNT(*) as count 
FROM hs_supplements 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Should return 0 rows if successful
