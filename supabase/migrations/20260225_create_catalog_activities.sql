-- Migration: create catalog_activities table
-- Maps to mobile CatalogSport interface in sportsService.ts
-- Table named catalog_activities (not catalog_sports) to align with admin panel naming

CREATE TABLE IF NOT EXISTS catalog_activities (
  id                    text        PRIMARY KEY,          -- slug id e.g. 'running', 'cycling', 'sauna'
  name                  text        NOT NULL,
  description           text,
  category              text        NOT NULL,             -- sport, wellness, flexibility, outdoor, strength, recovery, other
  icon_name             text,                             -- Lucide icon name for mobile app
  icon_svg_path         text,                             -- SVG path data for custom icon rendering
  image_url             text,                             -- Photo/illustration of the activity
  sweat_level           text        DEFAULT 'none',       -- none, low, moderate, high
  default_duration_min  integer     DEFAULT 30,
  calories_per_minute   numeric(5,1) DEFAULT 5,
  intensity_levels      jsonb       DEFAULT '["Low","Moderate","High"]'::jsonb,
  mineral_impact        jsonb       DEFAULT '[]'::jsonb,  -- [{name, lostMg}] per 30 min
  toxin_loss            jsonb       DEFAULT '[]'::jsonb,  -- [{name, lostUg, note}] per 30 min
  benefits              jsonb       DEFAULT '[]'::jsonb,  -- string array of health benefits
  strava_types          jsonb       DEFAULT '[]'::jsonb,  -- Strava sport_type strings for mapping
  equipment_needed      text[],                           -- optional equipment list
  muscle_groups         text[],                           -- primary muscle groups targeted
  contraindications     text[],                           -- health conditions where caution needed
  is_active             boolean     DEFAULT true,
  sort_order            integer     DEFAULT 100,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE catalog_activities ENABLE ROW LEVEL SECURITY;

-- Public read (catalog data is public)
CREATE POLICY "Public read access"
  ON catalog_activities FOR SELECT
  USING (true);

-- Service role full access
CREATE POLICY "Service role full access"
  ON catalog_activities
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can manage (admin panel)
CREATE POLICY "Authenticated users can manage"
  ON catalog_activities
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_category ON catalog_activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_is_active ON catalog_activities(is_active);
CREATE INDEX IF NOT EXISTS idx_activities_sort_order ON catalog_activities(sort_order);

COMMENT ON TABLE catalog_activities IS 'Master catalog of sports, exercises, and wellness activities';
COMMENT ON COLUMN catalog_activities.id IS 'Slug identifier matching mobile SPORT_ICONS keys (e.g. running, cycling, sauna)';
COMMENT ON COLUMN catalog_activities.icon_name IS 'Lucide icon name for mobile rendering';
COMMENT ON COLUMN catalog_activities.mineral_impact IS 'Array of {name, lostMg} per 30-min session at moderate intensity';
COMMENT ON COLUMN catalog_activities.toxin_loss IS 'Array of {name, lostUg, note} excreted via sweat per 30-min session';
COMMENT ON COLUMN catalog_activities.strava_types IS 'Strava SportType strings for auto-mapping imported activities';
