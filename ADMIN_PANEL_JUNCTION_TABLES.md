# Admin Panel Junction Tables Usage Guide

## Quick Reference

This guide shows how to **view and query junction table data** in the admin panel using the new helper functions and SQL views.

---

## 1. Import the Helpers

```typescript
import {
  getIngredientElements,
  getRecipeIngredients,
  getElementHSCoverage,
  getSymptomElements,
  getCookingMethodElements,
  getIngredientNutrition,
  getRecipeNutrition,
  // ... other helpers
} from '../utils/junctionTableHelpers';
```

---

## 2. Common Query Patterns

### 2.1 Show All Elements in an Ingredient

**Use case:** Display nutrition breakdown for chicken breast

```typescript
// In your component
const [elements, setElements] = useState<IngredientElementLink[]>([]);

useEffect(() => {
  async function loadElements() {
    try {
      const data = await getIngredientElements('chicken_breast');
      setElements(data);
    } catch (error) {
      console.error('Failed to load elements:', error);
    }
  }
  loadElements();
}, [ingredientId]);

// Render
{elements.map(link => (
  <div key={link.id}>
    <span>{link.element?.name_common}</span>
    <span>{link.amount_per_100g} {link.amount_unit}</span>
    {link.is_primary && <Badge>Primary</Badge>}
  </div>
))}
```

---

### 2.2 Show All Ingredients in a Recipe

**Use case:** Display recipe ingredient list with quantities

```typescript
const ingredients = await getRecipeIngredients('grilled_chicken_salad');

// Render
{ingredients.map(link => (
  <div key={link.id}>
    <img src={link.ingredient?.image_url} />
    <span>{link.ingredient?.name_common}</span>
    <span>{link.qty_g}g</span>
  </div>
))}
```

---

### 2.3 Show All HS Coverage for an Element

**Use case:** For Vitamin C, show all supplements, tests, and products

```typescript
const coverage = await getElementHSCoverage('ascorbic_acid_vitamin_c');

// coverage = {
//   supplements: [...],
//   tests: [...],
//   products: [...]
// }

// Render
<Tabs>
  <TabsList>
    <TabsTrigger>Supplements ({coverage.supplements.length})</TabsTrigger>
    <TabsTrigger>Tests ({coverage.tests.length})</TabsTrigger>
    <TabsTrigger>Products ({coverage.products.length})</TabsTrigger>
  </TabsList>
  
  <TabsContent value="supplements">
    {coverage.supplements.map(item => (
      <div key={item.hs_item_id}>
        <img src={item.hs_item_image} />
        <span>{item.hs_item_name}</span>
      </div>
    ))}
  </TabsContent>
</Tabs>
```

---

### 2.4 Show Symptom → Element → Test → Supplement Chain

**Use case:** User has fatigue, show what to test and what to take

```typescript
const careChain = await getSymptomCareChain('fatigue_symptom_id');

// careChain = [
//   {
//     element_id: 'iron',
//     element_name: 'Iron',
//     relationship: 'deficiency',
//     tests: [{id: 'iron_test', name: 'Serum Iron Test'}],
//     supplements: [{id: 'iron_supp', name: 'Iron Bisglycinate'}]
//   },
//   ...
// ]

// Render
{careChain.map(chain => (
  <Card key={chain.element_id}>
    <h3>{chain.element_name} {chain.relationship}</h3>
    
    <div>
      <h4>Tests to detect:</h4>
      {chain.tests.map(test => (
        <Link to={`/tests/${test.id}`}>{test.name}</Link>
      ))}
    </div>
    
    <div>
      <h4>Supplements to treat:</h4>
      {chain.supplements.map(supp => (
        <Link to={`/supplements/${supp.id}`}>{supp.name}</Link>
      ))}
    </div>
  </Card>
))}
```

---

### 2.5 Show Full Nutrition Profile (Grouped by Category)

**Use case:** Display complete nutrition breakdown for salmon

