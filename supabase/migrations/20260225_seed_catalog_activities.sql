-- Seed: catalog_activities comprehensive data
-- Sources: mobile AddActivityModal.tsx ACTIVITIES array + sportsService.ts FALLBACK_SPORTS + sportIcons.tsx SPORT_ICONS

INSERT INTO catalog_activities (id, name, description, category, icon_name, sweat_level, default_duration_min, calories_per_minute, mineral_impact, toxin_loss, benefits, strava_types, sort_order)
VALUES
-- ══════════════════════════════════════════════════════════════════════════
-- SPORTS
-- ══════════════════════════════════════════════════════════════════════════
('running', 'Running', 'Outdoor or treadmill running', 'sport', 'Footprints', 'high', 30, 10,
 '[{"name":"Sodium","lostMg":460},{"name":"Potassium","lostMg":100},{"name":"Magnesium","lostMg":8},{"name":"Calcium","lostMg":20},{"name":"Zinc","lostMg":0.5},{"name":"Iron","lostMg":0.2}]',
 '[{"name":"Lead (Pb)","lostUg":1.2,"note":"Heavy metal"},{"name":"Cadmium (Cd)","lostUg":0.3,"note":"Heavy metal"},{"name":"Arsenic (As)","lostUg":0.5,"note":"Metalloid"},{"name":"BPA","lostUg":2.0,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":560,"note":"Metabolic waste"}]',
 '["Cardiovascular health","Endurance","Weight management","Mental clarity"]',
 '["Run","TrailRun","VirtualRun"]', 1),

('cycling', 'Cycling', 'Road, mountain, or stationary bike', 'sport', 'Bike', 'high', 45, 8,
 '[{"name":"Sodium","lostMg":400},{"name":"Potassium","lostMg":80},{"name":"Magnesium","lostMg":6},{"name":"Calcium","lostMg":16}]',
 '[{"name":"Lead (Pb)","lostUg":1.0,"note":"Heavy metal"},{"name":"BPA","lostUg":1.8,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":480,"note":"Metabolic waste"}]',
 '["Lower body strength","Endurance","Joint-friendly cardio"]',
 '["Ride","MountainBikeRide","VirtualRide","GravelRide","EBikeRide"]', 2),

('swimming', 'Swimming', 'Pool or open water laps', 'sport', 'Waves', 'moderate', 30, 9,
 '[{"name":"Sodium","lostMg":200},{"name":"Potassium","lostMg":50},{"name":"Magnesium","lostMg":4}]',
 '[]',
 '["Full-body workout","Joint-friendly","Cardiovascular fitness"]',
 '["Swim"]', 3),

('walking', 'Walking', 'Brisk walk or hiking', 'sport', 'PersonStanding', 'low', 30, 4,
 '[{"name":"Sodium","lostMg":100},{"name":"Potassium","lostMg":30}]',
 '[]',
 '["Joint health","Mental wellbeing","Accessible fitness"]',
 '["Walk","Hike"]', 4),

('weights', 'Weight Training', 'Strength and resistance training', 'sport', 'Dumbbell', 'moderate', 45, 6,
 '[{"name":"Sodium","lostMg":300},{"name":"Potassium","lostMg":70},{"name":"Magnesium","lostMg":5},{"name":"Zinc","lostMg":0.4}]',
 '[{"name":"Lead (Pb)","lostUg":0.8,"note":"Heavy metal"},{"name":"BPA","lostUg":1.4,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":380,"note":"Metabolic waste"}]',
 '["Muscle growth","Bone density","Metabolic boost"]',
 '["WeightTraining","Crossfit"]', 5),

('yoga', 'Yoga', 'Vinyasa, hatha, or power yoga', 'flexibility', 'PersonStanding', 'low', 60, 3,
 '[{"name":"Sodium","lostMg":80},{"name":"Potassium","lostMg":20}]',
 '[]',
 '["Flexibility","Stress relief","Balance","Mind-body connection"]',
 '["Yoga"]', 6),

