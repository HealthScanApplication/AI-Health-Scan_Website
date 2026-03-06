# Mobile Recipe Detail Screen — Data & Section Guide

> **Purpose**: Prompt/guide for the mobile app to fetch, display, and organise recipe data across multiple catalog tables. Covers equipment, cooking methods, ingredients (with processing & images), and cooking steps with image selection logic.

---

## 1. Data Sources — Tables & Relationships

### Overview: 4 Tables Power the Recipe Screen

```
┌──────────────────────┐     ┌─────────────────────────┐
│  catalog_recipes     │────▶│  catalog_ingredients    │
│  (main recipe data)  │     │  (ingredient catalog)   │
│                      │     │  - image variants        │
│  equipment_ids[] ────┼──▶  │  - nutrition data        │
│  cooking_method_ids[]│     └─────────────────────────┘
│  linked_ingredients[]│
│  instructions[]      │     ┌─────────────────────────┐
│  ingredients[]       │────▶│  catalog_equipment      │
└──────────────────────┘     │  (tools/utensils)       │
                             │  - image_url             │
                             └─────────────────────────┘
                             ┌─────────────────────────┐
                             │  catalog_cooking_methods │
                             │  (grilling, slicing...)  │
                             │  - image_url             │
                             │  - health_impact         │
                             └─────────────────────────┘
```

---

## 2. API Endpoints

### Fetch Single Recipe
```
GET https://mofhvoudjxinvpplsytd.supabase.co/rest/v1/catalog_recipes?id=eq.{RECIPE_ID}&select=*
Headers:
  apikey: {SUPABASE_ANON_KEY}
  Authorization: Bearer {USER_ACCESS_TOKEN}
```

### Fetch All Recipes (list)
```
GET https://mofhvoudjxinvpplsytd.supabase.co/rest/v1/catalog_recipes?limit=1000&order=created_at.desc&select=id,name_common,category,category_sub,meal_slot,image_url,prep_time,cook_time,servings,difficulty,health_score,cuisine,tags
```

### Fetch Linked Equipment (by IDs)
```
GET https://mofhvoudjxinvpplsytd.supabase.co/rest/v1/catalog_equipment?id=in.({ID1},{ID2},{ID3})&select=id,name,category,description,image_url,brand,material,use_case,affiliate_url
```

### Fetch Linked Cooking Methods (by IDs)
```
GET https://mofhvoudjxinvpplsytd.supabase.co/rest/v1/catalog_cooking_methods?id=in.({ID1},{ID2},{ID3})&select=id,name,slug,category,description,temperature,medium,typical_time,health_impact,nutrient_effect,best_for,image_url
```

### Fetch Linked Ingredients (by IDs)
```
GET https://mofhvoudjxinvpplsytd.supabase.co/rest/v1/catalog_ingredients?id=in.({ID1},{ID2},{ID3})&select=id,name_common,category,image_url,image_url_raw,image_url_cut,image_url_cubed,image_url_cooked,image_url_powdered,nutrition_per_100g,health_benefits,elements_beneficial
```

### Admin: AI Enrich Recipe (POST)
```
POST https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-enrich-recipe
Headers:
  Authorization: Bearer {ADMIN_ACCESS_TOKEN}
  Content-Type: application/json
Body: {
  "recipeId": "{RECIPE_ID}",
  "recordData": { ...recipeRecord }
}
```

### Admin: AI Generate Steps (POST)
```
POST https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-generate-steps
Headers:
  Authorization: Bearer {ADMIN_ACCESS_TOKEN}
  Content-Type: application/json
Body: {
  "recipeId": "{RECIPE_ID}",
  "recordData": { ...recipeRecord }
}
```

### Storage: Upload Image (POST)
```
POST https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/make-server-ed0fe4c2/admin/storage/upload
Headers:
  Authorization: Bearer {ADMIN_ACCESS_TOKEN}
  Content-Type: multipart/form-data
Body: FormData with file + bucket ("catalog-media")
Returns: { url: "https://mofhvoudjxinvpplsytd.supabase.co/storage/v1/object/public/catalog-media/admin-uploads/{filename}" }
```

