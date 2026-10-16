-- Run only on staging mofhvoudjxinvpplsytd using `supabase db query --linked --project-ref ... --file ...`.
-- Uses an existing disposable QA auth owner; all fixture changes are rolled back.
begin;
do $$ begin
  if exists(select 1 from public.guide_profiles where user_id='67ac6963-dfad-4044-b5d0-376d6ceb7f31') then
    raise exception 'QA owner already has a profile; choose an unused QA owner before running';
  end if;
end $$;
set local request.jwt.claims='{"sub":"67ac6963-dfad-4044-b5d0-376d6ceb7f31","role":"authenticated","app_metadata":{}}';
set local role authenticated;
insert into public.guide_profiles(user_id,slug,display_name,status,commission_percent,onboarding_step)
values('67ac6963-dfad-4044-b5d0-376d6ceb7f31','qa-guardian-publishing-20261016','QA Publishing — rollback only','submitted',77,5);
update public.guide_profiles set status='approved',commission_percent=77 where user_id='67ac6963-dfad-4044-b5d0-376d6ceb7f31';
do $$ begin
  if not exists(select 1 from public.guide_profiles where slug='qa-guardian-publishing-20261016' and status='submitted' and commission_percent=15) then
    raise exception 'Owner approval/commission protection failed';
  end if;
end $$;
insert into public.guide_offers(id,guide_id,kind,title,status,access_model,price_cents,currency)
values('bc154ab0-b694-425c-8dc7-e42c32b05234','67ac6963-dfad-4044-b5d0-376d6ceb7f31','ebook','QA free offer','published','free',0,'GBP');
insert into public.guide_value_ramps(guide_id,name,slug,audience,problem,offer_ids,status)
values('67ac6963-dfad-4044-b5d0-376d6ceb7f31','QA path','qa-publishing','QA','Testing',array['bc154ab0-b694-425c-8dc7-e42c32b05234']::uuid[],'published');
reset role;
set local request.jwt.claims='{"role":"anon"}';
set local role anon;
do $$ begin
  if exists(select 1 from public.guide_profiles where slug='qa-guardian-publishing-20261016')
    or exists(select 1 from public.guide_offers where id='bc154ab0-b694-425c-8dc7-e42c32b05234')
    or exists(select 1 from public.guide_value_ramps where slug='qa-publishing') then
    raise exception 'Unapproved publishing fixture visible publicly';
  end if;
end $$;
reset role;
set local request.jwt.claims='{"role":"service_role"}';
update public.guide_profiles set status='approved' where user_id='67ac6963-dfad-4044-b5d0-376d6ceb7f31';
set local request.jwt.claims='{"role":"anon"}';
set local role anon;
do $$ begin
  if not exists(select 1 from public.guide_profiles where slug='qa-guardian-publishing-20261016')
    or not exists(select 1 from public.guide_offers where id='bc154ab0-b694-425c-8dc7-e42c32b05234')
    or not exists(select 1 from public.guide_value_ramps where slug='qa-publishing') then
    raise exception 'Approved published fixture not publicly readable';
  end if;
end $$;
reset role;
set local request.jwt.claims='{"role":"service_role"}';
update public.guide_profiles set status='paused' where user_id='67ac6963-dfad-4044-b5d0-376d6ceb7f31';
set local request.jwt.claims='{"role":"anon"}';
set local role anon;
do $$ begin
  if exists(select 1 from public.guide_offers where id='bc154ab0-b694-425c-8dc7-e42c32b05234')
    or exists(select 1 from public.guide_value_ramps where slug='qa-publishing') then
    raise exception 'Paused fixture still public';
  end if;
end $$;
reset role;
rollback;
select 'PASS: submit, owner cannot approve, public visibility after approval, pause hides offers and paths; transaction rolled back' as result;