('tennis', 'Tennis', 'Singles or doubles match', 'sport', 'CircleDot', 'high', 60, 8,
 '[{"name":"Sodium","lostMg":500},{"name":"Potassium","lostMg":110},{"name":"Magnesium","lostMg":9},{"name":"Calcium","lostMg":22}]',
 '[{"name":"Lead (Pb)","lostUg":1.5,"note":"Heavy metal"},{"name":"Cadmium (Cd)","lostUg":0.4,"note":"Heavy metal"},{"name":"BPA","lostUg":2.2,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":600,"note":"Metabolic waste"}]',
 '["Agility","Hand-eye coordination","Cardiovascular fitness"]',
 '["Tennis"]', 7),

('football', 'Football', 'Soccer, rugby, or American football', 'sport', 'Dribbble', 'high', 60, 9,
 '[{"name":"Sodium","lostMg":520},{"name":"Potassium","lostMg":120},{"name":"Magnesium","lostMg":10}]',
 '[{"name":"Lead (Pb)","lostUg":1.6,"note":"Heavy metal"},{"name":"Cadmium (Cd)","lostUg":0.5,"note":"Heavy metal"},{"name":"BPA","lostUg":2.4,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":640,"note":"Metabolic waste"},{"name":"Ammonia","lostUg":120,"note":"Metabolic waste"}]',
 '["Teamwork","Endurance","Agility","Cardiovascular fitness"]',
 '["Soccer","Football"]', 8),

('basketball', 'Basketball', 'Indoor or outdoor basketball', 'sport', 'CircleDot', 'high', 60, 8,
 '[{"name":"Sodium","lostMg":480},{"name":"Potassium","lostMg":100},{"name":"Magnesium","lostMg":8}]',
 '[{"name":"Lead (Pb)","lostUg":1.4,"note":"Heavy metal"},{"name":"BPA","lostUg":2.0,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":560,"note":"Metabolic waste"}]',
 '["Agility","Hand-eye coordination","Endurance","Teamwork"]',
 '["Basketball"]', 9),

('volleyball', 'Volleyball', 'Indoor or beach volleyball', 'sport', 'CircleDot', 'moderate', 60, 6,
 '[{"name":"Sodium","lostMg":350},{"name":"Potassium","lostMg":75}]',
 '[]',
 '["Teamwork","Reflexes","Upper body strength"]',
 '["Volleyball"]', 10),

('baseball', 'Baseball', 'Baseball or softball', 'sport', 'CircleDot', 'moderate', 90, 5,
 '[{"name":"Sodium","lostMg":250},{"name":"Potassium","lostMg":55}]',
 '[]',
 '["Hand-eye coordination","Explosive power","Teamwork"]',
 '["Baseball","Softball"]', 11),

('golf', 'Golf', '18 holes or driving range', 'sport', 'Flag', 'low', 120, 3,
 '[{"name":"Sodium","lostMg":150},{"name":"Potassium","lostMg":35}]',
 '[]',
 '["Walking","Focus","Core rotation","Stress relief"]',
 '["Golf"]', 12),

('boxing', 'Boxing', 'Sparring, bag work, or cardio boxing', 'sport', 'Swords', 'high', 45, 10,
 '[{"name":"Sodium","lostMg":550},{"name":"Potassium","lostMg":130},{"name":"Magnesium","lostMg":11}]',
 '[{"name":"Lead (Pb)","lostUg":1.8,"note":"Heavy metal"},{"name":"BPA","lostUg":2.5,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":680,"note":"Metabolic waste"}]',
 '["Cardiovascular fitness","Upper body power","Stress relief","Coordination"]',
 '["Boxing"]', 13),

('martial_arts', 'Martial Arts', 'Karate, jiu-jitsu, judo, or taekwondo', 'sport', 'Swords', 'high', 45, 9,
 '[{"name":"Sodium","lostMg":480},{"name":"Potassium","lostMg":100},{"name":"Magnesium","lostMg":8}]',
 '[{"name":"Lead (Pb)","lostUg":1.4,"note":"Heavy metal"},{"name":"Cadmium (Cd)","lostUg":0.4,"note":"Heavy metal"},{"name":"BPA","lostUg":2.0,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":580,"note":"Metabolic waste"},{"name":"Ammonia","lostUg":110,"note":"Metabolic waste"}]',
 '["Self-defense","Flexibility","Discipline","Cardiovascular fitness"]',
 '["MartialArts"]', 14),