---

## 3. Recipe Data Structure — `catalog_recipes`

### Core Fields
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `id` | — | `uuid` | Primary key |
| `name_common` | Recipe Name | `text` | **Primary title** |
| `name_other` | Alt Names | `text` | Subtitle |
| `category` | Category | `badge` | e.g. "salad", "soup", "main" |
| `category_sub` | Subcategory | `badge` | |
| `meal_slot` | Meal Slot | `badge` | "breakfast", "lunch", "dinner", "snack" |
| `cuisine` | Cuisine | `text` | e.g. "Asian", "Mediterranean" |
| `difficulty` | Difficulty | `badge` | "easy", "medium", "hard" |
| `prep_time` | Prep Time | `text` | e.g. "15 min" |
| `cook_time` | Cook Time | `text` | e.g. "30 min" |
| `servings` | Servings | `number` | Default portion count |

### Images & Media
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `image_url` | Hero Image | `image` | Main recipe card image |
| `image_url_raw` | Raw/Prep | `image` | Ingredients laid out |
| `image_url_plated` | Plated | `image` | Final plated dish |
| `image_url_closeup` | Close-up | `image` | Detail shot |
| `video_url` | Video | `video` | YouTube/Vimeo |
| `images` | Gallery | `link_list` | ContentLink[] |
| `videos` | Videos | `link_list` | ContentLink[] |

### Linked Data (ID arrays → fetch from other tables)
| DB Column | Type | Linked Table | Notes |
|-----------|------|--------------|-------|
| `equipment_ids` | `uuid[]` | `catalog_equipment` | Equipment needed |
| `cooking_method_ids` | `uuid[]` | `catalog_cooking_methods` | Methods used |
| `linked_ingredients` | `uuid[]` | `catalog_ingredients` | Ingredient catalog links |
| `equipment` | `string[]` | — | Legacy: equipment names (fallback if no IDs) |

### Inline Data (stored directly on recipe)
| DB Column | Type | Notes |
|-----------|------|-------|
| `ingredients` | `jsonb` | Ingredient list with qty, unit, processing, groups |
| `instructions` | `jsonb` | Cooking steps with text, images, and linked IDs |

### Nutrition & Health
| DB Column | Display | Type |
|-----------|---------|------|
| `nutrition_per_100g` | Per 100g | `json_table` |
| `nutrition_per_serving` | Per Serving | `json_table` |
| `elements_beneficial` | Beneficial Elements | `tags` |
| `elements_hazardous` | Hazardous Elements | `tags` |
| `health_benefits` | Benefits | `tags` |
| `health_score` | Health Score | `score` (0-100) |

### Descriptions
| DB Column | Display | Type |
|-----------|---------|------|
| `description` | Overview | `text` |
| `description_simple` | Simple | `text` |
| `description_technical` | Technical | `text` |

---

## 4. Ingredients Data — `ingredients` JSONB Column

The `ingredients` column on `catalog_recipes` contains a JSON array of items that can be **flat** or **grouped**.

### Flat Ingredient Entry
```json
{
  "name": "Tomato",
  "ingredient_id": "uuid-of-catalog-ingredient",
  "qty_g": 100,
  "unit": "g",
  "processing": "Sliced"
}
```

### Grouped Ingredient Entry
```json
{
  "group": "Fresh Vegetables",
  "items": [
    {
      "name": "Tomato",
      "ingredient_id": "uuid-1",
      "qty_g": 100,
      "unit": "g",
      "processing": "Sliced"
    },
    {
      "name": "Red Onion",
      "ingredient_id": "uuid-2",
      "qty_g": 50,
      "unit": "g",
      "processing": "Diced"
    }
  ]
}
```

