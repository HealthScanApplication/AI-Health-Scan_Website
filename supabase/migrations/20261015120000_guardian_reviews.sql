-- Customer reviews of a Guardian, collected through a one-time review link.
-- The Guardian creates a request (token + thank-you discount code) for a buyer;
-- the buyer submits through submit_guardian_review(token, …) and receives the code.
create table if not exists public.guardian_review_requests (
  token uuid primary key default gen_random_uuid(),
  guide_id uuid not null references auth.users(id) on delete cascade,
  customer_email text check (customer_email is null or char_length(customer_email) <= 254),
  customer_name text check (customer_name is null or char_length(customer_name) <= 120),
  discount_code text not null check (char_length(discount_code) between 3 and 40),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.guardian_reviews (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references auth.users(id) on delete cascade,
  request_token uuid unique references public.guardian_review_requests(token) on delete set null,
  reviewer_name text not null check (char_length(trim(reviewer_name)) between 1 and 80),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(trim(body)) between 3 and 1200),
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);
create index if not exists guardian_reviews_guide_idx on public.guardian_reviews (guide_id, created_at desc);

alter table public.guardian_review_requests enable row level security;
alter table public.guardian_reviews enable row level security;

drop policy if exists "guardian manages own review requests" on public.guardian_review_requests;
create policy "guardian manages own review requests" on public.guardian_review_requests
  for all to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid());

drop policy if exists "anyone reads published reviews" on public.guardian_reviews;
create policy "anyone reads published reviews" on public.guardian_reviews
  for select to anon, authenticated using (status = 'published' or guide_id = auth.uid());

drop policy if exists "guardian moderates own reviews" on public.guardian_reviews;
create policy "guardian moderates own reviews" on public.guardian_reviews
  for update to authenticated using (guide_id = auth.uid()) with check (guide_id = auth.uid());

grant select, insert, update, delete on public.guardian_review_requests to authenticated;
grant select on public.guardian_reviews to anon, authenticated;
grant update on public.guardian_reviews to authenticated;

-- One-time submit: validates the token, stores the review, returns the thank-you code.
create or replace function public.submit_guardian_review(p_token uuid, p_name text, p_rating int, p_body text)
returns text language plpgsql security definer set search_path = public as $$
declare req public.guardian_review_requests;
begin
  select * into req from public.guardian_review_requests where token = p_token for update;
  if not found then raise exception 'This review link is not valid.'; end if;
  if req.used_at is not null then raise exception 'This review link has already been used.'; end if;
  insert into public.guardian_reviews (guide_id, request_token, reviewer_name, rating, body)
    values (req.guide_id, req.token, trim(p_name), p_rating, trim(p_body));
  update public.guardian_review_requests set used_at = now() where token = p_token;
  return req.discount_code;
end $$;
revoke all on function public.submit_guardian_review(uuid, text, int, text) from public;
grant execute on function public.submit_guardian_review(uuid, text, int, text) to anon, authenticated;
