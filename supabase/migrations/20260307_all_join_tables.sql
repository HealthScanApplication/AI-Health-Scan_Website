-- ============================================================
-- COMPREHENSIVE JOIN TABLES MIGRATION
-- All many-to-many relationships with proper FK constraints
-- ============================================================
-- ID Types:
--   TEXT: catalog_elements, catalog_ingredients, catalog_recipes,
--         catalog_products, catalog_activities, hs_supplements,
--         hs_tests, hs_products
--   UUID: catalog_equipment, catalog_cooking_methods, catalog_symptoms
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SAFETY: Drop all join tables first (re-runnable during dev)
-- ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS element_supplements CASCADE;
DROP TABLE IF EXISTS element_tests CASCADE;
DROP TABLE IF EXISTS element_products CASCADE;
DROP TABLE IF EXISTS cooking_method_elements CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipe_cooking_methods CASCADE;
DROP TABLE IF EXISTS recipe_equipment CASCADE;
DROP TABLE IF EXISTS symptom_elements CASCADE;
DROP TABLE IF EXISTS activity_elements CASCADE;
DROP TABLE IF EXISTS product_ingredients CASCADE;
DROP TABLE IF EXISTS recipe_elements CASCADE;

-- ============================================================
-- GROUP A: HealthScan element links (element ↔ supplements/tests/products)
-- ============================================================

-- A1: element ↔ supplements
CREATE TABLE element_supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  supplement_id TEXT NOT NULL REFERENCES hs_supplements(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, supplement_id)
);
CREATE INDEX idx_es_element ON element_supplements(element_id);
CREATE INDEX idx_es_supplement ON element_supplements(supplement_id);

-- A2: element ↔ tests
CREATE TABLE element_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL REFERENCES hs_tests(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, test_id)
);
CREATE INDEX idx_et_element ON element_tests(element_id);
CREATE INDEX idx_et_test ON element_tests(test_id);

-- A3: element ↔ HS products (air filters, water quality devices, kits)
CREATE TABLE element_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES hs_products(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, product_id)
);
CREATE INDEX idx_ep_element ON element_products(element_id);
CREATE INDEX idx_ep_product ON element_products(product_id);

-- ============================================================
-- GROUP B: Cooking method ↔ elements (hazardous/beneficial)
-- ============================================================

-- B1: cooking_method ↔ element
CREATE TABLE cooking_method_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooking_method_id UUID NOT NULL REFERENCES catalog_cooking_methods(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'hazardous',  -- 'hazardous', 'beneficial', 'reduces', 'increases'
  severity TEXT DEFAULT 'moderate',                 -- 'low', 'moderate', 'high'
  mechanism TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cooking_method_id, element_id)
);
CREATE INDEX idx_cme_method ON cooking_method_elements(cooking_method_id);
CREATE INDEX idx_cme_element ON cooking_method_elements(element_id);

-- ============================================================
-- GROUP C: Recipe joins
-- ============================================================

-- C1: recipe ↔ ingredient WITH AMOUNTS (the big one!)
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES catalog_ingredients(id) ON DELETE CASCADE,
  qty_g NUMERIC,                         -- quantity in grams
  qty_original NUMERIC,                  -- original quantity (e.g. 2 for "2 cups")
  unit TEXT,                             -- 'g', 'ml', 'cup', 'tbsp', 'piece', etc.
  is_optional BOOLEAN DEFAULT false,
  group_name TEXT,                       -- 'main', 'sauce', 'garnish', 'dressing'
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, ingredient_id)
);
CREATE INDEX idx_ri_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_ri_ingredient ON recipe_ingredients(ingredient_id);

-- C2: recipe ↔ cooking method
CREATE TABLE recipe_cooking_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id) ON DELETE CASCADE,
  cooking_method_id UUID NOT NULL REFERENCES catalog_cooking_methods(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,      -- primary method vs secondary
  step_number INTEGER,                   -- which step uses this method
  duration_min INTEGER,                  -- how long this method is used
  temperature TEXT,                      -- override temp for this recipe
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, cooking_method_id)
);
CREATE INDEX idx_rcm_recipe ON recipe_cooking_methods(recipe_id);
CREATE INDEX idx_rcm_method ON recipe_cooking_methods(cooking_method_id);

