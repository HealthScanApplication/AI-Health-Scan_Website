# Recipe Ingredients & Steps UI Refactor

## Current Issues Identified

### 1. **Equipment Layout**
- ❌ Equipment is in a separate column
- ✅ Should be in same column as cooking methods

### 2. **Cooking Methods Missing**
- ❌ No cooking methods dropdown/management
- ✅ Need to add cooking methods (chopping, slicing, dicing, grilling, etc.)

### 3. **Ingredient Processing Not Tracked**
- ❌ Some ingredients have processing in their name (inconsistent)
- ❌ No qty tracking through processing steps
- ✅ Need: `x2 Tomato (50g) → sliced → Tomato Slices (50g)`

### 4. **Step Association Missing**
- ❌ No way to associate ingredients/equipment/methods with specific steps
- ✅ Need pills on each item with "Add to Step X" / "Remove from Step X"

### 5. **Mobile Image Selection Unclear**
- ❌ No logic for which images to use for steps/ingredients in mobile app

---

## Proposed UI Structure

### Column 1: Equipment & Cooking Methods
```
┌─────────────────────────────────┐
│ EQUIPMENT                       │
│ ☑️ Blender                      │
│ ☑️ Mixing bowl                  │
│ ☑️ Chef's knife                 │
│                                 │
│ COOKING METHODS                 │
│ [+ Add Method ▾]                │
│ • Chopping                      │
│ • Slicing                       │
│ • Grilling                      │
│ • Sautéing                      │
└─────────────────────────────────┘
```

