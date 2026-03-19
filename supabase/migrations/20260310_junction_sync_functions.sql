-- ============================================================
-- JUNCTION SYNC FUNCTIONS
-- Called by edge function after admin AI enrich saves JSONB data
-- These read the JUST-UPDATED JSONB columns from the parent table
-- and upsert corresponding junction table rows
-- ============================================================
-- Functions:
--   1. sync_ingredient_elements(p_id TEXT)   → catalog_ingredient_elements
--   2. sync_recipe_junctions(p_id TEXT)      → recipe_ingredients, recipe_cooking_methods, recipe_equipment, recipe_elements
--   3. sync_cooking_method_junctions(p_id TEXT) → cooking_method_elements
--   4. sync_symptom_junctions(p_id TEXT)     → symptom_elements
--   5. sync_activity_junctions(p_id TEXT)    → activity_elements
-- ============================================================


-- ═══════════════════════════════════════════════════════════════
-- 1. sync_ingredient_elements
--    Parses elements_beneficial, elements_hazardous,
--    and nutrition_per_100g JSONB → catalog_ingredient_elements rows
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION sync_ingredient_elements(p_id TEXT)
RETURNS JSONB AS $$
DECLARE
  cnt INTEGER := 0;
  total INTEGER := 0;
BEGIN
  -- Strategy 1: elements_beneficial → per_100g → minerals
  INSERT INTO catalog_ingredient_elements (ingredient_id, element_id, amount_per_100g, unit_per_100g, is_primary)
  SELECT i.id, e.id,
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
  WHERE i.id = p_id
    AND i.elements_beneficial->'per_100g'->'minerals' IS NOT NULL
    AND jsonb_typeof(i.elements_beneficial->'per_100g'->'minerals') = 'object'
    AND m.value ~ '^\d+\.?\d*$'
    AND (m.value)::numeric > 0
  ON CONFLICT (ingredient_id, element_id) DO UPDATE SET
    amount_per_100g = GREATEST(catalog_ingredient_elements.amount_per_100g, EXCLUDED.amount_per_100g),
    unit_per_100g = EXCLUDED.unit_per_100g,
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  -- Strategy 3: elements_beneficial → per_100g → vitamins
  INSERT INTO catalog_ingredient_elements (ingredient_id, element_id, amount_per_100g, unit_per_100g, is_primary)
  SELECT i.id, e.id,
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
  WHERE i.id = p_id
    AND i.elements_beneficial->'per_100g'->'vitamins' IS NOT NULL
    AND jsonb_typeof(i.elements_beneficial->'per_100g'->'vitamins') = 'object'
    AND v.value ~ '^\d+\.?\d*$'
    AND (v.value)::numeric > 0
  ON CONFLICT (ingredient_id, element_id) DO UPDATE SET
    amount_per_100g = GREATEST(catalog_ingredient_elements.amount_per_100g, EXCLUDED.amount_per_100g),
    unit_per_100g = EXCLUDED.unit_per_100g,
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  -- Strategy 4: elements_beneficial → per_100g → macronutrients
  INSERT INTO catalog_ingredient_elements (ingredient_id, element_id, amount_per_100g, unit_per_100g, is_primary)
  SELECT i.id, e.id,
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
  WHERE i.id = p_id
    AND i.elements_beneficial->'per_100g'->'macronutrients' IS NOT NULL
    AND jsonb_typeof(i.elements_beneficial->'per_100g'->'macronutrients') = 'object'
    AND mc.value ~ '^\d+\.?\d*$'
    AND (mc.value)::numeric > 0
  ON CONFLICT (ingredient_id, element_id) DO UPDATE SET
    amount_per_100g = GREATEST(catalog_ingredient_elements.amount_per_100g, EXCLUDED.amount_per_100g),
    unit_per_100g = EXCLUDED.unit_per_100g,
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  -- Strategy 5: elements_hazardous (flat JSONB: {"acrylamide": {"risk":"high"}, ...})
  INSERT INTO catalog_ingredient_elements (
    ingredient_id, element_id, amount_per_100g, unit_per_100g, is_primary,
    likelihood_percent, likelihood_reason
  )
  SELECT i.id, e.id,
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
  WHERE i.id = p_id
    AND i.elements_hazardous IS NOT NULL
    AND jsonb_typeof(i.elements_hazardous) = 'object'
    AND i.elements_hazardous != '{}'::jsonb
  ON CONFLICT (ingredient_id, element_id) DO UPDATE SET
    likelihood_percent = EXCLUDED.likelihood_percent,
    likelihood_reason = EXCLUDED.likelihood_reason,
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  -- Strategy 6: nutrition_per_100g (flat: {"calories":123,"protein_g":10,"calcium_mg":50})
  INSERT INTO catalog_ingredient_elements (ingredient_id, element_id, amount_per_100g, unit_per_100g, is_primary)
  SELECT i.id, e.id,
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
  WHERE i.id = p_id
    AND i.nutrition_per_100g IS NOT NULL
    AND jsonb_typeof(i.nutrition_per_100g) = 'object'
    AND i.nutrition_per_100g != '{}'::jsonb
    AND np.value ~ '^\d+\.?\d*$'
    AND (np.value)::numeric > 0
  ON CONFLICT (ingredient_id, element_id) DO NOTHING;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  RETURN jsonb_build_object('table', 'catalog_ingredient_elements', 'synced', total, 'ingredient_id', p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
-- 2. sync_recipe_junctions
--    Syncs: linked_ingredients → recipe_ingredients
--           cooking_method_ids  → recipe_cooking_methods
--           equipment_ids       → recipe_equipment
--           then recomputes recipe_elements from ingredient chain
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION sync_recipe_junctions(p_id TEXT)
RETURNS JSONB AS $$
DECLARE
  cnt INTEGER := 0;
  total INTEGER := 0;
BEGIN
  -- ── linked_ingredients → recipe_ingredients ──
  -- Handles both formats:
  --   Array of UUID strings: ["uuid1", "uuid2"]
  --   Array of objects: [{"id":"uuid1","name":"...","qty_g":100}]
  INSERT INTO recipe_ingredients (recipe_id, ingredient_id, qty_g, unit, sort_order, notes)
  SELECT
    p_id,
    CASE
      WHEN jsonb_typeof(el) = 'string' THEN el #>> '{}'
      WHEN jsonb_typeof(el) = 'object' AND el->>'id' IS NOT NULL THEN el->>'id'
      ELSE NULL
    END,
    CASE
      WHEN jsonb_typeof(el) = 'object' AND el->>'qty_g' IS NOT NULL THEN (el->>'qty_g')::numeric
      ELSE NULL
    END,
    CASE
      WHEN jsonb_typeof(el) = 'object' AND el->>'unit' IS NOT NULL THEN el->>'unit'
      ELSE 'g'
    END,
    ordinality::int,
    'Auto-synced from admin enrich'
  FROM catalog_recipes r,
       jsonb_array_elements(r.linked_ingredients) WITH ORDINALITY AS t(el, ordinality)
  WHERE r.id = p_id
    AND r.linked_ingredients IS NOT NULL
    AND jsonb_typeof(r.linked_ingredients) = 'array'
    AND r.linked_ingredients != '[]'::jsonb
    AND CASE
      WHEN jsonb_typeof(el) = 'string' THEN (el #>> '{}') IS NOT NULL
      WHEN jsonb_typeof(el) = 'object' THEN (el->>'id') IS NOT NULL
      ELSE false
    END
  ON CONFLICT (recipe_id, ingredient_id) DO UPDATE SET
    qty_g = COALESCE(EXCLUDED.qty_g, recipe_ingredients.qty_g),
    unit = COALESCE(EXCLUDED.unit, recipe_ingredients.unit),
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  -- ── cooking_method_ids (UUID[]) → recipe_cooking_methods ──
  INSERT INTO recipe_cooking_methods (recipe_id, cooking_method_id, is_primary, notes)
  SELECT p_id, cm_id,
    (row_number() OVER () = 1),
    'Auto-synced from admin enrich'
  FROM catalog_recipes r,
       unnest(r.cooking_method_ids) AS cm_id
  WHERE r.id = p_id
    AND r.cooking_method_ids IS NOT NULL
    AND array_length(r.cooking_method_ids, 1) > 0
  ON CONFLICT (recipe_id, cooking_method_id) DO UPDATE SET
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  -- ── equipment_ids (UUID[]) → recipe_equipment ──
  INSERT INTO recipe_equipment (recipe_id, equipment_id, is_required, notes)
  SELECT p_id, eq_id, true, 'Auto-synced from admin enrich'
  FROM catalog_recipes r,
       unnest(r.equipment_ids) AS eq_id
  WHERE r.id = p_id
    AND r.equipment_ids IS NOT NULL
    AND array_length(r.equipment_ids, 1) > 0
  ON CONFLICT (recipe_id, equipment_id) DO UPDATE SET
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  -- ── Recompute recipe_elements from recipe_ingredients → catalog_ingredient_elements chain ──
  -- Delete old computed rows for this recipe, then re-insert
  DELETE FROM recipe_elements
  WHERE recipe_id = p_id AND source = 'calculated';

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
    'Auto-computed from ingredient chain'
  FROM recipe_ingredients ri
  JOIN catalog_ingredient_elements cie ON cie.ingredient_id = ri.ingredient_id
  WHERE ri.recipe_id = p_id
    AND cie.amount_per_100g > 0
  GROUP BY ri.recipe_id, cie.element_id, cie.unit_per_100g
  ON CONFLICT (recipe_id, element_id, relationship) DO UPDATE SET
    amount_per_serving = EXCLUDED.amount_per_serving,
    unit = EXCLUDED.unit,
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  RETURN jsonb_build_object('table', 'recipe_junctions', 'synced', total, 'recipe_id', p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
-- 3. sync_cooking_method_junctions
--    Syncs: elements_hazardous/elements_beneficial → cooking_method_elements
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION sync_cooking_method_junctions(p_id TEXT)
RETURNS JSONB AS $$
DECLARE
  cnt INTEGER := 0;
  total INTEGER := 0;
  v_id UUID;
BEGIN
  v_id := p_id::UUID;

  -- elements_hazardous → cooking_method_elements (relationship='hazardous')
  INSERT INTO cooking_method_elements (cooking_method_id, element_id, relationship, notes)
  SELECT v_id, e.id, 'hazardous', 'Auto-synced from admin enrich'
  FROM catalog_cooking_methods cm,
       jsonb_object_keys(cm.elements_hazardous) AS haz_key
  JOIN catalog_elements e ON (e.nutrient_key = haz_key OR e.slug = haz_key OR e.id = haz_key)
  WHERE cm.id = v_id
    AND cm.elements_hazardous IS NOT NULL
    AND jsonb_typeof(cm.elements_hazardous) = 'object'
    AND cm.elements_hazardous != '{}'::jsonb
  ON CONFLICT (cooking_method_id, element_id) DO UPDATE SET
    relationship = 'hazardous',
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  -- elements_beneficial → cooking_method_elements (relationship='beneficial')
  INSERT INTO cooking_method_elements (cooking_method_id, element_id, relationship, notes)
  SELECT v_id, e.id, 'beneficial', 'Auto-synced from admin enrich'
  FROM catalog_cooking_methods cm,
       jsonb_object_keys(cm.elements_beneficial) AS ben_key
  JOIN catalog_elements e ON (e.nutrient_key = ben_key OR e.slug = ben_key OR e.id = ben_key)
  WHERE cm.id = v_id
    AND cm.elements_beneficial IS NOT NULL
    AND jsonb_typeof(cm.elements_beneficial) = 'object'
    AND cm.elements_beneficial != '{}'::jsonb
  ON CONFLICT (cooking_method_id, element_id) DO UPDATE SET
    relationship = 'beneficial',
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  RETURN jsonb_build_object('table', 'cooking_method_elements', 'synced', total, 'cooking_method_id', p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
-- 4. sync_symptom_junctions
--    Syncs: linked_elements_deficiency → symptom_elements (relationship='deficiency')
--           linked_elements_excess     → symptom_elements (relationship='excess')
--    ACTUAL DATA FORMAT:
--      [{"element_name":"Vitamin A","strength":"strong"},...]
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION sync_symptom_junctions(p_id TEXT)
RETURNS JSONB AS $$
DECLARE
  cnt INTEGER := 0;
  total INTEGER := 0;
  v_id UUID;
BEGIN
  v_id := p_id::UUID;

  -- linked_elements_deficiency → symptom_elements
  -- Data is array of objects: [{"element_name":"Vitamin A","strength":"strong"}]
  INSERT INTO symptom_elements (symptom_id, element_id, relationship, notes)
  SELECT DISTINCT v_id, e.id, 'deficiency',
    COALESCE(obj->>'strength', 'unknown') || ' link (auto-synced)'
  FROM catalog_symptoms s,
       jsonb_array_elements(s.linked_elements_deficiency) AS obj
  JOIN catalog_elements e ON (
    e.name_common ILIKE (obj->>'element_name') || '%'
    OR e.name_common ILIKE '%' || (obj->>'element_name') || '%'
    OR e.slug = lower(replace(replace(obj->>'element_name', ' ', '_'), '-', '_'))
    OR e.id = lower(replace(replace(obj->>'element_name', ' ', '_'), '-', '_'))
    OR e.nutrient_key = lower(replace(replace(obj->>'element_name', ' ', '_'), '-', '_'))
  )
  WHERE s.id = v_id
    AND s.linked_elements_deficiency IS NOT NULL
    AND jsonb_typeof(s.linked_elements_deficiency) = 'array'
    AND s.linked_elements_deficiency != '[]'::jsonb
    AND obj->>'element_name' IS NOT NULL
  ON CONFLICT (symptom_id, element_id, relationship) DO UPDATE SET
    notes = EXCLUDED.notes,
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  -- linked_elements_excess → symptom_elements
  INSERT INTO symptom_elements (symptom_id, element_id, relationship, notes)
  SELECT DISTINCT v_id, e.id, 'excess',
    COALESCE(obj->>'strength', 'unknown') || ' link (auto-synced)'
  FROM catalog_symptoms s,
       jsonb_array_elements(s.linked_elements_excess) AS obj
  JOIN catalog_elements e ON (
    e.name_common ILIKE (obj->>'element_name') || '%'
    OR e.name_common ILIKE '%' || (obj->>'element_name') || '%'
    OR e.slug = lower(replace(replace(obj->>'element_name', ' ', '_'), '-', '_'))
    OR e.id = lower(replace(replace(obj->>'element_name', ' ', '_'), '-', '_'))
    OR e.nutrient_key = lower(replace(replace(obj->>'element_name', ' ', '_'), '-', '_'))
  )
  WHERE s.id = v_id
    AND s.linked_elements_excess IS NOT NULL
    AND jsonb_typeof(s.linked_elements_excess) = 'array'
    AND s.linked_elements_excess != '[]'::jsonb
    AND obj->>'element_name' IS NOT NULL
  ON CONFLICT (symptom_id, element_id, relationship) DO UPDATE SET
    notes = EXCLUDED.notes,
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  RETURN jsonb_build_object('table', 'symptom_elements', 'synced', total, 'symptom_id', p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
-- 5. sync_activity_junctions
--    Syncs: mineral_impact JSONB → activity_elements
--    ACTUAL DATA FORMAT:
--      [{"name":"Sodium","lostMg":460}, {"name":"Potassium","lostMg":100}]
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION sync_activity_junctions(p_id TEXT)
RETURNS JSONB AS $$
DECLARE
  cnt INTEGER := 0;
  total INTEGER := 0;
BEGIN
  -- mineral_impact is an ARRAY of objects with "name" and "lostMg"
  INSERT INTO activity_elements (activity_id, element_id, relationship, mechanism, notes)
  SELECT DISTINCT p_id, e.id, 'depletes',
    'Loses ~' || COALESCE(obj->>'lostMg', '?') || 'mg per 30 min via sweat',
    'Auto-synced from admin enrich'
  FROM catalog_activities a,
       jsonb_array_elements(a.mineral_impact) AS obj
  JOIN catalog_elements e ON (
    e.name_common ILIKE (obj->>'name') || '%'
    OR e.name_common ILIKE '%' || (obj->>'name') || '%'
    OR e.slug = lower(replace(replace(obj->>'name', ' ', '_'), '-', '_'))
    OR e.id = lower(replace(replace(obj->>'name', ' ', '_'), '-', '_'))
    OR e.nutrient_key = lower(replace(replace(obj->>'name', ' ', '_'), '-', '_'))
  )
  WHERE a.id = p_id
    AND a.mineral_impact IS NOT NULL
    AND jsonb_typeof(a.mineral_impact) = 'array'
    AND a.mineral_impact != '[]'::jsonb
    AND obj->>'name' IS NOT NULL
  ON CONFLICT (activity_id, element_id) DO UPDATE SET
    mechanism = EXCLUDED.mechanism,
    updated_at = NOW();
  GET DIAGNOSTICS cnt = ROW_COUNT;
  total := total + cnt;

  RETURN jsonb_build_object('table', 'activity_elements', 'synced', total, 'activity_id', p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
-- GRANTS: Allow service_role and authenticated to execute
-- ═══════════════════════════════════════════════════════════════
GRANT EXECUTE ON FUNCTION sync_ingredient_elements(TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION sync_recipe_junctions(TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION sync_cooking_method_junctions(TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION sync_symptom_junctions(TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION sync_activity_junctions(TEXT) TO service_role, authenticated;
