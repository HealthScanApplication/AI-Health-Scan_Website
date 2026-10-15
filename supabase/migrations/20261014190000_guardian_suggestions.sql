-- Public "Suggest a Guardian" submissions from the /guardians directory.
-- Anyone may insert; nobody but service role / admins may read.
create table if not exists public.guardian_suggestions (
  id uuid primary key default gen_random_uuid(),
  guardian_type text not null check (char_length(trim(guardian_type)) between 1 and 60),
  name text not null check (char_length(trim(name)) between 1 and 120),
  instagram text check (instagram is null or char_length(instagram) <= 200),
  tiktok text check (tiktok is null or char_length(tiktok) <= 200),
  youtube text check (youtube is null or char_length(youtube) <= 300),
  website text check (website is null or char_length(website) <= 300),
  note text check (note is null or char_length(note) <= 2000),
  suggester_email text check (suggester_email is null or char_length(suggester_email) <= 254),
  status text not null default 'new' check (status in ('new', 'contacted', 'invited', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint guardian_suggestion_has_contact check (coalesce(instagram, tiktok, youtube, website) is not null)
);

alter table public.guardian_suggestions enable row level security;

drop policy if exists "anyone can suggest a guardian" on public.guardian_suggestions;
create policy "anyone can suggest a guardian" on public.guardian_suggestions
  for insert to anon, authenticated with check (status = 'new');

grant insert on public.guardian_suggestions to anon, authenticated;
