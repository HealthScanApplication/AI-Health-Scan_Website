# Mobile Element Detail Screen — Data & Section Guide

> **Purpose**: Prompt/guide for the mobile app to fetch, display, and organise `catalog_elements` data into reusable sections on the Element Detail screen.

---

## 1. Data Source — API Endpoint

### Fetch Single Element
```
GET https://mofhvoudjxinvpplsytd.supabase.co/rest/v1/catalog_elements?id=eq.{ELEMENT_ID}&select=*
Headers:
  apikey: {SUPABASE_ANON_KEY}
  Authorization: Bearer {USER_ACCESS_TOKEN}
```

### Fetch All Elements (list)
```
GET https://mofhvoudjxinvpplsytd.supabase.co/rest/v1/catalog_elements?limit=1000&order=category.asc,name_common.asc&select=*
```

### Admin "Fix" / Enrich Button (POST)
```
POST https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-fill-fields
Headers:
  Authorization: Bearer {ADMIN_ACCESS_TOKEN}
  Content-Type: application/json
Body: {
  "tabType": "Elements",
  "recordData": { ...elementRecord },
  "fields": [ ...fieldDefs ]
}
```
> The **"Fix" button** in the mobile app should call this endpoint. It is the same as the admin panel's **"AI Enrich"** button. Only show it for admin users (`role === 'admin'`). It fills empty fields with AI-generated data.

### Admin "Import DRV" Button (POST)
```
POST https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/make-server-ed0fe4c2/admin/import-element-data
Headers:
  Authorization: Bearer {ADMIN_ACCESS_TOKEN}
  Content-Type: application/json
Body: {
  "elementIds": ["{ELEMENT_ID}"],
  "source": "all"  // "eu" | "usa" | "healthscan" | "all"
}
```
> Generates official EU/USA/HealthScan DRV data (age_ranges, interventions, testing, etc.) for an element. Admin-only.

---

## 2. Reusable Section Component

Every section on the detail screen should use **one reusable component** with this signature:

```typescript
interface DetailSection {
  id: string;               // unique key e.g. "identity", "age_ranges"
  number: string;           // "01", "02", etc.
  emoji: string;            // section emoji
  title: string;            // display name
  collapsed: boolean;       // default collapsed state
  fields: SectionField[];   // data fields to render
}

interface SectionField {
  key: string;              // DB column name
  label: string;            // display label
  type: 'text' | 'tags' | 'json_table' | 'drv_chart' | 'image' | 'list' | 'badge' | 'score' | 'link_list' | 'rich_json';
  value: any;               // raw value from API
  emptyText?: string;       // placeholder when null
}
```

### Section Header Pattern
```
[collapse chevron] [number] • [emoji] [title] [field count badge]
```
Example: `▸ 01 • 🔬 Identity (8)`

All sections are **collapsible** (toggle on tap). Persist collapsed state in local storage per element.

---

## 3. Section Definitions — Order & Data Mapping

### 01 • 🖼️ Media
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `image_url` | Hero Image | `image` | Main card image |
| `image_url_raw` | Raw Form | `image` | |
| `image_url_powdered` | Powdered | `image` | |
| `image_url_cut` | Cut/Sliced | `image` | |
| `image_url_capsule` | Capsule | `image` | |
| `video_url` | Video | `video` | YouTube/Vimeo embed |

**Layout**: Horizontal scrollable image carousel at top. Video below.

---

### 02 • 🔬 Identity
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `name_common` | Common Name | `text` | **Primary title** |
| `name_other` | Other Names | `text` | Subtitle |
| `other_names` | Aliases | `tags` | Array of strings → tag chips |
| `health_role` | Health Role | `badge` | Color-coded: `beneficial`=green, `hazardous`=red, `both`=amber, `conditional`=blue |
| `category` | Category | `badge` | e.g. "vitamins", "minerals", "heavy metals" |
| `type_label` | Type | `text` | e.g. "fat-soluble vitamin" |
| `subcategory` | Subcategory | `text` | |
| `essential_90` | Essential 90 | `badge` | Boolean → "Essential 90 ✓" or hidden |
| `slug_path` | — | *hidden* | Internal use only |
| `nutrient_key` | — | *hidden* | Internal mapping key |
| `nutrient_unit` | Unit | `text` | e.g. "mg", "mcg" |

---

### 03 • ⚗️ Chemistry
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `chemical_symbol` | Symbol | `text` | e.g. "Fe", "Zn" |
| `molecular_formula` | Formula | `text` | e.g. "C₆H₈O₆" |
| `cas_number` | CAS Number | `text` | e.g. "50-81-7" |

**Layout**: 3-column grid, compact.