### Column 2: Ingredients with Processing & Qty
```
┌─────────────────────────────────────────────────────────┐
│ INGREDIENTS                                             │
│                                                         │
│ GROUP: Vegetables                                       │
│                                                         │
│ [🍅] Tomato                                             │
│     Qty: 2 × 50g = 100g                                │
│     Processing: [Sliced ▾]                             │
│     Output: Tomato Slices (100g)                       │
│     Steps: [1] [3] [+]                                 │
│                                                         │
│ [🧅] Onion                                              │
│     Qty: 1 × 150g = 150g                               │
│     Processing: [Diced ▾]                              │
│     Output: Diced Onion (150g)                         │
│     Steps: [2] [+]                                     │
│                                                         │
│ [🧄] Garlic                                             │
│     Qty: 3 cloves × 5g = 15g                           │
│     Processing: [Minced ▾]                             │
│     Output: Minced Garlic (15g)                        │
│     Steps: [2] [+]                                     │
│                                                         │
│ GROUP: Proteins                                         │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### Column 3: Cooking Steps with Pills
```
┌─────────────────────────────────────────────────────────┐
│ COOKING STEPS                                           │
│                                                         │
│ [1] Prep the vegetables                                │
│     🍅 Tomato Slices  🧪 Chef's knife  🔪 Slicing      │
│     [Photo: tomato_sliced.jpg]                         │
│                                                         │
│ [2] Make the base                                      │
│     🧅 Diced Onion  🧄 Minced Garlic                   │
│     🥘 Mixing bowl  🔥 Sautéing                        │
│     [Photo: onion_garlic_saute.jpg]                    │
│                                                         │
│ [3] Combine and cook                                   │
│     🍅 Tomato Slices  🧂 Salt  🌿 Basil                │
│     🍳 Pan  🔥 Simmering                               │
│     [Photo: final_dish.jpg]                            │
└─────────────────────────────────────────────────────────┘
```

---

## Data Structure Changes

### Current Structure (catalog_recipes)
```typescript
{
  ingredients: Array<{
    group?: string;
    items?: Array<{ name, qty, unit }>;
    name?: string;
    qty?: number;
    unit?: string;
  }>;
  equipment: string[];
  instructions: Array<{
    step: number;
    text: string;
    time?: string;
  }>;
}
```

### Proposed Structure
```typescript
{
  // Cooking methods master list
  cooking_methods: string[]; // ['Chopping', 'Slicing', 'Grilling', 'Sautéing']
  
  // Equipment (unchanged)
  equipment: string[];
  
  // Enhanced ingredients with processing
  ingredients: Array<{
    group?: string;
    items?: Array<{
      id: string; // unique ID for step association
      name: string;
      qty: number;
      unit: string;
      processing?: {
        method: string; // from cooking_methods
        output_name: string; // e.g., "Tomato Slices"
        output_qty: number;
        output_unit: string;
      };
      step_ids: number[]; // which steps use this ingredient
      image_url?: string; // ingredient-specific image
    }>;
    // ... flat structure
  }>;
  
  // Enhanced steps with associations
  instructions: Array<{
    step: number;
    text: string;
    time?: string;
    ingredient_ids: string[]; // IDs of ingredients used
    equipment_ids: string[]; // equipment used
    cooking_method_ids: string[]; // methods used
    image_url?: string; // step-specific image
    image_priority: 'ingredient' | 'step' | 'auto'; // for mobile
  }>;
}
```

---

## Cooking Methods Dropdown

### Standard Cooking Methods List
```javascript
const COOKING_METHODS = [
  // Cutting/Prep
  'Chopping', 'Slicing', 'Dicing', 'Mincing', 'Julienning',
  'Grating', 'Peeling', 'Crushing', 'Grinding',
  
  // Heat-based
  'Boiling', 'Simmering', 'Steaming', 'Poaching',
  'Grilling', 'Roasting', 'Baking', 'Broiling',
  'Sautéing', 'Stir-frying', 'Pan-frying', 'Deep-frying',
  'Braising', 'Stewing',
  
  // Mixing/Combining
  'Mixing', 'Whisking', 'Folding', 'Blending',
  'Kneading', 'Stirring', 'Tossing',
  
  // Other
  'Marinating', 'Seasoning', 'Garnishing', 'Plating'
];
```

---

## Mobile Image Selection Logic

### Priority System
1. **Step-specific image** (if uploaded)
2. **Primary ingredient image** (first ingredient in step)
3. **Cooking method placeholder** (generic image for method)
4. **Equipment image** (if no ingredient)
5. **Default recipe placeholder**

### Image Selection Algorithm
```typescript
function getStepImage(step: RecipeStep, ingredients: Ingredient[]): string {
  // 1. Explicit step image
  if (step.image_url) return step.image_url;
  
  // 2. Primary ingredient image (first in step)
  if (step.ingredient_ids.length > 0) {
    const primaryIngredient = ingredients.find(i => i.id === step.ingredient_ids[0]);
    if (primaryIngredient?.image_url) return primaryIngredient.image_url;
    
    // Lookup from catalog_ingredients if linked
    if (primaryIngredient?.catalog_ingredient_id) {
      return lookupIngredientImage(primaryIngredient.catalog_ingredient_id);
    }
  }
  
  // 3. Cooking method placeholder
  if (step.cooking_method_ids.length > 0) {
    const method = step.cooking_method_ids[0];
    return `/assets/cooking-methods/${method.toLowerCase()}.jpg`;
  }
  
  // 4. Equipment image
  if (step.equipment_ids.length > 0) {
    return `/assets/equipment/${step.equipment_ids[0].toLowerCase()}.jpg`;
  }
  
  // 5. Default
  return '/assets/recipe-placeholder.jpg';
}
```

### Ingredient Image Lookup
```typescript
function getIngredientImage(ingredient: RecipeIngredient): string {
  // 1. Ingredient-specific image (uploaded for this recipe)
  if (ingredient.image_url) return ingredient.image_url;
  
  // 2. Linked catalog ingredient
  if (ingredient.catalog_ingredient_id) {
    const catalogIng = await fetchIngredient(ingredient.catalog_ingredient_id);
    if (catalogIng?.image_url) return catalogIng.image_url;
  }
  
  // 3. AI-generated image URL (if available)
  if (ingredient.ai_image_url) return ingredient.ai_image_url;
  
  // 4. Generic ingredient placeholder
  return '/assets/ingredient-placeholder.jpg';
}
```

---

## UI/UX Flow

### Adding Processing to Ingredient
1. User selects ingredient
2. Click "Processing" dropdown
3. Select method (e.g., "Sliced")
4. System auto-generates output name: "Tomato" → "Tomato Slices"
5. User can edit output name if needed
6. Qty is preserved (100g → 100g)

### Associating Ingredient with Step
1. User clicks [+] button on ingredient pill
2. Dropdown shows available steps
3. Select step number
4. Ingredient pill appears in that step
5. Click [×] on pill to remove from step

### Auto-Image Assignment
1. When user adds ingredient to step, system suggests image
2. User can override with custom upload
3. Mobile app uses priority system to display

---

## Implementation Checklist

### Backend (Database)
- [ ] Add `cooking_methods` JSONB column to `catalog_recipes`
- [ ] Migrate existing `ingredients` to new structure with `id` and `step_ids`
- [ ] Migrate existing `instructions` to include association arrays
- [ ] Add `image_url` to both ingredients and instructions

### Admin Panel UI
- [ ] Reorganize layout: Equipment + Methods (Col 1), Ingredients (Col 2), Steps (Col 3)
- [ ] Add cooking methods dropdown with standard list + custom add
- [ ] Add processing dropdown to each ingredient
- [ ] Add step association pills to ingredients/equipment/methods
- [ ] Add image upload for steps and ingredients
- [ ] Update AI enrich to suggest processing methods

### Mobile App
- [ ] Implement image priority system
- [ ] Fetch ingredient images from catalog_ingredients
- [ ] Display processing info (e.g., "Sliced Tomato (100g)")
- [ ] Show step associations in ingredient detail
- [ ] Cache cooking method placeholder images

---

## Example: Complete Recipe Flow

### Recipe: Simple Tomato Pasta

**Equipment & Methods:**
- Equipment: Pot, Pan, Colander, Chef's knife
- Methods: Boiling, Slicing, Sautéing, Simmering

**Ingredients:**
```
GROUP: Pasta
- Spaghetti: 200g (no processing) → Steps: [1]

