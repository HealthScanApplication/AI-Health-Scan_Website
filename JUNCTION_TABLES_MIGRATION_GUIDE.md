# Junction Tables & Data Lookup Migration Guide

## Executive Summary

This guide documents the migration from **embedded JSONB/array columns** to **proper junction tables** for all many-to-many relationships in the Health Scan application. The migration improves data integrity, query performance, and enables proper relational queries across the catalog.

---

## 1. Architecture Overview

### 1.1 Database Projects

| Project | Ref | Role | URL |
|---------|-----|------|-----|
| **Staging** | `mofhvoudjxinvpplsytd` | Catalog data (ingredients, elements, recipes, cooking methods, symptoms) | `https://mofhvoudjxinvpplsytd.supabase.co` |
| **Production** | `ermbkttsyvpenjjxaxcf` | User data (auth, food items, activities, community content) | `https://ermbkttsyvpenjjxaxcf.supabase.co` |

### 1.2 Supabase Clients

**File:** `src/client/supabaseClient.ts`

```typescript
export const supabase = createClient(PROD_URL, PROD_ANON_KEY);      // Production
export const stagingSupabase = createClient(STAGING_URL, STAGING_ANON_KEY); // Staging catalog
```

---

## 2. Junction Tables Created (Staging)

### 2.1 Overview

| Junction Table | Left Entity | Right Entity | Rows | Status |
|----------------|-------------|--------------|------|--------|
| `element_supplements` | `catalog_elements` | `hs_supplements` | ~200 | ✅ Seeded |
| `element_tests` | `catalog_elements` | `hs_tests` | ~150 | ✅ Seeded |
| `element_products` | `catalog_elements` | `hs_products` | ~100 | ✅ Seeded |
| `cooking_method_elements` | `catalog_cooking_methods` | `catalog_elements` | ~50 | ✅ Seeded |
| `recipe_ingredients` | `catalog_recipes` | `catalog_ingredients` | ~1,200 | ✅ Seeded |
| `recipe_cooking_methods` | `catalog_recipes` | `catalog_cooking_methods` | ~400 | ✅ Seeded |
| `recipe_equipment` | `catalog_recipes` | `catalog_equipment` | ~300 | ✅ Seeded |
| `symptom_elements` | `catalog_symptoms` | `catalog_elements` | 91 | ✅ Seeded |
| `activity_elements` | `catalog_activities` | `catalog_elements` | ~80 | ✅ Seeded |
| `product_ingredients` | `catalog_products` | `catalog_ingredients` | ~200 | ✅ Seeded |
| `recipe_elements` | `catalog_recipes` | `catalog_elements` | ~2,000 | ✅ Calculated |
| `catalog_ingredient_elements` | `catalog_ingredients` | `catalog_elements` | 4,945 | ✅ Seeded |

---

### 2.2 Detailed Schemas

#### `catalog_ingredient_elements` ⭐ Most Important

**Purpose:** Links ingredients to their constituent elements (vitamins, minerals, macros, hazards) with amounts.

```sql
CREATE TABLE catalog_ingredient_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id TEXT NOT NULL REFERENCES catalog_ingredients(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  amount_per_100g NUMERIC,
  unit_per_100g TEXT,  -- ⚠️ NOT "amount_unit" in DB
  amount_per_serving NUMERIC,
  serving_type TEXT,
  serving_weight_g NUMERIC,
  likelihood_percent NUMERIC CHECK (likelihood_percent >= 0 AND likelihood_percent <= 100),
  likelihood_reason TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ingredient_id, element_id)
);
```

**⚠️ CRITICAL COLUMN MISMATCH:**
- **DB column:** `unit_per_100g`
- **TS interface property:** `amount_unit`
- **Mapping location:** `src/services/ingredientElementsService.ts`