---

### 04 • 📝 Summary
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `description` | Overview | `text` | Brief what-it-is summary |
| `description_simple` | Simple Description | `text` | Plain-language for users |
| `description_technical` | Technical Description | `text` | Scientific detail (collapsible) |

**Layout**: Stack vertically. `description_simple` is the primary user-facing text.

---

### 05 • ✅ Functions & Benefits
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `functions` | Functions | `tags` | Array → green tag chips |
| `health_benefits` | Benefits | `tags` | Object keys → tag chips |
| `risk_tags` | Risk Tags | `tags` | Array → red/amber tag chips. Only show if `health_role` ≠ `"beneficial"` |

**Layout**: Tag cloud / wrapped chips. Color-coded by health_role.

---

### 06 • 📊 Age Ranges & DRV ⭐ KEY SECTION
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `age_ranges` | DRV by Age | `drv_chart` | **THE main data table** |
| `daily_recommended_adult` | Adult RDA | `json_table` | Quick reference card |
| `regions_meta` | Source Authorities | `link_list` | EFSA/NIH links |

**This is the richest section.** The `age_ranges` JSON has this structure:
```json
{
  "europe": [
    {
      "age_group": "19-30y",
      "basis": "per_day",
      "male": {
        "deficiency": { "threshold": 630, "mild": { "symptoms": ["🟠 ..."] }, "severe": { "symptoms": ["🟠 ..."] } },
        "optimal": { "minimum": 570, "recommended": 900, "maximum": 3000, "benefits": ["🟢 ..."] },
        "excess": { "daily_limit": { "value": 3000, "symptoms": ["🔴 ..."] }, "acute_limit": { "value": 4500, "symptoms": ["🔴 ..."] } }
      },
      "female": {
        "deficiency": { ... },
        "optimal": { ... },
        "excess": { ... },
        "pregnancy": { "optimal": { ... }, "excess": { ... } },
        "breastfeeding": { "optimal": { ... }, "excess": { ... } }
      }
    }
  ],
  "north_america": [ ... ],
  "healthscan": [ ... ]
}
```

**Mobile UI for this section:**
1. **Region tab switcher** at top: `🇪🇺 EU` | `🇺🇸 USA` | `💚 HealthScan`
2. **Age group selector**: horizontal scroll pills (`0-6m`, `7-12m`, `1-3y`, ... `51+y`, `Pregnancy`, `Breastfeeding`)
3. **Gender toggle**: `♂ Male` | `♀ Female`
4. **Three-zone visual** for selected age+gender:
   - 🟠 **Deficiency zone**: threshold value + symptoms
   - 🟢 **Optimal zone**: min → recommended → max + benefits
   - 🔴 **Excess zone**: daily limit + acute limit + symptoms
5. **Quick adult card** from `daily_recommended_adult`:
   ```
   Adult RDA: ♂ 900 μg RAE | ♀ 700 μg RAE
   ```

---

### 07 • 🩸 Testing & Diagnostics
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `testing_or_diagnostics` | Testing Info | `rich_json` | Full testing data |

**Structure:**
```json
{
  "best_test": "Serum retinol",
  "matrix": "Blood serum",
  "why_best": "Most widely validated...",
  "optimal_range": { "low": 1.05, "high": 2.27, "unit": "μmol/L" },
  "detection_threshold": { "value": 0.35, "unit": "μmol/L" },
  "frequency": "Annually or when symptoms present",
  "methods": [
    { "name": "HPLC", "description": "...", "accuracy": "Gold standard", "cost": "$$" }
  ]
}
```

**Mobile UI:**
- **Optimal Range card**: visual bar with low/high markers and unit
- **Best Test badge**: prominent callout
- **Methods list**: expandable cards per method
- **Frequency reminder**: small info chip

---

### 08 • 🟠 Deficiency Info
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `deficiency` | Deficiency Details | `rich_json` | Causes, symptoms, treatment |

**Structure:** `{ causes, early_symptoms, moderate_symptoms, severe_symptoms, treatment }`
Only show when `health_role` ≠ `"hazardous"`.

---

### 09 • 🌱 Food Sources
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `found_in` | Found In | `tags` | Simple source tags |
| `reason` | Why Present | `text` | Explanation |
| `food_data` | Rich Food Sources | `rich_json` | Detailed sources with amounts |

**`food_data` structure:**
```json
{
  "strategy": { "animal": "Liver, eggs...", "plant": "Sweet potato, carrots..." },
  "sources": {
    "animal": [{ "name": "Beef liver", "amount_100g": 9442, "unit": "μg", "bioavailability": 0.9 }],
    "plant": [{ "name": "Sweet potato", "amount_100g": 961, "unit": "μg", "bioavailability": 0.05 }],
    "fortified": [...],
    "fermented": [...]
  },
  "bioavailability": { ... },
  "preparation_methods": { ... }
}
```

