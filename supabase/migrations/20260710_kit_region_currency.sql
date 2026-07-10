-- ============================================================
-- Migration: per-region kit currency + FX rates
-- Created: 2026-07-10 (apply to BOTH envs)
--
-- Kit region rows were cloned from US with the same USD number, so the admin
-- matrix showed 42 / 42 / 42 / 42 across US/EU/UK/AU. Make region prices real:
--   * protocol_kit_items.currency / protocol_kits.currency (by market:
--     US→USD, EU→EUR, UK→GBP, AU→AUD)
--   * fx_rates — one row per currency, usd_per_unit, admin-editable; the
--     admin UI uses it to convert local sell prices to USD for margin math
--     (margin_pct GENERATED column stays correct for USD rows only).
--   * one-time backfill: non-US item prices that still EXACTLY match their
--     US sibling (same kit slug + title) are converted to local currency at
--     indicative rates with retail rounding (ceil − 0.01 → x.99). Hand-set
--     regional prices (none today) are left alone.
--
-- Mobile note: ProtocolKitButton renders price_usd with a hardcoded "$" —
-- fine for US (the only live market today); EU/UK/AU need a symbol-by-market
-- tweak in the app before those kits go live.
-- ============================================================

create table if not exists public.fx_rates (
  currency char(3) primary key,
  usd_per_unit numeric not null check (usd_per_unit > 0),
  updated_at timestamptz not null default now()
);

insert into public.fx_rates (currency, usd_per_unit) values
  ('USD', 1.00), ('EUR', 1.09), ('GBP', 1.27), ('AUD', 0.66)
on conflict (currency) do nothing;

alter table public.fx_rates enable row level security;
drop policy if exists fx_rates_read on public.fx_rates;
create policy fx_rates_read on public.fx_rates for select using (true);
drop policy if exists fx_rates_write on public.fx_rates;
create policy fx_rates_write on public.fx_rates for all
  using (public.is_healthscan_admin()) with check (public.is_healthscan_admin());
-- RLS alone doesn't grant DML (the 20260710 kit-grants lesson)
grant select on public.fx_rates to anon, authenticated;
grant insert, update, delete on public.fx_rates to authenticated;

alter table public.protocol_kit_items add column if not exists currency char(3) not null default 'USD';
alter table public.protocol_kits add column if not exists currency char(3) not null default 'USD';

update public.protocol_kit_items set currency = case market
  when 'EU' then 'EUR' when 'UK' then 'GBP' when 'AU' then 'AUD' else 'USD' end
where currency = 'USD';
update public.protocol_kits set currency = case market
  when 'EU' then 'EUR' when 'UK' then 'GBP' when 'AU' then 'AUD' else 'USD' end
where currency = 'USD';

-- one-time price backfill: only rows still identical to their US sibling
with us as (
  select slug, title, price_usd from public.protocol_kit_items where market = 'US'
), fx as (
  select 'EU' as market, 0.92::numeric as rate union all
  select 'UK', 0.79 union all
  select 'AU', 1.52
)
update public.protocol_kit_items i
set price_usd = ceil(i.price_usd * fx.rate) - 0.01
from us, fx
where i.market = fx.market
  and i.market <> 'US'
  and i.slug = us.slug
  and i.title is not distinct from us.title
  and i.price_usd is not null
  and i.price_usd = us.price_usd;

-- same for the kit-level bundle price, when set
with us as (
  select slug, price_usd from public.protocol_kits where market = 'US'
), fx as (
  select 'EU' as market, 0.92::numeric as rate union all
  select 'UK', 0.79 union all
  select 'AU', 1.52
)
update public.protocol_kits k
set price_usd = ceil(k.price_usd * fx.rate) - 0.01
from us, fx
where k.market = fx.market
  and k.market <> 'US'
  and k.slug = us.slug
  and k.price_usd is not null
  and k.price_usd = us.price_usd;
