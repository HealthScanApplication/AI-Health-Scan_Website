# Supliful store-lane costs (HS SKUs)

*Researched 2026-07-10 by a 47-agent fan-out over supliful.com catalog pages (find + adversarial verify). Costs are per-unit USD read from each product page's embedded pricing / schema.org AggregateOffer.*

**How Supliful pricing tiers work:** `high` = free/Starter-plan cost (what you pay day one, no commitment). `low` = cheapest published tier (Pro/Enterprise plan or bulk prepay). We stored **`high`** as `supplier_cost_usd` — conservative; real margins improve on paid plans. `verified` = a second agent refetched the page and confirmed the numbers.

| Product | HS sell (US) | cost hi (stored) | cost lo | margin @ hi | size | verified | Supliful page |
|---|---|---|---|---|---|---|---|
| HS • Berberine HCl — 60 Capsules | $28.99 | $9.35 | $4.16 | 68% | exact |  | https://supliful.com/catalog/berberine-capsules |
| HS • Brightening Glow Serum — 30ml | $34 | $14.19 | $5.83 | 58% | exact |  | https://supliful.com/catalog/vitamin-glow-serum |
| HS • Ceramide Barrier Cream — 50ml | $28 | $12.75 | $4.82 | 54% | exact |  | https://supliful.com/catalog/anti-aging-moisturizer |
| HS • CoQ10 200mg — 30 Capsules | $36 | $11.85 | $5.69 | 67% | exact | ✓ | https://supliful.com/catalog/coq10-ubiquinone-capsules |
| HS • Collagen Peptides — 280g | $42 | $18.99 | $11.66 | 55% | exact | ✓ | https://supliful.com/catalog/grass-fed-hydrolyzed-collagen-peptides-powder |
| HS • Colostrum Powder — 30 Servings | $34.99 | $11.6 | $6.72 | 67% | exact | ✓ | https://supliful.com/catalog/colostrum-powder |
| HS • Complete Multivitamin — 60 Capsules | $34 | $10.19 | $4.06 | 70% | exact | ✓ | https://supliful.com/catalog/complete-multivitamin-capsules |
| HS • Digestive Enzymes — 60 Capsules | $25.99 | $10.79 | $3.36 | 58% | exact |  | https://supliful.com/catalog/digestive-enzyme-pro-blend-capsules |
| HS • Electrolyte Powder | $29.99 | $13.55 | $7.21 | 55% | closest |  | https://supliful.com/catalog/hydration-powder-lemonade |
| HS • Gentle Cleansing Balm — 100ml | $22 | $13.95 | $4.84 | 37% | closest | ✓ | https://supliful.com/catalog/EVL0GCGE |
| HS • Gua Sha Facial Oil — 30ml | $20 | $7.39 | $4.18 | 63% | exact | ✓ | https://supliful.com/catalog/gua-sha-face-oil |
| HS • Hyaluronic Acid Serum — 30ml | $26 | $8.19 | $2.4 | 68% | exact |  | https://supliful.com/catalog/hyaluronic-acid-serum |
| HS • Hydrating Essence Toner — 150ml | $24 | $14.75 | $4.79 | 39% | closest |  | https://supliful.com/catalog/gentle-balancing-toner |
| HS • Hydrating Setting Mist — 177ml | $24 | $14.75 | $4.79 | 39% | exact |  | https://supliful.com/catalog/gentle-balancing-toner |
| HS • Low-pH Gel Cleanser — 150ml | $18 | $13.95 | $4.84 | 23% | closest | ✓ | https://supliful.com/catalog/gentle-cleansing-gel |
| HS • Magnesium Glycinate — 90 Capsules | $24.95 | $11.65 | $5.23 | 53% | exact | ✓ | https://supliful.com/catalog/magnesium-glycinate-capsules |
| HS • Max Detox Blend • 60 Capsules | $29 | $9.85 | $3.82 | 66% | exact | ✓ | https://supliful.com/catalog/max-detox-acai-capsules |
| HS • NMN 500mg — 30 Capsules | $44 | $10.65 | $4.86 | 76% | exact | ✓ | https://supliful.com/catalog/nmn-capsules |
| HS • Organic Ashwagandha — 60 Capsules | $26 | $7.59 | $3.76 | 71% | exact |  | https://supliful.com/catalog/ashwagandha-capsules |
| HS • Probiotics — 30 Capsules | $31.99 | $8.75 | $4.01 | 73% | exact |  | https://supliful.com/catalog/probiotic-20-billion-cfu-capsules |
| HS • Sleep Support — 60 Capsules | $19.99 | $9.19 | $3.8 | 54% | exact | ✓ | https://supliful.com/catalog/sleep-support-capsules |
| HS • Glycine — 250g Powder | $18.99 | — | — | — | — | — | **not in catalog** |
| HS • L-Theanine — 60 Capsules | $21.99 | — | — | — | — | — | **not in catalog** |
| HS • Oregano Oil — 60 Softgels | $21.99 | — | — | — | — | — | **not in catalog** |
| HS • Sea Kelp Iodine — 60 Capsules | $17.99 | — | — | — | — | — | **not in catalog** |
| HS • Spirulina | $27.99 | — | — | — | — | — | **not in catalog** |

## Not on Supliful (need another supplier or stay affiliate)
Glycine, L-Theanine, Oregano Oil, Sea Kelp Iodine, Spirulina — Supliful carries no standalone SKU (only blends). Matches the fulfilment strategy note: no standalone L-theanine/glycine in their catalog.

## Caveats
- Skincare & some others are **closest-match** (Supliful has no exact 'Ceramide Barrier Cream' etc.) — see the `size` column and the workflow notes; confirm the SKU before committing.
- Prices sit behind a 'View price' login gate; agents read the page's embedded JSON / schema.org offers. Re-verify against your logged-in Supliful account before finalizing COGS.
- Non-US kit rows: DB `margin_pct` mixes currencies and is wrong; the admin UI's margin chip is fx-correct.