**Mobile UI:**
- **Source type tabs**: Animal | Plant | Fortified | Fermented
- **Sorted list** by `amount_100g` descending
- Each row: `[name] [amount per 100g] [bioavailability %]`
- Strategy text at top as summary card

---

### 10 • 📚 Detailed Sections
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `description_full` | Full Sections | `rich_json` | Expandable accordion |

**Keys inside `description_full`:**
- `simple` — Plain language overview
- `technical` — Scientific deep-dive
- `harmful_effects` — What happens with excess
- `what_depletes` — Factors that reduce levels
- `how_builds` — How to increase levels
- `how_lasts` — Storage & half-life
- `when_to_supplement` — Supplementation guidance
- `needed_for_absorption` — Co-factors
- `pregnancy_considerations` — Special pregnancy notes
- `summary_bullets` — Quick bullet points
- `risk_benefit_analysis` — Pros vs cons
- `therapeutic_window` — Dosage sweet spot

**Mobile UI:** Accordion — each key becomes an expandable section with its value as rich text.

---

### 11 • 🔗 Interactions
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `key_interactions` | Key Interactions | `rich_json` | Array of interaction objects |

**Structure:**
```json
[
  { "element": "Zinc", "type": "synergistic", "description": "Enhances absorption...", "reference": "https://pubmed.ncbi.nlm.nih.gov/..." },
  { "element": "Calcium", "type": "antagonistic", "description": "Competes for absorption..." }
]
```

**Mobile UI:**
- List of cards. Color-coded by `type`:
  - `synergistic` = green border
  - `antagonistic` = red border
  - `competitive` = amber border
- Each card: `[element name] [type badge] [description] [reference link]`

---

### 12 • 💊 Interventions
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `interventions` | Interventions | `rich_json` | Array of intervention objects |
| `detox_strategy` | Detox Strategy | `text` | Only for hazardous elements |
| `protective_agents` | Protective Agents | `tags` | |
| `detox_agents` | Detox Agents | `tags` | |

**`interventions` structure:**
```json
[
  {
    "title": "Retinyl Palmitate",
    "type": "supplement",
    "phase": ["deficiency", "optimal"],
    "description": "...",
    "mechanism": "...",
    "contraindications": ["Liver disease", "Pregnancy (high dose)"],
    "dosage_by_age_gender": {
      "europe": [{ "age_group": "19-30y", "male": { "amount": 900, "unit": "μg", "frequency": "daily" }, "female": { ... } }],
      "north_america": [...]
    }
  }
]
```

**Mobile UI:**
- Cards per intervention
- Type badge: `supplement`=purple, `lifestyle`=green, `herbal`=teal, `dietary`=amber
- Phase pills: `deficiency`, `optimal`, `excess`
- Expandable dosage table (reuses the region/age/gender selectors from Section 06)

---

### 13 • 📊 Scoring
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `health_score` | Health Score | `score` | 0-100 circular gauge |

**Mobile UI:** Circular progress gauge. Color: 0-30=red, 31-60=amber, 61-100=green.

---

### 14 • 📎 References & Meta
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `content_urls` | Reference URLs | `link_list` | Wikipedia, Examine, PubMed, NIH links |
| `confidence` | Data Confidence | `badge` | `verified`=green, `ai_generated`=blue, `draft`=gray, `needs_review`=amber |
| `ai_enriched_at` | Last Enriched | `text` | Timestamp |
| `created_at` | Created | `text` | |
| `updated_at` | Updated | `text` | |
| `qa_rules` | — | *hidden* | Internal QA only |

**`content_urls` structure:**
```json
{
  "wikipedia": "https://en.wikipedia.org/wiki/Vitamin_A",
  "examine": "https://examine.com/supplements/vitamin-a/",
  "pubmed": "https://pubmed.ncbi.nlm.nih.gov/?term=vitamin+a",
  "nih_factsheet": "https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/",
  "efsa": "https://www.efsa.europa.eu/..."
}
```

---

### 15 • 🎓 Content: Academic
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `scientific_references` | References | `rich_json` | Structured reference data |
| `scientific_papers` | Papers | `link_list` | ContentLink[] with title, url, votes, aiSummary |

**Mobile UI:** Card list with favicon, title, description, vote count. Tappable → opens in-app browser.

---

### 16 • 💬 Content: Social
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `social_content` | Social | `link_list` | ContentLink[] — Reddit, Twitter, YouTube, articles |

