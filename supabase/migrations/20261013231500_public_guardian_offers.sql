-- Public Guardian websites may show published offers only after the Guardian
-- profile itself has been approved. Owners retain their existing full access.
drop policy if exists "published offers on approved guardian pages are public" on public.guide_offers;
create policy "published offers on approved guardian pages are public"
on public.guide_offers
for select
using (
  status = 'published'
  and exists (
    select 1
    from public.guide_profiles
    where guide_profiles.user_id = guide_offers.guide_id
      and guide_profiles.status = 'approved'
  )
);