**Query Pattern:**
```typescript
const { data } = await stagingSupabase
  .from('catalog_ingredient_elements')
  .select(`
    id,
    amount_per_100g,
    unit_per_100g,  -- ✅ Use this in SELECT
    amount_per_serving,
    is_primary,
    catalog_elements (
      id,
      name_common,
      category,
      type_label
    )
  `)
  .eq('ingredient_id', ingredientId);

// Then map to interface:
const mapped = data.map(row => ({
  ...row,
  amount_unit: row.unit_per_100g  // Map to TS interface
}));
```

---

#### `element_supplements`

**Purpose:** Links elements to HS supplements that address them.

```sql
CREATE TABLE element_supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  supplement_id TEXT NOT NULL REFERENCES hs_supplements(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, supplement_id)
);
```

**Replaces:** `hs_supplements.element_key` (single TEXT field) → now supports multiple elements per supplement

**Query Pattern:**
```typescript
// Get all supplements for an element
const { data } = await stagingSupabase
  .from('element_supplements')
  .select(`
    id,
    is_primary,
    hs_supplements (
      id,
      name,
      slug,
      icon_url,
      category
    )
  `)
  .eq('element_id', elementId);
```

---

#### `element_tests`

**Purpose:** Links elements to HS tests that detect them.

```sql
CREATE TABLE element_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL REFERENCES hs_tests(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(element_id, test_id)
);
```

**Replaces:** `hs_tests.element_key` (single TEXT field)

---

#### `cooking_method_elements`

**Purpose:** Links cooking methods to hazardous/beneficial elements they produce/preserve.

```sql
CREATE TABLE cooking_method_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooking_method_id UUID NOT NULL REFERENCES catalog_cooking_methods(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES catalog_elements(id) ON DELETE CASCADE,
  relationship TEXT CHECK (relationship IN ('hazardous', 'beneficial')),
  severity TEXT CHECK (severity IN ('low', 'moderate', 'high')),
  mechanism TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cooking_method_id, element_id)
);
```

**Replaces:**
- `catalog_cooking_methods.elements_hazardous` (JSONB)
- `catalog_cooking_methods.elements_beneficial` (JSONB)

**Query Pattern:**
```typescript
// Get hazardous elements for a cooking method
const { data } = await stagingSupabase
  .from('cooking_method_elements')
  .select(`
    id,
    relationship,
    severity,
    mechanism,
    catalog_elements (
      id,
      name_common,
      category
    )
  `)
  .eq('cooking_method_id', methodId)
  .eq('relationship', 'hazardous');
```

---

#### `recipe_ingredients`

**Purpose:** Links recipes to ingredients with quantities.

```sql
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES catalog_ingredients(id) ON DELETE CASCADE,
  qty_g NUMERIC,
  unit TEXT DEFAULT 'g',
  sort_order INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, ingredient_id)
);
```

**Replaces:** `catalog_recipes.linked_ingredients` (JSONB array)

**Old format:**
```json
[
  {"id": "chicken_breast", "name": "Chicken Breast", "qty_g": 200, "unit": "g"},
  {"id": "olive_oil", "name": "Olive Oil", "qty_g": 15, "unit": "ml"}
]
```

**New query:**
```typescript
const { data } = await stagingSupabase
  .from('recipe_ingredients')
  .select(`
    id,
    qty_g,
    unit,
    sort_order,
    catalog_ingredients (
      id,
      name_common,
      category,
      image_url
    )
  `)
  .eq('recipe_id', recipeId)
  .order('sort_order');
```

---

#### `symptom_elements`

**Purpose:** Links symptoms to elements that cause them (deficiency or excess).

```sql
CREATE TABLE symptom_elements (
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
  UNIQUE(symptom_id, element_id, relationship)
);
```

**Replaces:**
- `catalog_symptoms.linked_elements_deficiency` (JSONB array)
- `catalog_symptoms.linked_elements_excess` (JSONB array)

**⚠️ CHECK Constraints:**
- `relationship`: ONLY `deficiency` or `excess` (NOT `exposure`, `toxicity`, `overdose`)
- `severity`: ONLY `mild`, `moderate`, `severe`, `critical` (NOT `high`, `low`)

---

