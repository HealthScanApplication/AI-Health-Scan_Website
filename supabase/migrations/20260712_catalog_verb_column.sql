-- DEV-491 — Catalog record editor: Type / Category / Verb.
--
-- A catalog record can act as an activity inside a protocol step (e.g. an oil
-- cleanser is "Apply Oil Cleanser", cayenne water is "Drink Cayenne in Warm
-- Water"). The action verb is how the item reads when it becomes a step. It has
-- no home on the catalog tables yet — until now the verb only existed prepended
-- into protocol_items.display_name. Give the catalog record a default action
-- verb so the product modal can set it and protocol steps can inherit it.
--
-- Type already has a home: catalog_products.product_kind and
-- catalog_activities.type both already exist. Only the verb is new.
--
-- Additive, nullable — safe to run on prod (already applied to both envs via the
-- Management API on 2026-07-12; this file is the record of record).

alter table public.catalog_products   add column if not exists verb text;
alter table public.catalog_activities  add column if not exists verb text;

comment on column public.catalog_products.verb  is 'Default action verb when this record is used as a protocol step (Apply/Take/Drink/Eat/…). Set in the admin catalog editor. See DEV-491.';
comment on column public.catalog_activities.verb is 'Default action verb when this record is used as a protocol step (Apply/Take/Drink/Eat/…). Set in the admin catalog editor. See DEV-491.';
