-- ============================================================
-- Migration: link real recipes to every meal slot on the child-nutrition
-- protocols, and add the missing Dinner item.
-- Created: 2026-06-24
--
-- Context: the kid protocols (Toddler 1–2, Child 2–3 / 3–4 / 4–5) had no Dinner
-- item and their lunch/snack slots pointed at generic placeholder recipes. This
-- links each breakfast / lunch / dinner / snack slot to a real catalog_recipes
-- row (the same recipes the website marketing preview shows) and inserts Dinner.
--
-- Baby Nutrition 0–1 (b0000000-…-010) is intentionally left as-is: it runs on
-- feeds + age-appropriate solids, which are already linked.
--
-- Idempotent: UPDATEs are keyed by protocol + display_name; the Dinner INSERT is
-- guarded by NOT EXISTS. Safe to run on staging and production.
-- ============================================================

-- ── Toddler Nutrition 1–2 (keeps Whole Milk for breakfast) ──
UPDATE protocol_items SET catalog_recipe_id = 'recipe_apple_sauce'
  WHERE protocol_id = 'b0000000-0000-0000-0000-000000000011' AND kind = 'action' AND display_name = 'Morning Snack';
UPDATE protocol_items SET catalog_recipe_id = 'recipe_denmark_main_sandwich_open_faced_cheese'
  WHERE protocol_id = 'b0000000-0000-0000-0000-000000000011' AND kind = 'action' AND display_name = 'Lunch';
UPDATE protocol_items SET catalog_recipe_id = 'recipe_raw_fruits'
  WHERE protocol_id = 'b0000000-0000-0000-0000-000000000011' AND kind = 'action' AND display_name = 'Afternoon Snack';

-- ── Child Nutrition 2–3 / 3–4 / 4–5 (breakfast → Kid French Toast Sticks) ──
UPDATE protocol_items SET catalog_recipe_id = 'recipe_kid_french_toast_sticks'
  WHERE protocol_id IN ('b0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000013','b0000000-0000-0000-0000-000000000014')
    AND kind = 'action' AND display_name = 'Breakfast';
UPDATE protocol_items SET catalog_recipe_id = 'recipe_apple_sauce'
  WHERE protocol_id IN ('b0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000013','b0000000-0000-0000-0000-000000000014')
    AND kind = 'action' AND display_name = 'Morning Snack';
UPDATE protocol_items SET catalog_recipe_id = 'recipe_denmark_main_sandwich_open_faced_cheese'
  WHERE protocol_id IN ('b0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000013','b0000000-0000-0000-0000-000000000014')
    AND kind = 'action' AND display_name = 'Lunch';
UPDATE protocol_items SET catalog_recipe_id = 'recipe_raw_fruits'
  WHERE protocol_id IN ('b0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000013','b0000000-0000-0000-0000-000000000014')
    AND kind = 'action' AND display_name = 'Afternoon Snack';

-- ── Insert the missing Dinner (linked to a kid-friendly pasta) on 1–2 … 4–5 ──
INSERT INTO protocol_items (id, protocol_id, display_name, item_type, kind, scheduled_time, group_name, category, subtype, day_number, sort_order, catalog_recipe_id)
SELECT gen_random_uuid(), p.pid, 'Dinner', 'consume', 'action', '17:30:00', 'Meal', 'consume', 'meal', 1,
       COALESCE((SELECT MAX(sort_order) FROM protocol_items WHERE protocol_id = p.pid), 0) + 1,
       'recipe_main_pasta_spaghetti_with_marinara_sauce'
FROM (VALUES
  ('b0000000-0000-0000-0000-000000000011'::uuid),
  ('b0000000-0000-0000-0000-000000000012'::uuid),
  ('b0000000-0000-0000-0000-000000000013'::uuid),
  ('b0000000-0000-0000-0000-000000000014'::uuid)
) AS p(pid)
WHERE NOT EXISTS (
  SELECT 1 FROM protocol_items pi
  WHERE pi.protocol_id = p.pid AND pi.kind = 'action' AND pi.display_name = 'Dinner'
);
