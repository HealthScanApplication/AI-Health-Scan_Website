# Mobile App — Data Access, Visualization & Regulatory API Report

**Generated:** 2026-03-04  
**Supabase Project:** `mofhvoudjxinvpplsytd`  
**URL:** `https://mofhvoudjxinvpplsytd.supabase.co`

---

## 1. DATABASE TABLES & WHAT THEY HOLD

| Table | Purpose | Record Count Guide |
|---|---|---|
| `catalog_elements` | All beneficial + hazardous elements (vitamins, minerals, toxins, heavy metals, etc.) | ~268 hazardous, ~90 beneficial |
| `catalog_ingredients` | Raw and processed food ingredients with nutrition + hazard data | Growing catalog |
| `catalog_recipes` | Recipes with linked ingredients, nutrition, hazards | Growing catalog |
| `catalog_products` | Packaged/branded products with barcodes | Growing catalog |
| `food_items` | User's logged meals/beverages/snacks (personal data) | Per-user |

---

## 2. SUPABASE QUERIES — HOW TO GET ALL ELEMENT DATA

### 2a. Get ALL Beneficial Elements (vitamins, minerals, amino acids, etc.)

```sql
SELECT id, name_common, health_role, category, type_label, subcategory,
       essential_90, nutrient_key, nutrient_unit, nutrient_category,
       description, description_simple, description_full,
       functions, health_benefits, health_score,
       thresholds, deficiency_ranges, excess_ranges,
       drv_by_population, deficiency,
       food_sources_detailed, food_strategy, found_in,
       interactions, image_url
FROM catalog_elements
WHERE health_role = 'beneficial'
ORDER BY name_common ASC;
```

**Mobile Supabase call:**
```typescript
const { data } = await supabase
  .from('catalog_elements')
  .select('id, name_common, health_role, category, type_label, subcategory, essential_90, nutrient_key, nutrient_unit, nutrient_category, description, description_simple, description_full, functions, health_benefits, health_score, thresholds, deficiency_ranges, excess_ranges, drv_by_population, deficiency, food_sources_detailed, food_strategy, found_in, interactions, image_url')
  .eq('health_role', 'beneficial')
  .order('name_common', { ascending: true });
```

### 2b. Get ALL Hazardous Elements

```typescript
const { data } = await supabase
  .from('catalog_elements')
  .select('id, name_common, health_role, category, type_label, subcategory, description, description_simple, description_full, risk_tags, thresholds, excess_ranges, detox_strategy, found_in, food_sources_detailed, prevention_items, elimination_items, interactions, image_url')
  .eq('health_role', 'hazardous')
  .order('name_common', { ascending: true });
```

### 2c. Get a Single Ingredient with ALL Nutrition + Hazard Data

```typescript
const { data } = await supabase
  .from('catalog_ingredients')
  .select('*')
  .eq('id', ingredientId)
  .single();
```

**Key fields returned:**
- `nutrition_per_100g` — macros (calories, protein_g, carbohydrates_g, fats_g, fiber_g, sugar_g, sodium_mg)
- `nutrition_per_serving` — same structure, per-serving amounts
- `elements_beneficial` — full micronutrient breakdown (see structure below)
- `elements_hazardous` — hazard risk map (see structure below)

---

## 3. DATA STRUCTURES FOR VISUALIZATION

### 3a. Macronutrients (from `nutrition_per_100g` or `nutrition_per_serving`)

```json
{
  "calories": 245,
  "protein_g": 26.1,
  "carbohydrates_g": 0,
  "fats_g": 15.2,
  "fiber_g": 0,
  "sugar_g": 0,
  "sodium_mg": 72,
  "serving_size_g": 170
}
```

**How to visualize:** Compare each macro against the user's daily target (from their profile/DRV).

```
Calories:  user_total / user_target × 100 = percentage
Protein:   sum(protein_g from all food_items) / DRV_protein × 100
Carbs:     sum(carbohydrates_g) / DRV_carbs × 100
Fats:      sum(fats_g) / DRV_fats × 100
```

**Default daily targets (adult):**
| Macro | Default Target |
|---|---|
| Calories | 2000 kcal |
| Protein | 50g (male) / 46g (female) |
| Carbs | 275g |
| Fats | 78g |
| Fiber | 28g |

