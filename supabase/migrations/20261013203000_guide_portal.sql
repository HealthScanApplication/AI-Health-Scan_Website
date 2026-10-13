-- Guide portal: public guide profiles + private guide CRM/content drafts.
-- Guide users remain ordinary authenticated users. RLS is the authority; no
-- client-side role flag grants access to another guide's records.
create table if not exists public.guide_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique,
  display_name text not null,
  headline text not null default '',
  bio text not null default '',
  avatar_url text,
  specialties text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','submitted','approved','paused')),
  commission_percent numeric(5,2) not null default 15 check (commission_percent between 0 and 100),
  onboarding_step integer not null default 1 check (onboarding_step between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guide_leads (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guide_profiles(user_id) on delete cascade,
  name text not null,
  email text not null,
  goal text,
  stage text not null default 'new' check (stage in ('new','contacted','client','closed')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guide_offers (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guide_profiles(user_id) on delete cascade,
  kind text not null check (kind in ('ebook','product','program')),
  title text not null,
  description text,
  cover_url text,
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'USD',
  affiliate_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guide_recipes (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guide_profiles(user_id) on delete cascade,
  title text not null,
  description text,
  meal_slot text,
  image_url text,
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  affiliate_product_ids text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','submitted','published')),
  catalog_recipe_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guide_leads_guide_idx on public.guide_leads(guide_id, created_at desc);
create index if not exists guide_offers_guide_idx on public.guide_offers(guide_id, created_at desc);
create index if not exists guide_recipes_guide_idx on public.guide_recipes(guide_id, created_at desc);

alter table public.guide_profiles enable row level security;
alter table public.guide_leads enable row level security;
alter table public.guide_offers enable row level security;
alter table public.guide_recipes enable row level security;

-- Approval state and platform commission are controlled by operations, never
-- by the guide's browser. The service role and existing HealthScan admins keep
-- authority to review applications and change those fields.
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
    else
      new.status := old.status;
      new.commission_percent := old.commission_percent;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guide_profile_privilege_guard on public.guide_profiles;
create trigger guide_profile_privilege_guard
before insert or update on public.guide_profiles
for each row execute function public.guard_guide_profile_privileges();

drop policy if exists "approved guides are public" on public.guide_profiles;
create policy "approved guides are public" on public.guide_profiles for select
  using (status = 'approved' or user_id = auth.uid());
drop policy if exists "guides create own profile" on public.guide_profiles;
create policy "guides create own profile" on public.guide_profiles for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "guides update own profile" on public.guide_profiles;
create policy "guides update own profile" on public.guide_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['guide_leads','guide_offers','guide_recipes'] loop
    execute format('drop policy if exists "guides manage own %1$s" on public.%1$I', t);
    execute format(
      'create policy "guides manage own %1$s" on public.%1$I for all to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid())',
      t
    );
  end loop;
end $$;

-- Guide protocols use the existing mobile protocol model. Ownership is always
-- the authenticated user; protocol_items inherit access through protocol_id.
-- Existing own-protocol RLS policies continue to enforce this boundary.