## 3. SQL Views for Cross-Table Nutrition Lookup

### 3.1 Available Views

| View | Purpose | Use Case |
|------|---------|----------|
| `v_ingredient_nutrition` | Full nutrition for any ingredient | "What's in chicken breast?" |
| `v_recipe_nutrition` | Calculated nutrition for recipes via ingredients | "What's the macro breakdown of this recipe?" |
| `v_recipe_hazards` | Hazardous elements from cooking methods | "Does grilling this produce carcinogens?" |
| `v_product_nutrition` | Product nutrition via ingredient links | "What nutrients are in this protein powder?" |
| `v_element_hs_coverage` | All HS items (supplements/tests/products) for an element | "For zinc: what supplements, tests, products exist?" |
| `v_symptom_care_chain` | Symptom → elements → tests → supplements | "Fatigue → which deficiency → which test → which supplement?" |

### 3.2 Example View Usage

**Get full nutrition for an ingredient:**
```sql
SELECT * FROM v_ingredient_nutrition WHERE ingredient_id = 'chicken_breast';
```

**Get recipe nutrition with calculated amounts:**
```sql
SELECT 
  element_name,
  element_category,
  SUM(amount_in_recipe) as total_amount,
  unit_per_100g
FROM v_recipe_nutrition 
WHERE recipe_id = 'grilled_chicken_salad'
GROUP BY element_name, element_category, unit_per_100g;
```

**Find all HS coverage for an element:**
```sql
SELECT * FROM v_element_hs_coverage WHERE element_id = 'zinc';
-- Returns: supplements, tests, products all in one query
```

---

## 4. Admin Panel Integration

### 4.1 Field Types for Junction Tables

**File:** `src/config/adminFieldConfig.ts`

#### Current Field Types (JSONB-based)

```typescript
{
  key: "elements_hazardous",
  label: "Hazardous Elements",
  type: "linked_elements",  // Custom component
  linkedTable: "catalog_elements",
  linkedCategory: "hazardous",
  showInDetail: true,
  showInEdit: true
}
```

**How it works:**
1. Reads `elements_hazardous` JSONB column
2. Parses keys as element slugs
3. Fetches element details from `catalog_elements`
4. Displays in a custom UI component

#### Recommended Migration to Junction Tables

**Option A: Keep JSONB, sync to junction table (current approach)**
- ✅ No UI changes needed
- ✅ Backward compatible
- ✅ Junction table auto-populated from JSONB
- ⚠️ JSONB is still source of truth

**Option B: Replace with junction table query (future)**
- Query `cooking_method_elements` directly
- Update `linked_elements` component to support junction table mode
- Remove JSONB columns after migration

---

### 4.2 Querying Junction Tables in Admin Panel

**Current pattern (JSONB):**
```typescript
// SimplifiedAdminPanel.tsx
const record = await stagingSupabase
  .from('catalog_cooking_methods')
  .select('id, name, elements_hazardous')  // JSONB column
  .eq('id', methodId)
  .single();

// elements_hazardous = {"acrylamide": {...}, "lead": {...}}
```

**New pattern (junction table):**
```typescript
const record = await stagingSupabase
  .from('catalog_cooking_methods')
  .select(`
    id,
    name,
    cooking_method_elements!inner (
      id,
      relationship,
      severity,
      catalog_elements (
        id,
        name_common,
        category
      )
    )
  `)
  .eq('id', methodId)
  .eq('cooking_method_elements.relationship', 'hazardous')
  .single();

// cooking_method_elements = [
//   {id: "...", relationship: "hazardous", catalog_elements: {...}},
//   ...
// ]
```

---

## 5. Migration Strategy: JSONB → Junction Tables

### 5.1 Phase 1: Dual-Write (Current State) ✅

**Status:** Complete

- Junction tables created and seeded from existing JSONB/arrays
- JSONB columns remain as source of truth
- Admin panel continues to read/write JSONB
- Background sync keeps junction tables updated

