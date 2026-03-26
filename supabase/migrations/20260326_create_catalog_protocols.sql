/**
 * ============================================================
 * CATALOG PROTOCOLS TABLE
 * ============================================================
 * Full-day protocols from night-before to sleep.
 * Each protocol is a structured daily plan containing time blocks
 * with activities, meals, supplements, and instructions.
 *
 * Time blocks: night_before, wake_up, morning, breakfast,
 *   mid_morning, lunch, afternoon, pre_dinner, dinner, evening, sleep
 */

-- ── 1. Main protocols table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog_protocols (
  id            TEXT        PRIMARY KEY,   -- slug e.g. 'detox-day', 'recovery-day'
  name          TEXT        NOT NULL,
  description   TEXT,
  category      TEXT        NOT NULL DEFAULT 'general',
  -- Categories: general, detox, recovery, performance, fasting, sleep, gut_health, immune, weight_loss
  difficulty    TEXT        DEFAULT 'beginner',
  -- Difficulty: beginner, intermediate, advanced
  duration_days INTEGER     DEFAULT 1,     -- How many days this protocol covers
  image_url     TEXT,
  icon_name     TEXT,

  -- ── Structured time blocks (JSONB) ─────────────────────────
  -- Each block: { instructions: string, activities: string[], recipes: string[], supplements: string[], duration_min: number, notes: string }
  night_before  JSONB       DEFAULT '{}'::jsonb,
  wake_up       JSONB       DEFAULT '{}'::jsonb,
  morning       JSONB       DEFAULT '{}'::jsonb,
  breakfast     JSONB       DEFAULT '{}'::jsonb,
  mid_morning   JSONB       DEFAULT '{}'::jsonb,
  lunch         JSONB       DEFAULT '{}'::jsonb,
  afternoon     JSONB       DEFAULT '{}'::jsonb,
  pre_dinner    JSONB       DEFAULT '{}'::jsonb,
  dinner        JSONB       DEFAULT '{}'::jsonb,
  evening       JSONB       DEFAULT '{}'::jsonb,
  sleep         JSONB       DEFAULT '{}'::jsonb,

  -- ── Summary fields ─────────────────────────────────────────
  total_calories    INTEGER,
  total_water_ml    INTEGER,
  key_benefits      JSONB,       -- ["Improved sleep", "Toxin removal"]
  target_symptoms   JSONB,       -- ["Fatigue", "Brain fog"]
  contraindications JSONB,       -- ["Pregnancy", "Heart conditions"]
  equipment_needed  JSONB,       -- ["Sauna", "Yoga mat"]
  
  -- ── Linked elements ────────────────────────────────────────
  elements_targeted JSONB,       -- {"vitamin_d": "replenish", "magnesium": "supplement"}
  
  -- ── Metadata ───────────────────────────────────────────────
  source        TEXT,            -- 'healthscan', 'community', 'expert'
  expert_id     TEXT,            -- FK to hs_experts if created by expert
  tags          TEXT[],
  is_active     BOOLEAN         DEFAULT true,
  is_featured   BOOLEAN         DEFAULT false,
  sort_order    INTEGER         DEFAULT 100,
  created_at    TIMESTAMPTZ     DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     DEFAULT NOW()
);

ALTER TABLE catalog_protocols ENABLE ROW LEVEL SECURITY;

-- Public read (catalog data is public)
CREATE POLICY "protocols_public_read"
  ON catalog_protocols FOR SELECT
  USING (true);

-- Service role full access
CREATE POLICY "protocols_service_role"
  ON catalog_protocols FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can manage (admin panel)
CREATE POLICY "protocols_authenticated_manage"
  ON catalog_protocols FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

GRANT SELECT ON catalog_protocols TO anon;
GRANT ALL ON catalog_protocols TO authenticated;
GRANT ALL ON catalog_protocols TO service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_protocols_category ON catalog_protocols(category);
CREATE INDEX IF NOT EXISTS idx_protocols_difficulty ON catalog_protocols(difficulty);
CREATE INDEX IF NOT EXISTS idx_protocols_is_active ON catalog_protocols(is_active);
CREATE INDEX IF NOT EXISTS idx_protocols_is_featured ON catalog_protocols(is_featured);
CREATE INDEX IF NOT EXISTS idx_protocols_sort_order ON catalog_protocols(sort_order);

