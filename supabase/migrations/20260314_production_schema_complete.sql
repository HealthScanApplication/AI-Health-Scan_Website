-- ============================================================
-- PRODUCTION SCHEMA MIGRATION — Complete
-- Run in PRODUCTION Supabase SQL Editor (ermbkttsyvpenjjxaxcf)
-- All statements use IF NOT EXISTS for idempotency — safe to re-run
-- NO DATA — schema only. Data pushed via sync endpoints after.
-- Created: 2026-03-14
-- ============================================================

-- ════════════════════════════════════════════════════════════════
-- PART 1: HS TABLES (tests, supplements, products, services, experts, packages)
-- ════════════════════════════════════════════════════════════════

-- ── 1A: hs_tests ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hs_tests (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT,
  element_key     TEXT,
  sample_type     TEXT,
  turnaround_days INTEGER,
  retail_price_eur   NUMERIC(10,2),
  wholesale_cost_eur NUMERIC(10,2),
  shipping_cost_eur  NUMERIC(10,2),
  support_cost_eur   NUMERIC(10,2),
  gross_margin_pct   NUMERIC(5,2),
  provider_eu     TEXT,
  provider_uk     TEXT,
  provider_us     TEXT,
  provider_au     TEXT,
  is_active       BOOLEAN DEFAULT true,
  is_featured     BOOLEAN DEFAULT false,
  description     TEXT,
  notes           TEXT,
  icon_url        TEXT,
  image_url       TEXT,
  video_url       TEXT,
  provider_eu_url TEXT,
  provider_uk_url TEXT,
  provider_us_url TEXT,
  provider_au_url TEXT,
  setup_notes     TEXT,
  api_dropship_available BOOLEAN DEFAULT false,
  api_dropship_connected BOOLEAN DEFAULT false,
  api_dropship_notes     TEXT,
  buy_url         TEXT,
  sample_order_url TEXT,
  provider_eu_cost NUMERIC(10,2),
  provider_uk_cost NUMERIC(10,2),
  provider_us_cost NUMERIC(10,2),
  provider_au_cost NUMERIC(10,2),
  element_image_url TEXT,
  element_images    JSONB,
  published       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hs_tests_element_key ON hs_tests(element_key);
CREATE INDEX IF NOT EXISTS idx_hs_tests_category    ON hs_tests(category);
ALTER TABLE hs_tests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_tests' AND policyname='hs_tests_read') THEN
    CREATE POLICY "hs_tests_read" ON hs_tests FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_tests' AND policyname='hs_tests_write') THEN
    CREATE POLICY "hs_tests_write" ON hs_tests FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON hs_tests TO anon;
GRANT ALL ON hs_tests TO authenticated, service_role;

-- ── 1B: hs_supplements ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS hs_supplements (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  element_key     TEXT,
  category        TEXT,
  region          TEXT DEFAULT 'EU',
  currency        TEXT DEFAULT 'EUR',
  retail_price    NUMERIC(10,2),
  estimated_cost  NUMERIC(10,2),
  margin_pct      NUMERIC(5,2),
  supplier        TEXT,
  affiliate_url   TEXT,
  is_active       BOOLEAN DEFAULT true,
  notes           TEXT,
  icon_url        TEXT,
  image_url       TEXT,
  video_url       TEXT,
  buy_url         TEXT,
  amazon_url      TEXT,
  iherb_url       TEXT,
  setup_notes     TEXT,
  element_image_url TEXT,
  element_images    JSONB,
  published       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hs_supplements_element_key ON hs_supplements(element_key);
CREATE INDEX IF NOT EXISTS idx_hs_supplements_region      ON hs_supplements(region);
ALTER TABLE hs_supplements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_supplements' AND policyname='hs_supplements_read') THEN
    CREATE POLICY "hs_supplements_read" ON hs_supplements FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_supplements' AND policyname='hs_supplements_write') THEN
    CREATE POLICY "hs_supplements_write" ON hs_supplements FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON hs_supplements TO anon;
GRANT ALL ON hs_supplements TO authenticated, service_role;

-- ── 1C: hs_products ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hs_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  product_type TEXT DEFAULT 'device',
  category TEXT,
  element_key TEXT,
  description TEXT,
  setup_notes TEXT,
  icon_url TEXT,
  image_url TEXT,
  image_url_2 TEXT,
  image_url_3 TEXT,
  video_url TEXT,
  source_url TEXT,
  source_platform TEXT,
  buy_url TEXT,
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
  temu_search_url TEXT,
  alibaba_search_url TEXT,
  aliexpress_search_url TEXT,
  temu_product_url TEXT,
  alibaba_product_url TEXT,
  aliexpress_product_url TEXT,
  dropship_status TEXT DEFAULT 'not_sourced',
  dropship_notes TEXT,
  dropship_moq INTEGER,
  dropship_lead_days INTEGER,
  element_image_url TEXT,
  element_images JSONB,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hs_products_product_type ON hs_products(product_type);
CREATE INDEX IF NOT EXISTS idx_hs_products_category ON hs_products(category);
CREATE INDEX IF NOT EXISTS idx_hs_products_element_key ON hs_products(element_key);
ALTER TABLE hs_products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_products' AND policyname='hs_products_read') THEN
    CREATE POLICY "hs_products_read" ON hs_products FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_products' AND policyname='hs_products_write') THEN
    CREATE POLICY "hs_products_write" ON hs_products FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON hs_products TO anon;
GRANT ALL ON hs_products TO authenticated, service_role;

-- ── 1D: hs_experts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hs_experts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  title TEXT,
  description TEXT,
  bio TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  email TEXT,
  avatar_url TEXT,
  image_url TEXT,
  video_intro_url TEXT,
  expertise_tags TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  user_rating NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  region TEXT DEFAULT 'GLOBAL',
  timezone TEXT,
  available_hours TEXT,
  is_active BOOLEAN DEFAULT true,
  published BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hs_experts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_experts' AND policyname='read_hs_experts') THEN
    CREATE POLICY "read_hs_experts" ON hs_experts FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_experts' AND policyname='write_hs_experts') THEN
    CREATE POLICY "write_hs_experts" ON hs_experts FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON hs_experts TO anon;
GRANT ALL ON hs_experts TO authenticated, service_role;

-- ── 1E: hs_services ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hs_services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  service_type TEXT DEFAULT 'coaching_call',
  duration_minutes INTEGER DEFAULT 60,
  delivery_method TEXT DEFAULT 'video_call',
  category TEXT DEFAULT 'General',
  retail_price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  region TEXT DEFAULT 'GLOBAL',
  estimated_cost NUMERIC,
  margin_pct NUMERIC,
  expert_id TEXT,
  icon_url TEXT,
  image_url TEXT,
  video_url TEXT,
  buy_url TEXT,
  booking_url TEXT,
  calendly_url TEXT,
  is_active BOOLEAN DEFAULT true,
  published BOOLEAN DEFAULT false,
  shopify_product_url TEXT,
  shopify_product_id TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hs_services ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_services' AND policyname='read_hs_services') THEN
    CREATE POLICY "read_hs_services" ON hs_services FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_services' AND policyname='write_hs_services') THEN
    CREATE POLICY "write_hs_services" ON hs_services FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON hs_services TO anon;
GRANT ALL ON hs_services TO authenticated, service_role;

-- FK: services → experts (only if both tables exist)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_service_expert' AND table_name = 'hs_services'
  ) THEN
    ALTER TABLE hs_services ADD CONSTRAINT fk_service_expert
      FOREIGN KEY (expert_id) REFERENCES hs_experts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── 1F: hs_packages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hs_packages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,
  category TEXT DEFAULT 'General',
  goal TEXT,
  target_audience TEXT,
  difficulty_level TEXT DEFAULT 'beginner',
  duration_weeks INTEGER,
  retail_price NUMERIC,
  compare_at_price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  region TEXT DEFAULT 'GLOBAL',
  discount_pct NUMERIC,
  icon_url TEXT,
  image_url TEXT,
  image_url_2 TEXT,
  video_url TEXT,
  color_hex TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  shopify_product_url TEXT,
  shopify_product_id TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE hs_packages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_packages' AND policyname='read_hs_packages') THEN
    CREATE POLICY "read_hs_packages" ON hs_packages FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hs_packages' AND policyname='write_hs_packages') THEN
    CREATE POLICY "write_hs_packages" ON hs_packages FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON hs_packages TO anon;
GRANT ALL ON hs_packages TO authenticated, service_role;

-- ── 1G: package_items (junction: package ↔ items) ────────────
CREATE TABLE IF NOT EXISTS package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT NOT NULL REFERENCES hs_packages(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,
  price_override NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(package_id, item_type, item_id)
);
CREATE INDEX IF NOT EXISTS idx_pkg_items_package ON package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_pkg_items_item ON package_items(item_type, item_id);
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='package_items' AND policyname='read_package_items') THEN
    CREATE POLICY "read_package_items" ON package_items FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='package_items' AND policyname='write_package_items') THEN
    CREATE POLICY "write_package_items" ON package_items FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON package_items TO anon;
