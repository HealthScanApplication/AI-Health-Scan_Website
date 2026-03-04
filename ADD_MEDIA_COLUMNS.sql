-- Add icon_url and video_url columns to catalog_activities and catalog_symptoms
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/sql

-- Add columns to catalog_activities
ALTER TABLE catalog_activities
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add columns to catalog_symptoms
ALTER TABLE catalog_symptoms
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comments
COMMENT ON COLUMN catalog_activities.icon_url IS 'URL to uploaded custom icon (SVG, PNG, JPG) - displayed centered';
COMMENT ON COLUMN catalog_activities.video_url IS 'URL to uploaded video demonstrating the activity';
COMMENT ON COLUMN catalog_symptoms.icon_url IS 'URL to uploaded custom icon (SVG, PNG, JPG) - displayed centered';
COMMENT ON COLUMN catalog_symptoms.video_url IS 'URL to uploaded video explaining the symptom';

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'catalog_activities'
  AND column_name IN ('icon_url', 'video_url')
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'catalog_symptoms'
  AND column_name IN ('icon_url', 'video_url')
ORDER BY column_name;