### Key Fields Per Ingredient Item
| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` | Display name (clean, no processing prefix) |
| `ingredient_id` | `uuid` | Links to `catalog_ingredients.id` for images & nutrition |
| `qty_g` | `number` | Quantity |
| `unit` | `string` | "g", "ml", "tsp", "tbsp", "cup", "piece", "slice", "pinch" etc. |
| `processing` | `string` | Processing method applied: "Chopped", "Sliced", "Diced", "Minced", etc. |
| `group` | `string` | Only on group entries — group label |
| `items` | `array` | Only on group entries — child ingredient items |

### How to Get Ingredient Images

For each ingredient item with an `ingredient_id`, fetch the corresponding record from `catalog_ingredients`:

```typescript
// Fetch all linked ingredient records in one call
const ingredientIds = flattenIngredients(recipe.ingredients).map(i => i.ingredient_id).filter(Boolean);
const { data: ingredients } = await supabase
  .from('catalog_ingredients')
  .select('id,name_common,image_url,image_url_raw,image_url_cut,image_url_cubed,image_url_cooked,image_url_powdered,nutrition_per_100g')
  .in('id', ingredientIds);
```

#### Ingredient Image Variants (from `catalog_ingredients`)
| Column | When to Show | Example |
|--------|-------------|---------|
| `image_url` | Default / base image | 🍅 Whole tomato |
| `image_url_raw` | Raw/unprocessed form | 🍅 Fresh tomato |
| `image_url_cut` | When `processing` = "Sliced", "Chopped", "Cut" | 🍅 Sliced tomato |
| `image_url_cubed` | When `processing` = "Diced", "Cubed" | 🍅 Diced tomato |
| `image_url_cooked` | When `processing` = "Sautéed", "Fried", "Roasted", etc. | 🍅 Cooked tomato |
| `image_url_powdered` | When `processing` = "Ground", "Powdered" | 🍅 Tomato powder |

### Processing Methods (standard list)
```
Chopped, Sliced, Diced, Minced, Julienned, Grated, Shredded,
Crushed, Ground, Mashed, Peeled, Zested, Melted, Softened,
Toasted, Roasted, Blanched, Marinated, Pickled, Fermented,
Smoked, Dried, Rehydrated, Soaked, Sprouted, Frozen,
Canned, Puréed, Strained, Infused
```

---

## 5. Cooking Steps — `instructions` JSONB Column

The `instructions` column contains an array of step objects:

```json
[
  {
    "text": "Slice the tomatoes and dice the onion finely",
    "image_url": "https://...storage.../step1.jpg",
    "ingredient_ids": ["uuid-tomato", "uuid-onion"],
    "equipment_ids": ["uuid-knife", "uuid-cutting-board"],
    "cooking_method_ids": ["uuid-slicing", "uuid-dicing"]
  },
  {
    "text": "Heat olive oil in a pan and sauté the onions until golden",
    "image_url": "",
    "ingredient_ids": ["uuid-olive-oil", "uuid-onion"],
    "equipment_ids": ["uuid-pan"],
    "cooking_method_ids": ["uuid-sauteing"]
  }
]
```

### Step Fields
| Field | Type | Notes |
|-------|------|-------|
| `text` | `string` | Step instruction text |
| `image_url` | `string` | Explicitly set step image (highest priority) |
| `ingredient_ids` | `uuid[]` | IDs from `catalog_ingredients` used in this step |
| `equipment_ids` | `uuid[]` | IDs from `catalog_equipment` used in this step |
| `cooking_method_ids` | `uuid[]` | IDs from `catalog_cooking_methods` used in this step |

---

## 6. Step Image Selection — Priority Algorithm

When rendering a step on the mobile app, use this priority system to determine which image to show:

```typescript
function getStepImage(step, ingredients, equipment, cookingMethods, recipe): string {
  // 1. Explicit step image (user-uploaded)
  if (step.image_url) return step.image_url;

  // 2. Primary linked ingredient — match processing variant
  if (step.ingredient_ids?.length > 0) {
    for (const ingId of step.ingredient_ids) {
      const ing = ingredients.find(i => i.id === ingId);
      if (!ing) continue;
      // Match processing variant from step text
      const lower = step.text.toLowerCase();
      if ((lower.includes('slice') || lower.includes('chop') || lower.includes('cut')) && ing.image_url_cut)
        return ing.image_url_cut;
      if ((lower.includes('dice') || lower.includes('cube')) && ing.image_url_cubed)
        return ing.image_url_cubed;
      if ((lower.includes('cook') || lower.includes('fry') || lower.includes('roast') || lower.includes('sauté') || lower.includes('bake') || lower.includes('grill')) && ing.image_url_cooked)
        return ing.image_url_cooked;
      if ((lower.includes('powder') || lower.includes('grind') || lower.includes('ground')) && ing.image_url_powdered)
        return ing.image_url_powdered;
      // Fall back to base image
      if (ing.image_url) return ing.image_url;
    }
  }

  // 3. Text-mention fallback — scan step text for ingredient names
  for (const ing of ingredients) {
    const name = (ing.name_common || '').toLowerCase();
    if (name.length > 2 && step.text.toLowerCase().includes(name)) {
      if (ing.image_url) return ing.image_url;
    }
  }

  // 4. Cooking method image
  if (step.cooking_method_ids?.length > 0) {
    for (const methodId of step.cooking_method_ids) {
      const method = cookingMethods.find(m => m.id === methodId);
      if (method?.image_url) return method.image_url;
    }
  }

  // 5. Equipment image
  if (step.equipment_ids?.length > 0) {
    for (const eqId of step.equipment_ids) {
      const eq = equipment.find(e => e.id === eqId);
      if (eq?.image_url) return eq.image_url;
    }
  }

  // 6. Recipe hero image (last resort)
  if (recipe.image_url) return recipe.image_url;

  // 7. User profile pic (for user-added recipes)
  if (recipe.is_user_recipe && recipe.user_profile_image_url)
    return recipe.user_profile_image_url;

  // 8. Placeholder
  return '';
}
```

### Priority Summary
| # | Source | Field | When |
|---|--------|-------|------|
| 1 | Step | `step.image_url` | Always wins if set |
| 2 | Ingredient | `catalog_ingredients.image_url_cut/cubed/cooked/powdered` | Processing keyword in step text |
| 3 | Ingredient | `catalog_ingredients.image_url` | Linked or text-mentioned ingredient |
| 4 | Method | `catalog_cooking_methods.image_url` | Method linked to step |
| 5 | Equipment | `catalog_equipment.image_url` | Equipment linked to step |
| 6 | Recipe | `catalog_recipes.image_url` | Hero image fallback |
| 7 | User | `user.profile_image_url` | User-added recipes only |
| 8 | — | Empty / placeholder | Nothing available |

---

## 7. Equipment — `catalog_equipment`

### Columns
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Display name, e.g. "Chef's Knife" |
| `category` | `text` | e.g. "Knives", "Pots & Pans", "Appliances" |
| `description` | `text` | What it's used for |
| `image_url` | `text` | Equipment photo |
| `brand` | `text` | Optional brand name |
| `material` | `text` | e.g. "Stainless Steel", "Cast Iron" |
| `size_notes` | `text` | e.g. "8-inch", "5-quart" |
| `use_case` | `text` | When to use this equipment |
| `affiliate_url` | `text` | Buy link (optional) |
| `cooking_methods_used_with` | `uuid[]` | Links to `catalog_cooking_methods` |

### How to Display
- **In recipe header**: Show equipment as icon chips with images
- **In step cards**: Show linked equipment as small pills: `🔧 Chef's Knife`
- **Tappable**: Opens equipment detail card with image, description, buy link

