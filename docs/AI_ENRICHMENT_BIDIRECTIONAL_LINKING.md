# AI Enrichment: Bidirectional Linking Guide

## Overview

The cooking methods and equipment catalogs have **bidirectional AI-powered linking**. When you enrich either table, AI automatically suggests and links related records from the other table.

## How It Works

### 🍳 Cooking Methods → Equipment

**Field:** `equipment_ids` (uuid array)

**When you click "AI Suggest" on a cooking method:**

1. AI analyzes the cooking method's:
   - Name (e.g., "Grilling")
   - Category (e.g., "Dry Heat")
   - Temperature (e.g., "High 230-370°C")
   - Medium (e.g., "Direct flame")
   - Description

2. AI queries `catalog_equipment` table to find matching equipment:
   - Equipment name/category matches method needs
   - Equipment `use_case` includes "Cooking"
   - Equipment suitable for the temperature range

3. AI returns array of equipment UUIDs:
   ```json
   ["uuid-of-grill", "uuid-of-tongs", "uuid-of-thermometer"]
   ```

4. These UUIDs are stored in `equipment_ids` array

**Example:**
- **Cooking Method:** "Grilling"
- **AI Suggests:** 
  - Grill (uuid: abc-123)
  - Tongs (uuid: def-456)
  - Meat Thermometer (uuid: ghi-789)
  - Grill Brush (uuid: jkl-012)

---

### 🔧 Equipment → Cooking Methods

**Field:** `cooking_methods_used_with` (uuid array)

**When you click "AI Suggest" on equipment:**

1. AI analyzes the equipment's:
   - Name (e.g., "Grill")
   - Category (e.g., "Cookware")
   - Description
   - Use case

2. AI queries `catalog_cooking_methods` table to find methods that use this equipment:
   - Method name/description mentions this equipment type
   - Method category aligns with equipment use
   - Equipment category fits method needs

3. AI returns array of cooking method UUIDs:
   ```json
   ["uuid-of-grilling", "uuid-of-smoking", "uuid-of-barbecuing"]
   ```

4. These UUIDs are stored in `cooking_methods_used_with` array

**Example:**
- **Equipment:** "Grill"
- **AI Suggests:**
  - Grilling (uuid: xyz-111)
  - Hot Smoking (uuid: xyz-222)
  - Plank Grilling (uuid: xyz-333)
  - Ember Roasting (uuid: xyz-444)

---

## Batch Enrichment

### Enrich All Cooking Methods
1. Go to Cooking Methods tab
2. Click "Batch Enrich" (if available)
3. AI processes each method and links equipment
4. Progress shown for each record

### Enrich All Equipment
1. Go to Equipment tab
2. Click "Batch Enrich" (if available)
3. AI processes each equipment item and links cooking methods
4. Progress shown for each record

---

## AI Prompt Templates

### Cooking Method Equipment Linking
```
Query catalog_equipment table for this cooking method '{name}'. 
Return array of equipment UUIDs needed. 

Match by:
1) Equipment name/category matches method needs (e.g., 'Grilling' needs 'Grill', 'Tongs')
2) Equipment use_case includes 'Cooking'
3) Consider temperature ({temperature}) and medium ({medium})

Format: ['uuid-1','uuid-2']
List equipment names if UUIDs unavailable.
```

### Equipment Cooking Method Linking
```
Query catalog_cooking_methods table for this equipment '{name}' (category: {category}). 
Return array of cooking method UUIDs that use this equipment. 

Match by:
1) Method name/description mentions this equipment type
2) Method category aligns with equipment use (e.g., 'Grill' → 'Grilling', 'Broiling')
3) Equipment category '{category}' fits method needs

Format: ['uuid-1','uuid-2']
List method names if UUIDs unavailable.
```

---

## Database Schema

### catalog_cooking_methods
```sql
equipment_ids uuid[] DEFAULT '{}'
```
- Array of UUIDs from `catalog_equipment`
- Indexed with GIN for fast array queries

