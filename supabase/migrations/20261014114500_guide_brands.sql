-- Guardians can operate under a personal identity and multiple business brands.
create table if not exists public.guide_brands (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guide_profiles(user_id) on delete cascade,
  name text not null,
  kind text not null default 'business' check (kind in ('personal', 'business')),
  logo_url text,
  contact_email text not null default '',
  whatsapp_phone text not null default '',
  website_url text not null default '',
  social_links jsonb not null default '{}'::jsonb,
  language text not null default 'English',
  pricing_region text not null default 'United States',
  currency text not null default 'USD' check (currency in ('GBP', 'EUR', 'USD')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guide_id, name)
);

create index if not exists guide_brands_guide_idx on public.guide_brands(guide_id, created_at);
alter table public.guide_brands enable row level security;

drop policy if exists "guides manage own guide_brands" on public.guide_brands;
create policy "guides manage own guide_brands" on public.guide_brands
  for all to authenticated
  using (guide_id = auth.uid())
  with check (guide_id = auth.uid());