### 3b. Micronutrients (from `elements_beneficial`)

The `elements_beneficial` field on ingredients/recipes contains the full micronutrient breakdown:

```json
{
  "serving": { "name": "1 cup", "size_g": 240 },
  "per_100g": {
    "calories": 42,
    "macronutrients": { "protein_g": 3.4, "fat_g": 0.4, "carbohydrates_g": 6.4, "fiber_g": 2.1 },
    "vitamins": {
      "vitamin_a_mcg": 469,
      "vitamin_c_mg": 28.1,
      "vitamin_k2_mcg": 482.9,
      "folate_mcg": 194,
      "riboflavin_mg": 0.19
    },
    "minerals": {
      "calcium_mg": 99,
      "iron_mg": 2.71,
      "magnesium_mg": 79,
      "potassium_mg": 558,
      "manganese_mg": 0.9
    },
    "amino_acids": { "leucine_g": 0.22, "lysine_g": 0.17 },
    "fatty_acids": { "omega_3_mg": 138, "omega_6_g": 0.03 },
    "antioxidants": { "beta_carotene_mg": 5.6, "lutein_mg": 12.2 },
    "functional": { "choline_mg": 19.3 },
    "digestive": { "soluble_fiber_g": 0.4, "insoluble_fiber_g": 1.7 }
  },
  "per_serving": { /* same structure */ }
}
```

**How to visualize micronutrients:**

1. **Sum across all food_items for the day:**
   ```
   daily_vitamin_c = Σ (item.elements_beneficial.per_serving.vitamins.vitamin_c_mg × servings)
   ```

2. **Compare against DRV** (from `catalog_elements` → `drv_by_population`):
   ```
   percentage = daily_vitamin_c / drv_rda × 100
   ```

3. **DRV lookup by user profile:**
   ```typescript
   // Get the DRV for this element matching user's age/gender
   const element = catalog_elements.find(e => e.nutrient_key === 'vitamin_c_mg');
   const drv = element.drv_by_population; // { unit: 'mg/day', groups: [...] }
   const match = drv.groups.find(g => 
     g.gender === user.gender && 
     userAgeInRange(g.age_range)
   );
   const rda = match?.rda; // e.g. 90 for adult male
   ```

### 3c. Hazardous Elements (from `elements_hazardous`)

```json
{
  "mercury": {
    "level": "moderate",
    "per_100g": 0.35,
    "per_serving": 0.6,
    "likelihood": 85,
    "reason": "Methylmercury bioaccumulates in predatory fish through aquatic food chains"
  },
  "pcbs": {
    "level": "low",
    "per_100g": 0.02,
    "per_serving": 0.034,
    "likelihood": 60,
    "reason": "Persistent organic pollutant found in fatty fish tissues"
  }
}
```

**How to visualize hazards:**

1. **Group by category** using `hazardCategories.json`:
   ```typescript
   import categories from '../config/hazardCategories.json';
   
   // For each food_item, iterate its elements_hazardous
   // Group element_ids by their parent category
   const grouped = categories.categories.map(cat => ({
     ...cat,
     detected: Object.keys(item.elements_hazardous || {})
       .filter(id => cat.element_ids.includes(id))
       .map(id => ({ id, ...item.elements_hazardous[id] }))
   }));
   ```

2. **Show count per category:** e.g. "Contaminants 2/74", "Pathogens 0/42"

