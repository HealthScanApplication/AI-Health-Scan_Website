# Drink picker and plain-water repair

The drink picker now queries published, non-group Drink/Beverage recipes before
the result limit. Private recipes use their explicit drink meal type. Result
rendering and selection both reject non-drinks; owner/private access is unchanged.

Data repair is restricted to four audited catalog IDs in staging and production:

- `recipe_water`: remains a group; removes invalid formula links and nutrition.
- `recipe_spring_water`: one 1000g spring-water ingredient, two 500g servings.
- `recipe_purified_water`: one 1000g purified-water ingredient, eight 125g servings.
- `recipe_water_minimum`: plain water with unspecified amount; removes psyllium
  and invented serving mass. Energy-bearing macros are zero; minerals/mass unknown.

Existing reference-water ingredient data is retained. Missing production water
ingredients receive only justified zero macros, with provenance; no mineral or
contaminant absence is invented. Recipe hazard values already labelled as lacking
ingredient evidence are removed, not changed to measured zero. Source-backed
ingredient assessments remain available. Other waters/drinks are not blanket-zeroed.

Before-data snapshots are in `docs/audits/`. They contain public catalog data, not
user records. Restore only the affected fields/links from the matching environment
snapshot if needed; do not overwrite an entire row over later legitimate edits.

Verification: `npm test`, `npm run build`, and
`supabase db query --linked --project-ref <ref> --file scripts/verify-plain-water.sql`.
The SQL assertions failed on the original data before repair. Real catalog search
also verifies the PostgREST drink/non-group filters work against staging.

The production frontend live-payment release hold remains unchanged, and the
production `ALLOW_LIVE_PAYMENTS` digest still matches `false`. No payments or
Stripe configuration changes are part of this work.