('climbing', 'Climbing', 'Bouldering, sport, or wall climbing', 'sport', 'Mountain', 'moderate', 60, 7,
 '[{"name":"Sodium","lostMg":280},{"name":"Potassium","lostMg":65},{"name":"Magnesium","lostMg":5}]',
 '[{"name":"Lead (Pb)","lostUg":0.9,"note":"Heavy metal"},{"name":"BPA","lostUg":1.5,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":400,"note":"Metabolic waste"}]',
 '["Grip strength","Problem solving","Full body strength","Mental focus"]',
 '["Climb","RockClimbing","Bouldering"]', 15),

('rowing', 'Rowing', 'Machine or on-water rowing', 'sport', 'Waves', 'high', 30, 9,
 '[{"name":"Sodium","lostMg":440},{"name":"Potassium","lostMg":95},{"name":"Magnesium","lostMg":7}]',
 '[{"name":"Lead (Pb)","lostUg":1.3,"note":"Heavy metal"},{"name":"Cadmium (Cd)","lostUg":0.4,"note":"Heavy metal"},{"name":"BPA","lostUg":2.1,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":560,"note":"Metabolic waste"},{"name":"Ammonia","lostUg":100,"note":"Metabolic waste"}]',
 '["Full body workout","Cardiovascular fitness","Low impact"]',
 '["Rowing","Kayaking","Canoeing","StandUpPaddling"]', 16),

('skiing', 'Skiing', 'Downhill, cross-country, or backcountry', 'outdoor', 'Mountain', 'high', 60, 8,
 '[{"name":"Sodium","lostMg":400},{"name":"Potassium","lostMg":90}]',
 '[]',
 '["Lower body strength","Balance","Cardiovascular fitness","Outdoor exposure"]',
 '["NordicSki","BackcountrySki","AlpineSki"]', 17),

('snowboarding', 'Snowboarding', 'Freestyle or freeride snowboarding', 'outdoor', 'Mountain', 'high', 60, 7,
 '[{"name":"Sodium","lostMg":380},{"name":"Potassium","lostMg":85}]',
 '[]',
 '["Balance","Core strength","Leg power","Outdoor activity"]',
 '["Snowboard"]', 18),

('surfing', 'Surfing', 'Ocean wave surfing or bodyboarding', 'outdoor', 'Waves', 'moderate', 60, 6,
 '[{"name":"Sodium","lostMg":300},{"name":"Potassium","lostMg":70}]',
 '[]',
 '["Balance","Upper body strength","Core stability","Mental wellbeing"]',
 '["Surfing","Kitesurf","Windsurf"]', 19),

('skateboarding', 'Skateboarding', 'Street, park, or cruising', 'outdoor', 'Zap', 'moderate', 45, 5,
 '[{"name":"Sodium","lostMg":250},{"name":"Potassium","lostMg":55}]',
 '[]',
 '["Balance","Coordination","Leg strength","Creativity"]',
 '["Skateboard"]', 20),

('table_tennis', 'Table Tennis', 'Competitive or recreational ping pong', 'sport', 'CircleDot', 'moderate', 30, 5,
 '[{"name":"Sodium","lostMg":200},{"name":"Potassium","lostMg":45}]',
 '[]',
 '["Reflexes","Hand-eye coordination","Mental agility"]',
 '["TableTennis"]', 21),

('badminton', 'Badminton', 'Singles or doubles badminton', 'sport', 'CircleDot', 'high', 45, 7,
 '[{"name":"Sodium","lostMg":420},{"name":"Potassium","lostMg":90}]',
 '[]',
 '["Agility","Speed","Cardiovascular fitness","Reflexes"]',
 '["Badminton"]', 22),

('cricket', 'Cricket', 'Batting, bowling, and fielding', 'sport', 'CircleDot', 'moderate', 120, 4,
 '[{"name":"Sodium","lostMg":300},{"name":"Potassium","lostMg":65}]',
 '[]',
 '["Hand-eye coordination","Sprint fitness","Teamwork"]',
 '["Cricket"]', 23),

('rugby', 'Rugby', 'Rugby union or league', 'sport', 'Shield', 'high', 80, 9,
 '[{"name":"Sodium","lostMg":540},{"name":"Potassium","lostMg":125}]',
 '[]',
 '["Full body strength","Endurance","Teamwork","Mental toughness"]',
 '["Rugby"]', 24),

