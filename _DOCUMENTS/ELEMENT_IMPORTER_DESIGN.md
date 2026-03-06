# Element Data Importer — Design & Usage Guide

## Overview

The importer generates rich element data (age_ranges, testing, interventions, food sources, etc.) using GPT-4o with real regulatory data from **EFSA (EU)** and **NIH/IOM (USA)**.

---

## 4 Data Sources

| Source | Key | Description | Authority |
|--------|-----|-------------|-----------|
| **EU Official** | `eu` | EFSA Dietary Reference Values | European Food Safety Authority |
| **USA Official** | `usa` | NIH Dietary Reference Intakes | National Academies / IOM |
| **Health Scan** | `healthscan` | Curated blend (stricter of EU+USA) | AI Health Scan default |
| **User Custom** | user profile | Per-user overrides | User-edited |

---

## API Endpoint

```
POST /make-server-ed0fe4c2/admin/import-element-data
Authorization: Bearer <access_token>
```

### Request Body

```json
{
  "elementIds": ["uuid1", "uuid2"],
  "source": "all",           // "eu" | "usa" | "healthscan" | "all"
  "fields": [                // optional — defaults to all
    "age_ranges",
    "testing_or_diagnostics",
    "interventions",
    "key_interactions",
    "food_data",
    "content_urls",
    "regions_meta",
    "daily_recommended_adult",
    "other_names",
    "slug_path",
    "confidence"
  ]
}
```

### Response

```json
{
  "success": true,
  "source": "all",
  "processed": 2,
  "succeeded": 2,
  "failed": 0,
  "totalTokens": 24500,
  "results": [
    {
      "id": "uuid1",
      "name": "Vitamin A",
      "status": "success",
      "fieldsGenerated": 11,
      "fields": ["age_ranges", "testing_or_diagnostics", ...],
      "regions": ["europe", "north_america", "healthscan"],
      "tokens": 12000
    }
  ]
}
```

---

## How It Works

### 1. Region Selection

| `source` param | Regions generated |
|----------------|-------------------|
| `eu` | `age_ranges.europe` only |
| `usa` | `age_ranges.north_america` only |
| `healthscan` | `age_ranges.healthscan` only |
| `all` | All three regions |

### 2. Age Groups Generated

For each region, these 11 entries are created:
- `0-6m`, `7-12m`, `1-3y`, `4-8y`, `9-13y`, `14-18y`, `19-30y`, `31-50y`, `51+y`
- `pregnancy` (standalone, female only)
- `breastfeeding` (standalone, female only)

### 3. Structure Per Age Group

```
age_group entry
├── age_group: "19-30y"
├── basis: "per_day"
├── male
│   ├── deficiency
│   │   ├── threshold: 630        (≈70% of RDA)
│   │   ├── mild.symptoms: ["🟠 ...", "🟠 ..."]
│   │   └── severe.symptoms: ["🔴 ...", "🔴 ..."]
│   ├── optimal
│   │   ├── minimum: 750           (EAR)
│   │   ├── recommended: 900       (RDA)
│   │   ├── maximum: 3000          (UL)
│   │   └── benefits: ["🟢 ...", "🟢 ...", "🟢 ...", "🟢 ...", "🟢 ...", "🟢 ..."]
│   └── excess
│       ├── daily_limit: {value: 3000, symptoms: ["🔴 ...", "🔴 ..."]}
│       └── acute_limit: {value: 4500, symptoms: ["🔴 ...", "🔴 ..."]}
└── female
    ├── deficiency: (same structure)
    ├── optimal: (same structure, different values)
    ├── excess: (same structure)
    ├── pregnancy (for ages 14-18y, 19-30y, 31-50y)
    │   ├── optimal: {minimum, recommended, maximum, benefits}
    │   └── excess: {daily_limit, acute_limit}
    └── breastfeeding (for ages 14-18y, 19-30y, 31-50y)
        ├── optimal: {minimum, recommended, maximum, benefits}
        └── excess: {daily_limit, acute_limit}
```

### 4. Value Mapping Rules

