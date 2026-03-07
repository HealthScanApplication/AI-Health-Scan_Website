-- Migration: extend hs_tests, hs_supplements + create hs_products
-- Apply via admin migration endpoint

-- ── hs_tests: new columns ─────────────────────────────────────────────────
ALTER TABLE hs_tests
  ADD COLUMN IF NOT EXISTS icon_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS provider_eu_url TEXT,
  ADD COLUMN IF NOT EXISTS provider_uk_url TEXT,
  ADD COLUMN IF NOT EXISTS provider_us_url TEXT,
  ADD COLUMN IF NOT EXISTS provider_au_url TEXT,
  ADD COLUMN IF NOT EXISTS setup_notes TEXT,
  ADD COLUMN IF NOT EXISTS api_dropship_available BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS api_dropship_connected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS api_dropship_notes TEXT,
  ADD COLUMN IF NOT EXISTS buy_url TEXT,
  ADD COLUMN IF NOT EXISTS sample_order_url TEXT,
  ADD COLUMN IF NOT EXISTS provider_eu_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS provider_uk_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS provider_us_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS provider_au_cost NUMERIC(10,2);

-- ── hs_supplements: new columns ───────────────────────────────────────────
ALTER TABLE hs_supplements
  ADD COLUMN IF NOT EXISTS icon_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS buy_url TEXT,
  ADD COLUMN IF NOT EXISTS amazon_url TEXT,
  ADD COLUMN IF NOT EXISTS iherb_url TEXT,
  ADD COLUMN IF NOT EXISTS setup_notes TEXT;

-- ── hs_products: new table (air filters, devices, etc.) ───────────────────
CREATE TABLE IF NOT EXISTS hs_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  product_type TEXT DEFAULT 'device',          -- device, filter, monitor, kit, accessory
  category TEXT,                               -- Air Quality, Water, Supplement, Lab Kit
  element_key TEXT,                            -- optional link to element
  description TEXT,
  setup_notes TEXT,
  icon_url TEXT,
  image_url TEXT,
  image_url_2 TEXT,
  image_url_3 TEXT,
  video_url TEXT,
  source_url TEXT,                             -- original product page (Temu, Amazon, etc.)
  source_platform TEXT,                        -- temu, amazon, iherb, aliexpress
  buy_url TEXT,                                -- affiliate / direct buy link
  retail_price NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  region TEXT DEFAULT 'EU',
  estimated_cost NUMERIC(10,2),
  margin_pct NUMERIC(5,2),
  supplier TEXT,
  affiliate_available BOOLEAN DEFAULT false,
  affiliate_connected BOOLEAN DEFAULT false,
  affiliate_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hs_products_product_type ON hs_products (product_type);
CREATE INDEX IF NOT EXISTS idx_hs_products_category ON hs_products (category);
CREATE INDEX IF NOT EXISTS idx_hs_products_element_key ON hs_products (element_key);

ALTER TABLE hs_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hs_products_read" ON hs_products;
CREATE POLICY "hs_products_read" ON hs_products FOR SELECT USING (true);
GRANT SELECT ON hs_products TO anon, authenticated;
GRANT ALL ON hs_products TO service_role;

-- ── Seed: hs_products (air filters from Temu) ─────────────────────────────
INSERT INTO hs_products (slug, name, product_type, category, description, source_platform, retail_price, currency, region, is_active, is_featured, notes)
VALUES
  ('hepa-air-purifier-desktop', 'Desktop HEPA Air Purifier', 'filter', 'Air Quality', 'Compact desktop HEPA H13 filter. Removes PM2.5, dust, pollen, pet dander. Quiet operation, USB powered. Ideal for desk or bedside use.', 'temu', 29.99, 'EUR', 'EU', true, true, 'Source from Temu. Pull product images via source_url.'),
  ('hepa-air-purifier-room', 'Room HEPA Air Purifier 360°', 'filter', 'Air Quality', '360° air intake HEPA H13 purifier for rooms up to 20m². Covers dust, smoke, allergens, VOCs. 3-speed fan. Sleep mode.', 'temu', 49.99, 'EUR', 'EU', true, false, 'Source from Temu.'),
  ('carbon-filter-replacement', 'Activated Carbon Filter Replacement', 'filter', 'Air Quality', 'Replacement activated carbon + HEPA filter pack. Compatible with most desktop purifiers. Replaces every 3-6 months.', 'temu', 12.99, 'EUR', 'EU', true, false, 'Consumable. Bundle with purifier.'),
  ('air-quality-monitor', 'Smart Air Quality Monitor (PM2.5/CO2/VOC)', 'monitor', 'Air Quality', 'Real-time PM2.5, CO2, VOC, temperature and humidity monitor. LED display. Connects to app via WiFi. Ideal for home health tracking.', 'temu', 39.99, 'EUR', 'EU', true, true, 'Source from Temu/AliExpress.'),
  ('water-filter-pitcher', 'Water Filter Pitcher (3L)', 'filter', 'Water Quality', 'Removes chlorine, heavy metals, bacteria. BPA-free 3L pitcher with activated carbon + ion exchange filter. Replace every 2 months.', 'temu', 24.99, 'EUR', 'EU', true, false, 'Links to heavy metal elements.'),
  ('uv-water-purifier', 'UV Water Purifier Tap Attachment', 'filter', 'Water Quality', 'UV-C sterilisation tap attachment. Kills 99.9% of bacteria and viruses. Easy install, no plumbing. Battery powered.', 'temu', 34.99, 'EUR', 'EU', true, false, 'Source from Temu.'),
  ('blood-pressure-monitor', 'Digital Blood Pressure Monitor', 'monitor', 'Health Monitoring', 'Clinically validated upper arm blood pressure monitor. Irregular heartbeat detection. 60-reading memory. USB rechargeable.', 'amazon', 39.99, 'EUR', 'EU', true, false, 'Health monitoring device.'),
  ('finger-pulse-oximeter', 'Fingertip Pulse Oximeter', 'monitor', 'Health Monitoring', 'Medical grade SpO2 + pulse rate + perfusion index monitor. OLED display. Includes carry case. AAA battery.', 'temu', 14.99, 'EUR', 'EU', true, false, 'Low cost, high margin.'),
  ('blue-light-glasses', 'Blue Light Blocking Glasses', 'accessory', 'Sleep & Light', 'Anti blue light glasses for screen use. Reduces eye strain, improves sleep quality. Clear lens + amber option.', 'temu', 9.99, 'EUR', 'EU', true, false, 'Linked to melatonin / sleep elements.')
ON CONFLICT (slug) DO NOTHING;