('hockey', 'Hockey', 'Ice hockey or field hockey', 'sport', 'Swords', 'high', 60, 8,
 '[{"name":"Sodium","lostMg":460},{"name":"Potassium","lostMg":100}]',
 '[]',
 '["Cardiovascular fitness","Speed","Coordination","Teamwork"]',
 '["FieldHockey"]', 25),

('dancing', 'Dancing', 'Any style — social, cardio, or freestyle', 'sport', 'Music', 'moderate', 30, 6,
 '[{"name":"Sodium","lostMg":250},{"name":"Potassium","lostMg":60}]',
 '[{"name":"Lead (Pb)","lostUg":0.7,"note":"Heavy metal"},{"name":"BPA","lostUg":1.2,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":340,"note":"Metabolic waste"}]',
 '["Coordination","Cardiovascular fitness","Mood boost","Social connection"]',
 '["Dance"]', 26),

('gymnastics', 'Gymnastics', 'Floor, apparatus, or rhythmic gymnastics', 'sport', 'Sparkles', 'high', 60, 7,
 '[{"name":"Sodium","lostMg":400},{"name":"Potassium","lostMg":90}]',
 '[]',
 '["Flexibility","Strength","Balance","Body control"]',
 '["Gymnastics"]', 27),

('crossfit', 'CrossFit', 'High-intensity functional fitness', 'strength', 'Flame', 'high', 45, 10,
 '[{"name":"Sodium","lostMg":560},{"name":"Potassium","lostMg":130},{"name":"Magnesium","lostMg":11}]',
 '[{"name":"Lead (Pb)","lostUg":1.8,"note":"Heavy metal"},{"name":"BPA","lostUg":2.5,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":700,"note":"Metabolic waste"}]',
 '["Functional fitness","Cardiovascular endurance","Strength","Community"]',
 '["Crossfit","HIIT"]', 28),

('jump_rope', 'Jump Rope', 'Skipping for cardio and coordination', 'sport', 'Zap', 'high', 15, 12,
 '[{"name":"Sodium","lostMg":350},{"name":"Potassium","lostMg":80}]',
 '[]',
 '["Cardiovascular fitness","Coordination","Bone density","Calorie burning"]',
 '[]', 29),

('pilates', 'Pilates', 'Mat or reformer Pilates', 'flexibility', 'PersonStanding', 'low', 45, 4,
 '[{"name":"Sodium","lostMg":120},{"name":"Potassium","lostMg":30}]',
 '[]',
 '["Core strength","Posture","Flexibility","Body awareness"]',
 '["Pilates"]', 30),

('hiking', 'Hiking', 'Trail hiking in nature', 'outdoor', 'Mountain', 'moderate', 90, 5,
 '[{"name":"Sodium","lostMg":300},{"name":"Potassium","lostMg":70},{"name":"Magnesium","lostMg":5}]',
 '[]',
 '["Cardiovascular fitness","Mental wellbeing","Leg strength","Nature exposure"]',
 '["Hike"]', 31),

('american_football', 'American Football', 'Tackle or flag football', 'sport', 'Shield', 'high', 60, 9,
 '[{"name":"Sodium","lostMg":520},{"name":"Potassium","lostMg":120}]',
 '[]',
 '["Explosive power","Teamwork","Endurance","Agility"]',
 '["Football"]', 32),

('pickleball', 'Pickleball', 'Singles or doubles pickleball', 'sport', 'CircleDot', 'moderate', 45, 6,
 '[{"name":"Sodium","lostMg":280},{"name":"Potassium","lostMg":65}]',
 '[]',
 '["Hand-eye coordination","Agility","Social connection","Low impact"]',
 '["Pickleball"]', 33),

('kickboxing', 'Kickboxing', 'Cardio kickboxing or Muay Thai', 'sport', 'Swords', 'high', 45, 10,
 '[{"name":"Sodium","lostMg":540},{"name":"Potassium","lostMg":125}]',
 '[]',
 '["Full body workout","Stress relief","Coordination","Self-defense"]',
 '[]', 34),

('calisthenics', 'Calisthenics', 'Bodyweight strength training', 'strength', 'Dumbbell', 'moderate', 45, 7,
 '[{"name":"Sodium","lostMg":320},{"name":"Potassium","lostMg":75}]',
 '[]',
 '["Functional strength","Body control","No equipment needed","Flexibility"]',
 '[]', 35),