GRANT ALL ON package_items TO authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- PART 2: COLUMN ADDITIONS to existing tables
-- ════════════════════════════════════════════════════════════════

-- cooking_methods: elements columns
ALTER TABLE catalog_cooking_methods ADD COLUMN IF NOT EXISTS elements_hazardous JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_cooking_methods ADD COLUMN IF NOT EXISTS elements_beneficial JSONB DEFAULT '{}'::jsonb;

-- ════════════════════════════════════════════════════════════════
-- PART 3: JUNCTION TABLES (11 tables)
-- ════════════════════════════════════════════════════════════════

-- ── 3A: element_supplements ──────────────────────────────────
CREATE TABLE IF NOT EXISTS element_supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  supplement_id TEXT NOT NULL REFERENCES hs_supplements(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, supplement_id)
);
CREATE INDEX IF NOT EXISTS idx_es_element ON element_supplements(element_id);
CREATE INDEX IF NOT EXISTS idx_es_supplement ON element_supplements(supplement_id);
ALTER TABLE element_supplements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='element_supplements' AND policyname='read_element_supplements') THEN
    CREATE POLICY "read_element_supplements" ON element_supplements FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='element_supplements' AND policyname='write_element_supplements') THEN
    CREATE POLICY "write_element_supplements" ON element_supplements FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON element_supplements TO anon;
