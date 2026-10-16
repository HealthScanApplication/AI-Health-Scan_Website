# Supplement composition repair — 16 October 2026

Scope: the website catalogue in staging (`mofhvoudjxinvpplsytd`), which the live website uses by default. Production project inspection found no `product_kind='supplement'` records; no unrelated production data was copied or changed.

The audit found 135 supplement products. Four had no junction records, and 76 had no links beyond generic water/metabolite placeholders. A nonzero junction count was therefore not evidence of actual composition.

## Repair boundaries

- Connect declared ingredient identities from structured supplement facts and unambiguous names to catalogue elements. Reuse canonical nutrient IDs where possible.
- Missing catalogue entries represent the exact declared ingredient identity, including botanical extracts. They are explicitly classified as supplement ingredients, not invented molecular analyses or quantified nutrients.
- Do not infer doses from generic “typical dose” text, formulas from marketing targets, excipients from another batch, or health effects from ingredient presence.
- Preserve existing quantities, serving units, serving sizes, sources, classifications, junctions and publication flags. New health classifications remain unset.
- Keep new evidence and per-product expected element IDs in auditable metadata. Existing legacy relationships remain available, but the picker counts only the declared ingredient links from this repair.
- Saved plans refresh their catalogue composition instead of retaining stale zero-link warnings.

## Manufacturer evidence

- [NOW Magnesium Glycinate](https://www.nowfoods.com/products/supplements/magnesium-glycinate-tablets): UPC 733739012890 (stored with a leading zero), 200 mg elemental magnesium per two tablets.
- [Olimp Chela-Mag B6, 60 capsules](https://olimpstore.pl/olimp-chela-mag-b6-60-capsules-568): EAN 5901330014734, 100 mg magnesium and 2.1 mg vitamin B6 per capsule.
- [NOW Propolis 1500](https://www.nowfoods.com/products/supplements/propolis-1500-capsules): UPC 733739025401 (stored with a leading zero), 300 mg propolis extract per capsule. The 1,500 mg equivalent is not the extract mass.

## Still needs an exact formula

128 products have declared ingredient identities linked. These seven are not represented as completed composition:

| Record | Required evidence |
| --- | --- |
| Morning Supplement Stack (`activity_bj_supplement_stack`) | Complete stack ingredients; the description ends with “etc.” |
| Supplement Stack (`activity_root_supplement_stack`) | An actual ingredient list |
| Bentonite / Green Clay Drink (`activity_oneill_bentonite_clay`) | Which alternative clay/formulation is intended |
| Multivitamin (`prod_generic_multivitamin`) | Individual vitamins/minerals rather than “full spectrum” |
| Max Detox Blend (`product_hs_max_detox`) | Exact supplier formula or label; similarly named blends differ |
| Energie 1 Protein Shake (`prod_us_4270000981708`) | Ingredient label for this barcode |
| Baja Gold Liquid Ocean Minerals (`trelune_baja_gold_minerals`) | Product-specific mineral composition |

Unpublished `hs_supplements` remain unpublished. Exact named nutrient keys gain links; marketing targets such as nicotine detox are not treated as ingredients.

## Verification

- `node scripts/test-supplement-composition-repair.mjs`: transaction-scoped repair, quantity/source preservation fixture, SQL assertions, rollback.
- `supabase db query --yes --linked --project-ref mofhvoudjxinvpplsytd --file scripts/test-supplement-composition.sql`: post-repair database assertions and unresolved list.
- `node --import tsx scripts/audit-supplement-composition.ts`: all published supplement products, real REST element visibility, expected junctions, duplicates, refreshed picker counts and unresolved warnings.
- `npx vitest run` and `npm run build`.

This repair links declared ingredient identities. It does not certify complete molecular composition, excipient coverage, analytical measurements, clinical safety or efficacy.