**Files:**
- `supabase/migrations/20260307_all_join_tables.sql` — creates all 11 junction tables
- `supabase/migrations/20260307_seed_ingredient_elements.sql` — seeds ingredient elements from 6 JSONB sources

---

### 5.2 Phase 2: Read from Junction, Write to Both (Recommended Next)

**Goal:** Start using junction tables for reads, keep JSONB for backward compatibility.

**Changes needed:**

1. **Update admin panel components:**
   ```typescript
   // Before (JSONB):
   const elements = Object.keys(record.elements_hazardous || {});
   
   // After (junction table):
   const { data: links } = await stagingSupabase
     .from('cooking_method_elements')
     .select('element_id, catalog_elements(name_common)')
     .eq('cooking_method_id', record.id)
     .eq('relationship', 'hazardous');
   const elements = links.map(l => l.catalog_elements.name_common);
   ```

2. **Update write operations to dual-write:**
   ```typescript
   // Write to JSONB (backward compat)
   await stagingSupabase
     .from('catalog_cooking_methods')
     .update({ elements_hazardous: jsonbData })
     .eq('id', methodId);
   
   // Also write to junction table
   await stagingSupabase
     .from('cooking_method_elements')
     .delete()
     .eq('cooking_method_id', methodId)
     .eq('relationship', 'hazardous');
   
   await stagingSupabase
     .from('cooking_method_elements')
     .insert(elementLinks);
   ```

---

### 5.3 Phase 3: Junction Tables Only (Future)

**Goal:** Remove JSONB columns entirely.

**Prerequisites:**
- All read queries migrated to junction tables
- All write operations use junction tables
- Mobile app updated to use junction table queries
- Verification that no code references old JSONB columns

**Migration steps:**
1. Add `deprecated` flag to JSONB columns
2. Monitor usage for 1-2 weeks
3. Run final sync: JSONB → junction tables
4. Drop JSONB columns
5. Update admin panel field configs to remove JSONB fields

---

## 6. Data Lookup Patterns

### 6.1 Element → All Related Entities

**Use case:** "For Vitamin C, show me all ingredients, recipes, supplements, tests, products"

```sql
-- Ingredients containing this element
SELECT i.name_common, cie.amount_per_100g, cie.unit_per_100g
FROM catalog_ingredient_elements cie
JOIN catalog_ingredients i ON i.id = cie.ingredient_id
WHERE cie.element_id = 'ascorbic_acid_vitamin_c'
ORDER BY cie.amount_per_100g DESC;

-- Recipes rich in this element (via ingredients)
SELECT r.name_common, SUM(re.amount_per_serving) as total_amount
FROM recipe_elements re
JOIN catalog_recipes r ON r.id = re.recipe_id
WHERE re.element_id = 'ascorbic_acid_vitamin_c'
GROUP BY r.id, r.name_common
ORDER BY total_amount DESC;

-- HS supplements for this element
SELECT s.name, s.slug, es.is_primary
FROM element_supplements es
JOIN hs_supplements s ON s.id = es.supplement_id
WHERE es.element_id = 'ascorbic_acid_vitamin_c';

-- HS tests for this element
SELECT t.name, t.slug, et.is_primary
FROM element_tests et
JOIN hs_tests t ON t.id = et.test_id
WHERE et.element_id = 'ascorbic_acid_vitamin_c';
```

**Or use the view:**
```sql
SELECT * FROM v_element_hs_coverage 
WHERE element_id = 'ascorbic_acid_vitamin_c';
```

---

### 6.2 Ingredient → Full Nutrition Profile

**Use case:** "What's the complete nutrition breakdown of salmon?"

```sql
SELECT * FROM v_ingredient_nutrition WHERE ingredient_id = 'salmon_atlantic';
```

**Returns:**
- All macronutrients (protein, fat, carbs)
- All micronutrients (vitamins, minerals)
- Hazardous elements (mercury, PCBs if present)
- Amounts per 100g with units

---

### 6.3 Recipe → Calculated Nutrition

**Use case:** "What's the total nutrition of this recipe?"