('powerlifting', 'Powerlifting', 'Squat, bench press, and deadlift focused', 'strength', 'Dumbbell', 'moderate', 60, 5,
 '[{"name":"Sodium","lostMg":280},{"name":"Potassium","lostMg":65}]',
 '[]',
 '["Maximum strength","Bone density","Hormonal response","Mental toughness"]',
 '["WeightTraining"]', 36),

-- ══════════════════════════════════════════════════════════════════════════
-- WELLNESS & RECOVERY
-- ══════════════════════════════════════════════════════════════════════════
('sauna', 'Sauna', 'Traditional dry or infrared sauna session', 'wellness', 'Flame', 'high', 15, 3,
 '[{"name":"Sodium","lostMg":600},{"name":"Potassium","lostMg":130},{"name":"Magnesium","lostMg":12},{"name":"Calcium","lostMg":25},{"name":"Zinc","lostMg":0.8},{"name":"Iron","lostMg":0.3}]',
 '[{"name":"Lead (Pb)","lostUg":2.5,"note":"Heavy metal — sweat excretes more than urine"},{"name":"Cadmium (Cd)","lostUg":0.8,"note":"Heavy metal"},{"name":"Mercury (Hg)","lostUg":0.4,"note":"Heavy metal — dental amalgam, fish"},{"name":"Arsenic (As)","lostUg":1.2,"note":"Metalloid — rice, water"},{"name":"BPA","lostUg":4.5,"note":"Endocrine disruptor — plastics"},{"name":"Phthalates (DEHP)","lostUg":3.8,"note":"Endocrine disruptor — plastics, cosmetics"},{"name":"PCBs","lostUg":0.2,"note":"Persistent organic pollutant"},{"name":"Urea","lostUg":720,"note":"Metabolic waste"},{"name":"Ammonia","lostUg":180,"note":"Metabolic waste"},{"name":"Lactic acid","lostUg":350,"note":"Metabolic byproduct"}]',
 '["Detoxification","Improved circulation","Reduced inflammation","Cardiovascular conditioning","Stress relief"]',
 '[]', 50),

('meditation', 'Meditation', 'Guided or unguided mindfulness practice', 'wellness', 'Timer', 'none', 15, 1,
 '[]',
 '[]',
 '["Stress reduction","Improved focus","Better sleep quality","Emotional regulation","Lower blood pressure"]',
 '["Meditation"]', 51),

('breathwork', 'Breathwork', 'Wim Hof, box breathing, or pranayama', 'wellness', 'Wind', 'low', 10, 2,
 '[]',
 '[]',
 '["Oxygenation","Nervous system regulation","Mental clarity","Stress relief","Immune support"]',
 '[]', 52),

('cold_plunge', 'Cold Plunge', 'Cold water immersion or ice bath', 'wellness', 'Snowflake', 'none', 5, 8,
 '[]',
 '[]',
 '["Reduced inflammation","Improved recovery","Dopamine boost","Mental resilience","Immune activation"]',
 '[]', 53),

('stretching', 'Stretching', 'Dynamic or static flexibility work', 'flexibility', 'PersonStanding', 'none', 15, 2,
 '[]',
 '[]',
 '["Flexibility","Injury prevention","Reduced muscle tension","Improved range of motion"]',
 '["Stretching"]', 54),

('foam_rolling', 'Foam Rolling', 'Self-myofascial release and recovery', 'recovery', 'CircleDot', 'none', 15, 1,
 '[]',
 '[]',
 '["Muscle recovery","Reduced soreness","Improved flexibility","Trigger point release"]',
 '[]', 55),

('massage', 'Massage', 'Sports, deep tissue, or relaxation massage', 'recovery', 'Hand', 'none', 60, 1,
 '[]',
 '[]',
 '["Muscle recovery","Stress relief","Pain reduction","Improved circulation"]',
 '[]', 56),

('red_light_therapy', 'Red Light Therapy', 'Near-infrared or red light exposure for recovery', 'recovery', 'Sun', 'none', 15, 1,
 '[]',
 '[]',
 '["Cellular energy","Skin health","Reduced inflammation","Wound healing"]',
 '[]', 57),

