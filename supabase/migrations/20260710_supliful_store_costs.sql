-- ============================================================
-- Migration: Supliful per-unit costs for HS store-lane kit items
-- Created: 2026-07-10 (applied to BOTH envs — 102 rows each)
--
-- Cost = Supliful STARTER/free-plan per-unit price (conservative; paid plans
-- and bulk prepay go lower — see docs/supliful-costs.md for the low..high
-- range + source URL per product). Costs are USD (Supliful bills USD); the
-- admin matrix converts region-local sell prices to USD via fx_rates for a
-- correct margin (the GENERATED margin_pct column is only right for US rows).
-- Supplier left as-is where already set, else 'Supliful'. 5 SKUs (Glycine,
-- L-Theanine, Oregano Oil, Sea Kelp Iodine, Spirulina) are NOT in Supliful's
-- catalog — left uncosted.
-- ============================================================


with src(title, cost) as (values
('HS • Berberine HCl — 60 Capsules', 9.35),
('HS • Brightening Glow Serum — 30ml', 14.19),
('HS • Ceramide Barrier Cream — 50ml', 12.75),
('HS • Collagen Peptides — 280g', 18.99),
('HS • Colostrum Powder — 30 Servings', 11.6),
('HS • Complete Multivitamin — 60 Capsules', 10.19),
('HS • CoQ10 200mg — 30 Capsules', 11.85),
('HS • Digestive Enzymes — 60 Capsules', 10.79),
('HS • Electrolyte Powder', 13.55),
('HS • Gentle Cleansing Balm — 100ml', 13.95),
('HS • Gua Sha Facial Oil — 30ml', 7.39),
('HS • Hyaluronic Acid Serum — 30ml', 8.19),
('HS • Hydrating Essence Toner — 150ml', 14.75),
('HS • Hydrating Setting Mist — 177ml', 14.75),
('HS • Low-pH Gel Cleanser — 150ml', 13.95),
('HS • Magnesium Glycinate — 90 Capsules', 11.65),
('HS • Max Detox Blend • 60 Capsules', 9.85),
('HS • NMN 500mg — 30 Capsules', 10.65),
('HS • Organic Ashwagandha — 60 Capsules', 7.59),
('HS • Probiotics — 30 Capsules', 8.75),
('HS • Sleep Support — 60 Capsules', 9.19)
)
update public.protocol_kit_items i
set supplier_cost_usd = src.cost,
    supplier = coalesce(nullif(i.supplier, ''), 'Supliful')
from src
where i.title = src.title and i.lane = 'store'
returning i.slug, i.market, i.title, i.supplier_cost_usd;
