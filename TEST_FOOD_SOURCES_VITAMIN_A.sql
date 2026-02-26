-- Sample food sources for Vitamin A
-- Apply this AFTER running: 20260226_add_elements_content_to_ingredients.sql
-- This creates sample foods with their Vitamin A content

-- First, ensure the migration is applied
ALTER TABLE catalog_ingredients
ADD COLUMN IF NOT EXISTS elements_content JSONB DEFAULT '{}'::jsonb;

-- Insert top 10 Vitamin A rich foods
INSERT INTO catalog_ingredients (id, slug, name, category, type, image_url, elements_content) VALUES
('beef_liver', 'beef-liver', 'Beef Liver', 'meat', 'organ meat', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400', 
'{"vitamin_a_drv": {"amount": 9442, "unit": "μg", "per": "100g", "form": "retinol", "bioavailability": "very high"}}'::jsonb),

('sweet_potato', 'sweet-potato', 'Sweet Potato', 'vegetable', 'root vegetable', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
'{"vitamin_a_drv": {"amount": 1043, "unit": "μg", "per": "100g", "form": "beta-carotene", "bioavailability": "moderate"}}'::jsonb),

('carrots', 'carrots', 'Carrots', 'vegetable', 'root vegetable', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
'{"vitamin_a_drv": {"amount": 835, "unit": "μg", "per": "100g", "form": "beta-carotene", "bioavailability": "moderate"}}'::jsonb),

('spinach', 'spinach', 'Spinach', 'vegetable', 'leafy green', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
'{"vitamin_a_drv": {"amount": 469, "unit": "μg", "per": "100g", "form": "beta-carotene", "bioavailability": "moderate"}}'::jsonb),

('kale', 'kale', 'Kale', 'vegetable', 'leafy green', 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=400',
'{"vitamin_a_drv": {"amount": 681, "unit": "μg", "per": "100g", "form": "beta-carotene", "bioavailability": "moderate"}}'::jsonb),

('butternut_squash', 'butternut-squash', 'Butternut Squash', 'vegetable', 'winter squash', 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400',
'{"vitamin_a_drv": {"amount": 532, "unit": "μg", "per": "100g", "form": "beta-carotene", "bioavailability": "moderate"}}'::jsonb),

('cod_liver_oil', 'cod-liver-oil', 'Cod Liver Oil', 'supplement', 'fish oil', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
'{"vitamin_a_drv": {"amount": 30000, "unit": "μg", "per": "100g", "form": "retinol", "bioavailability": "very high"}}'::jsonb),

('cantaloupe', 'cantaloupe', 'Cantaloupe', 'fruit', 'melon', 'https://images.unsplash.com/photo-1621583441131-e2e9e2e9e2e9?w=400',
'{"vitamin_a_drv": {"amount": 169, "unit": "μg", "per": "100g", "form": "beta-carotene", "bioavailability": "moderate"}}'::jsonb),

('red_bell_pepper', 'red-bell-pepper', 'Red Bell Pepper', 'vegetable', 'pepper', 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400',
'{"vitamin_a_drv": {"amount": 157, "unit": "μg", "per": "100g", "form": "beta-carotene", "bioavailability": "moderate"}}'::jsonb),

('mango', 'mango', 'Mango', 'fruit', 'tropical fruit', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
'{"vitamin_a_drv": {"amount": 54, "unit": "μg", "per": "100g", "form": "beta-carotene", "bioavailability": "moderate"}}'::jsonb),

('egg_yolk', 'egg-yolk', 'Egg Yolk', 'animal product', 'egg', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400',
'{"vitamin_a_drv": {"amount": 381, "unit": "μg", "per": "100g", "form": "retinol", "bioavailability": "high"}}'::jsonb),

('cheddar_cheese', 'cheddar-cheese', 'Cheddar Cheese', 'dairy', 'cheese', 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400',
'{"vitamin_a_drv": {"amount": 265, "unit": "μg", "per": "100g", "form": "retinol", "bioavailability": "high"}}'::jsonb),

('whole_milk', 'whole-milk', 'Whole Milk', 'dairy', 'milk', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
'{"vitamin_a_drv": {"amount": 46, "unit": "μg", "per": "100ml", "form": "retinol", "bioavailability": "high"}}'::jsonb),

('apricots', 'apricots', 'Apricots', 'fruit', 'stone fruit', 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400',
'{"vitamin_a_drv": {"amount": 96, "unit": "μg", "per": "100g", "form": "beta-carotene", "bioavailability": "moderate"}}'::jsonb),

('broccoli', 'broccoli', 'Broccoli', 'vegetable', 'cruciferous', 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400',
'{"vitamin_a_drv": {"amount": 31, "unit": "μg", "per": "100g", "form": "beta-carotene", "bioavailability": "moderate"}}'::jsonb)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  image_url = EXCLUDED.image_url,
  elements_content = EXCLUDED.elements_content,
  updated_at = now();

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_catalog_ingredients_elements_content 
ON catalog_ingredients USING gin (elements_content);
