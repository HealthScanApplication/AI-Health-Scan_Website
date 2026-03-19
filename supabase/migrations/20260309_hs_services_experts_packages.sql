-- ============================================================
-- Migration: HS Services, Experts, Packages
-- Created: 2026-03-09
-- ============================================================

-- ============================================================
-- 1. HS_SERVICES — coaching calls, consultations, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  service_type TEXT DEFAULT 'coaching_call',     -- coaching_call, consultation, workshop, program, assessment
  duration_minutes INTEGER DEFAULT 60,
  delivery_method TEXT DEFAULT 'video_call',     -- video_call, in_person, phone, chat, hybrid
  category TEXT DEFAULT 'General',               -- General, Nutrition, Fitness, Mental Health, Sleep, Detox
  
  -- Pricing
  retail_price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  region TEXT DEFAULT 'GLOBAL',
  estimated_cost NUMERIC,
  margin_pct NUMERIC,
  
  -- Expert link
  expert_id TEXT,                                -- FK to hs_experts
  
  -- Media
  icon_url TEXT,
  image_url TEXT,
  video_url TEXT,
  
  -- Buy / booking
  buy_url TEXT,
  booking_url TEXT,
  calendly_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  published BOOLEAN DEFAULT false,
  
  -- Shopify
  shopify_product_url TEXT,
  shopify_product_id TEXT,
  
  -- Meta
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hs_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_hs_services" ON hs_services FOR SELECT USING (true);
CREATE POLICY "write_hs_services" ON hs_services FOR ALL USING (true);
GRANT SELECT ON hs_services TO anon;
GRANT ALL ON hs_services TO authenticated, service_role;

-- ============================================================
-- 2. HS_EXPERTS — coaches, nutritionists, specialists
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_experts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  title TEXT,                                     -- e.g. "Certified Nutritionist", "Health Coach"
  description TEXT,
  bio TEXT,
  
  -- Contact & links
  website_url TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  email TEXT,
  
  -- Media
  avatar_url TEXT,
  image_url TEXT,
  video_intro_url TEXT,
  
  -- Expertise
  expertise_tags TEXT[] DEFAULT '{}',             -- e.g. ['nutrition','gut-health','weight-loss','detox']
  certifications TEXT[] DEFAULT '{}',             -- e.g. ['CNS','RD','CPT']
  languages TEXT[] DEFAULT '{}',                  -- e.g. ['en','es','fr']
  
  -- Rating
  user_rating NUMERIC DEFAULT 0,                 -- avg rating 0-5
  rating_count INTEGER DEFAULT 0,
  
  -- Region & availability
  region TEXT DEFAULT 'GLOBAL',
  timezone TEXT,
  available_hours TEXT,                           -- e.g. "Mon-Fri 9am-5pm CET"
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  published BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hs_experts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_hs_experts" ON hs_experts FOR SELECT USING (true);
CREATE POLICY "write_hs_experts" ON hs_experts FOR ALL USING (true);
GRANT SELECT ON hs_experts TO anon;
GRANT ALL ON hs_experts TO authenticated, service_role;

-- Add FK from services → experts
ALTER TABLE hs_services ADD CONSTRAINT fk_service_expert
  FOREIGN KEY (expert_id) REFERENCES hs_experts(id) ON DELETE SET NULL;

-- ============================================================
-- 3. HS_PACKAGES — bundles of supplements + tests + products + services
-- ============================================================
CREATE TABLE IF NOT EXISTS hs_packages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,
  
  -- Category & targeting
  category TEXT DEFAULT 'General',               -- General, Home, Performance, Weight, Longevity, Detox, Recovery
  goal TEXT,                                      -- e.g. "Clean home air", "Lose weight safely"
  target_audience TEXT,                           -- e.g. "Adults 25-45", "Athletes", "New mothers"
  difficulty_level TEXT DEFAULT 'beginner',       -- beginner, intermediate, advanced
  duration_weeks INTEGER,                         -- recommended program duration
  
  -- Pricing
  retail_price NUMERIC,
  compare_at_price NUMERIC,                      -- original price before discount
  currency TEXT DEFAULT 'EUR',
  region TEXT DEFAULT 'GLOBAL',
  discount_pct NUMERIC,                          -- e.g. 15 for 15% bundle discount
  
  -- Media
  icon_url TEXT,
  image_url TEXT,
  image_url_2 TEXT,
  video_url TEXT,
  color_hex TEXT,                                 -- brand color for the package card
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Shopify
  shopify_product_url TEXT,
  shopify_product_id TEXT,
  
  -- Meta
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hs_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_hs_packages" ON hs_packages FOR SELECT USING (true);
CREATE POLICY "write_hs_packages" ON hs_packages FOR ALL USING (true);
GRANT SELECT ON hs_packages TO anon;
GRANT ALL ON hs_packages TO authenticated, service_role;

-- ============================================================
-- 4. PACKAGE_ITEMS — junction: package ↔ (supplement|test|product|service)
-- ============================================================
CREATE TABLE IF NOT EXISTS package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT NOT NULL REFERENCES hs_packages(id) ON DELETE CASCADE,
  
  -- Polymorphic item reference
  item_type TEXT NOT NULL,                        -- 'supplement', 'test', 'product', 'service'
  item_id TEXT NOT NULL,
  
  -- Package-specific overrides
  quantity INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,              -- some items may be optional add-ons
  price_override NUMERIC,                         -- override item price within package
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(package_id, item_type, item_id)
);