('contrast_therapy', 'Contrast Therapy', 'Alternating hot and cold water immersion', 'recovery', 'Thermometer', 'low', 20, 2,
 '[]',
 '[]',
 '["Improved circulation","Muscle recovery","Reduced swelling","Immune stimulation"]',
 '[]', 58),

('float_tank', 'Float Tank', 'Sensory deprivation float tank session', 'recovery', 'Droplets', 'none', 60, 1,
 '[]',
 '[]',
 '["Deep relaxation","Pain relief","Magnesium absorption","Mental clarity"]',
 '[]', 59),

('grounding', 'Grounding', 'Barefoot walking on natural surfaces', 'wellness', 'Leaf', 'none', 20, 2,
 '[]',
 '[]',
 '["Inflammation reduction","Sleep improvement","Stress relief","Electron transfer"]',
 '[]', 60),

('tai_chi', 'Tai Chi', 'Slow-form martial arts for balance and flow', 'flexibility', 'PersonStanding', 'low', 30, 3,
 '[{"name":"Sodium","lostMg":60},{"name":"Potassium","lostMg":15}]',
 '[]',
 '["Balance","Fall prevention","Stress relief","Joint mobility","Mind-body connection"]',
 '[]', 61),

('barre', 'Barre', 'Ballet-inspired fitness class', 'flexibility', 'Music', 'low', 45, 4,
 '[{"name":"Sodium","lostMg":150},{"name":"Potassium","lostMg":35}]',
 '[]',
 '["Muscle tone","Posture","Flexibility","Core strength"]',
 '[]', 62),

-- ══════════════════════════════════════════════════════════════════════════
-- OUTDOOR
-- ══════════════════════════════════════════════════════════════════════════
('kayaking', 'Kayaking', 'River, lake, or sea kayaking', 'outdoor', 'Waves', 'moderate', 60, 6,
 '[{"name":"Sodium","lostMg":300},{"name":"Potassium","lostMg":70}]',
 '[]',
 '["Upper body strength","Core stability","Nature exposure","Cardiovascular fitness"]',
 '["Kayaking","Canoeing"]', 70),

('sailing', 'Sailing', 'Dinghy, yacht, or catamaran sailing', 'outdoor', 'Wind', 'low', 120, 3,
 '[{"name":"Sodium","lostMg":150},{"name":"Potassium","lostMg":35}]',
 '[]',
 '["Teamwork","Problem solving","Upper body strength","Nature exposure"]',
 '["Sail"]', 71),

('horse_riding', 'Horse Riding', 'Equestrian riding or polo', 'outdoor', 'Leaf', 'moderate', 60, 5,
 '[{"name":"Sodium","lostMg":250},{"name":"Potassium","lostMg":55}]',
 '[]',
 '["Core strength","Balance","Animal connection","Posture"]',
 '[]', 72),

('scuba_diving', 'Scuba Diving', 'Recreational or technical diving', 'outdoor', 'Waves', 'low', 60, 5,
 '[{"name":"Sodium","lostMg":100}]',
 '[]',
 '["Breathing control","Nature exposure","Mental focus","Stress relief"]',
 '[]', 73),

('triathlon', 'Triathlon', 'Swim-bike-run multisport event', 'sport', 'Zap', 'high', 120, 9,
 '[{"name":"Sodium","lostMg":700},{"name":"Potassium","lostMg":160},{"name":"Magnesium","lostMg":14},{"name":"Calcium","lostMg":30}]',
 '[{"name":"Lead (Pb)","lostUg":2.0,"note":"Heavy metal"},{"name":"BPA","lostUg":3.0,"note":"Endocrine disruptor"},{"name":"Urea","lostUg":800,"note":"Metabolic waste"}]',
 '["Ultimate endurance","Full body fitness","Mental toughness","Cardiovascular health"]',
 '["Triathlon","Multisport"]', 74)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon_name = EXCLUDED.icon_name,
  sweat_level = EXCLUDED.sweat_level,
  default_duration_min = EXCLUDED.default_duration_min,
  calories_per_minute = EXCLUDED.calories_per_minute,
  mineral_impact = EXCLUDED.mineral_impact,
  toxin_loss = EXCLUDED.toxin_loss,
  benefits = EXCLUDED.benefits,
  strava_types = EXCLUDED.strava_types,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
