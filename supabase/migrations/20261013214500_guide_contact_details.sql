-- Public contact details supplied by the guide during onboarding. They remain
-- protected by guide_profiles RLS until the guide is approved.
alter table public.guide_profiles
  add column if not exists contact_email text not null default '',
  add column if not exists whatsapp_phone text not null default '';

alter table public.guide_profiles
  drop constraint if exists guide_profiles_contact_email_length,
  add constraint guide_profiles_contact_email_length check (char_length(contact_email) <= 254),
  drop constraint if exists guide_profiles_whatsapp_phone_length,
  add constraint guide_profiles_whatsapp_phone_length check (char_length(whatsapp_phone) <= 32);
