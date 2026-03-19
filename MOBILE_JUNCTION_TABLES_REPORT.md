# Mobile App: Recipe Junction Tables Report

> **Generated:** 2026-03-13 | **Staging Supabase:** `mofhvoudjxinvpplsytd`
> **Base URL:** `https://mofhvoudjxinvpplsytd.supabase.co`

---

## 1. Overview — What Changed

All recipe relationships have been migrated from **embedded JSONB/array columns** to **proper junction tables**. The old columns still exist for backward compatibility, but the junction tables are the source of truth going forward.

### Old Approach (DEPRECATED — do not use)

| Column on `catalog_recipes` | Type | Issue |
|------------------------------|------|-------|
| `linked_ingredients` | JSONB array | Embedded, no FK integrity |
| `cooking_method_ids` | UUID[] | Flat array, no metadata |
| `equipment_ids` | UUID[] | Flat array, no metadata |
| `equipment` | JSONB | Legacy free-text |

### New Approach (USE THESE)

| Junction Table | Left | Right | Rows | Extra Columns |
|----------------|------|-------|------|---------------|
| `recipe_ingredients` | `catalog_recipes` | `catalog_ingredients` | ~1,200 | qty_g, unit, sort_order, is_optional, group_name |
| `recipe_cooking_methods` | `catalog_recipes` | `catalog_cooking_methods` | ~400 | is_primary, step_number, duration_min, temperature |
| `recipe_equipment` | `catalog_recipes` | `catalog_equipment` | ~300 | is_required |
| `recipe_elements` | `catalog_recipes` | `catalog_elements` | ~2,000 | amount_per_serving, unit, relationship, source |

### Additional Related Tables

| Junction Table | Left | Right | Rows | Purpose |
|----------------|------|-------|------|---------|
| `cooking_method_elements` | `catalog_cooking_methods` | `catalog_elements` | ~50 | Which hazards/benefits a cooking method produces |
| `catalog_ingredient_elements` | `catalog_ingredients` | `catalog_elements` | ~4,945 | Nutrition content of ingredients |
| `element_supplements` | `catalog_elements` | `hs_supplements` | ~200 | Which supplements address an element |
| `element_tests` | `catalog_elements` | `hs_tests` | ~150 | Which tests detect an element |
| `element_products` | `catalog_elements` | `hs_products` | ~100 | Which products relate to an element |
| `symptom_elements` | `catalog_symptoms` | `catalog_elements` | ~91 | Symptom ↔ element (deficiency/excess) |
| `activity_elements` | `catalog_activities` | `catalog_elements` | ~80 | Activity ↔ mineral impact |

---

## 2. RLS & Access

All junction tables have **public read access** via the `anon` key. No auth required for SELECT queries.

```
RLS Policy: SELECT → true (all rows visible)
GRANT SELECT ON [all_junction_tables] TO anon;
```

You can query directly with the Supabase anon key — no edge function needed.

---

## 3. Recipe Junction Table Schemas

### 3.1 `recipe_ingredients`

```sql
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id),
  ingredient_id TEXT NOT NULL REFERENCES catalog_ingredients(id),
  qty_g NUMERIC,              -- quantity in grams
  qty_original NUMERIC,       -- original quantity (e.g. 2 for "2 cups")
  unit TEXT,                   -- 'g', 'ml', 'cup', 'tbsp', 'piece'
  is_optional BOOLEAN DEFAULT false,
  group_name TEXT,             -- 'main', 'sauce', 'garnish', 'dressing'
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(recipe_id, ingredient_id)
);
```

**Supabase Query:**
```typescript
const { data: ingredients } = await stagingSupabase
  .from('recipe_ingredients')
  .select(`
    id,
    qty_g,
    qty_original,
    unit,
    is_optional,
    group_name,
    sort_order,
    catalog_ingredients (
      id,
      name_common,
      category,
      image_url,
      image_url_raw
    )
  `)
  .eq('recipe_id', recipeId)
  .order('sort_order');
```

