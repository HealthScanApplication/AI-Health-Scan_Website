-- Backfill nutrition_per_100g from elements_beneficial for ingredients
-- Only updates records where nutrition_per_100g is NULL or empty
-- and elements_beneficial has macro data in per_100g.macronutrients

UPDATE catalog_ingredients
SET nutrition_per_100g = jsonb_build_object(
  'calories', COALESCE(
    (elements_beneficial->'per_100g'->>'calories')::numeric,
    0
  ),
  'protein_g', COALESCE(
    (elements_beneficial->'per_100g'->'macronutrients'->>'protein_g')::numeric,
    0
  ),
  'carbohydrates_g', COALESCE(
    (elements_beneficial->'per_100g'->'macronutrients'->>'carbohydrates_g')::numeric,
    0
  ),
  'fats_g', COALESCE(
    (elements_beneficial->'per_100g'->'macronutrients'->>'fat_g')::numeric,
    (elements_beneficial->'per_100g'->'macronutrients'->>'fats_g')::numeric,
    0
  ),
  'fiber_g', COALESCE(
    (elements_beneficial->'per_100g'->'macronutrients'->>'fiber_g')::numeric,
    0
  ),
  'sugar_g', COALESCE(
    (elements_beneficial->'per_100g'->'macronutrients'->>'sugars_g')::numeric,
    (elements_beneficial->'per_100g'->'macronutrients'->>'sugar_g')::numeric,
    0
  ),
  'water_g', COALESCE(
    (elements_beneficial->'per_100g'->'macronutrients'->>'water_g')::numeric,
    (elements_beneficial->'per_100g'->'macronutrients'->>'water_content_g')::numeric,
    0
  ),
  'sodium_mg', COALESCE(
    (elements_beneficial->'per_100g'->'minerals'->>'sodium_mg')::numeric,
    0
  )
),
updated_at = now()
WHERE
  -- Only backfill if nutrition_per_100g is empty/null
  (nutrition_per_100g IS NULL OR nutrition_per_100g = '{}'::jsonb OR nutrition_per_100g = 'null'::jsonb)
  -- And elements_beneficial has actual macro data
  AND elements_beneficial IS NOT NULL
  AND elements_beneficial != '{}'::jsonb
  AND elements_beneficial->'per_100g' IS NOT NULL
  AND (
    (elements_beneficial->'per_100g'->>'calories')::numeric > 0
    OR (elements_beneficial->'per_100g'->'macronutrients'->>'protein_g')::numeric > 0
  );

-- Also backfill nutrition_per_serving from elements_beneficial.per_serving
UPDATE catalog_ingredients
SET nutrition_per_serving = jsonb_build_object(
  'calories', COALESCE(
    (elements_beneficial->'per_serving'->>'calories')::numeric,
    0
  ),
  'protein_g', COALESCE(
    (elements_beneficial->'per_serving'->'macronutrients'->>'protein_g')::numeric,
    0
  ),
  'carbohydrates_g', COALESCE(
    (elements_beneficial->'per_serving'->'macronutrients'->>'carbohydrates_g')::numeric,
    0
  ),
  'fats_g', COALESCE(
    (elements_beneficial->'per_serving'->'macronutrients'->>'fat_g')::numeric,
    (elements_beneficial->'per_serving'->'macronutrients'->>'fats_g')::numeric,
    0
  ),
  'fiber_g', COALESCE(
    (elements_beneficial->'per_serving'->'macronutrients'->>'fiber_g')::numeric,
    0
  ),
  'sugar_g', COALESCE(
    (elements_beneficial->'per_serving'->'macronutrients'->>'sugars_g')::numeric,
    (elements_beneficial->'per_serving'->'macronutrients'->>'sugar_g')::numeric,
    0
  ),
  'water_g', COALESCE(
    (elements_beneficial->'per_serving'->'macronutrients'->>'water_g')::numeric,
    (elements_beneficial->'per_serving'->'macronutrients'->>'water_content_g')::numeric,
    0
  ),
  'serving_size', COALESCE(
    elements_beneficial->'serving'->>'name',
    ''
  ),
  'serving_size_g', COALESCE(
    (elements_beneficial->'serving'->>'size_g')::numeric,
    0
  )
),
updated_at = now()
WHERE
  (nutrition_per_serving IS NULL OR nutrition_per_serving = '{}'::jsonb OR nutrition_per_serving = 'null'::jsonb)
  AND elements_beneficial IS NOT NULL
  AND elements_beneficial != '{}'::jsonb
  AND elements_beneficial->'per_serving' IS NOT NULL
  AND (
    (elements_beneficial->'per_serving'->>'calories')::numeric > 0
    OR (elements_beneficial->'per_serving'->'macronutrients'->>'protein_g')::numeric > 0
  );

-- Also fix any existing water_content_g keys in nutrition_per_100g to water_g
UPDATE catalog_ingredients
SET nutrition_per_100g = nutrition_per_100g - 'water_content_g' || jsonb_build_object('water_g', nutrition_per_100g->'water_content_g'),
    updated_at = now()
WHERE nutrition_per_100g ? 'water_content_g'
  AND NOT nutrition_per_100g ? 'water_g';
