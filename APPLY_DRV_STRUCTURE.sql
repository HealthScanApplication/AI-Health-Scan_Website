-- ============================================================================
-- APPLY DRV STRUCTURE TO CATALOG_ELEMENTS
-- ============================================================================
-- This file combines the migration and test data for easy application
-- Apply this in Supabase SQL Editor: https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/sql
-- ============================================================================

-- STEP 1: Add DRV columns to catalog_elements table
-- ============================================================================

ALTER TABLE catalog_elements

-- Age range columns (storing DRV data per age group)
ADD COLUMN IF NOT EXISTS drv_infants_0_6m JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_infants_7_12m JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_children_1_3y JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_children_4_8y JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_children_9_13y JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_teens_14_18y JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_adults_19_30y JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_adults_31_50y JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_adults_51_70y JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_seniors_71y_plus JSONB DEFAULT '{}'::jsonb,

-- Female-specific condition columns
ADD COLUMN IF NOT EXISTS drv_pregnancy JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_breastfeeding JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_menopause JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drv_menstruation JSONB DEFAULT '{}'::jsonb;

-- STEP 2: Insert test Vitamin A data
-- ============================================================================

INSERT INTO catalog_elements (
  id,
  slug,
  name_common,
  type_label,
  category,
  health_role,
  description_simple,
  daily_recommended_adult,
  food_strategy,
  drv_infants_0_6m,
  drv_children_1_3y,
  drv_children_4_8y,
  drv_teens_14_18y,
  drv_adults_19_30y,
  drv_adults_31_50y,
  drv_seniors_71y_plus,
  drv_pregnancy,
  drv_breastfeeding,
  drv_menopause,
  drv_menstruation
) VALUES (
  'vitamin_a_drv',
  'vitamin-a-drv',
  'Vitamin A',
  'vitamin',
  'nutrient',
  'beneficial',
  'Essential fat-soluble vitamin crucial for vision, immune function, reproduction, and cellular communication.',
  '{"male": {"value": 900, "unit": "μg RAE"}, "female": {"value": 700, "unit": "μg RAE"}}'::jsonb,
  '{"animal": "Include liver, dairy, and fish for highly bioavailable preformed vitamin A.", "plant": "Choose orange, red, and dark green vegetables for provitamin A carotenoids.", "fortified": "Select fortified foods when natural sources are limited or inadequate.", "fermented": "Include fermented dairy products for enhanced nutrient absorption.", "other": "Consume with healthy fats to optimize absorption and conversion efficiency."}'::jsonb,
  '{"male": {"deficiency": {"threshold": 280, "unit": "μg", "symptoms": ["Poor night vision", "Dry eyes", "Weak immunity"]}, "optimal": {"minimum": 300, "recommended": 400, "maximum": 600, "unit": "μg", "benefits": ["Vision development", "Immune function", "Cell growth", "Bone formation"]}, "excess": {"daily_limit": 600, "acute_limit": 1800, "unit": "μg", "symptoms": ["Nausea", "Vomiting", "Fontanelle bulging"]}}, "female": {"deficiency": {"threshold": 280, "unit": "μg", "symptoms": ["Poor night vision", "Dry eyes", "Weak immunity"]}, "optimal": {"minimum": 300, "recommended": 400, "maximum": 600, "unit": "μg", "benefits": ["Vision development", "Immune function", "Cell growth", "Bone formation"]}, "excess": {"daily_limit": 600, "acute_limit": 1800, "unit": "μg", "symptoms": ["Nausea", "Vomiting", "Fontanelle bulging"]}}}'::jsonb,
  '{"male": {"deficiency": {"threshold": 210, "unit": "μg", "symptoms": ["Night blindness", "Frequent infections", "Slow growth"]}, "optimal": {"minimum": 250, "recommended": 300, "maximum": 600, "unit": "μg", "benefits": ["Vision", "Immunity", "Growth", "Skin health"]}, "excess": {"daily_limit": 600, "acute_limit": 1800, "unit": "μg", "symptoms": ["Headache", "Nausea", "Irritability"]}}, "female": {"deficiency": {"threshold": 210, "unit": "μg", "symptoms": ["Night blindness", "Frequent infections", "Slow growth"]}, "optimal": {"minimum": 250, "recommended": 300, "maximum": 600, "unit": "μg", "benefits": ["Vision", "Immunity", "Growth", "Skin health"]}, "excess": {"daily_limit": 600, "acute_limit": 1800, "unit": "μg", "symptoms": ["Headache", "Nausea", "Irritability"]}}}'::jsonb,
  '{"male": {"deficiency": {"threshold": 280, "unit": "μg", "symptoms": ["Night blindness", "Dry skin", "Respiratory infections"]}, "optimal": {"minimum": 350, "recommended": 400, "maximum": 900, "unit": "μg", "benefits": ["Vision", "Immune defense", "Bone growth", "Tissue repair"]}, "excess": {"daily_limit": 900, "acute_limit": 2700, "unit": "μg", "symptoms": ["Headache", "Dizziness", "Nausea"]}}, "female": {"deficiency": {"threshold": 280, "unit": "μg", "symptoms": ["Night blindness", "Dry skin", "Respiratory infections"]}, "optimal": {"minimum": 350, "recommended": 400, "maximum": 900, "unit": "μg", "benefits": ["Vision", "Immune defense", "Bone growth", "Tissue repair"]}, "excess": {"daily_limit": 900, "acute_limit": 2700, "unit": "μg", "symptoms": ["Headache", "Dizziness", "Nausea"]}}}'::jsonb,
  '{"male": {"deficiency": {"threshold": 630, "unit": "μg", "symptoms": ["Night blindness", "Acne", "Slow wound healing"]}, "optimal": {"minimum": 750, "recommended": 900, "maximum": 2800, "unit": "μg", "benefits": ["Vision", "Skin health", "Immune support", "Growth"]}, "excess": {"daily_limit": 2800, "acute_limit": 8400, "unit": "μg", "symptoms": ["Headache", "Blurred vision", "Bone pain"]}}, "female": {"deficiency": {"threshold": 490, "unit": "μg", "symptoms": ["Night blindness", "Acne", "Menstrual irregularities"]}, "optimal": {"minimum": 600, "recommended": 700, "maximum": 2800, "unit": "μg", "benefits": ["Vision", "Skin health", "Immune support", "Hormone balance"]}, "excess": {"daily_limit": 2800, "acute_limit": 8400, "unit": "μg", "symptoms": ["Headache", "Blurred vision", "Bone pain"]}}}'::jsonb,
  '{"male": {"deficiency": {"threshold": 630, "unit": "μg", "symptoms": ["Night blindness", "Dry eyes", "Weakened immunity", "Dry skin"]}, "optimal": {"minimum": 750, "recommended": 900, "maximum": 3000, "unit": "μg", "benefits": ["Vision", "Immune support", "Skin integrity", "Antioxidant protection"]}, "excess": {"daily_limit": 3000, "acute_limit": 9000, "unit": "μg", "symptoms": ["Nausea", "Headache", "Dizziness", "Liver damage"]}}, "female": {"deficiency": {"threshold": 490, "unit": "μg", "symptoms": ["Night blindness", "Dry eyes", "Weakened immunity", "Dry skin"]}, "optimal": {"minimum": 600, "recommended": 700, "maximum": 3000, "unit": "μg", "benefits": ["Vision", "Immune support", "Skin integrity", "Antioxidant protection"]}, "excess": {"daily_limit": 3000, "acute_limit": 9000, "unit": "μg", "symptoms": ["Nausea", "Headache", "Dizziness", "Liver damage"]}}}'::jsonb,
  '{"male": {"deficiency": {"threshold": 630, "unit": "μg", "symptoms": ["Night blindness", "Dry eyes", "Frequent infections", "Poor wound healing"]}, "optimal": {"minimum": 750, "recommended": 900, "maximum": 3000, "unit": "μg", "benefits": ["Vision", "Immunity", "Tissue repair", "Antioxidant protection"]}, "excess": {"daily_limit": 3000, "acute_limit": 9000, "unit": "μg", "symptoms": ["Nausea", "Headache", "Bone pain", "Liver toxicity"]}}, "female": {"deficiency": {"threshold": 490, "unit": "μg", "symptoms": ["Night blindness", "Dry eyes", "Frequent infections", "Poor wound healing"]}, "optimal": {"minimum": 600, "recommended": 700, "maximum": 3000, "unit": "μg", "benefits": ["Vision", "Immunity", "Tissue repair", "Antioxidant protection"]}, "excess": {"daily_limit": 3000, "acute_limit": 9000, "unit": "μg", "symptoms": ["Nausea", "Headache", "Bone pain", "Liver toxicity"]}}}'::jsonb,
  '{"male": {"deficiency": {"threshold": 630, "unit": "μg", "symptoms": ["Night blindness", "Macular degeneration", "Weakened immunity", "Dry skin"]}, "optimal": {"minimum": 750, "recommended": 900, "maximum": 3000, "unit": "μg", "benefits": ["Vision preservation", "Immune support", "Epithelial health", "Antioxidant protection"]}, "excess": {"daily_limit": 3000, "acute_limit": 9000, "unit": "μg", "symptoms": ["Nausea", "Bone fractures", "Liver damage"]}}, "female": {"deficiency": {"threshold": 490, "unit": "μg", "symptoms": ["Night blindness", "Macular degeneration", "Weakened immunity", "Dry skin"]}, "optimal": {"minimum": 600, "recommended": 700, "maximum": 3000, "unit": "μg", "benefits": ["Vision preservation", "Immune support", "Epithelial health", "Antioxidant protection"]}, "excess": {"daily_limit": 3000, "acute_limit": 9000, "unit": "μg", "symptoms": ["Nausea", "Bone fractures", "Liver damage"]}}}'::jsonb,
  '{"deficiency": {"threshold": 490, "unit": "μg", "symptoms": ["Increased infection risk", "Poor fetal development", "Night blindness", "Anemia"]}, "optimal": {"minimum": 550, "recommended": 770, "maximum": 3000, "unit": "μg", "benefits": ["Fetal development", "Placental function", "Vision development", "Immune transfer"]}, "excess": {"daily_limit": 3000, "unit": "μg", "symptoms": ["Birth defects", "Liver toxicity", "Teratogenic effects"]}, "trimester_specific": {"first": {"recommended": 770, "note": "Critical for organ formation"}, "second": {"recommended": 770, "note": "Supports rapid growth"}, "third": {"recommended": 770, "note": "Prepares for birth and lactation"}}}'::jsonb,
  '{"deficiency": {"threshold": 900, "unit": "μg", "symptoms": ["Low milk vitamin A", "Infant vision problems", "Weakened infant immunity"]}, "optimal": {"minimum": 900, "recommended": 1300, "maximum": 3000, "unit": "μg", "benefits": ["Milk vitamin A content", "Infant vision development", "Immune transfer", "Growth support"]}, "excess": {"daily_limit": 3000, "unit": "μg", "symptoms": ["Infant toxicity via milk", "Liver damage", "Bone issues"]}}'::jsonb,
  '{"deficiency": {"threshold": 490, "unit": "μg", "symptoms": ["Dry eyes", "Dry skin", "Weakened immunity", "Bone loss"]}, "optimal": {"minimum": 600, "recommended": 700, "maximum": 3000, "unit": "μg", "benefits": ["Bone health", "Skin moisture", "Immune support", "Vision preservation"]}, "excess": {"daily_limit": 3000, "unit": "μg", "symptoms": ["Bone fractures", "Liver damage", "Headaches"]}, "note": "Post-menopausal women may need lower doses due to decreased bone density and increased fracture risk with excess vitamin A"}'::jsonb,
  '{"deficiency": {"threshold": 490, "unit": "μg", "symptoms": ["Heavy bleeding", "Prolonged periods", "Anemia", "Fatigue"]}, "optimal": {"minimum": 600, "recommended": 700, "maximum": 3000, "unit": "μg", "benefits": ["Normal menstrual flow", "Iron absorption", "Hormone balance", "Reduced cramping"]}, "excess": {"daily_limit": 3000, "unit": "μg", "symptoms": ["Irregular periods", "Headaches", "Nausea"]}, "heavy_flow_adjustment": {"recommended": 800, "note": "Slightly higher intake may help with heavy menstrual bleeding, but consult healthcare provider"}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name_common = EXCLUDED.name_common,
  type_label = EXCLUDED.type_label,
  category = EXCLUDED.category,
  health_role = EXCLUDED.health_role,
  description_simple = EXCLUDED.description_simple,
  daily_recommended_adult = EXCLUDED.daily_recommended_adult,
  food_strategy = EXCLUDED.food_strategy,
  drv_infants_0_6m = EXCLUDED.drv_infants_0_6m,
  drv_children_1_3y = EXCLUDED.drv_children_1_3y,
  drv_children_4_8y = EXCLUDED.drv_children_4_8y,
  drv_teens_14_18y = EXCLUDED.drv_teens_14_18y,
  drv_adults_19_30y = EXCLUDED.drv_adults_19_30y,
  drv_adults_31_50y = EXCLUDED.drv_adults_31_50y,
  drv_seniors_71y_plus = EXCLUDED.drv_seniors_71y_plus,
  drv_pregnancy = EXCLUDED.drv_pregnancy,
  drv_breastfeeding = EXCLUDED.drv_breastfeeding,
  drv_menopause = EXCLUDED.drv_menopause,
  drv_menstruation = EXCLUDED.drv_menstruation,
  updated_at = now();

-- ============================================================================
-- DONE! 
-- ============================================================================
-- The catalog_elements table now has DRV columns for:
-- - 10 age ranges (infants to seniors)
-- - 4 female-specific conditions (pregnancy, breastfeeding, menopause, menstruation)
-- - Test Vitamin A record with complete DRV data
-- ============================================================================