-- C3: recipe ↔ equipment
CREATE TABLE recipe_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES catalog_equipment(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,      -- required vs optional
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, equipment_id)
);
CREATE INDEX idx_re_recipe ON recipe_equipment(recipe_id);
CREATE INDEX idx_re_equipment ON recipe_equipment(equipment_id);

-- ============================================================
-- GROUP D: Symptom ↔ elements (deficiency/excess)
-- ============================================================

-- D1: symptom ↔ element
CREATE TABLE symptom_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_id UUID NOT NULL REFERENCES catalog_symptoms(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'deficiency', -- 'deficiency', 'excess', 'sensitivity'
  severity TEXT DEFAULT 'moderate',                 -- 'low', 'moderate', 'high'
  reversible BOOLEAN DEFAULT true,
  mechanism TEXT,                                   -- how the element affects the symptom
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symptom_id, element_id, relationship)
);
CREATE INDEX idx_se_symptom ON symptom_elements(symptom_id);
CREATE INDEX idx_se_element ON symptom_elements(element_id);
CREATE INDEX idx_se_relationship ON symptom_elements(relationship);

-- ============================================================
-- GROUP E: Activity ↔ elements (mineral impact)
-- ============================================================

-- E1: activity ↔ element
CREATE TABLE activity_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id TEXT NOT NULL REFERENCES catalog_activities(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'depletes', -- 'depletes', 'requires', 'enhances_absorption'
  impact_level TEXT DEFAULT 'moderate',           -- 'low', 'moderate', 'high'
  mechanism TEXT,                                  -- e.g. "lost through sweat"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, element_id)
);
CREATE INDEX idx_ae_activity ON activity_elements(activity_id);
CREATE INDEX idx_ae_element ON activity_elements(element_id);

-- ============================================================
-- GROUP F: Store product ↔ ingredients
-- ============================================================

-- F1: product ↔ ingredient (what's in packaged foods)
CREATE TABLE product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES catalog_ingredients(id) ON DELETE CASCADE,
  amount_per_serving NUMERIC,
  unit TEXT,
  percentage NUMERIC,                    -- % of product composition
  is_main BOOLEAN DEFAULT false,         -- main ingredient vs minor
  sort_order INTEGER DEFAULT 0,          -- order on label (first = most)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);
CREATE INDEX idx_pi_product ON product_ingredients(product_id);
CREATE INDEX idx_pi_ingredient ON product_ingredients(ingredient_id);

-- ============================================================
-- GROUP G: Recipe ↔ elements (aggregated from ingredients)
-- ============================================================

-- G1: recipe ↔ element (net beneficial + hazardous per recipe)
CREATE TABLE recipe_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'beneficial',  -- 'beneficial', 'hazardous'
  amount_per_serving NUMERIC,
  amount_per_100g NUMERIC,
  unit TEXT,
  source TEXT DEFAULT 'calculated',      -- 'calculated' (from ingredients) or 'manual'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, element_id, relationship)
);
CREATE INDEX idx_rel_recipe ON recipe_elements(recipe_id);
CREATE INDEX idx_rel_element ON recipe_elements(element_id);
CREATE INDEX idx_rel_relationship ON recipe_elements(relationship);

-- ============================================================
-- ADD COLUMNS: elements_hazardous/beneficial on cooking methods
-- ============================================================
ALTER TABLE catalog_cooking_methods ADD COLUMN IF NOT EXISTS elements_hazardous JSONB DEFAULT '{}'::jsonb;
ALTER TABLE catalog_cooking_methods ADD COLUMN IF NOT EXISTS elements_beneficial JSONB DEFAULT '{}'::jsonb;

-- Add element image columns to HS tables
ALTER TABLE hs_supplements ADD COLUMN IF NOT EXISTS element_image_url TEXT;
ALTER TABLE hs_supplements ADD COLUMN IF NOT EXISTS element_images JSONB;
ALTER TABLE hs_tests ADD COLUMN IF NOT EXISTS element_image_url TEXT;
ALTER TABLE hs_tests ADD COLUMN IF NOT EXISTS element_images JSONB;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS element_image_url TEXT;
ALTER TABLE hs_products ADD COLUMN IF NOT EXISTS element_images JSONB;