COMMENT ON TABLE catalog_protocols IS 'Full-day health protocols from night-before preparation through sleep';
COMMENT ON COLUMN catalog_protocols.night_before IS 'Evening prep: no screens, supplements, light stretching, meal prep';
COMMENT ON COLUMN catalog_protocols.wake_up IS 'First 15 min after waking: hydration, light, breathwork';
COMMENT ON COLUMN catalog_protocols.morning IS 'Morning routine: exercise, cold exposure, journaling';
COMMENT ON COLUMN catalog_protocols.breakfast IS 'First meal: recipes, supplements, timing';
COMMENT ON COLUMN catalog_protocols.mid_morning IS 'Mid-morning: snacks, hydration, movement break';
COMMENT ON COLUMN catalog_protocols.lunch IS 'Midday meal: recipes, supplements';
COMMENT ON COLUMN catalog_protocols.afternoon IS 'Afternoon: activity, hydration, focus work';
COMMENT ON COLUMN catalog_protocols.pre_dinner IS 'Pre-dinner: light exercise, sauna, wind-down start';
COMMENT ON COLUMN catalog_protocols.dinner IS 'Evening meal: recipes, timing (3hrs before sleep)';
COMMENT ON COLUMN catalog_protocols.evening IS 'Evening routine: relaxation, supplements, no blue light';
COMMENT ON COLUMN catalog_protocols.sleep IS 'Sleep: environment, temperature, duration target';

