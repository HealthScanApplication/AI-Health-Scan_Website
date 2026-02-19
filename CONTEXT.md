# AI Health Scan — Website & Admin Panel Context

## What this project is
- **Next.js / Vite React** web app deployed at `https://healthscan.live`
- Contains a **public-facing website** and a **full admin panel** (`/admin` route)
- Backend is a **Supabase Edge Function** (`make-server-ed0fe4c2`) acting as a REST API

---

## Tech Stack
- **Frontend**: React + TypeScript + Vite, TailwindCSS, shadcn/ui
- **Backend**: Supabase Edge Function (Deno/Hono) at `supabase/functions/make-server-ed0fe4c2/index.tsx`
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage (`catalog-media` bucket)
- **Auth**: Supabase Auth (JWT tokens)
- **KV Store**: Custom KV layer in edge function (for waitlist, products)
- **Deployed**: Netlify (frontend) + Supabase (edge function)

---

## Supabase Project
- **Project ref**: `mofhvoudjxinvpplsytd`
- **URL**: `https://mofhvoudjxinvpplsytd.supabase.co`
- **Edge function base URL**: `https://mofhvoudjxinvpplsytd.supabase.co/functions/v1/make-server-ed0fe4c2`

---

## Database Tables

### `catalog_elements`
Health elements (vitamins, minerals, toxins, etc.)
```
id, slug, name_common, name_other, category, type_label, subcategory,
health_role (beneficial|hazardous|both|conditional),
essential_90, chemical_symbol, molecular_formula, cas_number,
description, description_simple, description_technical, description_full,
functions (array), health_benefits (json), risk_tags (array),
thresholds (json), deficiency_ranges (json), excess_ranges (json),
drv_by_population (json),
found_in (array), food_sources_detailed (json), food_strategy (json), reason,
deficiency (json), interactions (json), detox_strategy,
health_score (0-100), scientific_references (json), info_sections (json),
image_url, image_url_raw, image_url_powdered, image_url_cut, video_url,
scientific_papers (jsonb array of ContentLink), social_content (jsonb array of ContentLink),
ai_enriched_at, ai_enrichment_version, created_at, updated_at
```

### `catalog_ingredients`
Food ingredients with processing info and nutrition data
```
id, name_common, name_other, name_scientific, category, category_sub,
processing_type, processing_methods, raw_ingredients, description_processing,
description_simple, description_technical, health_benefits, taste_profile (json),
elements_beneficial (json), elements_hazardous (json), health_score,
scientific_references, origin_country, origin_region, origin_city, culinary_history,
image_url, image_url_raw, image_url_powdered, image_url_cut, video_url,
scientific_papers (jsonb), social_content (jsonb),
created_at, updated_at
```

### `catalog_recipes`
Recipes with ingredients, instructions, nutrition
```
id, name_common, category, category_sub, meal_slot, cuisine, language,
prep_time, cook_time, servings, difficulty, instructions (array),
linked_ingredients (json), ingredients (json),
description, description_simple, description_technical,
health_benefits, taste_profile, flavor_profile, texture_profile,
elements_beneficial (json), elements_hazardous (json),
nutrition_per_100g (json), nutrition_per_serving (json),
health_score, scientific_references,
image_url, image_url_raw, image_url_plated, image_url_closeup, video_url,
scientific_papers (jsonb), social_content (jsonb),
created_at, updated_at
```

### `catalog_products` (KV store)
Scanned/imported food products
```
id, name_common, name, brand, category, barcode,
ingredients_text, allergen_info, serving_size, serving_unit,
description, description_simple, health_score,
nutrition_per_100g (json), nutrition_facts (json),
elements_beneficial, elements_hazardous,
scientific_papers (jsonb), social_content (jsonb),
image_url, image_url_raw, video_url,
created_at, updated_at
```

---

## ContentLink Type (used in scientific_papers / social_content)
```typescript
type ContentLink = {
  id: string;
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  isPdf: boolean;
  votes: number;
  addedAt: string;
  contentType?: 'paper' | 'book' | 'social' | 'article';
  abstract?: string;
  aiSummary?: string;
}
```

---

## Key API Endpoints (Edge Function)

### Public
- `GET /admin/waitlist` — get waitlist users
- `POST /waitlist/join` — join waitlist

### Admin (requires Bearer token)
- `GET /admin/catalog/:table` — list records (via Supabase REST directly)
- `POST /admin/catalog/update` — update a record `{ table, id, updates }`
- `POST /admin/catalog/insert` — create a record `{ table, record }`
- `POST /admin/catalog/delete` — delete a record `{ table, id }`
- `POST /admin/upload-file` — upload image/video to Supabase Storage
- `POST /admin/url-metadata` — fetch OG metadata for a URL `{ url }`
- `POST /admin/parse-content-links` — AI parse bulk text into ContentLink array `{ text, context }`
- `POST /admin/summarise-content-link` — AI plain-language summary `{ title, description, abstract, url, recordContext }`
- `POST /admin/ai-fill-fields` — AI fill empty fields for a record `{ tabType, recordData, fields, sampleRecords, context }`
- `POST /admin/ai-create-record` — AI generate a full new record `{ table, tabType, fields, sampleRecords, prompt }`

### Mobile App Endpoints (used by React Native)
- `POST /scan/analyze` — analyze a food scan (image/barcode)
- `GET /elements/:slug` — get element detail
- `GET /ingredients/:id` — get ingredient detail
- `GET /recipes` — list recipes
- `GET /recipes/:id` — get recipe detail
- `POST /waitlist/join` — join waitlist

---

## Auth Flow
- Users authenticate via **Supabase Auth** (email/password or magic link)
- JWT access token stored client-side, sent as `Authorization: Bearer <token>`
- Admin panel validates token server-side via `supabase.auth.getUser(token)`
- Admin users are identified by email domain or a specific admin email list

---

## Shared Data Contracts with React Native App
The React Native app consumes the same Supabase database and edge function endpoints.

Key shared types:
- `ContentLink` — content references attached to elements/ingredients/recipes
- `catalog_elements` schema — displayed in the mobile element detail screen
- `catalog_ingredients` schema — displayed in ingredient detail
- `catalog_recipes` schema — displayed in recipe detail
- `health_score` (0-100) — displayed as a score badge in mobile
- `elements_beneficial` / `elements_hazardous` — nutrition editor format used in scan results

---

## Screenshot Service
- URL screenshots: `https://image.thum.io/get/width/600/crop/400/{url}`
- No API key required

---

## Deployment
- **Frontend**: `netlify deploy --prod --dir=build`
- **Edge function**: `supabase functions deploy make-server-ed0fe4c2 --project-ref mofhvoudjxinvpplsytd --workdir /path/to/project --no-verify-jwt`
- **DB migrations**: `supabase db push --workdir /path/to/project`