**PostgREST (REST API):**
```
GET /rest/v1/recipe_ingredients
  ?recipe_id=eq.{recipeId}
  &select=id,qty_g,qty_original,unit,is_optional,group_name,sort_order,catalog_ingredients(id,name_common,category,image_url)
  &order=sort_order
```

---

### 3.2 `recipe_cooking_methods`

```sql
CREATE TABLE recipe_cooking_methods (
  id UUID PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id),
  cooking_method_id UUID NOT NULL REFERENCES catalog_cooking_methods(id),
  is_primary BOOLEAN DEFAULT false,   -- primary method vs secondary
  step_number INTEGER,                -- which step uses this method
  duration_min INTEGER,               -- how long this method is used
  temperature TEXT,                   -- override temp for this recipe
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(recipe_id, cooking_method_id)
);
```

**Supabase Query:**
```typescript
const { data: methods } = await stagingSupabase
  .from('recipe_cooking_methods')
  .select(`
    id,
    is_primary,
    step_number,
    duration_min,
    temperature,
    notes,
    catalog_cooking_methods (
      id,
      name,
      slug,
      category,
      description,
      temperature,
      medium,
      typical_time,
      health_impact,
      nutrient_effect,
      best_for,
      image_url
    )
  `)
  .eq('recipe_id', recipeId)
  .order('is_primary', { ascending: false });
```

**PostgREST (REST API):**
```
GET /rest/v1/recipe_cooking_methods
  ?recipe_id=eq.{recipeId}
  &select=id,is_primary,step_number,duration_min,temperature,notes,catalog_cooking_methods(id,name,slug,category,description,image_url,health_impact,nutrient_effect)
  &order=is_primary.desc
```

---

### 3.3 `recipe_equipment`

```sql
CREATE TABLE recipe_equipment (
  id UUID PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id),
  equipment_id UUID NOT NULL REFERENCES catalog_equipment(id),
  is_required BOOLEAN DEFAULT true,   -- required vs optional
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(recipe_id, equipment_id)
);
```

**Supabase Query:**
```typescript
const { data: equipment } = await stagingSupabase
  .from('recipe_equipment')
  .select(`
    id,
    is_required,
    notes,
    catalog_equipment (
      id,
      name,
      category,
      description,
      image_url,
      brand,
      size_notes,
      use_case
    )
  `)
  .eq('recipe_id', recipeId)
  .order('is_required', { ascending: false });
```

**PostgREST (REST API):**
```
GET /rest/v1/recipe_equipment
  ?recipe_id=eq.{recipeId}
  &select=id,is_required,notes,catalog_equipment(id,name,category,description,image_url,use_case)
  &order=is_required.desc
```

---

### 3.4 `recipe_elements` (Calculated Nutrition)

```sql
CREATE TABLE recipe_elements (
  id UUID PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES catalog_recipes(id),
  element_id TEXT NOT NULL REFERENCES catalog_elements(id),
  relationship TEXT DEFAULT 'beneficial',  -- 'beneficial' or 'hazardous'
  amount_per_serving NUMERIC,
  amount_per_100g NUMERIC,
  unit TEXT,
  source TEXT DEFAULT 'calculated',        -- 'calculated' or 'manual'
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(recipe_id, element_id, relationship)
);
```

**Supabase Query:**
```typescript
// Get all beneficial elements in a recipe
const { data: nutrition } = await stagingSupabase
  .from('recipe_elements')
  .select(`
    id,
    relationship,
    amount_per_serving,
    unit,
    source,
    catalog_elements (
      id,
      name_common,
      category,
      type_label,
      image_url,
      nutrient_unit
    )
  `)
  .eq('recipe_id', recipeId)
  .eq('relationship', 'beneficial')
  .order('amount_per_serving', { ascending: false, nullsFirst: false });
```

---

## 4. SQL Views (Pre-Built Queries)

These views are available via PostgREST and can be queried like tables.

### 4.1 `v_recipe_nutrition`

