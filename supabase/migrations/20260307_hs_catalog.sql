-- ============================================================
-- HealthScan Catalog Tables
-- hs_tests:       Health scan test products
-- hs_supplements: Health scan supplement products
-- element_key links to catalog_elements.nutrient_key
-- ============================================================

-- ── hs_tests ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hs_tests (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT,
  element_key     TEXT,          -- matches catalog_elements.nutrient_key
  sample_type     TEXT,
  turnaround_days INTEGER,
  retail_price_eur   NUMERIC(10,2),
  wholesale_cost_eur NUMERIC(10,2),
  shipping_cost_eur  NUMERIC(10,2),
  support_cost_eur   NUMERIC(10,2),
  gross_margin_pct   NUMERIC(5,2),
  provider_eu     TEXT,
  provider_uk     TEXT,
  provider_us     TEXT,
  provider_au     TEXT,
  is_active       BOOLEAN DEFAULT true,
  is_featured     BOOLEAN DEFAULT false,
  description     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hs_tests_element_key ON hs_tests (element_key);
CREATE INDEX IF NOT EXISTS idx_hs_tests_category    ON hs_tests (category);

ALTER TABLE hs_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hs_tests_read"  ON hs_tests;
CREATE POLICY "hs_tests_read"  ON hs_tests FOR SELECT USING (true);

-- ── hs_supplements ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hs_supplements (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  element_key     TEXT,          -- matches catalog_elements.nutrient_key
  category        TEXT,
  region          TEXT DEFAULT 'EU',   -- EU, UK, US, AU, ROW
  currency        TEXT DEFAULT 'EUR',
  retail_price    NUMERIC(10,2),
  estimated_cost  NUMERIC(10,2),
  margin_pct      NUMERIC(5,2),
  supplier        TEXT,
  affiliate_url   TEXT,
  is_active       BOOLEAN DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hs_supplements_element_key ON hs_supplements (element_key);
CREATE INDEX IF NOT EXISTS idx_hs_supplements_region      ON hs_supplements (region);

ALTER TABLE hs_supplements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hs_supplements_read" ON hs_supplements;
CREATE POLICY "hs_supplements_read" ON hs_supplements FOR SELECT USING (true);

-- ── Seed: 43 health scan tests ────────────────────────────────
INSERT INTO hs_tests (slug, name, category, element_key, sample_type, turnaround_days,
  retail_price_eur, wholesale_cost_eur, shipping_cost_eur, support_cost_eur, gross_margin_pct,
  provider_eu, provider_uk, provider_us, provider_au, is_active) VALUES
-- Vitamins
('vitamin-a-test',  'Vitamin A Test',        'Vitamins', 'vitamin-a',   'BLOOD_FINGER_PRICK', 4,  99, 32, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('vitamin-d-test',  'Vitamin D Test',        'Vitamins', 'vitamin-d',   'BLOOD_FINGER_PRICK', 3,  89, 28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('vitamin-b12-test','Vitamin B12 Test',      'Vitamins', 'vitamin-b12', 'BLOOD_FINGER_PRICK', 3,  89, 28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('vitamin-b6-test', 'Vitamin B6 Test',       'Vitamins', 'vitamin-b6',  'BLOOD_FINGER_PRICK', 4,  99, 32, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('vitamin-c-test',  'Vitamin C Test',        'Vitamins', 'vitamin-c',   'BLOOD_FINGER_PRICK', 3,  89, 28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('vitamin-e-test',  'Vitamin E Test',        'Vitamins', 'vitamin-e',   'BLOOD_FINGER_PRICK', 4,  99, 32, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('vitamin-k-test',  'Vitamin K Test',        'Vitamins', 'vitamin-k',   'BLOOD_FINGER_PRICK', 4,  99, 32, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('folate-test',     'Folate Test',           'Vitamins', 'vitamin-b9',  'BLOOD_FINGER_PRICK', 3,  89, 28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('biotin-test',     'Biotin Test',           'Vitamins', 'vitamin-b7',  'BLOOD_FINGER_PRICK', 4,  79, 24, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('thiamine-test',   'Thiamine (B1) Test',    'Vitamins', 'vitamin-b1',  'BLOOD_FINGER_PRICK', 4,  89, 28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
-- Minerals
('magnesium-test',  'Magnesium Test',        'Minerals', 'magnesium',   'BLOOD_FINGER_PRICK', 3,  79, 24, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('zinc-test',       'Zinc Test',             'Minerals', 'zinc',        'BLOOD_FINGER_PRICK', 3,  79, 24, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('iron-ferritin-test','Iron & Ferritin Test','Minerals', 'iron',        'BLOOD_FINGER_PRICK', 3,  89, 28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('iodine-test',     'Iodine Test',           'Minerals', 'iodine',      'URINE',              5,  89, 28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('selenium-test',   'Selenium Test',         'Minerals', 'selenium',    'BLOOD_FINGER_PRICK', 4,  89, 28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('copper-test',     'Copper Test',           'Minerals', 'copper',      'BLOOD_FINGER_PRICK', 4,  89, 28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('calcium-test',    'Calcium Test',          'Minerals', 'calcium',     'BLOOD_FINGER_PRICK', 3,  79, 24, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
-- Essential Fatty Acids
('omega3-index-test',   'Omega-3 Index Test',             'Essential Fatty Acids', 'omega-3-dha',            'BLOOD_FINGER_PRICK', 5, 99,  34, 6, 4, 57, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('omega6-ratio-test',   'Omega-6 to Omega-3 Ratio Test',  'Essential Fatty Acids', 'omega-6-linoleic-acid',  'BLOOD_FINGER_PRICK', 5, 99,  34, 6, 4, 57, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('efa-profile',         'Essential Fatty Acid Profile',   'Essential Fatty Acids', NULL,                     'BLOOD_FINGER_PRICK', 7, 149, 52, 7, 5, 57, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
-- Amino Acids
('homocysteine-test',          'Homocysteine Test',         'Amino Acids', 'homocysteine', 'BLOOD_FINGER_PRICK', 3, 79,  24, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('essential-amino-acid-profile','Essential Amino Acid Profile','Amino Acids', NULL,        'DRIED_URINE',        7, 199, 68, 7, 5, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
-- Metabolic & Hormones
('hba1c-test',           'HbA1c Blood Sugar Test',      'Metabolic & Hormones', NULL, 'BLOOD_FINGER_PRICK', 3, 79,  24, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('insulin-fasting-test', 'Fasting Insulin Test',        'Metabolic & Hormones', NULL, 'BLOOD_FINGER_PRICK', 3, 89,  28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('testosterone-test',    'Testosterone Test',           'Metabolic & Hormones', NULL, 'BLOOD_FINGER_PRICK', 3, 99,  34, 6, 4, 57, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('cortisol-test',        'Cortisol Stress Test',        'Metabolic & Hormones', NULL, 'SALIVA',             4, 89,  28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('thyroid-panel',        'Thyroid Panel (TSH, T3, T4)', 'Metabolic & Hormones', NULL, 'BLOOD_FINGER_PRICK', 3, 119, 42, 6, 4, 57, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('crp-inflammation-test','CRP Inflammation Test',       'Metabolic & Hormones', NULL, 'BLOOD_FINGER_PRICK', 3, 79,  24, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('dhea-test',            'DHEA Sulphate Test',          'Metabolic & Hormones', NULL, 'BLOOD_FINGER_PRICK', 4, 89,  28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('oestrogen-panel',      'Oestrogen Panel',             'Metabolic & Hormones', NULL, 'DRIED_URINE',        5, 139, 48, 7, 5, 57, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('progesterone-test',    'Progesterone Test',           'Metabolic & Hormones', NULL, 'DRIED_URINE',        5, 89,  28, 5, 3, 60, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
-- Toxins & Hazards
('lead-test',    'Lead Test',    'Toxins & Hazards', 'lead',    'BLOOD_FINGER_PRICK', 5, 129, 46, 7, 5, 57, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('mercury-test', 'Mercury Test', 'Toxins & Hazards', 'mercury', 'BLOOD_FINGER_PRICK', 5, 129, 46, 7, 5, 57, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('arsenic-test', 'Arsenic Test', 'Toxins & Hazards', 'arsenic', 'URINE',             5, 129, 46, 7, 5, 57, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('cadmium-test', 'Cadmium Test', 'Toxins & Hazards', 'cadmium', 'URINE',             5, 129, 46, 7, 5, 57, 'Probatix EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
-- DNA Tests
('lifestyle-dna-test',     'Lifestyle DNA Test',          'DNA Tests', NULL, 'SALIVA', 21, 299, 108, 8, 6, 62, 'DNA Provider EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('nutrigenomic-dna-test',  'Nutrigenomic DNA Test',       'DNA Tests', NULL, 'SALIVA', 21, 249,  88, 8, 6, 62, 'DNA Provider EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('fitness-dna-test',       'Fitness DNA Test',            'DNA Tests', NULL, 'SALIVA', 21, 249,  88, 8, 6, 62, 'DNA Provider EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('sleep-stress-dna-test',  'Sleep & Stress DNA Test',     'DNA Tests', NULL, 'SALIVA', 21, 249,  82, 7, 5, 62, 'DNA Provider EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
-- Microbiome
('gut-microbiome-test',        'Gut Microbiome Test',               'Microbiome', NULL, 'STOOL', 14, 179, 58, 7, 5, 61, 'Microbiome Provider EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('digestive-health-microbiome','Digestive Health Microbiome Test',  'Microbiome', NULL, 'STOOL', 14, 199, 65, 7, 5, 61, 'Microbiome Provider EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('immune-microbiome-test',     'Immune Microbiome Test',            'Microbiome', NULL, 'STOOL', 14, 199, 65, 7, 5, 61, 'Microbiome Provider EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('metabolic-microbiome-test',  'Metabolic Microbiome Test',         'Microbiome', NULL, 'STOOL', 14, 199, 65, 7, 5, 61, 'Microbiome Provider EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true),
('overall-wellness-microbiome','Overall Wellness Microbiome Test',  'Microbiome', NULL, 'STOOL', 14, 199, 65, 7, 5, 61, 'Microbiome Provider EU', 'Doctorbox UK', 'Physikit US', 'Physikit AU', true)
ON CONFLICT (slug) DO NOTHING;