---

## 8. Cooking Methods — `catalog_cooking_methods`

### Columns
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Display name, e.g. "Sautéing" |
| `slug` | `text` | URL-friendly slug |
| `category` | `text` | "Dry Heat", "Wet Heat", "Cutting/Prep", "Mixing", "Other" |
| `description` | `text` | What this method involves |
| `temperature` | `text` | e.g. "Medium-High (180-220°C)" |
| `medium` | `text` | e.g. "Oil", "Water", "Dry" |
| `typical_time` | `text` | e.g. "5-10 min" |
| `health_impact` | `text` | e.g. "Preserves nutrients well at quick cook times" |
| `nutrient_effect` | `text` | e.g. "Minimal vitamin loss" |
| `best_for` | `text` | e.g. "Vegetables, thin meats" |
| `equipment_ids` | `uuid[]` | Links to `catalog_equipment` |
| `image_url` | `text` | Method illustration photo |

### How to Display
- **In recipe header**: Show methods as colored pills: `🔥 Sautéing` `🔥 Slicing`
- **In step cards**: Show linked methods as small pills with fire emoji
- **Tappable**: Opens method detail card with description, health impact, temp

---

## 9. Mobile UI Layout — Recipe Detail Screen

### Header Section
```
┌─────────────────────────────────────┐
│ [Hero Image — image_url]            │
│                                     │
│ Recipe Name (name_common)           │
│ ⏱ 15 min prep  🍳 30 min cook      │
│ 🍽 4 servings   ⭐ Easy             │
│                                     │
│ [Category] [Cuisine] [Meal Slot]    │
│                                     │
│ 🔧 Knife • Pan • Oven              │
│ 🔥 Sautéing • Roasting             │
└─────────────────────────────────────┘
```