```sql
SELECT 
  element_category,
  element_name,
  SUM(amount_in_recipe) as total_amount,
  unit_per_100g
FROM v_recipe_nutrition
WHERE recipe_id = 'grilled_salmon_asparagus'
GROUP BY element_category, element_name, unit_per_100g
ORDER BY element_category, total_amount DESC;
```

---

### 6.4 Symptom → Care Chain

**Use case:** "I have fatigue. What deficiency? What test? What supplement?"

```sql
SELECT * FROM v_symptom_care_chain WHERE symptom_name ILIKE '%fatigue%';
```

**Returns:**
- Symptom name
- Related elements (e.g., iron, B12)
- Relationship type (deficiency/excess)
- Tests that detect it
- Supplements that treat it

---

## 7. Element ID Format (Critical)

### 7.1 Slug Format

Element IDs use **slug format**, NOT display names:

| Display Name | Actual ID (`catalog_elements.id`) |
|-------------|-----------------------------------|
| Vitamin A | `retinol_vitamin_a` |
| Vitamin B12 | `cobalamin_vitamin_b12` |
| Vitamin C | `ascorbic_acid_vitamin_c` |
| Iron | `iron` |
| Calcium | `calcium` |
| Lead | `lead` |
| Mercury | `mercury` |
| Acrylamide | `acrylamide` |

### 7.2 Lookup Pattern

**Always look up IDs before inserting:**
```typescript
// ❌ WRONG
await stagingSupabase
  .from('element_supplements')
  .insert({ element_id: 'Vitamin C', supplement_id: 'hs_supp_123' });

// ✅ CORRECT
const { data: element } = await stagingSupabase
  .from('catalog_elements')
  .select('id')
  .ilike('name_common', '%vitamin c%')
  .single();

await stagingSupabase
  .from('element_supplements')
  .insert({ element_id: element.id, supplement_id: 'hs_supp_123' });
```

---

## 8. Testing Junction Tables

### 8.1 Verification Queries

**Run after seeding to verify data integrity:**

```sql
-- Count all junction table links
SELECT 'element_supplements' as table_name, COUNT(*) as rows FROM element_supplements
UNION ALL SELECT 'element_tests', COUNT(*) FROM element_tests
UNION ALL SELECT 'element_products', COUNT(*) FROM element_products
UNION ALL SELECT 'cooking_method_elements', COUNT(*) FROM cooking_method_elements
UNION ALL SELECT 'recipe_ingredients', COUNT(*) FROM recipe_ingredients
UNION ALL SELECT 'recipe_cooking_methods', COUNT(*) FROM recipe_cooking_methods
UNION ALL SELECT 'recipe_equipment', COUNT(*) FROM recipe_equipment
UNION ALL SELECT 'symptom_elements', COUNT(*) FROM symptom_elements
UNION ALL SELECT 'activity_elements', COUNT(*) FROM activity_elements
UNION ALL SELECT 'product_ingredients', COUNT(*) FROM product_ingredients
UNION ALL SELECT 'recipe_elements', COUNT(*) FROM recipe_elements
UNION ALL SELECT 'catalog_ingredient_elements', COUNT(*) FROM catalog_ingredient_elements;
```

**Check for orphaned records:**
```sql
-- Elements with no ingredient links
SELECT e.id, e.name_common, e.category
FROM catalog_elements e
WHERE e.category IN ('Macronutrient', 'Vitamin', 'Mineral')
  AND NOT EXISTS (
    SELECT 1 FROM catalog_ingredient_elements cie WHERE cie.element_id = e.id
  )
ORDER BY e.category, e.name_common;

-- Ingredients with no element links
SELECT i.id, i.name_common, i.category
FROM catalog_ingredients i
WHERE NOT EXISTS (
    SELECT 1 FROM catalog_ingredient_elements cie WHERE cie.ingredient_id = i.id
  )
ORDER BY i.category, i.name_common
LIMIT 20;
```

---

## 9. Performance Considerations

### 9.1 Indexes

