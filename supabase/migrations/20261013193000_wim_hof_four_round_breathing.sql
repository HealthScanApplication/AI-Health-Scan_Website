-- Upgrade the existing suggested Wim Hof routine to a four-round breathing block.
--
-- Each round is a top-level activity so it can be timed and completed in the
-- mobile day view. The three child rows are instructional detail displayed
-- beneath that round. Retention is deliberately comfort-led rather than a
-- target: longer holds are not the goal and intense breathwork can cause loss
-- of consciousness.

BEGIN;

UPDATE public.protocols
SET name = 'Wim Hof Breathing & Cold Method',
    description = 'A four-round breathing practice followed by optional, gradual cold exposure. Each round combines 10 minutes of deep rhythmic breathing, a comfortable exhale retention, and one full recovery inhale held for about 15 seconds. Always practise seated or lying down. Never practise breath retention in water, near water, while driving, or while standing. Stop immediately if you feel unwell. General-wellness content, not medical advice.',
    source_attribution = 'Wim Hof Method breathing technique',
    updated_at = now()
WHERE id = '91664400-ad40-411c-8b12-b1ad79868be6';

-- Remove only the old executable breathing sequence. Rules and the separate
-- cold-exposure portion of the protocol remain intact.
DELETE FROM public.protocol_items
WHERE protocol_id = '91664400-ad40-411c-8b12-b1ad79868be6'
  AND kind = 'action'
  AND group_name = 'Breathing Foundation';

INSERT INTO public.protocol_items
  (id, protocol_id, item_type, catalog_activity_id, scheduled_time,
   duration_minutes, display_name, group_name, sort_order, notes, kind,
   category, subtype, recurrence_type, recurrence_interval_unit, enabled,
   hidden, notifications_enabled, rounds, has_children)
VALUES
  ('a1000000-0000-4000-8000-000000000001', '91664400-ad40-411c-8b12-b1ad79868be6',
   'activity', 'breathwork', '06:00:00', 10, 'Round 1 — Deep breathing',
   'Breathing Foundation', 1,
   'Breathe deeply and rhythmically for 10 minutes while seated or lying down. Let each exhale fall out without forcing it.',
   'action', 'do', 'wellness', 'daily', 'day', true, false, true, 1, true),
  ('a1000000-0000-4000-8000-000000000002', '91664400-ad40-411c-8b12-b1ad79868be6',
   'activity', 'breathwork', '06:12:00', 10, 'Round 2 — Deep breathing',
   'Breathing Foundation', 2,
   'Repeat the same controlled rhythm. Stay relaxed and stop if you feel unwell.',
   'action', 'do', 'wellness', 'daily', 'day', true, false, true, 1, true),
  ('a1000000-0000-4000-8000-000000000003', '91664400-ad40-411c-8b12-b1ad79868be6',
   'activity', 'breathwork', '06:24:00', 10, 'Round 3 — Deep breathing',
   'Breathing Foundation', 3,
   'Continue only while the breathing remains controlled and comfortable.',
   'action', 'do', 'wellness', 'daily', 'day', true, false, true, 1, true),
  ('a1000000-0000-4000-8000-000000000004', '91664400-ad40-411c-8b12-b1ad79868be6',
   'activity', 'breathwork', '06:36:00', 10, 'Round 4 — Deep breathing',
   'Breathing Foundation', 4,
   'Complete the final controlled round, then return to natural breathing before standing.',
   'action', 'do', 'wellness', 'daily', 'day', true, false, true, 1, true)
ON CONFLICT (id) DO UPDATE SET
  catalog_activity_id = EXCLUDED.catalog_activity_id,
  scheduled_time = EXCLUDED.scheduled_time,
  duration_minutes = EXCLUDED.duration_minutes,
  display_name = EXCLUDED.display_name,
  group_name = EXCLUDED.group_name,
  sort_order = EXCLUDED.sort_order,
  notes = EXCLUDED.notes,
  category = EXCLUDED.category,
  subtype = EXCLUDED.subtype,
  rounds = EXCLUDED.rounds,
  has_children = EXCLUDED.has_children;