CREATE INDEX idx_pkg_items_package ON package_items(package_id);
CREATE INDEX idx_pkg_items_item ON package_items(item_type, item_id);

ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_package_items" ON package_items FOR SELECT USING (true);
CREATE POLICY "write_package_items" ON package_items FOR ALL USING (true);
GRANT SELECT ON package_items TO anon;
GRANT ALL ON package_items TO authenticated, service_role;

-- ============================================================
-- 5. Add dropship lookup fields to hs_products
-- ============================================================
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS temu_search_url TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS alibaba_search_url TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS aliexpress_search_url TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS temu_product_url TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS alibaba_product_url TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS aliexpress_product_url TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS dropship_status TEXT DEFAULT 'not_sourced';  -- not_sourced, sourcing, sourced, ordered, in_stock
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS dropship_notes TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS dropship_moq INTEGER;       -- minimum order quantity
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS dropship_lead_days INTEGER;  -- shipping lead time

-- ============================================================
-- 6. SEED: Example packages
-- ============================================================
INSERT INTO hs_packages (id, name, slug, description, short_description, category, goal, retail_price, currency, sort_order, is_featured, tags) VALUES
  ('pkg_clean_home', 'Clean Home Starter', 'clean-home-starter',
   'Everything you need to assess and improve your home environment — air quality, water purity, and surface toxins.',
   'Assess and detox your home',
   'Home', 'Clean home environment',
   149.99, 'EUR', 1, true,
   ARRAY['home','air','water','toxins','starter']),

  ('pkg_clean_air', 'Clean Home Air', 'clean-home-air',
   'Monitor and purify your indoor air. Includes air quality test, HEPA filter, and air monitoring device.',
   'Breathe cleaner air at home',
   'Home', 'Clean home air',
   89.99, 'EUR', 2, false,
   ARRAY['home','air','purifier','monitor']),

  ('pkg_clean_water', 'Clean Home Water', 'clean-home-water',
   'Test and filter your drinking water. Includes water quality test kit and recommended filtration.',
   'Drink cleaner water at home',
   'Home', 'Clean home water',
   79.99, 'EUR', 3, false,
   ARRAY['home','water','filter','test']),

  ('pkg_longevity', 'Longevity Pack', 'longevity-pack',
   'Science-backed supplements, tests, and coaching for healthy aging and longevity. Includes NAD+, Omega-3, and telomere testing.',
   'Live longer, live better',
   'Longevity', 'Optimize healthspan',
   249.99, 'EUR', 4, true,
   ARRAY['longevity','aging','nad','omega','telomere']),

  ('pkg_performance', 'Performance Pack', 'performance-pack',
   'Maximize physical and mental performance. Includes hormone panel, creatine, electrolytes, and coaching call.',
   'Peak performance stack',
   'Performance', 'Maximize performance',
   199.99, 'EUR', 5, true,
   ARRAY['performance','athlete','hormones','energy']),

  ('pkg_weight_loss', 'Weight Loss Pack', 'weight-loss-pack',
   'Evidence-based weight management bundle. Metabolic testing, fiber supplements, GLP-1 support, and nutrition coaching.',
   'Lose weight safely and sustainably',
   'Weight', 'Sustainable weight loss',
   179.99, 'EUR', 6, false,
   ARRAY['weight-loss','metabolism','nutrition','coaching']),

  ('pkg_weight_gain', 'Weight Gain Pack', 'weight-gain-pack',
   'Healthy weight gain bundle. Includes calorie-dense supplements, protein, creatine, and strength coaching.',
   'Build mass healthily',
   'Weight', 'Healthy weight gain',
   169.99, 'EUR', 7, false,
   ARRAY['weight-gain','muscle','protein','strength']),

  ('pkg_gut_health', 'Gut Health Pack', 'gut-health-pack',
   'Restore and optimize your gut microbiome. Includes microbiome test, probiotics, prebiotics, and gut coaching.',
   'Fix your gut, fix your health',
   'Detox', 'Optimize gut health',
   159.99, 'EUR', 8, false,
   ARRAY['gut','microbiome','probiotics','prebiotics']),

  ('pkg_sleep', 'Sleep Optimization Pack', 'sleep-optimization-pack',
   'Improve sleep quality with monitoring, magnesium, melatonin, and sleep coaching.',
   'Sleep better, recover faster',
   'Recovery', 'Better sleep',
   129.99, 'EUR', 9, false,
   ARRAY['sleep','recovery','magnesium','melatonin']),

  ('pkg_detox', 'Full Body Detox', 'full-body-detox',
   'Comprehensive detoxification bundle. Heavy metal testing, liver support, binders, and detox coaching.',
   'Cleanse and reset your body',
   'Detox', 'Full body detox',
   219.99, 'EUR', 10, false,
   ARRAY['detox','heavy-metals','liver','cleanse'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT 'hs_services' as tbl, COUNT(*) as cnt FROM hs_services
UNION ALL SELECT 'hs_experts', COUNT(*) FROM hs_experts
UNION ALL SELECT 'hs_packages', COUNT(*) FROM hs_packages
UNION ALL SELECT 'package_items', COUNT(*) FROM package_items;