-- ============================================================
-- RLS POLICIES + GRANTS: Enable RLS + public read on all join tables
-- ============================================================

-- element_supplements
ALTER TABLE element_supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_element_supplements" ON element_supplements FOR SELECT USING (true);
CREATE POLICY "write_element_supplements" ON element_supplements FOR ALL USING (true);
GRANT SELECT ON element_supplements TO anon;
GRANT ALL ON element_supplements TO authenticated, service_role;

-- element_tests
ALTER TABLE element_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_element_tests" ON element_tests FOR SELECT USING (true);
CREATE POLICY "write_element_tests" ON element_tests FOR ALL USING (true);
GRANT SELECT ON element_tests TO anon;
GRANT ALL ON element_tests TO authenticated, service_role;

-- element_products
ALTER TABLE element_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_element_products" ON element_products FOR SELECT USING (true);
CREATE POLICY "write_element_products" ON element_products FOR ALL USING (true);
GRANT SELECT ON element_products TO anon;
GRANT ALL ON element_products TO authenticated, service_role;

-- cooking_method_elements
ALTER TABLE cooking_method_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_cooking_method_elements" ON cooking_method_elements FOR SELECT USING (true);
CREATE POLICY "write_cooking_method_elements" ON cooking_method_elements FOR ALL USING (true);
GRANT SELECT ON cooking_method_elements TO anon;
GRANT ALL ON cooking_method_elements TO authenticated, service_role;

-- recipe_ingredients
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_recipe_ingredients" ON recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "write_recipe_ingredients" ON recipe_ingredients FOR ALL USING (true);
GRANT SELECT ON recipe_ingredients TO anon;
GRANT ALL ON recipe_ingredients TO authenticated, service_role;

-- recipe_cooking_methods
ALTER TABLE recipe_cooking_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_recipe_cooking_methods" ON recipe_cooking_methods FOR SELECT USING (true);
CREATE POLICY "write_recipe_cooking_methods" ON recipe_cooking_methods FOR ALL USING (true);
GRANT SELECT ON recipe_cooking_methods TO anon;
GRANT ALL ON recipe_cooking_methods TO authenticated, service_role;

-- recipe_equipment
ALTER TABLE recipe_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_recipe_equipment" ON recipe_equipment FOR SELECT USING (true);
CREATE POLICY "write_recipe_equipment" ON recipe_equipment FOR ALL USING (true);
GRANT SELECT ON recipe_equipment TO anon;
GRANT ALL ON recipe_equipment TO authenticated, service_role;

-- symptom_elements
ALTER TABLE symptom_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_symptom_elements" ON symptom_elements FOR SELECT USING (true);
CREATE POLICY "write_symptom_elements" ON symptom_elements FOR ALL USING (true);
GRANT SELECT ON symptom_elements TO anon;
GRANT ALL ON symptom_elements TO authenticated, service_role;

-- activity_elements
ALTER TABLE activity_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_activity_elements" ON activity_elements FOR SELECT USING (true);
CREATE POLICY "write_activity_elements" ON activity_elements FOR ALL USING (true);
GRANT SELECT ON activity_elements TO anon;
GRANT ALL ON activity_elements TO authenticated, service_role;

-- product_ingredients
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_product_ingredients" ON product_ingredients FOR SELECT USING (true);
CREATE POLICY "write_product_ingredients" ON product_ingredients FOR ALL USING (true);
GRANT SELECT ON product_ingredients TO anon;
GRANT ALL ON product_ingredients TO authenticated, service_role;

-- recipe_elements
ALTER TABLE recipe_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_recipe_elements" ON recipe_elements FOR SELECT USING (true);
CREATE POLICY "write_recipe_elements" ON recipe_elements FOR ALL USING (true);
GRANT SELECT ON recipe_elements TO anon;
GRANT ALL ON recipe_elements TO authenticated, service_role;

-- ============================================================
-- AUTO-POPULATE: Fill join tables from existing JSONB/array data
-- ============================================================