3. **Bar chart per element:** Use `likelihood` (0-100) for the bar width, color by `level`:
   - `none` → grey (#E5E7EB)
   - `trace` → light amber
   - `low` → amber
   - `moderate` → orange
   - `high` → red

### 3d. DRV (Dietary Reference Values) Structure

Stored in `catalog_elements.drv_by_population`:

```json
{
  "unit": "mg/day",
  "groups": [
    { "group": "Infants 0–6 months", "age_range": "0–6m", "gender": "all", "rda": 0.4, "ul": null },
    { "group": "Children 1–3 years", "age_range": "1–3y", "gender": "all", "rda": 15, "ul": 400 },
    { "group": "Male 19–50 years", "age_range": "19–50y", "gender": "male", "rda": 90, "ul": 2000 },
    { "group": "Female 19–50 years", "age_range": "19–50y", "gender": "female", "rda": 75, "ul": 2000 },
    { "group": "Pregnant", "age_range": "any", "gender": "female", "rda": 85, "ul": 2000, "pregnant": true },
    { "group": "Lactating", "age_range": "any", "gender": "female", "rda": 120, "ul": 2000, "lactating": true }
  ]
}
```

| Field | Meaning |
|---|---|
| `rda` | Recommended Dietary Allowance — target daily intake |
| `ul` | Upper Tolerable Limit — max safe daily intake |
| `ai` | Adequate Intake (used when RDA data insufficient) |
| `ear` | Estimated Average Requirement |

### 3e. Thresholds (Beneficial Elements)

Stored in `catalog_elements.thresholds`:

```json
{
  "unit": "mg",
  "rdi": { "adult_male": 90, "adult_female": 75, "children": 25, "pregnant": 85 },
  "deficient": { "below": 30, "label": "Below your body's needs. Symptoms may appear over time." },
  "optimal": { "min": 75, "max": 200, "label": "Best range for daily function and long-term health." },
  "excess": { "above": 2000, "label": "Higher-than-needed intake. Risk increases if repeated." },
  "ul": 2000
}
```

### 3f. Thresholds (Hazardous Elements)

```json
{
  "unit": "mg/kg bw/day",
  "optimal": { "below": 0.001, "label": "Below guidance threshold — risk is lower." },
  "excess": { "above": 0.004, "label": "Above threshold — repeated exposure increases risk." },
  "regulatory_limits": {
    "fda": 0.003,
    "who": 0.002,
    "eu": 0.001
  }
}
```

---

## 4. REGULATORY DATA SOURCES — USA & EU

### 4a. USA Sources

| Source | What It Covers | Data Access |
|---|---|---|
| **FDA TDS (Total Diet Study)** | Contaminant levels in ~280 foods tested quarterly | PDF tables; no API. Scrape from [fda.gov/food/total-diet-study](https://www.fda.gov/food/total-diet-study) |
| **USDA FoodData Central** | Full nutrition data (SR Legacy, FNDDS, Foundation) | ✅ **REST API**: `https://api.nal.usda.gov/fdc/v1/` — Free API key from [fdc.nal.usda.gov](https://fdc.nal.usda.gov/api-guide) |
| **NIH ODS (Office of Dietary Supplements)** | DRV/RDA/UL values for all vitamins & minerals | PDF fact sheets; structured data via [ods.od.nih.gov](https://ods.od.nih.gov/factsheets/list-all/) |
| **EPA IRIS** | Reference doses (RfD) for toxic chemicals | Database at [epa.gov/iris](https://www.epa.gov/iris) — downloadable CSVs |
| **FDA Action Levels** | Max allowable contaminant levels in food (lead, mercury, aflatoxin) | PDF guidance docs; key values below |
| **ATSDR Toxicological Profiles** | MRL (Minimal Risk Levels) for 300+ substances | [atsdr.cdc.gov/toxprofiles](https://www.atsdr.cdc.gov/toxprofiles/) — downloadable PDFs with MRL tables |
| **CalProp65** | California's list of carcinogens/reproductive toxicants with NSRLs | Downloadable list at [oehha.ca.gov/proposition-65](https://oehha.ca.gov/proposition-65) |

### 4b. EU Sources

| Source | What It Covers | Data Access |
|---|---|---|
| **EFSA DRVs** | EU Dietary Reference Values (all nutrients) | ✅ **REST API**: `https://drvs.efsa.europa.eu/api/` — structured JSON |
| **EFSA Contaminant Opinions** | TWI/TDI values for heavy metals, PFAS, mycotoxins, etc. | Scientific opinions at [efsa.europa.eu](https://www.efsa.europa.eu/en/publications) |
| **EU Commission Reg 2023/915** | Maximum levels for contaminants in food (lead, cadmium, mercury, mycotoxins, PAHs, etc.) | Full regulation text — key values extractable |
| **EFSA OpenFoodTox** | ✅ Chemical hazard database with NOAEL/ADI/ARfD for 5000+ substances | **Downloadable CSV/Excel** at [efsa.europa.eu/en/data-report/chemical-hazards-database](https://www.efsa.europa.eu/en/data-report/chemical-hazards-database) |
| **EU Pesticide Database** | MRLs for all pesticide/crop combinations | ✅ Searchable at [ec.europa.eu/food/plant/pesticides/eu-pesticides-database](https://ec.europa.eu/food/plant/pesticides/eu-pesticides-database/) |

### 4c. International / WHO

| Source | What It Covers | Data Access |
|---|---|---|
| **WHO JECFA** | ADI/PTWI for food additives & contaminants | Monographs at [apps.who.int/food-additives-contaminants-jecfa-database](https://apps.who.int/food-additives-contaminants-jecfa-database/) |
| **WHO GEMS/Food** | Global contaminant monitoring data | Reports at [who.int/teams/food-safety](https://www.who.int/teams/food-safety) |
| **Codex Alimentarius** | International food standards including max residue limits | [fao.org/fao-who-codexalimentarius](https://www.fao.org/fao-who-codexalimentarius/) |

---

## 5. KEY REGULATORY LIMIT VALUES (PRE-EXTRACTED)

### 5a. Heavy Metals — FDA vs EU vs WHO

| Element | FDA Action Level | EU Max (Reg 2023/915) | WHO PTWI | Unit |
|---|---|---|---|---|
| **Lead** | 0.05 ppm (candy), 0.01 ppm (juice) | 0.02–0.30 mg/kg (varies by food) | 25 μg/kg bw/week (withdrawn, now ALARA) | ppm / mg/kg |
| **Mercury** | 1.0 ppm (fish action level) | 0.50 mg/kg (fish), 0.10 (other) | 1.6 μg/kg bw/week (methylmercury) | ppm |
| **Cadmium** | None specific (uses Codex) | 0.020–0.50 mg/kg (varies) | 25 μg/kg bw/month | ppm |
| **Arsenic (inorganic)** | 0.01 ppm (apple juice), 0.1 ppm (rice) | 0.10–0.30 mg/kg (rice) | 3 μg/kg bw/day (BMDL) | ppm |

### 5b. Mycotoxins

| Toxin | FDA Action Level | EU Max Level | Unit |
|---|---|---|---|
| **Aflatoxin B1** | 20 ppb (total aflatoxins) | 2–12 μg/kg (B1), 4–15 μg/kg (total) | ppb / μg/kg |
| **Ochratoxin A** | None specific | 3–10 μg/kg | μg/kg |
| **Deoxynivalenol** | 1 ppm advisory | 200–1750 μg/kg | ppb |
| **Fumonisins** | 2–4 ppm guidance | 200–4000 μg/kg | ppm / μg/kg |
| **Patulin** | 50 ppb (apple juice) | 10–50 μg/kg | ppb |

### 5c. Pesticide Residues

| Pesticide | US EPA Tolerance (ppm) | EU MRL (mg/kg) | ADI (mg/kg bw/day) |
|---|---|---|---|
| **Glyphosate** | 0.7 (grain), 30 (oilseeds) | 0.1 (most crops) | 0.5 (EFSA), 1.75 (EPA) |
| **Chlorpyrifos** | Revoked (2022) | 0.01 (default MRL) | 0.001 (EFSA) |
| **DDT** | Banned (0.05 residue) | 0.05 mg/kg | 0.01 (WHO) |

### 5d. PFAS & Industrial Chemicals

| Chemical | FDA Advisory | EU Limit | WHO Guideline | Unit |
|---|---|---|---|---|
| **PFOA** | 70 ppt (drinking water, old) | 4 ng/L (drinking water, 2023) | — | ppt / ng/L |
| **PFOS** | 70 ppt (combined) | 4 ng/L | — | ppt |
| **BPA** | 0.05 mg/kg (migrated) | 0.00002 mg/kg bw/day (TDI, 2023 EFSA) | — | varies |
| **Dioxins (TEQ)** | — | 2 pg WHO-TEQ/g fat | 1 pg/kg bw/month (PTWI) | pg TEQ |
| **Acrylamide** | — | Benchmark levels: 40–750 μg/kg (varies by food) | — | μg/kg |

---

## 6. APIS TO HOOK UP FOR AUTOMATED DATA IMPORT

### 6a. ✅ USDA FoodData Central API (FREE — PRIORITY 1)

**Best for:** Nutrition per 100g, macros, vitamins, minerals for ALL ingredients

```
Base URL: https://api.nal.usda.gov/fdc/v1/
API Key:  Get free at https://fdc.nal.usda.gov/api-key-signup.html
```

**Endpoints:**
```
GET /foods/search?query=spinach&api_key=YOUR_KEY
GET /food/{fdcId}?api_key=YOUR_KEY
```

**Importer flow:**
```
For each catalog_ingredient:
  1. Search USDA: GET /foods/search?query={name_common}&dataType=Foundation,SR%20Legacy
  2. Get top match fdcId
  3. GET /food/{fdcId} → full nutrient breakdown
  4. Map USDA nutrients → elements_beneficial JSON structure
  5. UPDATE catalog_ingredients SET elements_beneficial = {...}, nutrition_per_100g = {...}
```

**USDA Nutrient ID mapping (key ones):**
| USDA ID | Our Key | Name |
|---|---|---|
| 1003 | protein_g | Protein |
| 1004 | fat_g | Total fat |
| 1005 | carbohydrates_g | Carbohydrates |
| 1008 | calories | Energy (kcal) |
| 1079 | fiber_g | Fiber |
| 1087 | calcium_mg | Calcium |
| 1089 | iron_mg | Iron |
| 1090 | magnesium_mg | Magnesium |
| 1092 | potassium_mg | Potassium |
| 1093 | sodium_mg | Sodium |
| 1095 | zinc_mg | Zinc |
| 1104 | vitamin_a_mcg | Vitamin A (RAE) |
| 1162 | vitamin_c_mg | Vitamin C |
| 1110 | vitamin_d3_mcg | Vitamin D |
| 1109 | vitamin_e_mg | Vitamin E |
| 1185 | vitamin_k2_mcg | Vitamin K |
| 1166 | vitamin_b12_mcg | B12 |
| 1177 | folate_mcg | Folate |
| 1180 | choline_mg | Choline |
| 1253 | omega_3_mg | Omega-3 (DHA+EPA) |

### 6b. ✅ EFSA DRV API (FREE — PRIORITY 2)

**Best for:** EU dietary reference values by age/gender/pregnancy

```
Base URL: https://drvs.efsa.europa.eu/api/
```

**Example:**
```
GET /nutrients                    → list all nutrients
GET /nutrients/{id}/drvs          → DRV values by population group
```

**Importer flow:**
```
For each catalog_element WHERE health_role = 'beneficial':
  1. Match element to EFSA nutrient by name
  2. GET /nutrients/{efsa_id}/drvs
  3. Map to drv_by_population.groups[] format
  4. Merge with existing USA DRV data (NIH)
  5. UPDATE catalog_elements SET drv_by_population = {...}
```

### 6c. ✅ EFSA OpenFoodTox (DOWNLOADABLE — PRIORITY 3)

**Best for:** Hazardous element thresholds — NOAEL, ADI, ARfD for 5000+ chemicals

```
Download: https://www.efsa.europa.eu/en/data-report/chemical-hazards-database
Format: Excel/CSV with columns: substance, CAS, endpoint, value, unit, species, study_type
```

**Importer flow:**
```
1. Download OpenFoodTox CSV
2. For each catalog_element WHERE health_role = 'hazardous':
   a. Match by CAS number or name_common
   b. Extract: ADI, ARfD, NOAEL, TDI, TWI values
   c. Map to thresholds.regulatory_limits.eu
   d. UPDATE catalog_elements SET thresholds = {...}
```

### 6d. 🔧 Open Food Facts API (FREE — PRIORITY 4)

**Best for:** Product barcodes, ingredient lists, Nutri-Score, NOVA classification

```
Base URL: https://world.openfoodfacts.org/api/v2/
```

**Endpoints:**
```
GET /product/{barcode}            → full product data
GET /search?categories_tags=en:cereals&page_size=50
```

### 6e. 🔧 EPA CompTox Dashboard API (FREE — SUPPLEMENTARY)

**Best for:** Chemical toxicity data, reference doses, cancer classifications

```
Base URL: https://comptox.epa.gov/dashboard/
Batch download: https://comptox.epa.gov/dashboard/downloads
```

### 6f. 🔧 PubChem API (FREE — SUPPLEMENTARY)

**Best for:** CAS numbers, molecular formulas, hazard classifications (GHS)

```
Base URL: https://pubchem.ncbi.nlm.nih.gov/rest/pug/
GET /compound/name/mercury/property/MolecularFormula,MolecularWeight,IUPACName/JSON
```

---

## 7. IMPORTER STRATEGY — EDGE FUNCTION

### 7a. New Edge Function: `admin/import-regulatory-data`

```typescript
// Pseudocode for regulatory data importer
app.post('/make-server-ed0fe4c2/admin/import-regulatory-data', async (c) => {
  const { source, elementIds } = await c.req.json();
  // source: 'usda' | 'efsa_drv' | 'openfoodtox' | 'fda_limits'
  
  switch (source) {
    case 'usda':
      // For each ingredient, search USDA, map nutrients, update DB
      for (const id of elementIds) {
        const record = await supabase.from('catalog_ingredients').select('name_common').eq('id', id).single();
        const usdaData = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(record.name_common)}&api_key=${USDA_KEY}`);
        const nutrients = mapUsdaToOurFormat(usdaData);
        await supabase.from('catalog_ingredients').update({ elements_beneficial: nutrients, nutrition_per_100g: nutrients.macros }).eq('id', id);
      }
      break;
      
    case 'efsa_drv':
      // For each beneficial element, fetch EFSA DRVs
      for (const id of elementIds) {
        const element = await supabase.from('catalog_elements').select('name_common, drv_by_population').eq('id', id).single();
        const efsaDrvs = await fetch(`https://drvs.efsa.europa.eu/api/nutrients/search?name=${encodeURIComponent(element.name_common)}`);
        const merged = mergeUsaEuDrv(element.drv_by_population, efsaDrvs);
        await supabase.from('catalog_elements').update({ drv_by_population: merged }).eq('id', id);
      }
      break;
      
    case 'openfoodtox':
      // Bulk import from pre-parsed OpenFoodTox CSV
      // Match hazardous elements by CAS number
      break;
  }
});
```

### 7b. AI Enrichment Prompt for Regulatory Limits

Add this to the existing `structuredFormats` in the edge function for the `thresholds` field on hazardous elements:

```
For hazardous elements, provide regulatory limits from ALL major bodies:
{
  "unit": "mg/kg bw/day or ppb or ppm",
  "optimal": { "below": number, "label": "Below guidance threshold" },
  "excess": { "above": number, "label": "Above threshold — risk increases" },
  "regulatory_limits": {
    "fda": { "value": number, "unit": "ppm", "context": "action level in X food", "source": "FDA guidance doc" },
    "eu": { "value": number, "unit": "mg/kg", "context": "EU Reg 2023/915", "source": "EFSA opinion ref" },
    "who": { "value": number, "unit": "μg/kg bw/week", "context": "PTWI/PTMI", "source": "JECFA evaluation" },
    "epa": { "value": number, "unit": "mg/kg bw/day", "context": "RfD oral", "source": "IRIS assessment" },
    "codex": { "value": number, "unit": "mg/kg", "context": "ML in food category", "source": "Codex standard" }
  },
  "long_term_exposure": {
    "adi_or_tdi": number,
    "unit": "mg/kg bw/day",
    "basis": "NOAEL with safety factor 100",
    "critical_effect": "e.g. renal tubular damage",
    "study_type": "chronic oral study in rats",
    "cancer_classification": "IARC Group 1/2A/2B/3 or EPA class A/B/C/D"
  }
}
```

---

## 8. LONG-TERM EXPOSURE DATA NEEDED

For each hazardous element, the mobile app needs to track and display:

| Data Point | Source | DB Field |
|---|---|---|
| **TDI** (Tolerable Daily Intake) | EFSA / WHO | `thresholds.regulatory_limits.eu` |
| **RfD** (Reference Dose) | EPA IRIS | `thresholds.regulatory_limits.epa` |
| **PTWI/PTMI** (Provisional Tolerable Weekly/Monthly Intake) | WHO JECFA | `thresholds.regulatory_limits.who` |
| **NOAEL** (No Observed Adverse Effect Level) | OpenFoodTox | `thresholds.long_term_exposure.basis` |
| **Cancer Classification** | IARC / EPA | `thresholds.long_term_exposure.cancer_classification` |
| **Bioaccumulation half-life** | Toxicology literature | `description_full.how_lasts` |
| **Critical organ/effect** | ATSDR / EFSA | `thresholds.long_term_exposure.critical_effect` |

### How Mobile App Uses Long-Term Data:

```
User eats food with mercury (0.35 mg/kg) →
  Per-serving exposure = 0.35 × serving_g / 1000 = X mg
  Per-kg-bodyweight = X / user_weight_kg = Y mg/kg bw
  
  Compare against:
    WHO PTWI: 1.6 μg/kg bw/WEEK → daily = 0.23 μg/kg bw/day
    EPA RfD: 0.1 μg/kg bw/day
    EU TWI: 1.3 μg/kg bw/WEEK → daily = 0.19 μg/kg bw/day
    
  Weekly accumulation = sum(daily_exposures over 7 days)
  % of PTWI = weekly_accumulation / PTWI × 100
```

---

## 9. IMPLEMENTATION PRIORITY ORDER

| # | Task | Effort | Impact |
|---|---|---|---|
| 1 | **USDA API importer** for `elements_beneficial` + `nutrition_per_100g` on all ingredients | 2 days | 🔴 Critical — fills all micronutrient data |
| 2 | **EFSA DRV API** importer for `drv_by_population` on all beneficial elements | 1 day | 🔴 Critical — enables % DRV calculations |
| 3 | **OpenFoodTox CSV** import for hazardous element thresholds + regulatory limits | 1 day | 🔴 Critical — fills all toxic level data |
| 4 | **Enhance AI prompt** for `thresholds` field to include FDA/EU/WHO/EPA values with sources | 0.5 day | 🟡 High — improves AI-generated regulatory data |
| 5 | **FDA action levels** manual data entry for top 20 contaminants (lead, mercury, etc.) | 0.5 day | 🟡 High — fills US regulatory gaps |
| 6 | **Long-term exposure calculator** in mobile app | 2 days | 🟡 High — weekly/monthly accumulation tracking |
| 7 | **Open Food Facts** product barcode scanner integration | 1 day | 🟢 Medium — product catalog expansion |
| 8 | **EPA CompTox** bulk import for RfD values | 1 day | 🟢 Medium — supplements EPA reference doses |

---

## 10. ENVIRONMENT VARIABLES NEEDED

```bash
# Add to Supabase secrets
supabase secrets set USDA_API_KEY=your_key_here
# EFSA DRV API is open (no key needed)
# OpenFoodTox is a downloadable CSV (no key needed)
# Open Food Facts API is open (no key needed)
```

---

## 11. QUICK REFERENCE — MOBILE QUERY CHEAT SHEET

```typescript
// Get user's daily food items
const { data: meals } = await supabase.from('food_items')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', todayStart)
  .lt('created_at', todayEnd)
  .in('type', ['meal', 'beverage', 'snack', 'ingredient']);

// Get all beneficial elements for DRV lookup
const { data: elements } = await supabase.from('catalog_elements')
  .select('id, name_common, nutrient_key, nutrient_unit, drv_by_population, thresholds')
  .eq('health_role', 'beneficial');

// Get all hazardous elements for threshold lookup  
const { data: hazards } = await supabase.from('catalog_elements')
  .select('id, name_common, category, thresholds, risk_tags')
  .eq('health_role', 'hazardous');

// Get ingredient detail with full nutrition
const { data: ingredient } = await supabase.from('catalog_ingredients')
  .select('name_common, elements_beneficial, elements_hazardous, nutrition_per_100g, nutrition_per_serving')
  .eq('id', ingredientId)
  .single();
```
