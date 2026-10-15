alter table public.protocols
  add column if not exists profile_role text default 'self',
  add column if not exists profile_name text,
  add column if not exists profile_image_url text,
  add column if not exists schedule_basis text default 'calendar';

do $$ begin
  alter table public.protocols add constraint protocols_profile_role_check
    check (profile_role in ('self', 'partner', 'child'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.protocols add constraint protocols_schedule_basis_check
    check (schedule_basis in ('calendar', 'menstrual_cycle', 'lunar_cycle'));
exception when duplicate_object then null; end $$;

