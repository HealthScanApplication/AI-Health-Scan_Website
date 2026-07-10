-- ============================================================
-- Migration: merge hs_products → catalog_products, then retire hs_products
-- Created: 2026-07-10 (apply to BOTH envs)
--
-- hs_products was an orphan: 9 unpublished, unsourced device stubs (air/water/
-- monitoring gadgets), 0 rows in prod, read by nothing, only a dangling FK from
-- the empty element_products. The real products table is catalog_products (what
-- the scanner + protocols + kits link to via catalog_product_id). Migrate the 9
-- devices in as real catalog rows (so they can be put in kits), then drop the
-- table. Amazon-sourced → their buy_url becomes purchase_url + affiliate_link_amazon
-- (affiliate lane). Prod inserts 0 (empty); the devices reach prod via the mirror.
-- ============================================================

insert into public.catalog_products
  (id, barcode, name_common, name, slug, category, description, price_usd, purchase_url, affiliate_link_amazon, created_at, updated_at)
select
  'product_hs_' || s.slug,
  'HS-' || trim(both '-' from upper(regexp_replace(h.name, '[^A-Za-z0-9]+', '-', 'g'))),
  h.name, h.name, s.slug, h.category,
  to_jsonb(h.description),
  h.retail_price::numeric,
  h.buy_url,
  case when lower(coalesce(h.supplier, '')) = 'amazon' then h.buy_url else null end,
  now(), now()
from public.hs_products h
cross join lateral (
  select trim(both '_' from regexp_replace(lower(h.name), '[^a-z0-9]+', '_', 'g')) as slug
) s
on conflict (id) do nothing;

-- retire the orphan table (element_products is empty; drop its dangling FK first)
alter table if exists public.element_products drop constraint if exists element_products_product_id_fkey;
drop table if exists public.hs_products cascade;