```typescript
const nutrition = await getIngredientNutrition('salmon_atlantic');

// nutrition = {
//   macronutrients: [{element_name: 'Protein', amount_per_100g: 20, ...}],
//   vitamins: [{element_name: 'Vitamin D', amount_per_100g: 10, ...}],
//   minerals: [{element_name: 'Selenium', amount_per_100g: 36, ...}],
//   hazardous: [{element_name: 'Mercury', likelihood_percent: 30, ...}]
// }

// Render
<Accordion>
  <AccordionItem value="macros">
    <AccordionTrigger>
      Macronutrients ({nutrition.macronutrients.length})
    </AccordionTrigger>
    <AccordionContent>
      {nutrition.macronutrients.map(el => (
        <div key={el.element_id}>
          {el.element_name}: {el.amount_per_100g}{el.unit_per_100g}
        </div>
      ))}
    </AccordionContent>
  </AccordionItem>
  
  <AccordionItem value="vitamins">
    <AccordionTrigger>
      Vitamins ({nutrition.vitamins.length})
    </AccordionTrigger>
    <AccordionContent>
      {nutrition.vitamins.map(el => (
        <div key={el.element_id}>
          {el.element_name}: {el.amount_per_100g}{el.unit_per_100g}
        </div>
      ))}
    </AccordionContent>
  </AccordionItem>
  
  {nutrition.hazardous.length > 0 && (
    <AccordionItem value="hazards">
      <AccordionTrigger className="text-red-600">
        ⚠️ Hazardous Elements ({nutrition.hazardous.length})
      </AccordionTrigger>
      <AccordionContent>
        {nutrition.hazardous.map(el => (
          <div key={el.element_id} className="text-red-600">
            {el.element_name}: {el.likelihood_percent}% likelihood
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  )}
</Accordion>
```

---

### 2.6 Show Calculated Recipe Nutrition

**Use case:** Display total nutrition for a recipe (aggregated from ingredients)

```typescript
const nutrition = await getRecipeNutrition('grilled_salmon_asparagus');

// nutrition = [
//   {
//     element_id: 'protein',
//     element_name: 'Protein',
//     element_category: 'Macronutrient',
//     total_amount: 45.2,
//     unit: 'g',
//     ingredients: [
//       {name: 'Salmon', amount: 40},
//       {name: 'Asparagus', amount: 5.2}
//     ]
//   },
//   ...
// ]

// Render
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nutrient</TableHead>
      <TableHead>Total Amount</TableHead>
      <TableHead>From Ingredients</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {nutrition.map(el => (
      <TableRow key={el.element_id}>
        <TableCell>{el.element_name}</TableCell>
        <TableCell>{el.total_amount.toFixed(1)} {el.unit}</TableCell>
        <TableCell>
          {el.ingredients.map(ing => (
            <div key={ing.name}>
              {ing.name}: {ing.amount.toFixed(1)}{el.unit}
            </div>
          ))}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 2.7 Show Hazardous Elements from Cooking Methods

**Use case:** Display warnings for grilling (produces HCAs, PAHs)

```typescript
const hazards = await getRecipeHazards('grilled_steak');

// hazards = [
//   {
//     cooking_method: 'Grilling',
//     hazardous_element: 'Heterocyclic Amines (HCAs)',
//     severity: 'high',
//     mechanism: 'Formed when meat is cooked at high temperatures'
//   },
//   ...
// ]

// Render
{hazards.length > 0 && (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Cooking Method Warnings</AlertTitle>
    <AlertDescription>
      {hazards.map(h => (
        <div key={h.hazardous_element}>
          <strong>{h.cooking_method}</strong> produces{' '}
          <strong>{h.hazardous_element}</strong>
          {h.severity && ` (${h.severity} risk)`}
          {h.mechanism && <p className="text-sm">{h.mechanism}</p>}
        </div>
      ))}
    </AlertDescription>
  </Alert>
)}
```

---

## 3. Editing Junction Table Data

### 3.1 Add Element to Ingredient

```typescript
import { addIngredientElements } from '../utils/junctionTableHelpers';

async function handleAddElement() {
  try {
    await addIngredientElements('chicken_breast', [
      {
        element_id: 'retinol_vitamin_a',
        amount_per_100g: 10,
        unit_per_100g: 'μg',
        is_primary: true
      }
    ]);
    
    toast.success('Element added successfully');
    // Refresh the list
    loadElements();
  } catch (error) {
    toast.error('Failed to add element');
  }
}
```

---

### 3.2 Update Element Amount

```typescript
import { updateIngredientElementAmount } from '../utils/junctionTableHelpers';

