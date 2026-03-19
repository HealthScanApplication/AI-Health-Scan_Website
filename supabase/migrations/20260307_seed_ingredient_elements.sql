-- ============================================================
-- SEED: catalog_ingredient_elements
-- Populates the ingredient → element join table from existing
-- JSONB columns on catalog_ingredients:
--   1. elements_content  (flat: {"vitamin_a": {"amount":900,"unit":"μg"}})
--   2. elements_beneficial->'per_100g'->'minerals'  (nested)
--   3. elements_beneficial->'per_100g'->'vitamins'  (nested)
--   4. elements_beneficial->'per_100g'->'macronutrients' (nested)
--   5. elements_hazardous (flat JSONB keys → hazardous elements)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STRATEGY 1: elements_content (cleanest source)
-- Structure: { "vitamin_a": {"amount": 900, "unit": "μg"}, ... }
-- Keys match catalog_elements.nutrient_key or slug
-- ────────────────────────────────────────────────────────────
INSERT INTO catalog_ingredient_elements (
  ingredient_id, element_id, amount_per_100g, unit_per_100g, is_primary
)
SELECT
  i.id,
  e.id,
  (ec.value->>'amount')::numeric,
  COALESCE(ec.value->>'unit', 'mg'),
  true
FROM catalog_ingredients i,
     jsonb_each(i.elements_content) AS ec(key, value)
JOIN catalog_elements e ON (e.nutrient_key = ec.key OR e.slug = ec.key OR e.id = ec.key)
WHERE i.elements_content IS NOT NULL
  AND jsonb_typeof(i.elements_content) = 'object'
  AND i.elements_content != '{}'::jsonb
  AND (ec.value->>'amount')::numeric > 0
ON CONFLICT (ingredient_id, element_id) DO UPDATE SET
  amount_per_100g = EXCLUDED.amount_per_100g,
  unit_per_100g = EXCLUDED.unit_per_100g,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────
-- STRATEGY 2: elements_beneficial → minerals
-- Structure: { "per_100g": { "minerals": { "sodium_mg": 10, ... } } }
-- Keys have unit suffix (_mg, _ug, _g) that needs stripping
-- ────────────────────────────────────────────────────────────
INSERT INTO catalog_ingredient_elements (
  ingredient_id, element_id, amount_per_100g, unit_per_100g, is_primary
)
SELECT
  i.id,
  e.id,
  (m.value)::numeric,
  CASE
    WHEN m.key LIKE '%_ug' OR m.key LIKE '%_mcg' THEN 'μg'
    WHEN m.key LIKE '%_mg' THEN 'mg'
    WHEN m.key LIKE '%_g' THEN 'g'
    ELSE 'mg'
  END,
  false
FROM catalog_ingredients i,
     jsonb_each_text(i.elements_beneficial->'per_100g'->'minerals') AS m(key, value)
JOIN catalog_elements e ON (
  e.nutrient_key = regexp_replace(m.key, '_(mg|ug|mcg|g)$', '')
  OR e.slug = regexp_replace(m.key, '_(mg|ug|mcg|g)$', '')
  OR e.nutrient_key = m.key
  OR e.slug = m.key
)
WHERE i.elements_beneficial IS NOT NULL
  AND jsonb_typeof(i.elements_beneficial) = 'object'
  AND i.elements_beneficial->'per_100g' IS NOT NULL
  AND jsonb_typeof(i.elements_beneficial->'per_100g') = 'object'
  AND i.elements_beneficial->'per_100g'->'minerals' IS NOT NULL
  AND jsonb_typeof(i.elements_beneficial->'per_100g'->'minerals') = 'object'
  AND (m.value)::numeric > 0
ON CONFLICT (ingredient_id, element_id) DO UPDATE SET
  amount_per_100g = GREATEST(catalog_ingredient_elements.amount_per_100g, EXCLUDED.amount_per_100g),
  unit_per_100g = EXCLUDED.unit_per_100g,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────
-- STRATEGY 3: elements_beneficial → vitamins
-- Structure: { "per_100g": { "vitamins": { "vitamin_a_ug": 100, ... } } }
-- ────────────────────────────────────────────────────────────
INSERT INTO catalog_ingredient_elements (
  ingredient_id, element_id, amount_per_100g, unit_per_100g, is_primary
)
SELECT
  i.id,
  e.id,
  (v.value)::numeric,
  CASE
    WHEN v.key LIKE '%_ug' OR v.key LIKE '%_mcg' THEN 'μg'
    WHEN v.key LIKE '%_mg' THEN 'mg'
    WHEN v.key LIKE '%_g' THEN 'g'
    WHEN v.key LIKE '%_iu' THEN 'IU'
    ELSE 'mg'
  END,
  false