GRANT ALL ON element_supplements TO authenticated, service_role;

-- ── 3B: element_tests ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS element_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL REFERENCES hs_tests(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, test_id)
);
CREATE INDEX IF NOT EXISTS idx_et_element ON element_tests(element_id);
CREATE INDEX IF NOT EXISTS idx_et_test ON element_tests(test_id);
ALTER TABLE element_tests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='element_tests' AND policyname='read_element_tests') THEN
    CREATE POLICY "read_element_tests" ON element_tests FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='element_tests' AND policyname='write_element_tests') THEN
    CREATE POLICY "write_element_tests" ON element_tests FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON element_tests TO anon;
GRANT ALL ON element_tests TO authenticated, service_role;

-- ── 3C: element_products ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS element_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES hs_products(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_ep_element ON element_products(element_id);
CREATE INDEX IF NOT EXISTS idx_ep_product ON element_products(product_id);
ALTER TABLE element_products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='element_products' AND policyname='read_element_products') THEN
    CREATE POLICY "read_element_products" ON element_products FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='element_products' AND policyname='write_element_products') THEN
    CREATE POLICY "write_element_products" ON element_products FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON element_products TO anon;
GRANT ALL ON element_products TO authenticated, service_role;

-- ── 3D: cooking_method_elements ──────────────────────────────
CREATE TABLE IF NOT EXISTS cooking_method_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooking_method_id UUID NOT NULL REFERENCES catalog_cooking_methods(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'hazardous',
  severity TEXT DEFAULT 'moderate',
  mechanism TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cooking_method_id, element_id)
);
CREATE INDEX IF NOT EXISTS idx_cme_method ON cooking_method_elements(cooking_method_id);
CREATE INDEX IF NOT EXISTS idx_cme_element ON cooking_method_elements(element_id);
ALTER TABLE cooking_method_elements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cooking_method_elements' AND policyname='read_cooking_method_elements') THEN
    CREATE POLICY "read_cooking_method_elements" ON cooking_method_elements FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cooking_method_elements' AND policyname='write_cooking_method_elements') THEN
    CREATE POLICY "write_cooking_method_elements" ON cooking_method_elements FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON cooking_method_elements TO anon;