async function handleUpdateAmount(elementId: string, newAmount: number) {
  try {
    await updateIngredientElementAmount(
      'chicken_breast',
      elementId,
      newAmount,
      'g'
    );
    
    toast.success('Amount updated');
    loadElements();
  } catch (error) {
    toast.error('Failed to update amount');
  }
}
```

---

### 3.3 Remove Element from Ingredient

```typescript
import { removeIngredientElement } from '../utils/junctionTableHelpers';

async function handleRemoveElement(elementId: string) {
  try {
    await removeIngredientElement('chicken_breast', elementId);
    toast.success('Element removed');
    loadElements();
  } catch (error) {
    toast.error('Failed to remove element');
  }
}
```

---

## 4. Direct SQL View Queries

For advanced use cases, query the views directly:

### 4.1 Find Top Ingredients for an Element

```typescript
import { getSupabaseClient } from '../utils/supabase/client';

const supabase = getSupabaseClient();

const { data } = await supabase
  .from('v_ingredient_nutrition')
  .select('ingredient_name, amount_per_100g, unit_per_100g')
  .eq('element_id', 'ascorbic_acid_vitamin_c')
  .gte('amount_per_100g', 10) // At least 10mg
  .order('amount_per_100g', { ascending: false })
  .limit(10);

// Returns top 10 ingredients highest in Vitamin C
```

---

### 4.2 Find Recipes Rich in a Specific Nutrient

```typescript
const { data } = await supabase
  .from('v_recipe_nutrition')
  .select('recipe_name, element_name, amount_in_recipe, unit_per_100g')
  .eq('element_id', 'protein')
  .gte('amount_in_recipe', 30) // At least 30g protein
  .order('amount_in_recipe', { ascending: false });

// Returns high-protein recipes
```

---

### 4.3 Find All Symptoms for an Element Deficiency

```typescript
const { data } = await supabase
  .from('v_symptom_care_chain')
  .select('symptom_name, element_relationship, test_name, supplement_name')
  .eq('element_id', 'iron')
  .eq('element_relationship', 'deficiency');

// Returns all symptoms caused by iron deficiency + tests + supplements
```

---

## 5. Performance Tips

### 5.1 Use Views for Complex Queries

✅ **GOOD** (uses pre-computed view):
```typescript
const nutrition = await getIngredientNutrition('salmon');
```

❌ **BAD** (multiple queries):
```typescript
const elements = await getIngredientElements('salmon');
const macros = elements.filter(e => e.element?.category === 'Macronutrient');
const vitamins = elements.filter(e => e.element?.category === 'Vitamin');
// ... etc
```

---

### 5.2 Batch Queries When Possible

✅ **GOOD** (single query with embedded join):
```typescript
const coverage = await getElementHSCoverage('zinc');
// Returns supplements, tests, products in one query
```

❌ **BAD** (3 separate queries):
```typescript
const supplements = await getSupplementsForElement('zinc');
const tests = await getTestsForElement('zinc');
const products = await getProductsForElement('zinc');
```

---

### 5.3 Use Pagination for Large Lists

```typescript
const { data, error } = await supabase
  .from('catalog_ingredient_elements')
  .select(`
    id,
    amount_per_100g,
    catalog_elements(name_common)
  `)
  .eq('ingredient_id', ingredientId)
  .range(0, 49) // First 50 results
  .order('amount_per_100g', { ascending: false });
