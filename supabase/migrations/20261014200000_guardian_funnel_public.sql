-- Public Guardian mini-site funnel.
-- 1. Visitors can opt in to an approved Guardian's free offer (insert only;
--    they can never read leads back). Consent is recorded per GDPR.
-- 2. Published value ramps on approved Guardian pages are publicly readable.

alter table public.guide_leads
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists consent_text text,
  add column if not exists consent_at timestamptz,
  add column if not exists source_offer_id uuid references public.guide_offers(id) on delete set null,
  add column if not exists value_ramp_id uuid references public.guide_value_ramps(id) on delete set null;

drop policy if exists "visitors can opt in on approved guardian pages" on public.guide_leads;
create policy "visitors can opt in on approved guardian pages"
on public.guide_leads
for insert to anon, authenticated
with check (
  stage = 'new'
  and notes = ''
  and char_length(trim(name)) between 1 and 120
  and char_length(email) between 3 and 254
  and exists (
    select 1 from public.guide_profiles
    where guide_profiles.user_id = guide_leads.guide_id
      and guide_profiles.status = 'approved'
  )
);

drop policy if exists "published value ramps on approved guardian pages are public" on public.guide_value_ramps;
create policy "published value ramps on approved guardian pages are public"
on public.guide_value_ramps
for select
using (
  status = 'published'
  and exists (
    select 1 from public.guide_profiles
    where guide_profiles.user_id = guide_value_ramps.guide_id
      and guide_profiles.status = 'approved'
  )
);
