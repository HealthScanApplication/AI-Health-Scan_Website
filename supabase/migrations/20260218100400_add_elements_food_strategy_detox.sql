-- Add food_strategy (jsonb) and detox_strategy (text) columns to catalog_elements
-- food_strategy: stores structured data for "animal vs plant" or source strategy cards
-- detox_strategy: stores text for "how to reduce exposure" guidance (hazardous elements)

ALTER TABLE public.catalog_elements
  ADD COLUMN IF NOT EXISTS food_strategy jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS detox_strategy text DEFAULT NULL;