```

---

## 6. Error Handling

### 6.1 Handle Missing Data Gracefully

```typescript
async function loadIngredientElements(ingredientId: string) {
  try {
    const elements = await getIngredientElements(ingredientId);
    
    if (elements.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No nutrition data</AlertTitle>
          <AlertDescription>
            This ingredient doesn't have nutrition data yet.
            <Button onClick={() => triggerAIEnrichment(ingredientId)}>
              Generate with AI
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    
    return <NutritionTable elements={elements} />;
  } catch (error) {
    console.error('Failed to load elements:', error);
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading nutrition data</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }
}
```

---

### 6.2 Validate Element IDs Before Inserting

```typescript
async function addElementToIngredient(ingredientId: string, elementName: string) {
  // ❌ WRONG: Don't use display names as IDs
  // await addIngredientElements(ingredientId, [{
  //   element_id: 'Vitamin C',  // This will fail!
  //   amount_per_100g: 50
  // }]);
  
  // ✅ CORRECT: Look up the actual element ID first
  const { data: element } = await supabase
    .from('catalog_elements')
    .select('id')
    .ilike('name_common', `%${elementName}%`)
    .single();
  
  if (!element) {
    throw new Error(`Element "${elementName}" not found`);
  }
  
  await addIngredientElements(ingredientId, [{
    element_id: element.id, // e.g., 'ascorbic_acid_vitamin_c'
    amount_per_100g: 50,
    unit_per_100g: 'mg'
  }]);
}
```

---

## 7. UI Component Examples

### 7.1 Element Badge with Tooltip

```typescript
function ElementBadge({ element, amount, unit }: {
  element: { id: string; name_common: string; category: string };
  amount?: number;
  unit?: string;
}) {
  const categoryColors = {
    'Macronutrient': 'bg-blue-100 text-blue-800',
    'Vitamin': 'bg-green-100 text-green-800',
    'Mineral': 'bg-purple-100 text-purple-800',
    'Hazardous Element': 'bg-red-100 text-red-800'
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={categoryColors[element.category]}>
            {element.name_common}
            {amount && ` (${amount}${unit})`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Category: {element.category}</p>
          <p>ID: {element.id}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

### 7.2 Nutrition Progress Bar

```typescript
function NutritionBar({ element, amount, dailyValue }: {
  element: string;
  amount: number;
  dailyValue: number;
}) {
  const percentage = Math.min((amount / dailyValue) * 100, 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{element}</span>
        <span>{amount.toFixed(1)}mg ({percentage.toFixed(0)}% DV)</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
```

---

## 8. Testing Junction Table Queries

```typescript
// Test file: src/utils/__tests__/junctionTableHelpers.test.ts

import { getIngredientElements, getRecipeNutrition } from '../junctionTableHelpers';

describe('Junction Table Helpers', () => {
  it('should fetch ingredient elements', async () => {
    const elements = await getIngredientElements('chicken_breast');
    
    expect(elements).toBeDefined();
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0]).toHaveProperty('element_id');
    expect(elements[0]).toHaveProperty('amount_per_100g');
    expect(elements[0]).toHaveProperty('amount_unit'); // Mapped from unit_per_100g
  });
  
  it('should calculate recipe nutrition', async () => {
    const nutrition = await getRecipeNutrition('grilled_chicken_salad');
    
    expect(nutrition).toBeDefined();
    expect(nutrition.length).toBeGreaterThan(0);
    expect(nutrition[0]).toHaveProperty('total_amount');
    expect(nutrition[0]).toHaveProperty('ingredients');
  });
});
```

---

## 9. Migration Checklist for Existing Code

When migrating from JSONB to junction tables:

- [ ] Replace `record.elements_hazardous` with `getCookingMethodElements(record.id, 'hazardous')`
- [ ] Replace `record.linked_ingredients` with `getRecipeIngredients(record.id)`
- [ ] Replace `record.cooking_method_ids.map(...)` with `getRecipeCookingMethods(record.id)`
- [ ] Replace manual element lookups with `getIngredientNutrition(record.id)`
- [ ] Update write operations to use `addIngredientElements()` instead of JSONB updates
- [ ] Test all queries return expected data structure
- [ ] Verify no `amount_unit` in `.select()` calls (use `unit_per_100g`)

---

## 10. Quick Command Reference

```bash
# Run junction table tests
npx jest junctionTableHelpers --no-coverage

# Check for JSONB column usage (should migrate these)
grep -r "elements_hazardous" src/components/
grep -r "linked_ingredients" src/components/
grep -r "cooking_method_ids" src/components/

# Verify junction table data
psql -h mofhvoudjxinvpplsytd.supabase.co -U postgres -d postgres
> SELECT COUNT(*) FROM catalog_ingredient_elements;
> SELECT COUNT(*) FROM recipe_ingredients;
```

---

## Summary

**Key Takeaways:**

1. **Use helper functions** from `junctionTableHelpers.ts` for common queries
2. **Use SQL views** (`v_ingredient_nutrition`, `v_recipe_nutrition`, etc.) for complex lookups
3. **Always look up element IDs** before inserting (use slugs, not display names)
4. **Handle missing data gracefully** with fallback UI
5. **Batch queries** when possible to reduce round trips
6. **Map `unit_per_100g` to `amount_unit`** in TypeScript interfaces
7. **Test junction table queries** before deploying

For more details, see `JUNCTION_TABLES_MIGRATION_GUIDE.md`.