-- ── 2. Seed sample protocols ─────────────────────────────────
INSERT INTO catalog_protocols (id, name, description, category, difficulty, duration_days, icon_name, night_before, wake_up, morning, breakfast, mid_morning, lunch, afternoon, pre_dinner, dinner, evening, sleep, key_benefits, target_symptoms, sort_order)
VALUES
(
  'detox-day',
  'Full Detox Day',
  'A comprehensive 24-hour detox protocol designed to support your body''s natural elimination pathways through sweat, hydration, nutrition, and rest.',
  'detox',
  'intermediate',
  1,
  'Droplets',
  '{"instructions": "Light dinner by 7pm. No alcohol or processed food. Take activated charcoal (500mg). Prepare overnight oats for morning. Set room to 18°C.", "supplements": ["activated_charcoal"], "duration_min": 60, "notes": "Hydrate well — 500ml water before bed"}'::jsonb,
  '{"instructions": "Drink 500ml warm lemon water immediately. 5 min deep breathing. Morning sunlight exposure for 10 min.", "activities": ["breathwork"], "duration_min": 20, "notes": "No phone for first 20 minutes"}'::jsonb,
  '{"instructions": "30-min brisk walk or light jog to promote lymphatic drainage. Follow with 3-min cold shower.", "activities": ["walking", "cold_plunge"], "duration_min": 45, "notes": "Sweat is key — dress warmly if walking"}'::jsonb,
  '{"instructions": "Green smoothie: spinach, celery, cucumber, ginger, lemon, chlorella powder. Take supplements with breakfast.", "recipes": ["green_detox_smoothie"], "supplements": ["chlorella", "vitamin_c"], "duration_min": 20}'::jsonb,
  '{"instructions": "Herbal tea (dandelion root or milk thistle). 500ml water. 10-min stretch break.", "activities": ["stretching"], "duration_min": 30}'::jsonb,
  '{"instructions": "Large mixed salad with cruciferous vegetables (broccoli, kale, cabbage), avocado, olive oil, lemon dressing. Sulforaphane supports Phase II liver detox.", "recipes": ["cruciferous_detox_salad"], "duration_min": 30}'::jsonb,
  '{"instructions": "20-min infrared sauna session OR hot bath with Epsom salts (2 cups). Rehydrate with electrolyte water after.", "activities": ["sauna"], "duration_min": 45, "notes": "Drink 1L water during and after sauna"}'::jsonb,
  '{"instructions": "Light yoga or stretching. Prepare dinner ingredients. Take glutathione supplement.", "activities": ["yoga"], "supplements": ["glutathione"], "duration_min": 30}'::jsonb,
  '{"instructions": "Steamed wild salmon with roasted vegetables (beets, sweet potato, garlic). Rich in omega-3 and antioxidants. Finish eating by 7pm.", "recipes": ["salmon_detox_bowl"], "duration_min": 30, "notes": "No food after 7pm — start overnight fast"}'::jsonb,
  '{"instructions": "Magnesium glycinate (400mg). Chamomile tea. 10-min gratitude journaling. Blue light blocking glasses from 8pm.", "supplements": ["magnesium_glycinate"], "duration_min": 60}'::jsonb,
  '{"instructions": "Room at 18°C. Blackout curtains. Aim for 8 hours. Sleep by 10pm.", "duration_min": 480, "notes": "Target: 10pm–6am"}'::jsonb,
  '["Liver support", "Heavy metal clearance", "Improved digestion", "Reduced inflammation", "Mental clarity"]'::jsonb,
  '["Fatigue", "Brain fog", "Bloating", "Skin issues"]'::jsonb,
  1
),
(
  'recovery-day',
  'Active Recovery Day',
  'Gentle movement, anti-inflammatory nutrition, and targeted supplementation to optimise recovery after intense training or stressful periods.',
  'recovery',
  'beginner',
  1,
  'Heart',
  '{"instructions": "Casein protein shake or Greek yoghurt. Magnesium supplement. Legs elevated for 10 min. Foam roll tight areas.", "supplements": ["magnesium_glycinate", "zinc"], "duration_min": 30}'::jsonb,
  '{"instructions": "500ml water with pinch of sea salt. 5 min gentle stretching in bed. Sunlight exposure.", "duration_min": 15}'::jsonb,
  '{"instructions": "20-min easy walk. Focus on nasal breathing. Optional: 2-min cold shower finish.", "activities": ["walking"], "duration_min": 25}'::jsonb,
  '{"instructions": "Anti-inflammatory breakfast: overnight oats with blueberries, walnuts, turmeric, honey. Omega-3 supplement.", "supplements": ["omega_3", "vitamin_d"], "duration_min": 20}'::jsonb,
  '{"instructions": "Bone broth (250ml). Gentle mobility work — hips, shoulders, ankles. Hydrate.", "duration_min": 30}'::jsonb,
  '{"instructions": "Wild salmon or sardines with quinoa and steamed greens. Rich in omega-3 and complete protein for repair.", "duration_min": 30}'::jsonb,
  '{"instructions": "15-min restorative yoga or foam rolling. Nap if needed (20 min max). Tart cherry juice for melatonin.", "activities": ["yoga"], "duration_min": 45}'::jsonb,
  '{"instructions": "Epsom salt bath (20 min) or contrast shower (hot 3 min / cold 1 min × 3). Compression garments optional.", "duration_min": 30}'::jsonb,
  '{"instructions": "Lean protein with sweet potato and leafy greens. Glycine-rich bone broth soup. Finish by 7:30pm.", "duration_min": 30}'::jsonb,
  '{"instructions": "Glycine (3g) + magnesium. Gentle stretching. No screens after 9pm. Read or meditate.", "supplements": ["glycine", "magnesium_glycinate"], "duration_min": 45}'::jsonb,
  '{"instructions": "Cool room (18°C). White noise if needed. Target 9+ hours for optimal recovery.", "duration_min": 540, "notes": "Extra sleep is the #1 recovery tool"}'::jsonb,
  '["Muscle repair", "Reduced DOMS", "Nervous system recovery", "Joint health", "Improved next-day performance"]'::jsonb,
  '["Muscle soreness", "Fatigue", "Poor sleep", "Joint stiffness"]'::jsonb,
  2
),
(
  'sleep-optimisation',
  'Sleep Optimisation Protocol',
  'A full-day protocol structured to maximise sleep quality through light exposure timing, meal timing, supplementation, and environment control.',
  'sleep',
  'beginner',
  1,
  'Moon',
  '{"instructions": "This block IS the protocol goal. Room temp 18°C. Complete darkness. No phone in bedroom. Weighted blanket optional.", "duration_min": 480, "notes": "This is the target outcome — work backward from desired sleep time"}'::jsonb,
  '{"instructions": "Bright light within 5 min of waking (sunlight ideal, 10k lux lamp if overcast). No snooze button. Cold water face splash.", "duration_min": 15, "notes": "Anchors circadian rhythm"}'::jsonb,
  '{"instructions": "Exercise in morning sunlight. Any cardio 20+ min. Caffeine OK before 12pm ONLY.", "activities": ["running", "walking", "cycling"], "duration_min": 30}'::jsonb,
  '{"instructions": "High-protein breakfast with complex carbs. Eggs, oats, berries. Coffee permitted (last cup).", "duration_min": 20, "notes": "NO caffeine after noon"}'::jsonb,
  '{"instructions": "Second sunlight exposure (10 min outside). Green tea OK (low caffeine). Movement break.", "duration_min": 15}'::jsonb,
  '{"instructions": "Balanced meal. Include tryptophan sources: turkey, chicken, eggs, cheese. Complex carbs for serotonin.", "duration_min": 30}'::jsonb,
  '{"instructions": "Sunlight exposure again if possible. Light walk. No caffeine. Start winding down stimulation.", "activities": ["walking"], "duration_min": 20}'::jsonb,
  '{"instructions": "Watch sunset if possible (signals circadian wind-down). Dim all lights. Start blue-light blocking.", "duration_min": 15, "notes": "Blue light blocking glasses from now until bed"}'::jsonb,
  '{"instructions": "High-glycemic carbs aid sleep: white rice, potato. Tart cherry juice. Kiwi fruit (2). Finish eating 3 hrs before bed.", "duration_min": 30, "notes": "Finish by 7pm if sleeping at 10pm"}'::jsonb,
  '{"instructions": "Magnesium glycinate 400mg + L-theanine 200mg + Apigenin 50mg. Hot shower/bath (raises then drops core temp). Journaling or reading ONLY.", "supplements": ["magnesium_glycinate", "l_theanine", "apigenin"], "duration_min": 60}'::jsonb,
  '{"instructions": "Room 18°C. Complete darkness. Earplugs or white noise. Phone in another room. Body scan meditation in bed.", "duration_min": 480, "notes": "Consistent time every night — even weekends"}'::jsonb,
  '["Deep sleep increase", "Faster sleep onset", "Better HRV", "Morning energy", "Hormone optimisation"]'::jsonb,
  '["Insomnia", "Poor sleep quality", "Night waking", "Daytime fatigue"]'::jsonb,
  3
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Also re-seed activities if table is empty ─────────────
-- (Fixes "No records found" issue if seed wasn't applied)
INSERT INTO catalog_activities (id, name, description, category, icon_name, sweat_level, default_duration_min, calories_per_minute, mineral_impact, toxin_loss, benefits, strava_types, sort_order)
SELECT * FROM (VALUES
  ('running', 'Running', 'Outdoor or treadmill running', 'sport', 'Footprints', 'high', 30, 10,
   '[{"name":"Sodium","lostMg":460},{"name":"Potassium","lostMg":100},{"name":"Magnesium","lostMg":8}]'::jsonb,
   '[{"name":"Lead (Pb)","lostUg":1.2,"note":"Heavy metal"},{"name":"BPA","lostUg":2.0,"note":"Endocrine disruptor"}]'::jsonb,
   '["Cardiovascular health","Endurance","Weight management","Mental clarity"]'::jsonb,
   '["Run","TrailRun","VirtualRun"]'::jsonb, 1),
  ('cycling', 'Cycling', 'Road, mountain, or stationary bike', 'sport', 'Bike', 'high', 45, 8,
   '[{"name":"Sodium","lostMg":400},{"name":"Potassium","lostMg":80}]'::jsonb,
   '[{"name":"Lead (Pb)","lostUg":1.0,"note":"Heavy metal"}]'::jsonb,
   '["Lower body strength","Endurance","Joint-friendly cardio"]'::jsonb,
   '["Ride","MountainBikeRide","VirtualRide"]'::jsonb, 2),
  ('swimming', 'Swimming', 'Pool or open water laps', 'sport', 'Waves', 'moderate', 30, 9,
   '[{"name":"Sodium","lostMg":200},{"name":"Potassium","lostMg":50}]'::jsonb, '[]'::jsonb,
   '["Full-body workout","Joint-friendly","Cardiovascular fitness"]'::jsonb,
   '["Swim"]'::jsonb, 3),
  ('walking', 'Walking', 'Brisk walk or hiking', 'sport', 'PersonStanding', 'low', 30, 4,
   '[{"name":"Sodium","lostMg":100}]'::jsonb, '[]'::jsonb,
   '["Joint health","Mental wellbeing","Accessible fitness"]'::jsonb,
   '["Walk","Hike"]'::jsonb, 4),
  ('weights', 'Weight Training', 'Strength and resistance training', 'sport', 'Dumbbell', 'moderate', 45, 6,
   '[{"name":"Sodium","lostMg":300},{"name":"Zinc","lostMg":0.4}]'::jsonb,
   '[{"name":"Urea","lostUg":380,"note":"Metabolic waste"}]'::jsonb,
   '["Muscle growth","Bone density","Metabolic boost"]'::jsonb,
   '["WeightTraining","Crossfit"]'::jsonb, 5),
  ('yoga', 'Yoga', 'Vinyasa, hatha, or power yoga', 'flexibility', 'PersonStanding', 'low', 60, 3,
   '[{"name":"Sodium","lostMg":80}]'::jsonb, '[]'::jsonb,
   '["Flexibility","Stress reduction","Balance","Mindfulness"]'::jsonb,
   '["Yoga"]'::jsonb, 6),
  ('hiit', 'HIIT', 'High-intensity interval training', 'sport', 'Zap', 'high', 25, 12,
   '[{"name":"Sodium","lostMg":500},{"name":"Potassium","lostMg":120}]'::jsonb,
   '[{"name":"Lead (Pb)","lostUg":1.5,"note":"Heavy metal"},{"name":"BPA","lostUg":2.5,"note":"Endocrine disruptor"}]'::jsonb,
   '["Fat burning","Cardiovascular fitness","Time-efficient"]'::jsonb,
   '["HIIT"]'::jsonb, 7),
  ('sauna', 'Sauna', 'Infrared or traditional sauna session', 'wellness', 'Flame', 'high', 20, 2,
   '[{"name":"Sodium","lostMg":600},{"name":"Potassium","lostMg":150},{"name":"Magnesium","lostMg":12}]'::jsonb,
   '[{"name":"Lead (Pb)","lostUg":2.0,"note":"Heavy metal"},{"name":"Cadmium (Cd)","lostUg":0.8,"note":"Heavy metal"},{"name":"BPA","lostUg":4.0,"note":"Endocrine disruptor"},{"name":"Mercury (Hg)","lostUg":0.3,"note":"Heavy metal"}]'::jsonb,
   '["Detoxification","Cardiovascular health","Skin health","Recovery"]'::jsonb,
   '[]'::jsonb, 8),
  ('cold_plunge', 'Cold Plunge', 'Cold water immersion or ice bath', 'wellness', 'Snowflake', 'none', 5, 1,
   '[]'::jsonb, '[]'::jsonb,
   '["Inflammation reduction","Mental resilience","Recovery","Immune boost"]'::jsonb,
   '[]'::jsonb, 9),
  ('meditation', 'Meditation', 'Mindfulness or guided meditation', 'wellness', 'Brain', 'none', 15, 1,
   '[]'::jsonb, '[]'::jsonb,
   '["Stress reduction","Focus","Emotional regulation","Sleep quality"]'::jsonb,
   '[]'::jsonb, 10),
  ('stretching', 'Stretching', 'Dynamic or static stretching routine', 'flexibility', 'Move', 'none', 15, 2,
   '[]'::jsonb, '[]'::jsonb,
   '["Flexibility","Injury prevention","Recovery","Posture"]'::jsonb,
   '[]'::jsonb, 11),
  ('breathwork', 'Breathwork', 'Wim Hof, box breathing, or pranayama', 'wellness', 'Wind', 'none', 10, 1,
   '[]'::jsonb, '[]'::jsonb,
   '["Stress management","Oxygenation","Nervous system regulation","Focus"]'::jsonb,
   '[]'::jsonb, 12),
  ('pilates', 'Pilates', 'Mat or reformer Pilates', 'flexibility', 'PersonStanding', 'low', 45, 4,
   '[{"name":"Sodium","lostMg":120}]'::jsonb, '[]'::jsonb,
   '["Core strength","Flexibility","Posture","Back pain relief"]'::jsonb,
   '["Pilates"]'::jsonb, 13),
  ('tennis', 'Tennis', 'Singles or doubles tennis', 'sport', 'Trophy', 'high', 60, 8,
   '[{"name":"Sodium","lostMg":450},{"name":"Potassium","lostMg":100}]'::jsonb,
   '[{"name":"Lead (Pb)","lostUg":1.1,"note":"Heavy metal"}]'::jsonb,
   '["Agility","Cardiovascular health","Hand-eye coordination"]'::jsonb,
   '["Tennis"]'::jsonb, 14),
  ('rowing', 'Rowing', 'Machine or on-water rowing', 'sport', 'Ship', 'high', 30, 9,
   '[{"name":"Sodium","lostMg":420},{"name":"Potassium","lostMg":90}]'::jsonb,
   '[{"name":"Urea","lostUg":450,"note":"Metabolic waste"}]'::jsonb,
   '["Full-body workout","Cardiovascular fitness","Low impact"]'::jsonb,
   '["Rowing"]'::jsonb, 15)
) AS v(id, name, description, category, icon_name, sweat_level, default_duration_min, calories_per_minute, mineral_impact, toxin_loss, benefits, strava_types, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM catalog_activities LIMIT 1);
