-- Add elements_content column to catalog_ingredients table
-- This stores the nutritional element content for each food/ingredient

ALTER TABLE catalog_ingredients
ADD COLUMN IF NOT EXISTS elements_content JSONB DEFAULT '{}'::jsonb;

-- Create index for faster queries on element content
CREATE INDEX IF NOT EXISTS idx_catalog_ingredients_elements_content 
ON catalog_ingredients USING gin (elements_content);

-- Add comment explaining the structure
COMMENT ON COLUMN catalog_ingredients.elements_content IS 
'JSONB object storing element content per food. Structure: 
{
  "element_id": {
    "amount": 900,
    "unit": "μg",
    "per": "100g",
    "bioavailability": "high",
    "form": "retinol"
  }
}
Example:
{
  "vitamin_a": {"amount": 900, "unit": "μg", "per": "100g", "form": "retinol"},
  "vitamin_c": {"amount": 50, "unit": "mg", "per": "100g"},
  "iron": {"amount": 2.5, "unit": "mg", "per": "100g", "bioavailability": "high"}
}';