**Purpose:** Full nutrition breakdown for a recipe (via ingredient chain).

```typescript
const { data } = await stagingSupabase
  .from('v_recipe_nutrition')
  .select('*')
  .eq('recipe_id', recipeId);

// Returns per-element:
// { recipe_id, recipe_name, ingredient_name, qty_g, element_name,
//   element_category, element_type, amount_per_100g, unit_per_100g,
//   amount_in_recipe }
```

### 4.2 `v_recipe_hazards`

**Purpose:** Hazardous elements from cooking methods used in a recipe.

```typescript
const { data } = await stagingSupabase
  .from('v_recipe_hazards')
  .select('*')
  .eq('recipe_id', recipeId);

// Returns:
// { recipe_id, recipe_name, cooking_method, element_id,
//   hazardous_element, severity, mechanism }
```

### 4.3 `v_ingredient_nutrition`

**Purpose:** Full nutrition profile for any ingredient.

```typescript
const { data } = await stagingSupabase
  .from('v_ingredient_nutrition')
  .select('*')
  .eq('ingredient_id', ingredientId);
```

### 4.4 `v_element_hs_coverage`

**Purpose:** All HS items (supplements, tests, products) for an element.

```typescript
const { data } = await stagingSupabase
  .from('v_element_hs_coverage')
  .select('*')
  .eq('element_id', elementId);

// Returns: { element_id, element_name, hs_type, hs_item_id, hs_item_name, hs_item_image }
// hs_type = 'supplement' | 'test' | 'product'
```

### 4.5 `v_symptom_care_chain`

**Purpose:** Symptom → element → test → supplement lookup.

```typescript
const { data } = await stagingSupabase
  .from('v_symptom_care_chain')
  .select('*')
  .eq('symptom_id', symptomId);
```

---

## 5. Preparation / Instructions

**There is NO separate `catalog_preparation_methods` table.** Recipe preparation steps are stored as inline JSONB on the recipe itself:

```typescript
// Instructions are on the recipe record directly
const { data: recipe } = await stagingSupabase
  .from('catalog_recipes')
  .select('id, name_common, instructions, cooking_instructions, prep_time, cook_time')
  .eq('id', recipeId)
  .single();

// recipe.instructions = [
//   { "step": 1, "text": "Preheat oven to 200°C..." },
//   { "step": 2, "text": "Dice the onion..." },
//   ...
// ]
// recipe.prep_time = "15 min"
// recipe.cook_time = "30 min"
```

---

## 6. Full Recipe Detail Query (Recommended Pattern)

To fetch everything for a single recipe detail screen, make these parallel calls:

```typescript
const recipeId = 'grilled_chicken_salad';

// 1. Recipe base data (name, description, instructions, times, etc.)
const recipePromise = stagingSupabase
  .from('catalog_recipes')
  .select(`
    id, name_common, name_other, category, category_sub, type,
    cuisine, language, meal_slot, difficulty,
    prep_time, cook_time, servings,
    instructions, cooking_instructions,
    description, description_simple, description_technical,
    health_benefits, taste_profile, flavor_profile, texture_profile,
    nutrition_per_100g, nutrition_per_serving,
    image_url, image_url_raw, image_url_plated, image_url_closeup,
    video_url, health_score
  `)
  .eq('id', recipeId)
  .single();

// 2. Ingredients (via junction table)
const ingredientsPromise = stagingSupabase
  .from('recipe_ingredients')
  .select(`
    id, qty_g, qty_original, unit, is_optional, group_name, sort_order,
    catalog_ingredients (id, name_common, category, image_url)
  `)
  .eq('recipe_id', recipeId)
  .order('sort_order');

// 3. Cooking methods (via junction table)
const methodsPromise = stagingSupabase
  .from('recipe_cooking_methods')
  .select(`
    id, is_primary, step_number, duration_min, temperature, notes,
    catalog_cooking_methods (id, name, slug, category, description, image_url, health_impact, nutrient_effect)
  `)
  .eq('recipe_id', recipeId)
  .order('is_primary', { ascending: false });

// 4. Equipment (via junction table)
const equipmentPromise = stagingSupabase
  .from('recipe_equipment')
  .select(`
    id, is_required, notes,
    catalog_equipment (id, name, category, description, image_url, use_case)
  `)
  .eq('recipe_id', recipeId)
  .order('is_required', { ascending: false });

// 5. Nutrition elements (via junction table)
const nutritionPromise = stagingSupabase
  .from('recipe_elements')
  .select(`
    id, relationship, amount_per_serving, unit, source,
    catalog_elements (id, name_common, category, type_label, image_url)
  `)
  .eq('recipe_id', recipeId)
  .order('amount_per_serving', { ascending: false, nullsFirst: false });

// 6. Hazards from cooking methods (via view)
const hazardsPromise = stagingSupabase
  .from('v_recipe_hazards')
  .select('*')
  .eq('recipe_id', recipeId);

// Execute all in parallel
const [recipe, ingredients, methods, equipment, nutrition, hazards] = await Promise.all([
  recipePromise, ingredientsPromise, methodsPromise,
  equipmentPromise, nutritionPromise, hazardsPromise
]);
```