-- ── A: HS element links (from element_key on hs_* tables) ──
INSERT INTO element_supplements (element_id, supplement_id, is_primary, notes)
SELECT e.id, s.id, true, 'Auto-linked via element_key: ' || s.element_key
FROM hs_supplements s
JOIN catalog_elements e ON (s.element_key = e.nutrient_key OR s.element_key = e.slug)
WHERE s.element_key IS NOT NULL
ON CONFLICT (element_id, supplement_id) DO NOTHING;

INSERT INTO element_tests (element_id, test_id, is_primary, notes)
SELECT e.id, t.id, true, 'Auto-linked via element_key: ' || t.element_key
FROM hs_tests t
JOIN catalog_elements e ON (t.element_key = e.nutrient_key OR t.element_key = e.slug)
WHERE t.element_key IS NOT NULL
ON CONFLICT (element_id, test_id) DO NOTHING;

INSERT INTO element_products (element_id, product_id, is_primary, notes)
SELECT e.id, p.id, true, 'Auto-linked via element_key: ' || p.element_key
FROM hs_products p
JOIN catalog_elements e ON (p.element_key = e.nutrient_key OR p.element_key = e.slug)
WHERE p.element_key IS NOT NULL
ON CONFLICT (element_id, product_id) DO NOTHING;

-- ── B: Cooking method → element links (from JSONB) ──
INSERT INTO cooking_method_elements (cooking_method_id, element_id, relationship, notes)
SELECT cm.id, e.id, 'hazardous', 'Auto-linked from elements_hazardous: ' || haz_key
FROM catalog_cooking_methods cm,
     jsonb_object_keys(cm.elements_hazardous) AS haz_key
JOIN catalog_elements e ON (e.nutrient_key = haz_key OR e.slug = haz_key)
WHERE cm.elements_hazardous IS NOT NULL
  AND jsonb_typeof(cm.elements_hazardous) = 'object'
  AND cm.elements_hazardous != '{}'::jsonb
ON CONFLICT (cooking_method_id, element_id) DO NOTHING;

INSERT INTO cooking_method_elements (cooking_method_id, element_id, relationship, notes)
SELECT cm.id, e.id, 'beneficial', 'Auto-linked from elements_beneficial: ' || ben_key
FROM catalog_cooking_methods cm,
     jsonb_object_keys(cm.elements_beneficial) AS ben_key
JOIN catalog_elements e ON (e.nutrient_key = ben_key OR e.slug = ben_key)
WHERE cm.elements_beneficial IS NOT NULL
  AND jsonb_typeof(cm.elements_beneficial) = 'object'
  AND cm.elements_beneficial != '{}'::jsonb
ON CONFLICT (cooking_method_id, element_id) DO NOTHING;

-- ── C1: Recipe → ingredients (from linked_ingredients JSONB) ──
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, qty_g, unit, sort_order, notes)
SELECT
  r.id,
  i.id,
  CASE WHEN (ing->>'qty_g')::numeric > 0 THEN (ing->>'qty_g')::numeric ELSE NULL END,
  COALESCE(ing->>'unit', 'g'),
  row_number() OVER (PARTITION BY r.id ORDER BY ordinality)::int,
  'Auto-linked from linked_ingredients JSONB'
FROM catalog_recipes r,
     jsonb_array_elements(r.linked_ingredients) WITH ORDINALITY AS t(ing, ordinality)
JOIN catalog_ingredients i ON (
  i.id = (ing->>'id')
  OR i.name_common = (ing->>'name')
)
WHERE r.linked_ingredients IS NOT NULL
  AND jsonb_typeof(r.linked_ingredients) = 'array'
  AND r.linked_ingredients != '[]'::jsonb
ON CONFLICT (recipe_id, ingredient_id) DO NOTHING;

-- ── C2: Recipe → cooking methods (from cooking_method_ids UUID[]) ──
INSERT INTO recipe_cooking_methods (recipe_id, cooking_method_id, is_primary, notes)
SELECT r.id, cm_id, false, 'Auto-linked from cooking_method_ids array'
FROM catalog_recipes r,
     unnest(r.cooking_method_ids) AS cm_id
WHERE r.cooking_method_ids IS NOT NULL
  AND array_length(r.cooking_method_ids, 1) > 0
ON CONFLICT (recipe_id, cooking_method_id) DO NOTHING;

