-- Structured guide channels and a broader offer catalogue.
alter table public.guide_profiles
  add column if not exists social_links jsonb not null default '{}'::jsonb;

alter table public.guide_profiles
  drop constraint if exists guide_profiles_onboarding_step_check,
  add constraint guide_profiles_onboarding_step_check check (onboarding_step between 1 and 5);

alter table public.guide_offers
  drop constraint if exists guide_offers_kind_check;

alter table public.guide_offers
  add constraint guide_offers_kind_check check (kind in (
    'lead_magnet','ebook','recipe_book','routine','one_to_one_call',
    'group_call','journey','festival','team_program','product','program'
  )),
  add column if not exists access_model text not null default 'paid'
    check (access_model in ('free','paid')),
  add column if not exists file_path text,
  add column if not exists booking_url text;

-- Paid downloads stay private. A later checkout endpoint can issue short-lived
-- signed URLs after verifying purchase; the browser never receives a public URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guide-files', 'guide-files', false, 52428800, array[
  'application/pdf','application/epub+zip','application/zip'
])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "guides read own files" on storage.objects;
create policy "guides read own files" on storage.objects for select to authenticated
  using (bucket_id = 'guide-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "guides upload own files" on storage.objects;
create policy "guides upload own files" on storage.objects for insert to authenticated
  with check (bucket_id = 'guide-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "guides update own files" on storage.objects;
create policy "guides update own files" on storage.objects for update to authenticated
  using (bucket_id = 'guide-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'guide-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "guides delete own files" on storage.objects;
create policy "guides delete own files" on storage.objects for delete to authenticated
  using (bucket_id = 'guide-files' and (storage.foldername(name))[1] = auth.uid()::text);