---

## 7. Cooking Method Detail (with Element Impact)

When showing a cooking method detail screen:

```typescript
const methodId = 'some-uuid';

// Base data
const { data: method } = await stagingSupabase
  .from('catalog_cooking_methods')
  .select('id, name, slug, category, description, temperature, medium, typical_time, health_impact, nutrient_effect, best_for, image_url')
  .eq('id', methodId)
  .single();

// Hazardous elements this method produces
const { data: hazards } = await stagingSupabase
  .from('cooking_method_elements')
  .select(`
    id, relationship, severity, mechanism, notes,
    catalog_elements (id, name_common, category, type_label, image_url)
  `)
  .eq('cooking_method_id', methodId)
  .eq('relationship', 'hazardous');

// Beneficial elements this method preserves/enhances
const { data: benefits } = await stagingSupabase
  .from('cooking_method_elements')
  .select(`
    id, relationship, severity, mechanism, notes,
    catalog_elements (id, name_common, category, type_label, image_url)
  `)
  .eq('cooking_method_id', methodId)
  .eq('relationship', 'beneficial');
```

---

## 8. Element Detail (Full Coverage)

When showing an element detail screen, pull all related items:

```typescript
const elementId = 'iron';

// Base element data
const elementPromise = stagingSupabase
  .from('catalog_elements')
  .select('*')
  .eq('id', elementId)
  .single();

// Top ingredients containing this element
const ingredientsPromise = stagingSupabase
  .from('catalog_ingredient_elements')
  .select(`
    id, amount_per_100g, unit_per_100g, is_primary,
    catalog_ingredients (id, name_common, category, image_url)
  `)
  .eq('element_id', elementId)
  .order('amount_per_100g', { ascending: false, nullsFirst: false })
  .limit(20);

// Recipes rich in this element
const recipesPromise = stagingSupabase
  .from('recipe_elements')
  .select(`
    id, amount_per_serving, unit, relationship,
    catalog_recipes (id, name_common, category, image_url)
  `)
  .eq('element_id', elementId)
  .eq('relationship', 'beneficial')
  .order('amount_per_serving', { ascending: false, nullsFirst: false })
  .limit(10);

// HS coverage (supplements, tests, products) — via view
const hsPromise = stagingSupabase
  .from('v_element_hs_coverage')
  .select('*')
  .eq('element_id', elementId);

// Symptoms related to this element
const symptomsPromise = stagingSupabase
  .from('symptom_elements')
  .select(`
    id, relationship, severity, description,
    catalog_symptoms (id, name, category)
  `)
  .eq('element_id', elementId);

const [element, ingredients, recipes, hs, symptoms] = await Promise.all([
  elementPromise, ingredientsPromise, recipesPromise, hsPromise, symptomsPromise
]);
```

