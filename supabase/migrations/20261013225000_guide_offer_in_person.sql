-- In-person sessions are a distinct Guardian offer rung and should not be
-- collapsed into online 1:1 calls or generic programs.
alter table public.guide_offers
  drop constraint if exists guide_offers_kind_check;

alter table public.guide_offers
  add constraint guide_offers_kind_check check (kind in (
    'lead_magnet','ebook','recipe_book','routine','one_to_one_call',
    'group_call','in_person','journey','festival','team_program','product','program'
  ));
