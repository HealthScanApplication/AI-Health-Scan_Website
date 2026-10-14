create table if not exists public.guide_library_folders (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guide_id, name)
);

create table if not exists public.guide_library_items (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.guide_library_folders(id) on delete set null,
  kind text not null check (kind in ('pdf', 'url', 'transcript')),
  title text not null check (char_length(trim(title)) between 1 and 180),
  source_url text,
  file_path text,
  transcript text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guide_library_item_source check (
    (kind = 'pdf' and file_path is not null) or
    (kind = 'url' and source_url is not null) or
    (kind = 'transcript' and transcript is not null)
  )
);

create index if not exists guide_library_folders_guide_idx on public.guide_library_folders(guide_id);
create index if not exists guide_library_items_guide_folder_idx on public.guide_library_items(guide_id, folder_id);

alter table public.guide_library_folders enable row level security;
alter table public.guide_library_items enable row level security;

drop policy if exists "guides manage own library folders" on public.guide_library_folders;
create policy "guides manage own library folders" on public.guide_library_folders
  for all to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid());

drop policy if exists "guides manage own library items" on public.guide_library_items;
create policy "guides manage own library items" on public.guide_library_items
  for all to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid());