-- The same three instructions appear under every round in the app. The
-- comfortable retention may naturally last around 1–3 minutes for some
-- experienced users, but it is never prescribed as a minimum or goal.
INSERT INTO public.protocol_items
  (id, protocol_id, item_type, scheduled_time, duration_minutes, display_name,
   group_name, sort_order, notes, kind, category, subtype, recurrence_type,
   recurrence_interval_unit, enabled, hidden, notifications_enabled,
   parent_protocol_item_id)
SELECT v.id::uuid, '91664400-ad40-411c-8b12-b1ad79868be6'::uuid,
       'activity', NULL, v.duration_minutes, v.display_name,
       'Breathing Foundation', v.child_order, v.notes, 'rule_do', 'do',
       'wellness', 'daily', 'day', true, false, false, v.parent_id::uuid
FROM (VALUES
  ('a1100000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001',1,10,'Deep rhythmic breathing','Breathe deeply through the nose or mouth and let each exhale leave without force.'),
  ('a1100000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000001',2,NULL,'Comfortable exhale retention','After the final exhale, pause only until you naturally need to breathe. Do not chase a time target.'),
  ('a1100000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000001',3,NULL,'Full recovery breath','Take one comfortably full inhale, hold gently for about 15 seconds, then release.'),
  ('a1200000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002',1,10,'Deep rhythmic breathing','Breathe deeply through the nose or mouth and let each exhale leave without force.'),
  ('a1200000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000002',2,NULL,'Comfortable exhale retention','After the final exhale, pause only until you naturally need to breathe. Do not chase a time target.'),
  ('a1200000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000002',3,NULL,'Full recovery breath','Take one comfortably full inhale, hold gently for about 15 seconds, then release.'),
  ('a1300000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000003',1,10,'Deep rhythmic breathing','Breathe deeply through the nose or mouth and let each exhale leave without force.'),
  ('a1300000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000003',2,NULL,'Comfortable exhale retention','After the final exhale, pause only until you naturally need to breathe. Do not chase a time target.'),
  ('a1300000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000003',3,NULL,'Full recovery breath','Take one comfortably full inhale, hold gently for about 15 seconds, then release.'),
  ('a1400000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000004',1,10,'Deep rhythmic breathing','Breathe deeply through the nose or mouth and let each exhale leave without force.'),
  ('a1400000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000004',2,NULL,'Comfortable exhale retention','After the final exhale, pause only until you naturally need to breathe. Do not chase a time target.'),
  ('a1400000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000004',3,NULL,'Full recovery breath','Take one comfortably full inhale, hold gently for about 15 seconds, then release.')
) AS v(id, parent_id, child_order, duration_minutes, display_name, notes)
ON CONFLICT (id) DO UPDATE SET
  duration_minutes = EXCLUDED.duration_minutes,
  display_name = EXCLUDED.display_name,
  sort_order = EXCLUDED.sort_order,
  notes = EXCLUDED.notes,
  parent_protocol_item_id = EXCLUDED.parent_protocol_item_id;

-- Keep the cold phase after all four breathing rounds. Breath retention and
-- power breathing must never be performed in or near water.
UPDATE public.protocol_items
SET scheduled_time = CASE display_name
      WHEN 'Cold Shower' THEN '06:50:00'::time
      WHEN 'Ice Bath Full Immersion' THEN '07:00:00'::time
      WHEN 'Wim Hof Controlled Breathing During Cold' THEN '07:02:00'::time
      WHEN 'Post-Cold Warm-Up & Body Scan' THEN '07:05:00'::time
      WHEN 'Meditation' THEN '07:15:00'::time
      WHEN 'Commitment Affirmation & Mental Visualization' THEN '07:25:00'::time
      ELSE scheduled_time
    END,
    notes = CASE
      WHEN display_name = 'Wim Hof Controlled Breathing During Cold'
        THEN 'Breathe normally and calmly. Never perform power breathing or breath retention in or near water.'
      ELSE notes
    END
WHERE protocol_id = '91664400-ad40-411c-8b12-b1ad79868be6'
  AND display_name IN (
    'Cold Shower', 'Ice Bath Full Immersion',
    'Wim Hof Controlled Breathing During Cold',
    'Post-Cold Warm-Up & Body Scan', 'Meditation',
    'Commitment Affirmation & Mental Visualization'
  );

COMMIT;