FROM catalog_ingredients i,
     jsonb_each_text(i.elements_beneficial->'per_100g'->'vitamins') AS v(key, value)
JOIN catalog_elements e ON (
  e.nutrient_key = regexp_replace(v.key, '_(mg|ug|mcg|g|iu)$', '')
  OR e.slug = regexp_replace(v.key, '_(mg|ug|mcg|g|iu)$', '')
  OR e.nutrient_key = v.key
  OR e.slug = v.key
)
WHERE i.elements_beneficial IS NOT NULL
  AND jsonb_typeof(i.elements_beneficial) = 'object'
  AND i.elements_beneficial->'per_100g' IS NOT NULL
  AND jsonb_typeof(i.elements_beneficial->'per_100g') = 'object'
  AND i.elements_beneficial->'per_100g'->'vitamins' IS NOT NULL
  AND jsonb_typeof(i.elements_beneficial->'per_100g'->'vitamins') = 'object'
  AND (v.value)::numeric > 0
ON CONFLICT (ingredient_id, element_id) DO UPDATE SET
  amount_per_100g = GREATEST(catalog_ingredient_elements.amount_per_100g, EXCLUDED.amount_per_100g),
  unit_per_100g = EXCLUDED.unit_per_100g,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────
-- STRATEGY 4: elements_beneficial → macronutrients
-- Structure: { "per_100g": { "macronutrients": { "protein_g": 10, ... } } }
-- Map: protein_g → protein, fat_g/fats_g → fat, carbohydrates_g → carbohydrates, etc.
-- ────────────────────────────────────────────────────────────
INSERT INTO catalog_ingredient_elements (
  ingredient_id, element_id, amount_per_100g, unit_per_100g, is_primary
)
SELECT
  i.id,
  e.id,
  (mc.value)::numeric,
  'g',
  false
FROM catalog_ingredients i,
     jsonb_each_text(i.elements_beneficial->'per_100g'->'macronutrients') AS mc(key, value)
JOIN catalog_elements e ON (
  e.nutrient_key = regexp_replace(mc.key, '_(g|mg)$', '')
  OR e.slug = regexp_replace(mc.key, '_(g|mg)$', '')
  OR e.nutrient_key = mc.key
  OR e.slug = mc.key
)
WHERE i.elements_beneficial IS NOT NULL
  AND jsonb_typeof(i.elements_beneficial) = 'object'
  AND i.elements_beneficial->'per_100g' IS NOT NULL
  AND jsonb_typeof(i.elements_beneficial->'per_100g') = 'object'
  AND i.elements_beneficial->'per_100g'->'macronutrients' IS NOT NULL
  AND jsonb_typeof(i.elements_beneficial->'per_100g'->'macronutrients') = 'object'
  AND (mc.value)::numeric > 0
ON CONFLICT (ingredient_id, element_id) DO UPDATE SET
  amount_per_100g = GREATEST(catalog_ingredient_elements.amount_per_100g, EXCLUDED.amount_per_100g),
  unit_per_100g = EXCLUDED.unit_per_100g,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────
-- STRATEGY 5: elements_hazardous (flat JSONB keys)
-- Structure: { "acrylamide": {"risk": "high"}, "lead": {"risk": "low"} }
-- ────────────────────────────────────────────────────────────
INSERT INTO catalog_ingredient_elements (
  ingredient_id, element_id, amount_per_100g, unit_per_100g, is_primary,
  likelihood_percent, likelihood_reason
)
SELECT
  i.id,
  e.id,
  COALESCE((hz.value->>'amount')::numeric, 0),
  COALESCE(hz.value->>'unit', 'trace'),
  false,
  CASE
    WHEN hz.value->>'risk' = 'high' THEN 80
    WHEN hz.value->>'risk' = 'moderate' THEN 50
    WHEN hz.value->>'risk' = 'low' THEN 20
    ELSE 10
  END,
  'Hazardous element: ' || COALESCE(hz.value->>'risk', 'unknown') || ' risk'
FROM catalog_ingredients i,
     jsonb_each(i.elements_hazardous) AS hz(key, value)
