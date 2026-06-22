-- ============================================================
-- Migration: protocol_items — hide flag + two-level type taxonomy
-- Created: 2026-06-22
--
-- Adds three ADDITIVE, reversible columns to protocol_items so the protocol
-- editor (web admin) and the mobile app can model groups + a clean type system:
--
--   hidden   BOOLEAN  — item stays in the protocol but is hidden from the day view
--   category TEXT     — top bucket: consume | do | sleep | supplement
--   subtype  TEXT     — consume: meal|drink|snack|beverage
--                       do:      hygiene|wellness|exercise
--                       sleep:   sleep   ·   supplement: supplement
--
-- `item_type` stays the BACKING (recipe|product|supplement|activity) and the
-- catalog_*_id links (catalog_recipe_id / catalog_product_id / supplement_id /
-- catalog_activity_id) are unchanged. Part-of-day stays DERIVED from scheduled_time.
--
-- Additive only — existing rows keep working and the mobile app ignores the new
-- columns until it is updated to read them, so this is safe to apply first.
-- Reverse with: ALTER TABLE protocol_items DROP COLUMN hidden, DROP COLUMN category, DROP COLUMN subtype;
-- ============================================================

ALTER TABLE protocol_items
  ADD COLUMN IF NOT EXISTS hidden   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS subtype  TEXT;

COMMENT ON COLUMN protocol_items.hidden   IS 'In the protocol but hidden from the day view (e.g. background sleep anchors).';
COMMENT ON COLUMN protocol_items.category IS 'Top bucket: consume | do | sleep | supplement.';
COMMENT ON COLUMN protocol_items.subtype  IS 'consume: meal|drink|snack|beverage; do: hygiene|wellness|exercise; sleep; supplement.';

-- ── Backfill: category (best-effort from existing fields; the editor refines) ──
UPDATE protocol_items SET category = 'sleep'
 WHERE category IS NULL
   AND lower(trim(display_name)) ~ '(^|[^a-z])(sleep|wake|bed|wind[- ]?down|lights[- ]?out|nap)([^a-z]|$)';

UPDATE protocol_items SET category = 'supplement'
 WHERE category IS NULL AND (item_type = 'supplement' OR scope = 'supplement');

UPDATE protocol_items SET category = 'consume'
 WHERE category IS NULL
   AND (item_type IN ('consume','recipe','product') OR scope = 'consume'
        OR lower(coalesce(group_name,'')) LIKE 'consume%');

UPDATE protocol_items SET category = 'do'
 WHERE category IS NULL;   -- everything else (activities, hygiene, wellness, exercise)

-- ── Backfill: subtype ──
-- consume → meal | drink | snack | beverage  (kind of consumable; meal_slot stays the WHEN)
UPDATE protocol_items SET subtype = 'beverage'
 WHERE subtype IS NULL AND category = 'consume'
   AND (meal_slot = 'beverage' OR lower(display_name) ~ '(tea|coffee|water|juice|kombucha|tonic|broth)');
UPDATE protocol_items SET subtype = 'drink'
 WHERE subtype IS NULL AND category = 'consume'
   AND lower(display_name) ~ '(shake|smoothie|latte|elixir|drink|electrolyte|ag1|collagen)';
UPDATE protocol_items SET subtype = 'snack'
 WHERE subtype IS NULL AND category = 'consume'
   AND (meal_slot = 'snack' OR lower(display_name) ~ '(snack|nuts|trail mix|fruit|protein bar)');
UPDATE protocol_items SET subtype = 'meal'
 WHERE subtype IS NULL AND category = 'consume';

-- do → hygiene | wellness | exercise
UPDATE protocol_items SET subtype = 'exercise'
 WHERE subtype IS NULL AND category = 'do'
   AND (lower(coalesce(group_name,'')) LIKE '%exercise%'
        OR lower(display_name) ~ '(workout|hiit|run|jog|sprint|strength|cardio|walk|hike|stretch|yoga|pilates|training|squat|push[- ]?up|lift)');
UPDATE protocol_items SET subtype = 'hygiene'
 WHERE subtype IS NULL AND category = 'do'
   AND lower(display_name) ~ '(brush|floss|tongue|shower|cleanse|wash|skincare|serum|moistur|gua sha|oil pull|dry[- ]?brush|exfoliat|toner)';
UPDATE protocol_items SET subtype = 'wellness'
 WHERE subtype IS NULL AND category = 'do';   -- meditation, breathwork, sun, grounding, journaling…

-- sleep / supplement
UPDATE protocol_items SET subtype = 'sleep'      WHERE subtype IS NULL AND category = 'sleep';
UPDATE protocol_items SET subtype = 'supplement' WHERE subtype IS NULL AND category = 'supplement';
