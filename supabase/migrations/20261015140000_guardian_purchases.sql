-- Real payments for Guardian offers (single platform Stripe account).
-- Rows are written only by the guardian-payments edge function (service role);
-- a Guardian can read the purchases of their own offers.
create table if not exists public.guardian_purchases (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references auth.users(id) on delete cascade,
  offer_id uuid not null references public.guide_offers(id) on delete restrict,
  previous_purchase_id uuid references public.guardian_purchases(id) on delete set null,
  customer_email text not null check (char_length(customer_email) <= 254),
  customer_name text check (customer_name is null or char_length(customer_name) <= 120),
  stripe_customer_id text not null,
  stripe_payment_intent_id text unique,
  amount_cents integer not null check (amount_cents >= 0),
  list_amount_cents integer not null check (list_amount_cents >= 0),
  currency text not null,
  discount_code text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'requires_action')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists guardian_purchases_guide_idx on public.guardian_purchases (guide_id, created_at desc);

alter table public.guardian_purchases enable row level security;
drop policy if exists "guardian reads own purchases" on public.guardian_purchases;
create policy "guardian reads own purchases" on public.guardian_purchases
  for select to authenticated using (guide_id = auth.uid());
grant select on public.guardian_purchases to authenticated;
grant all on public.guardian_purchases to service_role;