GRANT ALL ON cooking_method_elements TO authenticated, service_role;

-- ── 3E: recipe_ingredients ───────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES catalog_ingredients(id) ON DELETE CASCADE,
  qty_g NUMERIC,
  qty_original NUMERIC,
  unit TEXT,
  is_optional BOOLEAN DEFAULT false,
  group_name TEXT,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_ri_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ri_ingredient ON recipe_ingredients(ingredient_id);
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_ingredients' AND policyname='read_recipe_ingredients') THEN
    CREATE POLICY "read_recipe_ingredients" ON recipe_ingredients FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_ingredients' AND policyname='write_recipe_ingredients') THEN
    CREATE POLICY "write_recipe_ingredients" ON recipe_ingredients FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON recipe_ingredients TO anon;
GRANT ALL ON recipe_ingredients TO authenticated, service_role;

-- ── 3F: recipe_cooking_methods ───────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_cooking_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id) ON DELETE CASCADE,
  cooking_method_id UUID NOT NULL REFERENCES catalog_cooking_methods(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  step_number INTEGER,
  duration_min INTEGER,
  temperature TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, cooking_method_id)
);
CREATE INDEX IF NOT EXISTS idx_rcm_recipe ON recipe_cooking_methods(recipe_id);
CREATE INDEX IF NOT EXISTS idx_rcm_method ON recipe_cooking_methods(cooking_method_id);
ALTER TABLE recipe_cooking_methods ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_cooking_methods' AND policyname='read_recipe_cooking_methods') THEN
    CREATE POLICY "read_recipe_cooking_methods" ON recipe_cooking_methods FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_cooking_methods' AND policyname='write_recipe_cooking_methods') THEN
    CREATE POLICY "write_recipe_cooking_methods" ON recipe_cooking_methods FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON recipe_cooking_methods TO anon;
GRANT ALL ON recipe_cooking_methods TO authenticated, service_role;

-- ── 3G: recipe_equipment ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES catalog_equipment(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, equipment_id)
);
CREATE INDEX IF NOT EXISTS idx_re_recipe ON recipe_equipment(recipe_id);
CREATE INDEX IF NOT EXISTS idx_re_equipment ON recipe_equipment(equipment_id);
ALTER TABLE recipe_equipment ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_equipment' AND policyname='read_recipe_equipment') THEN
    CREATE POLICY "read_recipe_equipment" ON recipe_equipment FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_equipment' AND policyname='write_recipe_equipment') THEN
    CREATE POLICY "write_recipe_equipment" ON recipe_equipment FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON recipe_equipment TO anon;
GRANT ALL ON recipe_equipment TO authenticated, service_role;

-- ── 3H: recipe_elements (calculated nutrition) ───────────────
CREATE TABLE IF NOT EXISTS recipe_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'beneficial',
  amount_per_serving NUMERIC,
  amount_per_100g NUMERIC,
  unit TEXT,
  source TEXT DEFAULT 'calculated',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, element_id, relationship)
);
CREATE INDEX IF NOT EXISTS idx_rel_recipe ON recipe_elements(recipe_id);
CREATE INDEX IF NOT EXISTS idx_rel_element ON recipe_elements(element_id);
ALTER TABLE recipe_elements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_elements' AND policyname='read_recipe_elements') THEN
    CREATE POLICY "read_recipe_elements" ON recipe_elements FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_elements' AND policyname='write_recipe_elements') THEN
    CREATE POLICY "write_recipe_elements" ON recipe_elements FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON recipe_elements TO anon;