| Field | Source |
|-------|--------|
| `deficiency.threshold` | ≈70% of RDA (clinical deficiency cutoff) |
| `optimal.minimum` | EAR (Estimated Average Requirement) |
| `optimal.recommended` | RDA or AI (Adequate Intake) |
| `optimal.maximum` | UL (Tolerable Upper Intake Level) |
| `excess.daily_limit.value` | UL |
| `excess.acute_limit.value` | ≈1.5× UL |

### 5. Merge Behavior

When importing a single region (e.g. `source: "eu"`), the importer **preserves existing data** in other regions. It merges:
```
existing age_ranges = { north_america: [...] }
+ imported age_ranges = { europe: [...] }
= final age_ranges = { europe: [...], north_america: [...] }
```

---

## Mobile UI Mapping

From the screenshots, the mobile app renders:

### Deficient / Optimal / Excess Card (Image 1 & 2)
```
EU > Female > 18-35 > Normal
┌─────────────┬──────────────────┬─────────────┐
│  Deficient   │     Optimal      │   Excess    │
│  0.34        │  0.35 to 1.75    │   2.10      │
│  mg/day      │  mg/day          │   mg/day    │
└─────────────┴──────────────────┴─────────────┘
```

Maps to `age_ranges.europe[age_group="19-30y"].female`:
- Deficient: `deficiency.threshold` → 0.34 mg/day
- Optimal: `optimal.minimum` to `optimal.maximum` → 0.35 to 1.75 mg/day
- Excess: `excess.daily_limit.value` → 2.10 mg/day

### Symptoms Panel (Image 2)
- Left column (deficiency): `deficiency.mild.symptoms` + `deficiency.severe.symptoms`
- Right column (excess): `excess.daily_limit.symptoms` + `excess.acute_limit.symptoms`

### When to Supplement (Image 3)
- "If Deficient" dosage: `interventions[0].dosage_by_age_gender.europe[age_group].female.amount`
- "If Pregnant" dosage: `interventions[0].dosage_by_age_gender.europe[age_group].pregnancy.amount`
- Age range grid: map `interventions[0].dosage_by_age_gender` entries to columns

---

## Fields Generated

| Field | Type | Description |
|-------|------|-------------|
| `age_ranges` | JSONB | EU + USA + HealthScan DRV data by age × gender |
| `daily_recommended_adult` | JSONB | Quick reference: `{male: {value, unit}, female: {value, unit}}` |
| `regions_meta` | JSONB | Authority names and reference URLs per region |
| `testing_or_diagnostics` | JSONB | Blood test info, optimal ranges, methods |
| `interventions` | JSONB | 2-4 interventions with dosage_by_age_gender |
| `key_interactions` | JSONB | 3-6 synergistic/antagonistic interactions with PubMed refs |
| `food_data` | JSONB | Rich food sources with USDA amounts, bioavailability |
| `content_urls` | JSONB | Wikipedia, Examine, PubMed, NIH reference URLs |
| `other_names` | JSONB | Array of alternative names |
| `slug_path` | TEXT | URL-friendly snake_case identifier |
| `confidence` | TEXT | "ai_generated" (set by importer) |

---

## User Custom Overrides

For user-specific customization:
1. User selects a base (EU, USA, or HealthScan)
2. User can edit any value in their profile
3. Overrides are stored per-user (future: `user_element_overrides` table)
4. Mobile app checks user overrides first, falls back to selected region's official data

---

## SQL Migration

Run `supabase/migrations/20260304_add_element_age_ranges_and_meta.sql` to add all new columns.

---

## Admin UI Usage

In the admin panel, under the **Elements** tab:
1. Select elements to import
2. Click "Import Element Data" button
3. Choose source: EU, USA, HealthScan, or All
4. Choose fields to generate (or generate all)
5. Review results

The admin can also manually edit any field in the "Age Ranges & DRV" section.

---

## Cost Estimate

Per element with `source: "all"`:
- ~12,000-16,000 tokens (GPT-4o)
- ~$0.08-0.12 per element
- For 100 elements: ~$8-12

Per element with single region:
- ~6,000-8,000 tokens
- ~$0.04-0.06 per element
