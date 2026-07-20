-- ============================================================
-- Migration: kit-item supplier pipeline (DEV — apply to BOTH envs)
-- Created: 2026-07-13
--
-- protocol_kit_items gains two links needed to actually run a white-label
-- dropship SKU through a supplier (Supliful US / Suplify EU / UK domestic):
--   label_url     the print-ready product label design (a Canva share/
--                 download link, or a hosted PDF) — required by the
--                 supplier before the SKU can go live for fulfilment.
--   supplier_url  the supplier's own catalog/product page for this SKU
--                 (e.g. the Suplify catalog entry) — distinct from
--                 affiliate_url, which is the CUSTOMER-facing buy link.
-- ============================================================

alter table public.protocol_kit_items
  add column if not exists label_url text,
  add column if not exists supplier_url text;