GRANT ALL ON recipe_elements TO authenticated, service_role;

-- ── 3I: symptom_elements ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS symptom_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_id UUID NOT NULL REFERENCES catalog_symptoms(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  relationship TEXT CHECK (relationship IN ('deficiency', 'excess')),
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
  onset_timeline TEXT,
  prevalence TEXT,
  description TEXT,
  reversible_with_correction BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symptom_id, element_id, relationship)
);
CREATE INDEX IF NOT EXISTS idx_se_symptom ON symptom_elements(symptom_id);
CREATE INDEX IF NOT EXISTS idx_se_element ON symptom_elements(element_id);
ALTER TABLE symptom_elements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='symptom_elements' AND policyname='read_symptom_elements') THEN
    CREATE POLICY "read_symptom_elements" ON symptom_elements FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='symptom_elements' AND policyname='write_symptom_elements') THEN
    CREATE POLICY "write_symptom_elements" ON symptom_elements FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON symptom_elements TO anon;
GRANT ALL ON symptom_elements TO authenticated, service_role;

-- ── 3J: activity_elements ────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id TEXT NOT NULL REFERENCES catalog_activities(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'depletes',
  mechanism TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, element_id)
);
CREATE INDEX IF NOT EXISTS idx_ae_activity ON activity_elements(activity_id);
CREATE INDEX IF NOT EXISTS idx_ae_element ON activity_elements(element_id);
ALTER TABLE activity_elements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activity_elements' AND policyname='read_activity_elements') THEN
    CREATE POLICY "read_activity_elements" ON activity_elements FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activity_elements' AND policyname='write_activity_elements') THEN
    CREATE POLICY "write_activity_elements" ON activity_elements FOR ALL USING (true);
  END IF;
END $$;
GRANT SELECT ON activity_elements TO anon;
GRANT ALL ON activity_elements TO authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- PART 4: SQL VIEWS for cross-table lookups
-- ════════════════════════════════════════════════════════════════

-- V1: Full nutrition for any ingredient
DROP VIEW IF EXISTS v_ingredient_nutrition;
CREATE VIEW v_ingredient_nutrition AS
SELECT
  i.id AS ingredient_id,
  i.name_common AS ingredient_name,
  i.category,
  e.id AS element_id,
  e.name_common AS element_name,
  e.category AS element_category,
  e.type_label AS element_type,
  e.health_role,
  cie.amount_per_100g,
  cie.unit_per_100g,
  cie.amount_per_serving,
  cie.is_primary
FROM catalog_ingredients i
JOIN catalog_ingredient_elements cie ON cie.ingredient_id = i.id
JOIN catalog_elements e ON e.id = cie.element_id;

-- V2: Recipe nutrition via ingredient chain
DROP VIEW IF EXISTS v_recipe_nutrition;
CREATE VIEW v_recipe_nutrition AS
SELECT
  r.id AS recipe_id,
  r.name_common AS recipe_name,
  r.category AS recipe_category,
  ri.ingredient_id,
  ing.name_common AS ingredient_name,
  ri.qty_g,
  ri.unit,
  e.id AS element_id,
  e.name_common AS element_name,
  e.category AS element_category,
  e.type_label AS element_type,
  e.health_role,
  cie.amount_per_100g,
  cie.unit_per_100g,
  CASE WHEN ri.qty_g > 0 AND cie.amount_per_100g > 0
    THEN ROUND((ri.qty_g / 100.0) * cie.amount_per_100g, 3)
    ELSE NULL END AS amount_in_recipe
FROM catalog_recipes r
JOIN recipe_ingredients ri ON ri.recipe_id = r.id
JOIN catalog_ingredients ing ON ing.id = ri.ingredient_id
JOIN catalog_ingredient_elements cie ON cie.ingredient_id = ri.ingredient_id
JOIN catalog_elements e ON e.id = cie.element_id;

