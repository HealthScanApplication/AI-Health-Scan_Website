# Remaining supplement labels — 2026-10-16

Three of the seven remaining entries have identifiable primary-source evidence.
This repair links declared identities, not a complete molecular analysis, safety
assessment or proof of every ingredient/excipient. Existing measurements and their
units, serving sizes, sources and classifications are preserved; current label
values are recorded separately under `metadata.verified_label_20261016`.

| Catalogue product | Primary evidence | Repair |
| --- | --- | --- |
| Max Detox Blend | [R3 storefront](https://healthscan.myshopify.com/products/healthscan-max-detox), exact variant `57911295639935`, SKU `HS-MAXDETOX-60` | Five disclosed identities: psyllium husk, acai, chlorella, slippery elm bark, black walnut. No amount, extract form, plant part or undisclosed excipient inferred. |
| XbyX Energie 1 | [Manufacturer label](https://www.xbyx.ch/products/energie-veganes-proteinpulver), original 500 g variant barcode `4270000981708` | 24 explicitly quantified vitamins/minerals per 30 g plus seven other declared active identities. Micrograms stored as `ug`, not `mg`. Does not claim every protein ingredient/excipient is mapped. |
| Baja Gold 360 ml refill | [Manufacturer](https://bajagoldminerals.com/products/liquid-ocean-minerals), 12 oz refill barcode `850034199290`; [exact refill Supplement Facts](https://cdn.shopify.com/s/files/1/0749/6538/5526/files/B-LIQ-SOLE-12-SupplementFacts_Directions.png?v=1751300299) | Per label-declared 2 ml: calcium 1 mg, magnesium 3 mg, chloride 350 mg, sodium 200 mg, potassium 2 mg. No quantities inferred for marketing claims about other trace minerals. |

The remaining four cannot be tied to an exact manufacturer label:

- `activity_bj_supplement_stack`: unversioned “40+ pills” activity. A current or
  archived Bryan Johnson stack is not proof of this record's exact dated formula.
- `activity_root_supplement_stack`: grouped dosing activity with no ingredient list.
- `activity_oneill_bentonite_clay`: “bentonite OR green clay”, not a definite blend.
- `prod_generic_multivitamin`: no brand/variant/barcode; [NIH explains there is no
  standard multivitamin composition](https://ods.od.nih.gov/factsheets/MVMS-Consumer/).

No child products or corresponding activity composition records were found for
these generic entries. They remain `needs_label` with zero expected verified links;
assigning an arbitrary online formula would create false data. Supply the exact
dated stack/formula or select the actual branded product to resolve them.

## Verification

`node scripts/test-verified-supplement-labels.mjs` runs the migration twice inside
a rolled-back transaction, asserts the sourced links and units, and checks that an
existing quantity/unit/serving/source and product publication/identity survive.
`scripts/test-verified-supplement-labels.sql` provides post-apply assertions.
The public REST audit checks all supplement products and raw-element readability:
`node --import tsx scripts/audit-supplement-composition.ts`.

Target catalogue: website staging project `mofhvoudjxinvpplsytd`. The separate
production project has no supplement product records; this repair does not copy
catalogue data between environments. Expected final inventory: 135 products,
131 with declared ingredient links, four needing a definite label/formula.

Verified results: pre-repair regression failed on missing Baja Gold chloride;
enhanced rollback/reapply/preservation checks passed; applied-label SQL assertions
passed; public REST audit checked all 135 records (131 linked, four unresolved),
including raw-element readability and the picker's exact ingredient counts.
All 154 application tests and the production build passed. Independent review
found no blocking issues; its full-junction coverage suggestion was implemented.

Automated PR review identified the manufacturer's additional-nutrient panel:
taurine and CoQ10 each 50 mg per 30 g. Follow-up migration
`20261016152851` records these values separately from historical measurements,
and fills only empty measurements created by this repair. Choline bitartrate
150 mg is not assigned as 150 mg of elemental choline. The whole-catalogue
legacy assertion timed out; its expected-link check is now scoped to supplement
products, matching this repair and the complete public REST audit.
