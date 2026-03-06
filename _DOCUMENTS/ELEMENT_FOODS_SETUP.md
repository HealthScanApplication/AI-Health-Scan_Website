# Element Foods (Top 10) — Setup Guide

## Overview
The `element_foods` table stores the "Top 10 Foods" for each element (vitamins, minerals, amino acids) displayed in the mobile app.

---

## Database Setup

### 1. Run Migration
Execute the migration in Supabase SQL Editor:
```
/Users/john/05_Code/_AI-Health-Scan/_AI-Health-Scan_Website/supabase/migrations/20260304_create_element_foods.sql
```

### 2. Seed Data
The seed file contains Top 10 foods for:
- Vitamin K2
- Chloride
- Sulfur
- 9 Essential Amino Acids (Leucine, Isoleucine, Valine, Lysine, Methionine, Phenylalanine, Threonine, Tryptophan, Histidine)

Location: `supabase/SEED/SEED_element_foods_part2.sql`

---

## Table Structure

```sql
element_foods (
  id UUID PRIMARY KEY,
  element_id TEXT → catalog_elements(id),
  food_name TEXT,
  food_category TEXT,           -- 'animal', 'dairy', 'plant', 'fermented', 'seafood', etc.
  amount_per_serving NUMERIC,   -- e.g. 1103
  unit TEXT,                     -- 'μg', 'mg', 'g'
  serving_size NUMERIC,          -- e.g. 100
  serving_unit TEXT,             -- 'g', 'ml'
  emoji_icon TEXT,               -- '🫘', '🧀', '🥚'
  image_url TEXT,                -- NULL (looked up from catalog_ingredients)
  catalog_ingredient_id TEXT,    -- Links to catalog_ingredients
  rank INTEGER,                  -- 1-10
  bioavailability TEXT,          -- 'high', 'moderate', 'low'
  notes TEXT,                    -- Description/context
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(element_id, food_name)
)
```

---

## Admin Panel Integration

### Option 1: Add "Top Foods" Tab (Recommended)
Add a new top-level tab in SimplifiedAdminPanel:
- Tab name: "Top Foods"
- Shows `element_foods` table
- Filter by element (dropdown)
- Editable inline table with columns:
  - Rank (sortable)
  - Food Name
  - Category
  - Amount/Serving
  - Bioavailability
  - Notes
  - Link to Ingredient (if `catalog_ingredient_id` exists)

### Option 2: Embed in Element Edit Modal
Add a collapsible section in the "Food Sources" section of each element:
- Section: "🍽️ Top 10 Foods (Mobile)"
- Shows related `element_foods` records
- Add/Edit/Delete inline
- Drag to reorder rank

---

## Mobile App Usage

### API Endpoint
```
GET /rest/v1/element_foods?element_id=eq.{ELEMENT_ID}&order=rank.asc&limit=10
```

### Response Format
```json
[
  {
    "id": "uuid",
    "element_id": "menaquinone_vitamin_k2",
    "food_name": "Natto",
    "food_category": "fermented",
    "amount_per_serving": 1103,
    "unit": "μg",
    "serving_size": 100,
    "serving_unit": "g",
    "emoji_icon": "🫘",
    "image_url": null,
    "catalog_ingredient_id": "plant_legume_bean_soy_natto",
    "rank": 1,
    "bioavailability": "high",
    "notes": "Fermented soybeans — richest K2 source by far"
  }
]
```

### Mobile UI Display
**Section: "Top 10 Food Sources"**
- Ranked list (1-10)
- Each row:
  ```
  [rank] [emoji] [food_name]
  [amount_per_serving] [unit] per [serving_size][serving_unit]
  [bioavailability badge] [notes]
  ```
- Tappable → shows ingredient detail if `catalog_ingredient_id` exists
- Image from `catalog_ingredients.image_url` if linked

---

## Data Maintenance

### Adding New Element Foods
1. Open admin panel → Top Foods tab
2. Select element from dropdown
3. Click "Add Food"
4. Fill in:
   - Food Name
   - Category
   - Amount per serving + unit
   - Serving size + unit
   - Emoji icon
   - Rank (1-10)
   - Bioavailability
   - Notes
   - Optional: Link to catalog ingredient
5. Save

### Linking to Ingredients
- If the food exists in `catalog_ingredients`, set `catalog_ingredient_id`
- This enables:
  - Auto image lookup
  - Deep link to ingredient detail in mobile app
  - Cross-reference data validation

---

## Next Steps

1. ✅ Run migration: `20260304_create_element_foods.sql`
2. ✅ Run seed: `SEED_element_foods_part2.sql`
3. ⚪ Add "Top Foods" tab to admin panel (or embed in element edit modal)
4. ⚪ Test CRUD operations
5. ⚪ Update mobile app to fetch and display top foods per element