### Tab Layout
```
[ Ingredients ] [ Steps ] [ Nutrition ] [ Info ]
```

### Ingredients Tab
```
┌─────────────────────────────────────┐
│ Servings: [- 4 +]  (scale qty)     │
│                                     │
│ ── Fresh Vegetables ──              │
│ [🍅] Tomato         100g  Sliced    │
│ [🧅] Red Onion       50g  Diced    │
│ [🧄] Garlic          15g  Minced   │
│                                     │
│ ── Proteins ──                      │
│ [🍗] Chicken        200g  Cubed    │
│                                     │
│ ── Pantry ──                        │
│ [🫒] Olive Oil       2 tbsp        │
│ [🧂] Salt            1 pinch       │
└─────────────────────────────────────┘
```

Each ingredient row:
- **Image**: From `catalog_ingredients` matching processing variant
- **Name**: Clean name (no processing prefix)
- **Qty**: Scaled by servings multiplier
- **Processing badge**: If set, show as small pill

### Steps Tab
```
┌─────────────────────────────────────┐
│ Step 1 of 5                         │
│ [Step Image — from priority algo]   │
│                                     │
│ Slice the tomatoes and dice the     │
│ onion finely.                       │
│                                     │
│ 🍅 Tomato  🧅 Onion                │
│ 🔧 Knife  🔧 Board                 │
│ 🔥 Slicing  🔥 Dicing              │
│                                     │
│         [ ← Prev ]  [ Next → ]     │
└─────────────────────────────────────┘
```

Each step card:
- **Image**: Use the priority algorithm (Section 6)
- **Text**: Step instruction
- **Pills**: Linked ingredients (green), equipment (blue), methods (red/orange)
- **Navigation**: Swipeable or prev/next buttons

---

## 10. Data Fetch Strategy — Recommended Flow

```typescript
async function loadRecipeDetail(recipeId: string) {
  // 1. Fetch the recipe record
  const recipe = await fetchRecipe(recipeId);

  // 2. Extract all linked IDs
  const equipmentIds = recipe.equipment_ids || [];
  const methodIds = recipe.cooking_method_ids || [];
  const ingredientIds = recipe.linked_ingredients || [];

  // 3. Parallel fetch all linked data
  const [equipment, methods, ingredients] = await Promise.all([
    equipmentIds.length > 0
      ? supabase.from('catalog_equipment').select('*').in('id', equipmentIds)
      : { data: [] },
    methodIds.length > 0
      ? supabase.from('catalog_cooking_methods').select('*').in('id', methodIds)
      : { data: [] },
    ingredientIds.length > 0
      ? supabase.from('catalog_ingredients').select('id,name_common,image_url,image_url_raw,image_url_cut,image_url_cubed,image_url_cooked,image_url_powdered,nutrition_per_100g').in('id', ingredientIds)
      : { data: [] },
  ]);

  // 4. Parse ingredients list (inline JSON)
  const ingredientList = flattenIngredients(recipe.ingredients);

  // 5. Parse steps (inline JSON)
  const steps = (recipe.instructions || []).map(s => ({
    text: s.text || '',
    image_url: s.image_url || '',
    ingredient_ids: s.ingredient_ids || [],
    equipment_ids: s.equipment_ids || [],
    cooking_method_ids: s.cooking_method_ids || [],
  }));

  // 6. Compute step images using priority algorithm
  const stepImages = steps.map(step =>
    getStepImage(step, ingredients.data, equipment.data, methods.data, recipe)
  );

  return {
    recipe,
    equipment: equipment.data,
    methods: methods.data,
    ingredients: ingredients.data,
    ingredientList,
    steps,
    stepImages,
  };
}

// Helper: flatten grouped + flat ingredients into a single list
function flattenIngredients(raw: any[]): IngredientItem[] {
  if (!Array.isArray(raw)) return [];
  const result: IngredientItem[] = [];
  for (const entry of raw) {
    if (entry.group && Array.isArray(entry.items)) {
      for (const child of entry.items) {
        result.push({ ...child, group: entry.group });
      }
    } else {
      result.push(entry);
    }
  }
  return result;
}
```

