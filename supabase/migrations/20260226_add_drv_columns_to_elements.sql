-- Add DRV (Dietary Reference Values) columns to catalog_elements table
-- Supports age ranges, deficiency/optimal/excess values, and female-specific conditions

-- Add DRV columns for different age groups and genders
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

-- Add comments to explain the structure
COMMENT ON COLUMN catalog_elements.drv_infants_0_6m IS 'DRV data for infants 0-6 months: {male: {deficiency, optimal, excess}, female: {deficiency, optimal, excess}}';
COMMENT ON COLUMN catalog_elements.drv_infants_7_12m IS 'DRV data for infants 7-12 months';
COMMENT ON COLUMN catalog_elements.drv_children_1_3y IS 'DRV data for children 1-3 years';
COMMENT ON COLUMN catalog_elements.drv_children_4_8y IS 'DRV data for children 4-8 years';
COMMENT ON COLUMN catalog_elements.drv_children_9_13y IS 'DRV data for children 9-13 years';
COMMENT ON COLUMN catalog_elements.drv_teens_14_18y IS 'DRV data for teens 14-18 years';
COMMENT ON COLUMN catalog_elements.drv_adults_19_30y IS 'DRV data for adults 19-30 years';
COMMENT ON COLUMN catalog_elements.drv_adults_31_50y IS 'DRV data for adults 31-50 years';
COMMENT ON COLUMN catalog_elements.drv_adults_51_70y IS 'DRV data for adults 51-70 years';
COMMENT ON COLUMN catalog_elements.drv_seniors_71y_plus IS 'DRV data for seniors 71+ years';
COMMENT ON COLUMN catalog_elements.drv_pregnancy IS 'DRV data for pregnancy: {deficiency, optimal, excess, trimester_specific}';
COMMENT ON COLUMN catalog_elements.drv_breastfeeding IS 'DRV data for breastfeeding: {deficiency, optimal, excess}';
COMMENT ON COLUMN catalog_elements.drv_menopause IS 'DRV data for menopause: {deficiency, optimal, excess}';
COMMENT ON COLUMN catalog_elements.drv_menstruation IS 'DRV data for menstruation: {deficiency, optimal, excess, heavy_flow_adjustment}';

-- Example structure for each DRV column:
-- {
--   "male": {
--     "deficiency": {"threshold": 280, "unit": "μg", "symptoms": ["night blindness", "dry eyes"]},
--     "optimal": {"minimum": 300, "recommended": 400, "maximum": 600, "unit": "μg", "benefits": ["vision", "immunity"]},
--     "excess": {"daily_limit": 600, "acute_limit": 1800, "unit": "μg", "symptoms": ["nausea", "headache"]}
--   },
--   "female": {
--     "deficiency": {"threshold": 280, "unit": "μg", "symptoms": ["night blindness", "dry eyes"]},
--     "optimal": {"minimum": 300, "recommended": 400, "maximum": 600, "unit": "μg", "benefits": ["vision", "immunity"]},
--     "excess": {"daily_limit": 600, "acute_limit": 1800, "unit": "μg", "symptoms": ["nausea", "headache"]}
--   }
-- }

-- For pregnancy/breastfeeding/menopause/menstruation, structure is similar but may include additional fields:
-- {
--   "deficiency": {"threshold": 490, "unit": "μg", "symptoms": ["increased infection risk"]},
--   "optimal": {"minimum": 550, "recommended": 770, "maximum": 3000, "unit": "μg", "benefits": ["fetal development", "placental function"]},
--   "excess": {"daily_limit": 3000, "unit": "μg", "symptoms": ["birth defects", "liver toxicity"]},
--   "trimester_specific": {
--     "first": {"recommended": 770},
--     "second": {"recommended": 770},
--     "third": {"recommended": 770}
--   }
-- }