-- Mark first cooking method as primary
UPDATE recipe_cooking_methods rcm SET is_primary = true
FROM (
  SELECT DISTINCT ON (recipe_id) id
  FROM recipe_cooking_methods
  ORDER BY recipe_id, created_at
) first_method
WHERE rcm.id = first_method.id;

-- ── C3: Recipe → equipment (from equipment_ids UUID[]) ──
INSERT INTO recipe_equipment (recipe_id, equipment_id, is_required, notes)
SELECT r.id, eq_id, true, 'Auto-linked from equipment_ids array'
FROM catalog_recipes r,
     unnest(r.equipment_ids) AS eq_id
WHERE r.equipment_ids IS NOT NULL
  AND array_length(r.equipment_ids, 1) > 0
ON CONFLICT (recipe_id, equipment_id) DO NOTHING;

-- ── D: Symptom → element links (from JSONB arrays) ──
INSERT INTO symptom_elements (symptom_id, element_id, relationship, notes)
SELECT s.id, e.id, 'deficiency', 'Auto-linked from linked_elements_deficiency'
FROM catalog_symptoms s,
     jsonb_array_elements_text(s.linked_elements_deficiency) AS def_key
JOIN catalog_elements e ON (e.nutrient_key = def_key OR e.slug = def_key OR e.id = def_key)
WHERE s.linked_elements_deficiency IS NOT NULL
  AND jsonb_typeof(s.linked_elements_deficiency) = 'array'
  AND s.linked_elements_deficiency != '[]'::jsonb
ON CONFLICT (symptom_id, element_id, relationship) DO NOTHING;

INSERT INTO symptom_elements (symptom_id, element_id, relationship, notes)
SELECT s.id, e.id, 'excess', 'Auto-linked from linked_elements_excess'
FROM catalog_symptoms s,
     jsonb_array_elements_text(s.linked_elements_excess) AS exc_key
JOIN catalog_elements e ON (e.nutrient_key = exc_key OR e.slug = exc_key OR e.id = exc_key)
WHERE s.linked_elements_excess IS NOT NULL
  AND jsonb_typeof(s.linked_elements_excess) = 'array'
  AND s.linked_elements_excess != '[]'::jsonb
ON CONFLICT (symptom_id, element_id, relationship) DO NOTHING;

-- ── E: Activity → element links (from mineral_impact JSONB) ──
INSERT INTO activity_elements (activity_id, element_id, relationship, mechanism, notes)
SELECT a.id, e.id, 'depletes', mi.value->>'mechanism', 'Auto-linked from mineral_impact'
FROM catalog_activities a,
     jsonb_each(a.mineral_impact) AS mi(key, value)
JOIN catalog_elements e ON (e.nutrient_key = mi.key OR e.slug = mi.key)
WHERE a.mineral_impact IS NOT NULL
  AND jsonb_typeof(a.mineral_impact) = 'object'
  AND a.mineral_impact != '{}'::jsonb
ON CONFLICT (activity_id, element_id) DO NOTHING;

-- ── F: Product → ingredients (from ingredients_text parsing) ──
-- Products store ingredients as text, so we do fuzzy name matching
INSERT INTO product_ingredients (product_id, ingredient_id, is_main, sort_order, notes)
SELECT DISTINCT ON (p.id, i.id)
  p.id, i.id,
  (row_number() OVER (PARTITION BY p.id ORDER BY i.name_common)) <= 3,
  row_number() OVER (PARTITION BY p.id ORDER BY i.name_common)::int,
  'Auto-linked via name match in ingredients_text'
FROM catalog_products p
JOIN catalog_ingredients i ON (
  p.ingredients_text ILIKE '%' || i.name_common || '%'
)
WHERE p.ingredients_text IS NOT NULL
  AND length(p.ingredients_text) > 5
  AND length(i.name_common) > 3
ON CONFLICT (product_id, ingredient_id) DO NOTHING;

-- ── G: Recipe → elements (aggregate from recipe_ingredients + ingredient_elements) ──
INSERT INTO recipe_elements (recipe_id, element_id, relationship, amount_per_serving, unit, source, notes)
SELECT
  ri.recipe_id,
  cie.element_id,
  'beneficial',
  SUM(CASE WHEN ri.qty_g > 0 AND cie.amount_per_100g > 0
    THEN (ri.qty_g / 100.0) * cie.amount_per_100g
    ELSE NULL END),
  cie.unit_per_100g,
  'calculated',
  'Aggregated from recipe_ingredients → catalog_ingredient_elements'