All junction tables have indexes on:
- Foreign key columns (automatic via FK constraints)
- Unique constraints (automatic)

**Additional recommended indexes:**
```sql
-- For frequent element lookups
CREATE INDEX idx_ingredient_elements_element ON catalog_ingredient_elements(element_id);
CREATE INDEX idx_element_supplements_element ON element_supplements(element_id);
CREATE INDEX idx_element_tests_element ON element_tests(element_id);

-- For recipe nutrition calculations
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_elements_recipe ON recipe_elements(recipe_id);
```

### 9.2 Query Optimization

**Use views for complex joins:**
```sql
-- ❌ SLOW: Multiple joins in application code
const ingredients = await getIngredients(recipeId);
for (const ing of ingredients) {
  const elements = await getElements(ing.id);
  // ...
}

-- ✅ FAST: Single view query
SELECT * FROM v_recipe_nutrition WHERE recipe_id = 'recipe_123';
```

---

## 10. Migration Checklist

### 10.1 Completed ✅

- [x] Create all 11 junction tables
- [x] Seed junction tables from existing JSONB/arrays
- [x] Create 6 SQL views for cross-table lookups
- [x] Add RLS policies and grants
- [x] Verify data integrity (4,945 ingredient-element links)
- [x] Fix `jsonb_typeof` errors in migration scripts

### 10.2 Pending (Admin Panel)

- [ ] Update `SimplifiedAdminPanel.tsx` to query junction tables
- [ ] Add junction table editing UI components
- [ ] Implement dual-write for JSONB + junction tables
- [ ] Add visual indicators for junction table vs JSONB data

### 10.3 Pending (Mobile App)

- [ ] Update ingredient detail screens to use `v_ingredient_nutrition`
- [ ] Update recipe nutrition calculations to use `v_recipe_nutrition`
- [ ] Update element detail screens to use `v_element_hs_coverage`
- [ ] Test all junction table queries on mobile

### 10.4 Future (Deprecation)

- [ ] Monitor JSONB column usage
- [ ] Add deprecation warnings to JSONB fields
- [ ] Final sync: JSONB → junction tables
- [ ] Drop JSONB columns
- [ ] Update all documentation

---

## 11. Troubleshooting

### 11.1 Common Errors

**Error:** `column "amount_unit" does not exist`
- **Cause:** Using TypeScript interface property name in SQL query
- **Fix:** Use `unit_per_100g` in `.select()`, map to `amount_unit` in code

**Error:** `new row violates check constraint "symptom_elements_relationship_check"`
- **Cause:** Using invalid relationship type (e.g., `exposure` instead of `excess`)
- **Fix:** Use only `deficiency` or `excess`

**Error:** `cannot call jsonb_each on a non-object`
- **Cause:** JSONB column contains `null`, `[]`, or scalar value
- **Fix:** Add `jsonb_typeof(column) = 'object'` check before `jsonb_each`

### 11.2 Data Integrity Checks

**Find duplicate junction records:**
```sql
SELECT ingredient_id, element_id, COUNT(*)
FROM catalog_ingredient_elements
GROUP BY ingredient_id, element_id
HAVING COUNT(*) > 1;
```

**Find junction records with invalid FKs:**
```sql
SELECT cie.id, cie.ingredient_id, cie.element_id
FROM catalog_ingredient_elements cie
LEFT JOIN catalog_ingredients i ON i.id = cie.ingredient_id
LEFT JOIN catalog_elements e ON e.id = cie.element_id
WHERE i.id IS NULL OR e.id IS NULL;
```

---

## 12. Contact & Support

**Migration files:**
- `supabase/migrations/20260307_all_join_tables.sql`
- `supabase/migrations/20260307_seed_ingredient_elements.sql`

**Key services:**
- `src/services/ingredientElementsService.ts`
- `src/services/aiSuggestService.ts`

**Admin panel:**
- `src/config/adminFieldConfig.ts`
- `src/components/SimplifiedAdminPanel.tsx`

For questions about junction table usage, consult this guide or the SQL migration files which include inline documentation.
