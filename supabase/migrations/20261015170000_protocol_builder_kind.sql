-- Guardian Diet / Fitness builders + combined personal Protocols.
-- Items stay generic protocol_items; only the builder's own settings live on the protocol.
-- `protocols` is a security_invoker view over catalog_protocols, so the columns go on the table
-- and the view is re-created with them appended (existing columns unchanged, same order).
alter table public.catalog_protocols
  add column if not exists builder_kind text check (builder_kind in ('diet', 'fitness', 'personal')),
  add column if not exists builder_config jsonb,
  add column if not exists source_protocol_ids uuid[];

comment on column public.catalog_protocols.builder_kind is 'Which Guardian builder owns this protocol: diet | fitness | personal (combined). Null = plain protocol.';
comment on column public.catalog_protocols.builder_config is 'Builder settings: diet framework + kcal/macro targets + weekly plan, or fitness goal/level + weekly sessions, or the combined person.';
comment on column public.catalog_protocols.source_protocol_ids is 'For builder_kind = personal: the protocols whose items were combined into this one.';

create or replace view public.protocols with (security_invoker = true) as
select id, user_id, name, description, type, is_suggested, is_active, frequency, frequency_days, cloned_from, tags, image_url,
  source_attribution, sort_order, created_at, updated_at, target_gender, target_age_min, target_age_max, health_score, start_time,
  is_enabled, total_days, risk_level, effectiveness_evidence, contraindications, prerequisites, creator, category, source, is_public,
  image_prompt, nutrition_cycle_days, fitness_cycle_days, phases, scaffold_profile, is_personal_routine, profile_id,
  builder_kind, builder_config, source_protocol_ids
from public.catalog_protocols;

notify pgrst, 'reload schema';
