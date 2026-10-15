-- Admin review of Guardian sites and suggestions.
--  * Admins (public.is_healthscan_admin(): JWT is_admin / role=admin) can see and change every
--    Guardian profile (approve = publish, paused = unpublish) and read/triage suggestions.
--  * A Guardian may move their own profile to 'submitted' (request review) but never approve it;
--    approval, pausing and commission stay with admins / the service role.
--  * review_requested_at records when the Guardian last asked for review (drives the admin email).

alter table public.guide_profiles add column if not exists review_requested_at timestamptz;
alter table public.guide_profiles add column if not exists reviewed_at timestamptz;
alter table public.guide_profiles add column if not exists review_note text check (review_note is null or char_length(review_note) <= 2000);

create or replace function public.guard_guide_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and not coalesce(public.is_healthscan_admin(), false) then
    if tg_op = 'INSERT' then
      new.status := case when new.status = 'submitted' then 'submitted' else 'draft' end;
      new.commission_percent := 15;
      new.reviewed_at := null; new.review_note := null;
    else
      -- Guardians can only ask for review; everything else keeps the admin-set value.
      if new.status = 'submitted' and old.status in ('draft', 'paused', 'submitted') then
        new.status := 'submitted';
      else
        new.status := old.status;
      end if;
      new.commission_percent := old.commission_percent;
      new.reviewed_at := old.reviewed_at;
      new.review_note := old.review_note;
    end if;
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status and new.status in ('approved', 'paused') then
    new.reviewed_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop policy if exists "admins read all guide profiles" on public.guide_profiles;
create policy "admins read all guide profiles" on public.guide_profiles
  for select to authenticated using (public.is_healthscan_admin());
drop policy if exists "admins update guide profiles" on public.guide_profiles;
create policy "admins update guide profiles" on public.guide_profiles
  for update to authenticated using (public.is_healthscan_admin()) with check (public.is_healthscan_admin());

drop policy if exists "admins read all guide offers" on public.guide_offers;
create policy "admins read all guide offers" on public.guide_offers
  for select to authenticated using (public.is_healthscan_admin());

drop policy if exists "admins read guardian suggestions" on public.guardian_suggestions;
create policy "admins read guardian suggestions" on public.guardian_suggestions
  for select to authenticated using (public.is_healthscan_admin());
drop policy if exists "admins triage guardian suggestions" on public.guardian_suggestions;
create policy "admins triage guardian suggestions" on public.guardian_suggestions
  for update to authenticated using (public.is_healthscan_admin()) with check (public.is_healthscan_admin());
grant select, update on public.guardian_suggestions to authenticated;
