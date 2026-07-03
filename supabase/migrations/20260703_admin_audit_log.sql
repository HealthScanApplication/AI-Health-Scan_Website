-- ============================================================
-- Migration: admin audit trail (DEV — apply to BOTH staging and production)
-- Created: 2026-07-03
--
-- 1) admin_audit_log — row-level change log (who / when / what changed) on the
--    human-edited content tables: catalog parents, hs_*, protocols. Junction
--    tables are intentionally NOT row-audited (bulk sync noise) — bulk ops are
--    recorded in sync_runs instead.
-- 2) sync_runs — one row per mirror/push/pull/merge run (incl. dry runs),
--    written by the admin edge function.
--
-- Actor resolution: the editor's JWT email for direct PostgREST writes; the
-- x-admin-email request header for service-role writes from the edge function
-- (it forwards the admin's email); falls back to the DB role name.
-- ============================================================

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text,
  action text not null,               -- INSERT | UPDATE | DELETE
  table_name text not null,
  record_id text,
  changed jsonb,                      -- UPDATE: {col:[old,new]} · INSERT: new row · DELETE: {id,name…}
  source text                         -- 'rest' (default) | x-sync-source header ('mirror','merge',…)
);
create index if not exists admin_audit_log_rec_idx on public.admin_audit_log (table_name, record_id);
create index if not exists admin_audit_log_at_idx on public.admin_audit_log (at desc);
alter table public.admin_audit_log enable row level security;
drop policy if exists admin_audit_read on public.admin_audit_log;
create policy admin_audit_read on public.admin_audit_log
  for select to authenticated using (public.is_healthscan_admin());

create table if not exists public.sync_runs (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text,
  kind text not null,                 -- mirror-to-prod | push-to-prod | pull-from-prod | merge-prod
  dry_run boolean not null default false,
  tables text[],
  results jsonb
);
alter table public.sync_runs enable row level security;
drop policy if exists sync_runs_read on public.sync_runs;
create policy sync_runs_read on public.sync_runs
  for select to authenticated using (public.is_healthscan_admin());

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text; v_changed jsonb; v_id text; v_hdrs jsonb; v_source text;
begin
  begin v_hdrs := current_setting('request.headers', true)::jsonb;
  exception when others then v_hdrs := null; end;
  v_actor := coalesce(
    nullif(auth.jwt() ->> 'email', ''),
    v_hdrs ->> 'x-admin-email',
    current_user::text
  );
  v_source := coalesce(v_hdrs ->> 'x-sync-source', 'rest');

  if TG_OP = 'UPDATE' then
    -- store only the columns that actually changed (timestamps excluded);
    -- a no-op upsert logs nothing.
    select jsonb_object_agg(n.key, jsonb_build_array(o.value, n.value)) into v_changed
    from jsonb_each(to_jsonb(NEW)) n
    join jsonb_each(to_jsonb(OLD)) o on o.key = n.key
    where n.key not in ('updated_at', 'created_at')
      and n.value is distinct from o.value;
    if v_changed is null then return null; end if;
    v_id := to_jsonb(NEW) ->> 'id';
  elsif TG_OP = 'INSERT' then
    v_changed := to_jsonb(NEW);
    v_id := to_jsonb(NEW) ->> 'id';
  else
    -- DELETE: compact identity only (a mass purge of wide rows must not bloat the log)
    v_changed := jsonb_strip_nulls(jsonb_build_object(
      'name_common', to_jsonb(OLD) ->> 'name_common',
      'name',        to_jsonb(OLD) ->> 'name',
      'display_name',to_jsonb(OLD) ->> 'display_name'
    ));
    v_id := to_jsonb(OLD) ->> 'id';
  end if;

  insert into public.admin_audit_log (actor, action, table_name, record_id, changed, source)
  values (v_actor, TG_OP, TG_TABLE_NAME, v_id, v_changed, v_source);
  return null;
end;
$$;

-- attach to the human-edited content tables
do $$
declare t text;
begin
  foreach t in array array[
    'catalog_elements','catalog_ingredients','catalog_recipes','catalog_products',
    'catalog_activities','catalog_symptoms','catalog_equipment','catalog_cooking_methods',
    'hs_tests','hs_supplements','hs_products','hs_experts','hs_services','hs_packages',
    'protocols','protocol_items'
  ] loop
    execute format('drop trigger if exists audit_changes on public.%I', t);
    execute format(
      'create trigger audit_changes after insert or update or delete on public.%I for each row execute function public.audit_row_change()', t);
  end loop;
end $$;