---

## 9. Key Differences: Old vs New

### ❌ OLD (do not use)
```typescript
// Reading from embedded JSONB
const recipe = await supabase.from('catalog_recipes').select('linked_ingredients').single();
const ingredients = JSON.parse(recipe.linked_ingredients); // [{id, name, qty_g}]

// Reading from UUID array
const methodIds = recipe.cooking_method_ids; // ['uuid1', 'uuid2']
const methods = await supabase.from('catalog_cooking_methods').select('*').in('id', methodIds);
```

### ✅ NEW (use this)
```typescript
// Junction table with joined data in one query
const { data } = await supabase
  .from('recipe_ingredients')
  .select('qty_g, unit, sort_order, catalog_ingredients(id, name_common, image_url)')
  .eq('recipe_id', recipeId)
  .order('sort_order');
```

---

## 10. ID Types Reference

| Table | ID Type | Example |
|-------|---------|---------|
| `catalog_recipes` | TEXT (slug) | `grilled_chicken_salad` |
| `catalog_ingredients` | TEXT (slug) | `chicken_breast` |
| `catalog_elements` | TEXT (slug) | `iron`, `ascorbic_acid_vitamin_c` |
| `catalog_cooking_methods` | UUID | `a1b2c3d4-...` |
| `catalog_equipment` | UUID | `e5f6g7h8-...` |
| `catalog_symptoms` | UUID | `i9j0k1l2-...` |
| `catalog_activities` | TEXT (slug) | `running` |
| `hs_supplements` | TEXT (slug) | `hs_supp_iron` |
| `hs_tests` | TEXT (slug) | `hs_test_iron` |
| `hs_products` | TEXT (slug) | `hs_prod_water_filter` |

---

## 11. TypeScript Interfaces

```typescript
interface RecipeIngredient {
  id: string;
  qty_g: number | null;
  qty_original: number | null;
  unit: string;
  is_optional: boolean;
  group_name: string | null;
  sort_order: number;
  catalog_ingredients: {
    id: string;
    name_common: string;
    category: string;
    image_url: string | null;
  };
}

interface RecipeCookingMethod {
  id: string;
  is_primary: boolean;
  step_number: number | null;
  duration_min: number | null;
  temperature: string | null;
  notes: string | null;
  catalog_cooking_methods: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string | null;
    image_url: string | null;
    health_impact: string | null;
    nutrient_effect: string | null;
  };
}

interface RecipeEquipment {
  id: string;
  is_required: boolean;
  notes: string | null;
  catalog_equipment: {
    id: string;
    name: string;
    category: string;
    description: string | null;
    image_url: string | null;
    use_case: string | null;
  };
}

interface RecipeElement {
  id: string;
  relationship: 'beneficial' | 'hazardous';
  amount_per_serving: number | null;
  unit: string | null;
  source: 'calculated' | 'manual';
  catalog_elements: {
    id: string;
    name_common: string;
    category: string;
    type_label: string | null;
    image_url: string | null;
  };
}
```

---

## 12. Checklist for Mobile Migration

- [ ] Replace `linked_ingredients` JSONB reads → query `recipe_ingredients` junction table
- [ ] Replace `cooking_method_ids` UUID[] reads → query `recipe_cooking_methods` junction table
- [ ] Replace `equipment_ids` UUID[] reads → query `recipe_equipment` junction table
- [ ] Replace `elements_beneficial` JSONB reads → query `recipe_elements` junction table
- [ ] Use `v_recipe_nutrition` view for recipe nutrition screens
- [ ] Use `v_recipe_hazards` view for cooking hazard warnings
- [ ] Use `v_element_hs_coverage` view for element detail screens
- [ ] Use `v_symptom_care_chain` view for symptom → care chain
- [ ] Update element grouping to use `type_label` field (format: `["mineral"]`, `["vitamin"]`, etc.)
- [ ] Instructions/preparation steps remain on `catalog_recipes.instructions` (JSONB) — no junction table needed