---

## 11. User-Added Recipes

For recipes created by users (not from the admin catalog):

| Field | Source | Notes |
|-------|--------|-------|
| `created_by` | `uuid` | User ID who created the recipe |
| `is_user_recipe` | `boolean` | Flag for user-created content |
| Profile image | `auth.users` or `profiles` table | Fallback image for steps |

### Image Fallback for User Recipes
If a user-created recipe has no step images, ingredient images, or hero image:
- Use the **user's profile picture** as a subtle watermark/avatar in the step card
- Show a "Add photos" prompt to encourage the user to upload images

---

## 12. Section Rendering Order — Recipe Detail

| # | Emoji | Section | Key Data | Default |
|---|-------|---------|----------|---------|
| 01 | 🖼️ | Media | image_url, image_url_plated, video_url | **Open** |
| 02 | 📋 | Overview | name_common, category, difficulty, times | **Open** |
| 03 | 🥕 | Ingredients | ingredients JSON, catalog_ingredients images | **Open** |
| 04 | 👨‍🍳 | Steps | instructions JSON, step images (priority algo) | **Open** |
| 05 | 🔧 | Equipment | equipment_ids → catalog_equipment | Collapsed |
| 06 | 🔥 | Cooking Methods | cooking_method_ids → catalog_cooking_methods | Collapsed |
| 07 | 📊 | Nutrition | nutrition_per_100g, nutrition_per_serving | Collapsed |
| 08 | ✅ | Health Benefits | health_benefits, elements_beneficial | Collapsed |
| 09 | ⚠️ | Hazards | elements_hazardous | Collapsed (hide if empty) |
| 10 | 📝 | Description | description_simple, description_technical | Collapsed |
| 11 | 🏷️ | Tags & Diet | tags, allergens, dietary_info | Collapsed |
| 12 | 📎 | References | scientific_references, scientific_papers | Collapsed |

---

## 13. Shared Utility Location

The image selection algorithm is implemented as a shared TypeScript utility:

**File**: `src/utils/recipeImageSelection.ts`

```typescript
import { getStepImage, getAllStepImages } from '../utils/recipeImageSelection';
```

**Types exported:**
- `StepImageContext` — input context for the algorithm
- `getStepImage(ctx)` — returns best image URL for a single step
- `getAllStepImages(steps, ingredients, equipment, methods, ...)` — returns image array for all steps

**Processing utility**: `src/utils/recipeProcessing.ts`
- `stripProcessing(name)` — strips processing prefix from ingredient name
- `cleanIngredientName(ing)` — returns clean display name

---

## 14. Empty State Handling

| Missing Data | Fallback |
|-------------|----------|
| No step image | Use priority algorithm → eventually placeholder |
| No ingredient image | Show first letter avatar in colored circle |
| No equipment image | Show tool emoji (🔧) |
| No cooking method image | Show fire emoji (🔥) |
| No recipe hero image | Show category-based placeholder |
| No nutrition data | Show "Nutrition info coming soon" |
| User recipe, no images | Show user profile pic + "Add photos" prompt |
