-- ============================================================
-- Add rich age_ranges + meta columns to catalog_elements
-- Supports the full Vitamin A-style JSON structure:
--   age_ranges → EU + USA deficiency/optimal/excess by age × gender
--   testing_or_diagnostics → blood tests, methods, optimal ranges
--   interventions → supplements, lifestyle, herbal with dosage by age
--   content_urls → Wikipedia, Examine, PubMed, NIH
--   regions_meta → EFSA / NIH authority references
--   daily_recommended_adult → quick male/female reference
--   other_names → array of aliases
--   confidence → verification status
--
-- Run in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/sql
-- Date: 2026-03-04
-- ============================================================

-- 1. age_ranges — THE core structure
--    { "europe": [...], "north_america": [...], "healthscan": [...] }
--    Each array entry: { age_group, basis, male: {deficiency, optimal, excess}, female: {..., pregnancy?, breastfeeding?} }
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS age_ranges JSONB DEFAULT '{}'::jsonb;

-- 2. testing_or_diagnostics — blood tests and diagnostic info
--    { matrix, best_test, why_best, optimal_range: {low, high, unit}, detection_threshold, frequency, methods: [...] }
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS testing_or_diagnostics JSONB DEFAULT '{}'::jsonb;

-- 3. interventions — detailed interventions with dosage_by_age_gender
--    [ { title, type, phase[], description, mechanism, dosage_by_age_gender: { europe: [...], north_america: [...] }, ... } ]
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS interventions JSONB DEFAULT '[]'::jsonb;

-- 4. content_urls — reference links to authoritative sources
--    { wikipedia, examine, pubmed, nih_factsheet, efsa, ... }
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS content_urls JSONB DEFAULT '{}'::jsonb;

-- 5. regions_meta — authority info per region
--    { europe: { authority, reference_url, notes }, north_america: { ... } }
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS regions_meta JSONB DEFAULT '{}'::jsonb;

-- 6. daily_recommended_adult — quick reference for default adult values
--    { male: { value: 900, unit: "μg RAE" }, female: { value: 700, unit: "μg RAE" } }
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS daily_recommended_adult JSONB DEFAULT '{}'::jsonb;

-- 7. other_names — array of alternative names (Retinol, Beta-carotene, etc.)
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS other_names JSONB DEFAULT '[]'::jsonb;

-- 8. confidence — verification status: 'verified', 'ai_generated', 'draft', 'needs_review'
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS confidence TEXT DEFAULT 'draft';

-- 9. key_interactions — richer interaction format with references
--    [ { element, type, description, reference, id } ]
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS key_interactions JSONB DEFAULT '[]'::jsonb;

-- 10. food_data — richer food sources with bioavailability, preparation methods
--     { strategy: {...}, sources: { animal: [...], plant: [...], ... }, bioavailability: {...}, preparation_methods: {...} }
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS food_data JSONB DEFAULT '{}'::jsonb;

-- 11. slug_path — URL-friendly identifier
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS slug_path TEXT;

-- 12. qa_rules — validation metadata
ALTER TABLE catalog_elements ADD COLUMN IF NOT EXISTS qa_rules JSONB DEFAULT '{}'::jsonb;

-- Comments
COMMENT ON COLUMN catalog_elements.age_ranges IS 'Full DRV data by region (europe/north_america/healthscan), age group, gender — deficiency/optimal/excess with symptoms and benefits';
COMMENT ON COLUMN catalog_elements.testing_or_diagnostics IS 'Blood tests, diagnostic methods, optimal ranges, detection thresholds';
COMMENT ON COLUMN catalog_elements.interventions IS 'Detailed interventions (supplement/lifestyle/herbal) with dosage_by_age_gender per region';
COMMENT ON COLUMN catalog_elements.content_urls IS 'Reference URLs: wikipedia, examine, pubmed, nih_factsheet, efsa';
COMMENT ON COLUMN catalog_elements.regions_meta IS 'Regulatory authority info per region';
COMMENT ON COLUMN catalog_elements.daily_recommended_adult IS 'Quick reference RDA for adult male/female';
COMMENT ON COLUMN catalog_elements.other_names IS 'Array of alternative/common names';
COMMENT ON COLUMN catalog_elements.confidence IS 'Data verification status: verified, ai_generated, draft, needs_review';
COMMENT ON COLUMN catalog_elements.key_interactions IS 'Structured interactions with element references and PubMed links';
COMMENT ON COLUMN catalog_elements.food_data IS 'Rich food source data with bioavailability, preparation methods, and strategy';
COMMENT ON COLUMN catalog_elements.slug_path IS 'URL-friendly path for deep linking';
COMMENT ON COLUMN catalog_elements.qa_rules IS 'QA validation rules and coverage metadata';

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'catalog_elements'
  AND column_name IN (
    'age_ranges', 'testing_or_diagnostics', 'interventions', 'content_urls',
    'regions_meta', 'daily_recommended_adult', 'other_names', 'confidence',
    'key_interactions', 'food_data', 'slug_path', 'qa_rules'
  )
ORDER BY column_name;