-- V3: Recipe hazards from cooking methods
DROP VIEW IF EXISTS v_recipe_hazards;
CREATE VIEW v_recipe_hazards AS
SELECT
  r.id AS recipe_id,
  r.name_common AS recipe_name,
  cm.name AS cooking_method,
  e.id AS element_id,
  e.name_common AS hazardous_element,
  cme.severity,
  cme.mechanism
FROM catalog_recipes r
JOIN recipe_cooking_methods rcm ON rcm.recipe_id = r.id
JOIN catalog_cooking_methods cm ON cm.id = rcm.cooking_method_id
JOIN cooking_method_elements cme ON cme.cooking_method_id = cm.id
JOIN catalog_elements e ON e.id = cme.element_id
WHERE cme.relationship = 'hazardous';

-- V4: Element → all HS items (supplements + tests + products)
DROP VIEW IF EXISTS v_element_hs_coverage;
CREATE VIEW v_element_hs_coverage AS
SELECT
  e.id AS element_id, e.name_common AS element_name, e.category AS element_category,
  'supplement' AS hs_type, s.id AS hs_item_id, s.name AS hs_item_name, s.slug AS hs_item_slug, s.icon_url AS hs_item_image
FROM catalog_elements e
JOIN element_supplements es ON es.element_id = e.id
JOIN hs_supplements s ON s.id = es.supplement_id
UNION ALL
SELECT
  e.id, e.name_common, e.category,
  'test', t.id, t.name, t.slug, t.icon_url
FROM catalog_elements e
JOIN element_tests et ON et.element_id = e.id
JOIN hs_tests t ON t.id = et.test_id
UNION ALL
SELECT
  e.id, e.name_common, e.category,
  'product', p.id, p.name, p.slug, p.icon_url
FROM catalog_elements e
JOIN element_products ep ON ep.element_id = e.id
JOIN hs_products p ON p.id = ep.product_id;

-- V5: Symptom care chain → element → test → supplement
DROP VIEW IF EXISTS v_symptom_care_chain;
CREATE VIEW v_symptom_care_chain AS
SELECT
  sym.id AS symptom_id, sym.name AS symptom_name,
  se.relationship AS element_relationship,
  e.id AS element_id, e.name_common AS element_name,
  t.id AS test_id, t.name AS test_name,
  s.id AS supplement_id, s.name AS supplement_name
FROM catalog_symptoms sym
JOIN symptom_elements se ON se.symptom_id = sym.id
JOIN catalog_elements e ON e.id = se.element_id
LEFT JOIN element_tests et ON et.element_id = e.id
LEFT JOIN hs_tests t ON t.id = et.test_id
LEFT JOIN element_supplements es ON es.element_id = e.id
LEFT JOIN hs_supplements s ON s.id = es.supplement_id;

-- GRANTS on views
GRANT SELECT ON v_ingredient_nutrition TO anon, authenticated, service_role;
GRANT SELECT ON v_recipe_nutrition TO anon, authenticated, service_role;
GRANT SELECT ON v_recipe_hazards TO anon, authenticated, service_role;
GRANT SELECT ON v_element_hs_coverage TO anon, authenticated, service_role;
GRANT SELECT ON v_symptom_care_chain TO anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════
-- PART 5: SCHEMA-WIDE GRANTS
-- ════════════════════════════════════════════════════════════════
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ════════════════════════════════════════════════════════════════
-- VERIFY: List all new tables
-- ════════════════════════════════════════════════════════════════
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'hs_tests','hs_supplements','hs_products','hs_services','hs_experts','hs_packages','package_items',
    'element_supplements','element_tests','element_products',
    'cooking_method_elements',
    'recipe_ingredients','recipe_cooking_methods','recipe_equipment','recipe_elements',
    'symptom_elements','activity_elements',
    'catalog_ingredient_elements'
  )
ORDER BY table_name;
