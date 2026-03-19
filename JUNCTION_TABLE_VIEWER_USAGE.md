# Junction Table Viewer - Admin Panel Integration

## Overview

The **Junction Table Viewer** component automatically displays all related records for any entity in the admin panel detail view. It shows images and key information for each related record via junction tables.

---

## Features

✅ **Automatic relationship detection** - Shows only relevant tabs based on entity type  
✅ **Image-first display** - All related records shown with images in a grid layout  
✅ **Smart badges** - Category, relationship type, severity, and "Primary" indicators  
✅ **Tabbed interface** - Organized by relationship type (Elements, Ingredients, Recipes, etc.)  
✅ **Count badges** - Shows number of related records in each tab  
✅ **Responsive grid** - 1 column mobile, 2 columns tablet, 3 columns desktop  

---

## What It Shows

### For Elements (`catalog_elements`)
- **Ingredients** - All ingredients containing this element (with amounts)
- **Supplements** - HS supplements for this element
- **Tests** - HS tests that detect this element
- **Products** - HS products containing this element

### For Ingredients (`catalog_ingredients`)
- **Elements** - All elements in this ingredient (with amounts)
- **Recipes** - All recipes using this ingredient (with quantities)

### For Recipes (`catalog_recipes`)
- **Ingredients** - All ingredients in this recipe (with quantities)

### For Cooking Methods (`catalog_cooking_methods`)
- **Elements** - Hazardous and beneficial elements (with relationship badges)

### For Symptoms (`catalog_symptoms`)
- **Elements** - Related elements (deficiency/excess with severity)

### For Activities (`catalog_activities`)
- **Elements** - Elements depleted by this activity

---

## How to Use

### In Admin Panel Detail View

1. Click on any record in the admin panel
2. Scroll down past the detail fields
3. The **Junction Table Viewer** appears automatically
4. Click tabs to view different relationship types
5. Each related record shows:
   - Image (or placeholder if none)
   - Name
   - Category badge
   - Relationship badge (if applicable)
   - Amount/quantity (if applicable)
   - "Primary" badge (if marked as primary)

---

## Example: Viewing an Element

When viewing **Vitamin C** (`ascorbic_acid_vitamin_c`):

**Ingredients Tab (showing 47 items):**
```
┌─────────────────────────────────────┐
│ [Image: Orange]                     │
│ Orange                              │
│ 🟢 Fruit                            │
│ 53.2 mg                             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [Image: Broccoli]                   │
│ Broccoli                            │
│ 🟢 Vegetable                        │
│ 89.2 mg                             │
│ ⭐ Primary                          │
└─────────────────────────────────────┘
```

**Supplements Tab (showing 12 items):**
```
┌─────────────────────────────────────┐
│ [Image: Vitamin C 1000mg]           │
│ Vitamin C 1000mg                    │
│ 🟣 Vitamin Supplement               │
│ ⭐ Primary                          │
└─────────────────────────────────────┘
```

**Tests Tab (showing 3 items):**
```
┌─────────────────────────────────────┐
│ [Image: Vitamin C Blood Test]       │
│ Vitamin C Blood Test                │
│ 🔬 Blood Test                       │
└─────────────────────────────────────┘
```

---

## Example: Viewing an Ingredient

When viewing **Chicken Breast** (`chicken_breast`):

**Elements Tab (showing 28 items):**
```
┌─────────────────────────────────────┐
│ [Image: Protein icon]               │
│ Protein                             │
│ 🔵 Macronutrient                    │
│ 31.0 g                              │
│ ⭐ Primary                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [Image: Niacin icon]                │
│ Niacin (Vitamin B3)                 │
│ 🟢 Vitamin                          │
│ 14.8 mg                             │
└─────────────────────────────────────┘
```

**Recipes Tab (showing 43 items):**
```
┌─────────────────────────────────────┐
│ [Image: Grilled Chicken Salad]      │
│ Grilled Chicken Salad               │
│ 🥗 Salad                            │
│ 200 g                               │
└─────────────────────────────────────┘
```

---

## Example: Viewing a Cooking Method

When viewing **Grilling** (`grilling`):

**Elements Tab (showing 8 items):**
```
┌─────────────────────────────────────┐
│ [Image: HCA molecule]               │
│ Heterocyclic Amines (HCAs)          │
│ 🔴 Hazardous Element                │
│ 🔴 hazardous | high                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [Image: Vitamin D]                  │
│ Vitamin D                           │
│ 🟢 Vitamin                          │
│ 🟢 beneficial | moderate            │
└─────────────────────────────────────┘
```

---

## Badge Color Coding

### Category Badges
- 🔵 **Blue** - Macronutrients (Protein, Fat, Carbs)
- 🟢 **Green** - Vitamins, Vegetables, Fruits
- 🟣 **Purple** - Minerals
- 🔴 **Red** - Hazardous Elements, Meat
- 🟠 **Orange** - Fruits (some)
- ⚪ **Gray** - Other/Unknown

### Relationship Badges
- 🔴 **Red** - Hazardous, Excess
- 🟢 **Green** - Beneficial
- 🟠 **Orange** - Deficiency
- 🟡 **Yellow** - Depletes

### Special Badges
- ⭐ **Yellow "Primary"** - Marked as primary relationship

---

## Technical Details

### Component Location
`src/components/admin/JunctionTableViewer.tsx`

### Helper Functions Used
From `src/utils/junctionTableHelpers.ts`:
- `getIngredientElements()`
- `getIngredientsForElement()`
- `getRecipeIngredients()`
- `getRecipesForIngredient()`
- `getElementHSCoverage()`
- `getCookingMethodElements()`
- `getSymptomElements()`
- `getActivityElements()`

### Integration Point
Added to `src/components/admin/CatalogDetailTray.tsx` after the `IngredientCoverageSection`.

### Props
```typescript
interface JunctionTableViewerProps {
  entityType: 'element' | 'ingredient' | 'recipe' | 'product' | 'supplement' | 'test' | 'cooking_method' | 'symptom' | 'activity';
  entityId: string;
  entityName?: string;
}
```

---

## Performance

- **Lazy loading** - Only loads data when detail modal is opened
- **Parallel queries** - Uses SQL views for efficient joins
- **Cached results** - Data cached until modal is closed
- **Smart filtering** - Only shows tabs with data (empty tabs hidden)

---

## Future Enhancements

Potential improvements:
- [ ] Click on related item to navigate to its detail view
- [ ] Inline editing of amounts/quantities
- [ ] Drag-and-drop to reorder items
- [ ] Bulk add/remove relationships
- [ ] Export related records to CSV
- [ ] Filter/search within each tab
- [ ] Sort by amount, name, category

---

## Troubleshooting

**No tabs showing:**
- Check that junction tables are seeded (run migrations)
- Verify entity has relationships in database
- Check console for errors

**Images not loading:**
- Verify `image_url` fields are populated
- Check CORS settings if images from external domains
- Fallback placeholder will show if image fails

**Wrong relationships showing:**
- Verify `getEntityType()` mapping in `CatalogDetailTray.tsx`
- Check junction table queries in `junctionTableHelpers.ts`

---

## Summary

The Junction Table Viewer provides a **visual, image-first way** to explore all relationships for any entity in the admin panel. It automatically detects the entity type and shows only relevant relationships, making it easy to understand how data is connected across the catalog.

**Key benefit:** Instead of seeing raw JSONB data or ID arrays, admins now see actual images and names of related records, making the data much more accessible and understandable.
