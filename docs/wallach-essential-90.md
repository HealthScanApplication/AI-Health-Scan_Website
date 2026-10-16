# Wallach historical core90 collection

This collection records Dr. Joel Wallach/Youngevity's historical list. It is **not** a scientific classification of human essential nutrients, an endorsement of its health claims, a supplement recommendation or a list of safe intake goals.

## Sources and the 90/91 discrepancy

- [Youngevity Healthy Body Start Pak2.0 brochure](https://youngevityrc.com/wp-content/uploads/HBSP-2pt0_trifold-brochure4-0715-4review.pdf) establishes the branded90 framework and describes an Omega3/6/9 product blend.
- [Published Youngevity distributor item list](https://youngevityproducts.co.uk/pages/the-90-nutrients) enumerates60 minerals,16 vitamins,12 amino acids and “2–3” fatty acids, listing Omega3,6 and9.

The itemized three-fatty-acid variant totals91, not90. This app explicitly uses the **60+16+12+2 core90** interpretation, counting Omega3 and Omega6. Omega9 remains available as a related nutrient outside the core count. It does not silently drop another nutrient, count a duplicate, or claim every published version agrees.

`src/config/wallachEssential90.json` is the versioned identity manifest. Silica is not silently substituted with elemental silicon. VitaminK2 is not counted again as vitaminK; EPA/DHA/ALA are not additional entries beside the Omega3 group. Protein, fibre, water, additives, pathogens, miscellaneous phytonutrients and unsupported extras are not core90 members. Core15 and Extended30 remain the app's existing convenience subsets, not lists attributed to Wallach.

## Data and safety boundaries

- One catalog element identity per manifest entry; membership never follows name substrings, a chemical form or a shared nutrient key.
- `essential_90` and `raw_data.wallach90_membership` describe historical membership only. Existing `category`, `is_beneficial`, risk tags, hazard records and measurements are unchanged, even for members such as arsenic and beryllium.
- Missing identities are created as `Historical reference`, without measurements, intake targets or a beneficial status. These must not be mistaken for populated nutrition records.
- The repair retains each affected row's previous flag under `raw_data.wallach90_repair`. No element rows are deleted or merged, so junction references remain valid.
- No established app reference: no percentage target, no gap-filling instruction and no “boost” option. A placeholder database value is never promoted into an intake target. Other measured nutrition/hazards remain visible outside the core count.
- Missing catalogue records use an explicitly unlinked manifest fallback, preserving90 membership without fabricating measurement coverage. The UI reports how many identities were loaded from the catalogue.

## Verification

`node scripts/audit-wallach-essential-90.mjs` runs a read-only database audit of exact membership, canonical mappings, source groups and retained hazard classification. The repair migration validates60/16/12/2 and compares snapshots of every pre-existing element, rolling back if any unrelated field changes. Unit tests exercise offline/live group membership, duplicates, safety-aware gap/boost exclusion and unit conversion.

The website's configured database is `mofhvoudjxinvpplsytd`. Do not apply this catalog repair to an unrelated/empty production project merely because its name says production.
