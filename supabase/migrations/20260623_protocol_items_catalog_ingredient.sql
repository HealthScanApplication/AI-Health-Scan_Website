-- ============================================================
-- Migration: protocol_items.catalog_ingredient_id
-- Created: 2026-06-23
--
-- Adds a link from a protocol item to catalog_ingredients (whole foods, seeds,
-- herbs — which carry raw vs ground variants, e.g. "Flax Seed" / "Ground
-- Flaxseed"). Previously such items could only link a catalog_product, which is
-- wrong for a generic ingredient (a product is a specific branded SKU).
--
-- Additive, nullable. Read by the web admin Protocol Editor (catalog linker:
-- new "ingredient" kind) and the mobile app (catalog image resolver).
-- Reverse: ALTER TABLE protocol_items DROP COLUMN catalog_ingredient_id;
-- ============================================================

ALTER TABLE protocol_items ADD COLUMN IF NOT EXISTS catalog_ingredient_id TEXT;

COMMENT ON COLUMN protocol_items.catalog_ingredient_id IS 'Link to catalog_ingredients.id — whole foods / seeds / herbs (raw vs ground variants).';