FROM recipe_ingredients ri
JOIN catalog_ingredient_elements cie ON cie.ingredient_id = ri.ingredient_id
WHERE cie.amount_per_100g > 0
GROUP BY ri.recipe_id, cie.element_id, cie.unit_per_100g
ON CONFLICT (recipe_id, element_id, relationship) DO NOTHING;

-- ── Populate element images on HS tables ──
UPDATE hs_supplements s SET
  element_image_url = e.image_url,
  element_images = jsonb_build_array(jsonb_build_object('element_key', COALESCE(e.nutrient_key, e.slug), 'image_url', e.image_url, 'name', e.name_common))
FROM catalog_elements e
WHERE (s.element_key = e.nutrient_key OR s.element_key = e.slug) AND e.image_url IS NOT NULL;

UPDATE hs_tests t SET
  element_image_url = e.image_url,
  element_images = jsonb_build_array(jsonb_build_object('element_key', COALESCE(e.nutrient_key, e.slug), 'image_url', e.image_url, 'name', e.name_common))
FROM catalog_elements e
WHERE (t.element_key = e.nutrient_key OR t.element_key = e.slug) AND e.image_url IS NOT NULL;

UPDATE hs_products p SET
  element_image_url = e.image_url,
  element_images = jsonb_build_array(jsonb_build_object('element_key', COALESCE(e.nutrient_key, e.slug), 'image_url', e.image_url, 'name', e.name_common))
FROM catalog_elements e
WHERE (p.element_key = e.nutrient_key OR p.element_key = e.slug) AND e.image_url IS NOT NULL;

-- ============================================================
-- AUTO-LINK: hs_tests that have element_key but no element_tests row
-- Ensures every test with an element_key has a join record
-- ============================================================
INSERT INTO element_tests (element_id, test_id, is_primary, notes)
SELECT e.id, t.id, true, 'Auto-linked: test element_key matched element'
FROM hs_tests t
JOIN catalog_elements e ON (t.element_key = e.nutrient_key OR t.element_key = e.slug)
WHERE t.element_key IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM element_tests et WHERE et.test_id = t.id AND et.element_id = e.id
  )
ON CONFLICT (element_id, test_id) DO NOTHING;

-- Also link supplements that might be missing
INSERT INTO element_supplements (element_id, supplement_id, is_primary, notes)
SELECT e.id, s.id, true, 'Auto-linked: supplement element_key matched element'
FROM hs_supplements s
JOIN catalog_elements e ON (s.element_key = e.nutrient_key OR s.element_key = e.slug)
WHERE s.element_key IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM element_supplements es WHERE es.supplement_id = s.id AND es.element_id = e.id
  )
ON CONFLICT (element_id, supplement_id) DO NOTHING;

-- ============================================================
-- VIEWS: Nutrition lookup via join chains
-- ============================================================

-- V1: Full nutrition breakdown for any ingredient (macro + micro + hazardous)
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

-- V2: Full nutrition breakdown for any recipe (via ingredients)
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

-- V3: Recipe hazardous elements (from cooking methods)
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

-- V4: Product nutrition (product → ingredients → elements)
DROP VIEW IF EXISTS v_product_nutrition;
CREATE VIEW v_product_nutrition AS
SELECT
  p.id AS product_id,
  COALESCE(p.name_common, p.name) AS product_name,
  p.category,
  pi.ingredient_id,
  ing.name_common AS ingredient_name,
  pi.is_main,
  e.id AS element_id,
  e.name_common AS element_name,
  e.type_label AS element_type,
  e.health_role,
  cie.amount_per_100g,
  cie.unit_per_100g
FROM catalog_products p
JOIN product_ingredients pi ON pi.product_id = p.id
JOIN catalog_ingredients ing ON ing.id = pi.ingredient_id
JOIN catalog_ingredient_elements cie ON cie.ingredient_id = pi.ingredient_id
JOIN catalog_elements e ON e.id = cie.element_id;

