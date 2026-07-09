-- ============================================================
-- Migration: kit-item economics (DEV — apply to BOTH envs)
-- Created: 2026-07-10
--
-- protocol_kit_items gains the supplier/margin economics the hs_* tables
-- already carry (hs_supplements/hs_products convention: retail_price,
-- estimated_cost, margin_pct, supplier). Here the sell price already exists
-- as price_usd, so:
--   supplier_cost_usd  what we pay the supplier per unit (store lane)
--   supplier           who supplies/fulfils it (e.g. 'Tre Lune', 'Momentous')
--   commission_pct     affiliate commission we EARN on non-HealthScan items
--                      (affiliate lane; e.g. Amazon ~3%, partner deals vary)
--   margin_pct         GENERATED (not stored by hand, unlike hs_*): gross
--                      margin of sell vs cost — recomputes automatically when
--                      either input changes, admin UI treats it as read-only.
-- ============================================================

alter table public.protocol_kit_items
  add column if not exists supplier_cost_usd numeric,
  add column if not exists supplier text,
  add column if not exists commission_pct numeric;

-- generated column added separately (ADD COLUMN ... GENERATED can't be IF NOT EXISTS-merged
-- with a later redefinition; drop-and-add keeps re-runs idempotent)
alter table public.protocol_kit_items drop column if exists margin_pct;
alter table public.protocol_kit_items
  add column margin_pct numeric generated always as (
    case
      when price_usd is not null and price_usd > 0 and supplier_cost_usd is not null
      then round(((price_usd - supplier_cost_usd) / price_usd) * 100.0, 1)
      else null
    end
  ) stored;