GROUP: Vegetables
- Tomato: 3 × 100g = 300g → Sliced → Tomato Slices (300g) → Steps: [2, 3]
- Garlic: 4 cloves × 5g = 20g → Minced → Minced Garlic (20g) → Steps: [2]
- Basil: 10 leaves → Chopped → Chopped Basil (5g) → Steps: [3]

GROUP: Seasonings
- Olive Oil: 30ml → Steps: [2]
- Salt: 5g → Steps: [1, 3]
```

**Steps:**
```
[1] Boil pasta
    Ingredients: Spaghetti, Salt
    Equipment: Pot, Colander
    Methods: Boiling
    Image: boiling_pasta.jpg (step-specific)

[2] Sauté aromatics
    Ingredients: Tomato Slices, Minced Garlic, Olive Oil
    Equipment: Pan, Chef's knife
    Methods: Slicing, Sautéing
    Image: tomato_garlic_saute.jpg (step-specific)

[3] Combine and serve
    Ingredients: Spaghetti, Tomato Slices, Chopped Basil, Salt
    Equipment: Pan
    Methods: Simmering
    Image: final_pasta.jpg (step-specific)
```

**Mobile Display:**
- Step 1 image: boiling_pasta.jpg (explicit)
- Step 2 image: tomato_garlic_saute.jpg (explicit)
- Step 3 image: final_pasta.jpg (explicit)
- Ingredient "Tomato" image: from catalog_ingredients (tomato.jpg)
- Ingredient "Garlic" image: from catalog_ingredients (garlic.jpg)

---

## Migration Strategy

### Phase 1: Data Structure
1. Add new columns to `catalog_recipes`
2. Create migration script to add `id` to existing ingredients
3. Initialize empty `step_ids`, `cooking_methods`, `image_url` fields

### Phase 2: Admin UI
1. Update recipe edit form layout
2. Add cooking methods management
3. Add processing dropdowns
4. Add step association UI

### Phase 3: Mobile Integration
1. Update mobile API to return new structure
2. Implement image priority logic
3. Update mobile UI to display processing info
4. Add step-ingredient associations

### Phase 4: AI Enhancement
1. Update AI enrich to suggest cooking methods
2. Auto-suggest processing based on ingredient + method
3. Generate step associations based on instruction text