-- V5: Element → all related HS items (supplements + tests + products)
DROP VIEW IF EXISTS v_element_hs_coverage;
CREATE VIEW v_element_hs_coverage AS
SELECT
  e.id AS element_id,
  e.name_common AS element_name,
  e.category AS element_category,
  'supplement' AS hs_type,
  s.id AS hs_item_id,
  s.name AS hs_item_name,
  s.slug AS hs_item_slug,
  s.icon_url AS hs_item_image
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

-- V6: Symptom → which elements are involved → which tests detect them → which supplements treat them
DROP VIEW IF EXISTS v_symptom_care_chain;
CREATE VIEW v_symptom_care_chain AS
SELECT
  sym.id AS symptom_id,
  sym.name AS symptom_name,
  se.relationship AS element_relationship,
  e.id AS element_id,
  e.name_common AS element_name,
  t.id AS test_id,
  t.name AS test_name,
  s.id AS supplement_id,
  s.name AS supplement_name
FROM catalog_symptoms sym
JOIN symptom_elements se ON se.symptom_id = sym.id
JOIN catalog_elements e ON e.id = se.element_id
LEFT JOIN element_tests et ON et.element_id = e.id
LEFT JOIN hs_tests t ON t.id = et.test_id
LEFT JOIN element_supplements es ON es.element_id = e.id
LEFT JOIN hs_supplements s ON s.id = es.supplement_id;

-- Grant read on all views
GRANT SELECT ON v_ingredient_nutrition TO anon, authenticated, service_role;
GRANT SELECT ON v_recipe_nutrition TO anon, authenticated, service_role;
GRANT SELECT ON v_recipe_hazards TO anon, authenticated, service_role;
GRANT SELECT ON v_product_nutrition TO anon, authenticated, service_role;
GRANT SELECT ON v_element_hs_coverage TO anon, authenticated, service_role;
GRANT SELECT ON v_symptom_care_chain TO anon, authenticated, service_role;

-- ============================================================
-- VERIFY: Count all join table links
-- ============================================================
SELECT 'element_supplements' as join_table, COUNT(*) as total, COUNT(DISTINCT element_id) as side_a, COUNT(DISTINCT supplement_id) as side_b FROM element_supplements
UNION ALL SELECT 'element_tests', COUNT(*), COUNT(DISTINCT element_id), COUNT(DISTINCT test_id) FROM element_tests
UNION ALL SELECT 'element_products', COUNT(*), COUNT(DISTINCT element_id), COUNT(DISTINCT product_id) FROM element_products
UNION ALL SELECT 'cooking_method_elements', COUNT(*), COUNT(DISTINCT cooking_method_id), COUNT(DISTINCT element_id) FROM cooking_method_elements
UNION ALL SELECT 'recipe_ingredients', COUNT(*), COUNT(DISTINCT recipe_id), COUNT(DISTINCT ingredient_id) FROM recipe_ingredients
UNION ALL SELECT 'recipe_cooking_methods', COUNT(*), COUNT(DISTINCT recipe_id), COUNT(DISTINCT cooking_method_id) FROM recipe_cooking_methods
UNION ALL SELECT 'recipe_equipment', COUNT(*), COUNT(DISTINCT recipe_id), COUNT(DISTINCT equipment_id) FROM recipe_equipment
UNION ALL SELECT 'symptom_elements', COUNT(*), COUNT(DISTINCT symptom_id), COUNT(DISTINCT element_id) FROM symptom_elements
UNION ALL SELECT 'activity_elements', COUNT(*), COUNT(DISTINCT activity_id), COUNT(DISTINCT element_id) FROM activity_elements
UNION ALL SELECT 'product_ingredients', COUNT(*), COUNT(DISTINCT product_id), COUNT(DISTINCT ingredient_id) FROM product_ingredients
UNION ALL SELECT 'recipe_elements', COUNT(*), COUNT(DISTINCT recipe_id), COUNT(DISTINCT element_id) FROM recipe_elements;

-- ============================================================
-- BONUS: Show tests missing element links
-- ============================================================
SELECT t.id, t.name, t.element_key, 'MISSING element link' as status
FROM hs_tests t
WHERE t.element_key IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM element_tests et WHERE et.test_id = t.id)
ORDER BY t.name;