### catalog_equipment
```sql
cooking_methods_used_with uuid[] DEFAULT '{}'
```
- Array of UUIDs from `catalog_cooking_methods`
- Indexed with GIN for fast array queries

---

## Querying Relationships

### Find equipment for a cooking method
```sql
SELECT e.* 
FROM catalog_equipment e
WHERE e.id = ANY(
  SELECT unnest(equipment_ids) 
  FROM catalog_cooking_methods 
  WHERE name = 'Grilling'
);
```

### Find cooking methods that use specific equipment
```sql
SELECT cm.* 
FROM catalog_cooking_methods cm
WHERE cm.id = ANY(
  SELECT unnest(cooking_methods_used_with) 
  FROM catalog_equipment 
  WHERE name = 'Grill'
);
```

### Find cooking methods with no equipment linked
```sql
SELECT * FROM catalog_cooking_methods 
WHERE equipment_ids = '{}' OR equipment_ids IS NULL;
```

### Find equipment not linked to any cooking method
```sql
SELECT * FROM catalog_equipment 
WHERE cooking_methods_used_with = '{}' OR cooking_methods_used_with IS NULL;
```

---

## Benefits

✅ **No Duplicate Data** - Equipment names stored once, referenced everywhere  
✅ **Automatic Updates** - Change equipment name once, reflects everywhere  
✅ **Bidirectional Queries** - Query from either direction  
✅ **AI-Powered** - Intelligent suggestions based on context  
✅ **Scalable** - GIN indexes make array queries fast  
✅ **Enrichment Ready** - AI can populate relationships automatically  

---

## Workflow Example

### Adding a New Cooking Method

1. **Create cooking method:** "Sous Vide"
   - Category: "Moist Heat"
   - Temperature: "50-85°C"
   - Medium: "Temperature-controlled water bath"

2. **Click AI Suggest on `equipment_ids`**
   - AI finds: Sous Vide Machine, Vacuum Sealer, Food-Safe Bags
   - Returns their UUIDs
   - Array populated: `['uuid-1', 'uuid-2', 'uuid-3']`

3. **Equipment automatically updated**
   - Each equipment item now shows "Sous Vide" in their `cooking_methods_used_with`
   - (If you run AI enrich on equipment later)

### Adding New Equipment

1. **Create equipment:** "Wok"
   - Category: "Cookware"
   - Use Case: "Cooking"

2. **Click AI Suggest on `cooking_methods_used_with`**
   - AI finds: Stir-Frying, Deep-Frying, Steaming, Smoking
   - Returns their UUIDs
   - Array populated: `['uuid-a', 'uuid-b', 'uuid-c', 'uuid-d']`

3. **Cooking methods automatically linked**
   - Each method now shows "Wok" in their `equipment_ids`
   - (If you run AI enrich on methods later)

---

## Migration Required

Before using AI enrichment, run this migration:

```sql
-- Already created in: 20260224_alter_cooking_equipment_relationships.sql
ALTER TABLE catalog_cooking_methods DROP COLUMN IF EXISTS equipment_needed;
ALTER TABLE catalog_cooking_methods ADD COLUMN IF NOT EXISTS equipment_ids uuid[] DEFAULT '{}';
ALTER TABLE catalog_equipment ADD COLUMN IF NOT EXISTS cooking_methods_used_with uuid[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_cooking_methods_equipment_ids 
  ON catalog_cooking_methods USING GIN(equipment_ids);
CREATE INDEX IF NOT EXISTS idx_equipment_cooking_methods 
  ON catalog_equipment USING GIN(cooking_methods_used_with);
```

---

## Future Enhancements

- **Auto-sync:** When equipment is linked to a method, automatically add method to equipment's array
- **Batch operations:** Bulk link/unlink relationships
- **Visual relationship graph:** See connections between methods and equipment
- **Validation:** Warn if equipment doesn't match method's temperature/category requirements
- **Smart suggestions:** "Methods using this equipment also use: X, Y, Z"