**Mobile UI:** Card list with favicon, title, description, vote count. Tappable → opens in-app browser.

---

### 17 • 📦 Content: All
| DB Column | Display | Type | Notes |
|-----------|---------|------|-------|
| `images` | Image Gallery | `link_list` | ContentLink[] — all images |
| `videos` | Video Content | `link_list` | ContentLink[] — all videos |

**Mobile UI:** Grid gallery for images, list for videos. Tappable → opens in-app browser or media viewer.

---

## 4. Admin "Fix" Button — Implementation

### When to show
```typescript
const isAdmin = user?.role === 'admin' || user?.app_metadata?.role === 'admin';
```
Only show the **Fix button** (floating action button or toolbar button) when `isAdmin === true`.

### What it does
The "Fix" button = **AI Enrich Record**. It sends the current element data to the server, which uses GPT-4o to fill any empty/missing fields with research-backed data.

### Button states
1. **Default**: `🔧 Fix` or `✨ Enrich` — cyan/purple gradient
2. **Loading**: `⏳ Enriching...` with spinner — disabled
3. **Success**: `✓ Fixed` — green, auto-dismiss after 3s
4. **Error**: `✕ Failed` — red with retry option

### API call
```typescript
const handleFixElement = async (elementId: string) => {
  setFixing(true);
  try {
    const res = await fetch(
      `https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/make-server-ed0fe4c2/admin/ai-fill-fields`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tabType: 'Elements',
          recordData: elementRecord,
          fields: ELEMENT_FIELD_DEFS, // field configs for what to fill
        }),
      }
    );
    const data = await res.json();
    if (data.success) {
      // Merge data.filledFields into local state
      setElement(prev => ({ ...prev, ...data.filledFields }));
      showToast(`Fixed ${Object.keys(data.filledFields).length} fields`);
    }
  } catch (err) {
    showToast('Fix failed — try again', 'error');
  } finally {
    setFixing(false);
  }
};
```

### Additional admin actions
For the admin toolbar, also include:
- **Import DRV** → calls `/admin/import-element-data` with `source: "all"` — generates age_ranges, interventions, testing data
- **Match to Records** → calls `/admin/ai-link-ingredients` — links element to ingredients/recipes/products that contain it

---

## 5. Section Rendering Order Summary

| # | Emoji | Section | Key Fields | Default State |
|---|-------|---------|------------|---------------|
| 01 | 🖼️ | Media | image_url, video_url | **Open** |
| 02 | 🔬 | Identity | name_common, health_role, category | **Open** |
| 03 | ⚗️ | Chemistry | chemical_symbol, molecular_formula | Collapsed |
| 04 | 📝 | Summary | description, description_simple | **Open** |
| 05 | ✅ | Functions & Benefits | functions, health_benefits, risk_tags | **Open** |
| 06 | 📊 | Age Ranges & DRV | age_ranges, daily_recommended_adult | **Open** |
| 07 | 🩸 | Testing & Diagnostics | testing_or_diagnostics | Collapsed |
| 08 | 🟠 | Deficiency Info | deficiency | Collapsed |
| 09 | 🌱 | Food Sources | found_in, food_data | Collapsed |
| 10 | 📚 | Detailed Sections | description_full | Collapsed |
| 11 | 🔗 | Interactions | key_interactions | Collapsed |
| 12 | 💊 | Interventions | interventions, detox_strategy | Collapsed |
| 13 | 📊 | Scoring | health_score | Collapsed |
| 14 | 📎 | References & Meta | content_urls, confidence | Collapsed |
| 15 | 🎓 | Content: Academic | scientific_references, scientific_papers | Collapsed |
| 16 | 💬 | Content: Social | social_content | Collapsed |
| 17 | 📦 | Content: All | images, videos | Collapsed |

---

## 6. Empty State Handling

If a field is `null`, `undefined`, `{}`, or `[]`:
- **Don't hide the section** — show it with a subtle empty state
- Show: `"No data yet"` + the admin Fix button if user is admin
- This encourages admins to enrich records from the mobile app directly
- Non-admin users see: `"Coming soon"` placeholder

---

## 7. Shared Types Location

Types are defined in: `src/types/catalog.ts`
This file is shared between mobile and web projects. Key types:
- `CatalogElement` — full element record
- `AgeRanges`, `AgeRangeEntry`, `GenderDrvBlock` — DRV structure
- `TestingOrDiagnostics` — testing section
- `Intervention`, `DosageEntry` — interventions
- `KeyInteraction` — interactions
- `FoodData`, `FoodSourceEntry` — food sources
- `ContentLink` — papers & social content