JOIN catalog_elements e ON (e.nutrient_key = hz.key OR e.slug = hz.key OR e.id = hz.key)
WHERE i.elements_hazardous IS NOT NULL
  AND jsonb_typeof(i.elements_hazardous) = 'object'
  AND i.elements_hazardous != '{}'::jsonb
ON CONFLICT (ingredient_id, element_id) DO UPDATE SET
  likelihood_percent = EXCLUDED.likelihood_percent,
  likelihood_reason = EXCLUDED.likelihood_reason,
  updated_at = NOW();

-- ────────────────────────────────────────────────────────────
-- STRATEGY 6: Also backfill from nutrition_per_100g if available
-- Structure: { "calories": 123, "protein_g": 10, "calcium_mg": 50 }
-- This is a flat key-value with unit suffixes
-- ────────────────────────────────────────────────────────────
INSERT INTO catalog_ingredient_elements (
  ingredient_id, element_id, amount_per_100g, unit_per_100g, is_primary
)
SELECT
  i.id,
  e.id,
  (np.value)::numeric,
  CASE
    WHEN np.key LIKE '%_ug' OR np.key LIKE '%_mcg' THEN 'μg'
    WHEN np.key LIKE '%_mg' THEN 'mg'
    WHEN np.key LIKE '%_g' THEN 'g'
    WHEN np.key = 'calories' THEN 'kcal'
    ELSE 'mg'
  END,
  false
FROM catalog_ingredients i,
     jsonb_each_text(i.nutrition_per_100g) AS np(key, value)
JOIN catalog_elements e ON (
  e.nutrient_key = regexp_replace(np.key, '_(mg|ug|mcg|g)$', '')
  OR e.slug = regexp_replace(np.key, '_(mg|ug|mcg|g)$', '')
  OR e.nutrient_key = np.key
  OR e.slug = np.key
)
WHERE i.nutrition_per_100g IS NOT NULL
  AND jsonb_typeof(i.nutrition_per_100g) = 'object'
  AND i.nutrition_per_100g != '{}'::jsonb
  AND np.value ~ '^\d+\.?\d*$'
  AND (np.value)::numeric > 0
ON CONFLICT (ingredient_id, element_id) DO NOTHING;

-- ============================================================
-- VERIFY: How many ingredient-element links were created
-- ============================================================
SELECT
  'Total ingredient-element links' AS metric,
  COUNT(*) AS value
FROM catalog_ingredient_elements
UNION ALL
SELECT 'Distinct ingredients linked', COUNT(DISTINCT ingredient_id) FROM catalog_ingredient_elements
UNION ALL
SELECT 'Distinct elements linked', COUNT(DISTINCT element_id) FROM catalog_ingredient_elements
UNION ALL
SELECT 'Avg elements per ingredient', ROUND(AVG(cnt), 1)::text::bigint FROM (
  SELECT ingredient_id, COUNT(*) AS cnt FROM catalog_ingredient_elements GROUP BY ingredient_id
) sub
UNION ALL
SELECT 'Ingredients with NO element links', COUNT(*) FROM catalog_ingredients i
WHERE NOT EXISTS (SELECT 1 FROM catalog_ingredient_elements cie WHERE cie.ingredient_id = i.id);

-- Show top 5 ingredients by element count
SELECT
  i.name_common,
  COUNT(cie.element_id) AS element_count
FROM catalog_ingredient_elements cie
JOIN catalog_ingredients i ON i.id = cie.ingredient_id
GROUP BY i.name_common
ORDER BY element_count DESC
LIMIT 5;

-- Show ingredients that STILL have no element links (need manual seeding or AI enrichment)
SELECT i.id, i.name_common, i.category,
  CASE
    WHEN i.elements_content IS NOT NULL AND i.elements_content != '{}'::jsonb THEN 'has elements_content'
    WHEN i.elements_beneficial IS NOT NULL AND i.elements_beneficial != '{}'::jsonb THEN 'has elements_beneficial'
    WHEN i.nutrition_per_100g IS NOT NULL AND i.nutrition_per_100g != '{}'::jsonb THEN 'has nutrition_per_100g'
    ELSE 'NO nutrition data at all'
  END AS data_status
FROM catalog_ingredients i
WHERE NOT EXISTS (SELECT 1 FROM catalog_ingredient_elements cie WHERE cie.ingredient_id = i.id)
ORDER BY i.name_common
LIMIT 20;
