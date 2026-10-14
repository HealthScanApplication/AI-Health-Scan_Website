-- A value ramp is an ordered customer journey. Content remains in the existing
-- guide_offers / guide_recipes / protocols tables and can be reused by ramps.
create table if not exists public.guide_value_ramps (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guide_profiles(user_id) on delete cascade,
  name text not null,
  slug text not null,
  audience text not null default '',
  problem text not null default '',
  offer_ids uuid[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guide_id, slug)
);

create index if not exists guide_value_ramps_guide_idx
  on public.guide_value_ramps(guide_id, created_at desc);

alter table public.guide_value_ramps enable row level security;

drop policy if exists "guides manage own guide_value_ramps" on public.guide_value_ramps;
create policy "guides manage own guide_value_ramps" on public.guide_value_ramps
  for all to authenticated
  using (guide_id = auth.uid())
  with check (guide_id = auth.uid());
