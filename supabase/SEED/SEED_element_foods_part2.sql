-- =============================================================================
-- SEED: element_foods Part 2 — Remaining Essential Nutrients
-- Covers: Vitamin K2, Chloride, Sulfur, 9 Essential Amino Acids
-- Date: 2026-02-27 (updated)
-- image_url is NULL — images are looked up from catalog_ingredients
-- catalog_ingredient_id links to real records; NULL = not yet in DB
-- =============================================================================

INSERT INTO public.element_foods (element_id, food_name, food_category, amount_per_serving, unit, serving_size, serving_unit, emoji_icon, image_url, catalog_ingredient_id, rank, bioavailability, notes) VALUES

-- ═══════════════════════════════════════════════════════════════════════════════
-- VITAMIN K2 (Menaquinone)
-- ═══════════════════════════════════════════════════════════════════════════════
('menaquinone_vitamin_k2', 'Natto', 'fermented', 1103, 'μg', 100, 'g', '🫘', NULL, 'plant_legume_bean_soy_natto', 1, 'high', 'Fermented soybeans — richest K2 source by far'),
('menaquinone_vitamin_k2', 'Goose Liver Pâté', 'animal', 369, 'μg', 100, 'g', '🍖', NULL, NULL, 2, 'high', 'Rich in MK-4 form of vitamin K2'),
('menaquinone_vitamin_k2', 'Hard Cheese (Gouda)', 'dairy', 76, 'μg', 50, 'g', '🧀', NULL, NULL, 3, 'high', 'Aged cheeses contain MK-9 from bacterial fermentation'),
('menaquinone_vitamin_k2', 'Soft Cheese (Brie)', 'dairy', 57, 'μg', 50, 'g', '🧀', NULL, 'animal_cow_dairy_cheese_brie', 4, 'high', 'Soft fermented cheese — moderate K2'),
('menaquinone_vitamin_k2', 'Egg Yolk', 'animal', 32, 'μg', 50, 'g', '🥚', NULL, 'animal_chicken_egg_yolk', 5, 'high', 'Pastured eggs have higher K2 (MK-4)'),
('menaquinone_vitamin_k2', 'Butter', 'dairy', 15, 'μg', 14, 'g', '🧈', NULL, 'animal_cow_dairy_butter', 6, 'high', 'Grass-fed butter — contains MK-4'),
('menaquinone_vitamin_k2', 'Chicken Liver', 'animal', 14, 'μg', 85, 'g', '🍗', NULL, NULL, 7, 'high', 'Organ meat — good MK-4 source'),
('menaquinone_vitamin_k2', 'Sauerkraut', 'fermented', 5, 'μg', 100, 'g', '🥬', NULL, 'plant_vegetable_leaf_cabbage_fermented_sauerkraut', 8, 'moderate', 'Lacto-fermented cabbage — bacterial K2'),

-- ═══════════════════════════════════════════════════════════════════════════════
-- CHLORIDE
-- ═══════════════════════════════════════════════════════════════════════════════
('chloride', 'Table Salt', 'other', 3600, 'mg', 6, 'g', '🧂', NULL, NULL, 1, 'high', 'One teaspoon — sodium chloride is ~60% chloride'),
('chloride', 'Soy Sauce', 'fermented', 1264, 'mg', 15, 'ml', '🥢', NULL, NULL, 2, 'high', 'One tablespoon — very high chloride'),
('chloride', 'Seaweed (Kelp)', 'plant', 2000, 'mg', 30, 'g', '🌿', NULL, 'plant_seaweed_kelp', 3, 'high', 'Dried kelp — natural ocean mineral'),
('chloride', 'Olives', 'plant', 735, 'mg', 50, 'g', '🫒', NULL, 'plant_fruit_olive_green', 4, 'high', 'Brined olives — salt-cured'),
('chloride', 'Celery', 'vegetable', 80, 'mg', 110, 'g', '🥬', NULL, 'plant_vegetable_celery', 5, 'high', 'Two stalks — naturally chloride-rich vegetable'),
('chloride', 'Tomato', 'vegetable', 652, 'mg', 240, 'ml', '🍅', NULL, 'plant_vegetable_tomato', 6, 'high', 'Tomato juice — often salted'),

-- ═══════════════════════════════════════════════════════════════════════════════
-- SULFUR
-- ═══════════════════════════════════════════════════════════════════════════════
('sulfur', 'Garlic', 'vegetable', 70, 'mg', 9, 'g', '🧄', NULL, 'plant_vegetable_root_garlic', 1, 'high', 'Three cloves — allicin and sulfur compounds'),
('sulfur', 'Onions', 'vegetable', 51, 'mg', 160, 'g', '🧅', NULL, 'plant_vegetable_root_onion', 2, 'high', 'One medium onion — thiosulfinates'),
('sulfur', 'Eggs', 'animal', 180, 'mg', 100, 'g', '🥚', NULL, 'animal_chicken_egg', 3, 'high', 'Two large eggs — methionine and cysteine sulfur'),
('sulfur', 'Beef', 'animal', 200, 'mg', 85, 'g', '🥩', NULL, 'animal_cow_meat_beef', 4, 'high', 'Three ounces — amino acid sulfur'),
('sulfur', 'Broccoli', 'vegetable', 47, 'mg', 91, 'g', '🥦', NULL, 'plant_vegetable_broccoli', 5, 'moderate', 'One cup chopped — sulforaphane rich'),
('sulfur', 'Cabbage', 'vegetable', 35, 'mg', 89, 'g', '🥬', NULL, 'plant_vegetable_leaf_cabbage', 6, 'moderate', 'One cup shredded — glucosinolates'),
('sulfur', 'Fish (Salmon)', 'seafood', 150, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_salmon', 7, 'high', 'Three ounces — protein-bound sulfur'),
('sulfur', 'Dairy (Milk)', 'dairy', 100, 'mg', 244, 'ml', '🥛', NULL, 'animal_cow_dairy_milk_whole', 8, 'high', 'One cup — casein and whey sulfur amino acids'),

-- ═══════════════════════════════════════════════════════════════════════════════
-- LEUCINE (Essential Amino Acid)
-- ═══════════════════════════════════════════════════════════════════════════════
('leucine', 'Parmesan Cheese', 'dairy', 3453, 'mg', 100, 'g', '🧀', NULL, 'animal_cow_dairy_cheese_parmesan', 1, 'high', 'Highest leucine per 100g of common foods'),
('leucine', 'Chicken Breast', 'animal', 2650, 'mg', 85, 'g', '🍗', NULL, 'animal_chicken_meat_breast', 2, 'high', 'Three ounces cooked — excellent lean source'),
('leucine', 'Beef (Lean)', 'animal', 2400, 'mg', 85, 'g', '🥩', NULL, 'animal_cow_meat_beef', 3, 'high', 'Three ounces lean — complete amino acid profile'),
('leucine', 'Tuna', 'seafood', 2170, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_tuna', 4, 'high', 'Three ounces — dense protein fish'),
('leucine', 'Soybeans', 'legume', 1940, 'mg', 86, 'g', '🫘', NULL, 'plant_legume_bean_soy', 5, 'moderate', 'Half cup cooked — top plant source of leucine'),
('leucine', 'Salmon', 'seafood', 1770, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_salmon', 6, 'high', 'Three ounces — omega-3 bonus'),
('leucine', 'Peanuts', 'nut_seed', 1672, 'mg', 28, 'g', '🥜', NULL, 'plant_nut_peanut', 7, 'moderate', 'One ounce — concentrated plant protein'),
('leucine', 'Lentils', 'legume', 1290, 'mg', 99, 'g', '🫘', NULL, 'plant_legume_bean_lentil', 8, 'moderate', 'Half cup cooked — legume leucine'),
('leucine', 'Eggs', 'animal', 1088, 'mg', 100, 'g', '🥚', NULL, 'animal_chicken_egg', 9, 'high', 'Two large eggs — complete protein'),
('leucine', 'Milk', 'dairy', 800, 'mg', 244, 'ml', '🥛', NULL, 'animal_cow_dairy_milk_whole', 10, 'high', 'One cup — whey protein rich in leucine'),

-- ═══════════════════════════════════════════════════════════════════════════════
-- ISOLEUCINE (Essential Amino Acid)
-- ═══════════════════════════════════════════════════════════════════════════════
('isoleucine', 'Chicken Breast', 'animal', 1230, 'mg', 85, 'g', '🍗', NULL, 'animal_chicken_meat_breast', 1, 'high', 'Three ounces cooked — lean BCAA source'),
('isoleucine', 'Tuna', 'seafood', 1150, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_tuna', 2, 'high', 'Three ounces — high protein fish'),
('isoleucine', 'Beef (Lean)', 'animal', 1140, 'mg', 85, 'g', '🥩', NULL, 'animal_cow_meat_beef', 3, 'high', 'Three ounces lean — branched-chain source'),
('isoleucine', 'Soybeans', 'legume', 1100, 'mg', 86, 'g', '🫘', NULL, 'plant_legume_bean_soy', 4, 'moderate', 'Half cup cooked — best plant BCAA'),
('isoleucine', 'Salmon', 'seafood', 1050, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_salmon', 5, 'high', 'Three ounces — omega-3 rich protein'),
('isoleucine', 'Lentils', 'legume', 810, 'mg', 99, 'g', '🫘', NULL, 'plant_legume_bean_lentil', 6, 'moderate', 'Half cup cooked — legume isoleucine'),
('isoleucine', 'Eggs', 'animal', 672, 'mg', 100, 'g', '🥚', NULL, 'animal_chicken_egg', 7, 'high', 'Two large eggs — complete protein'),
('isoleucine', 'Milk', 'dairy', 520, 'mg', 244, 'ml', '🥛', NULL, 'animal_cow_dairy_milk_whole', 8, 'high', 'One cup — casein and whey'),

-- ═══════════════════════════════════════════════════════════════════════════════
-- VALINE (Essential Amino Acid)
-- ═══════════════════════════════════════════════════════════════════════════════
('valine', 'Chicken Breast', 'animal', 1300, 'mg', 85, 'g', '🍗', NULL, 'animal_chicken_meat_breast', 1, 'high', 'Three ounces cooked — BCAA-rich'),
('valine', 'Beef (Lean)', 'animal', 1280, 'mg', 85, 'g', '🥩', NULL, 'animal_cow_meat_beef', 2, 'high', 'Three ounces lean — complete amino acids'),
('valine', 'Salmon', 'seafood', 1240, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_salmon', 3, 'high', 'Three ounces — complete protein fish'),
('valine', 'Tuna', 'seafood', 1210, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_tuna', 4, 'high', 'Three ounces — dense protein source'),
('valine', 'Soybeans', 'legume', 1150, 'mg', 86, 'g', '🫘', NULL, 'plant_legume_bean_soy', 5, 'moderate', 'Half cup cooked — top plant BCAA'),
('valine', 'Lentils', 'legume', 960, 'mg', 99, 'g', '🫘', NULL, 'plant_legume_bean_lentil', 6, 'moderate', 'Half cup cooked — legume valine'),
('valine', 'Eggs', 'animal', 860, 'mg', 100, 'g', '🥚', NULL, 'animal_chicken_egg', 7, 'high', 'Two large eggs — balanced amino acids'),
('valine', 'Milk', 'dairy', 550, 'mg', 244, 'ml', '🥛', NULL, 'animal_cow_dairy_milk_whole', 8, 'high', 'One cup — whey and casein protein'),

-- ═══════════════════════════════════════════════════════════════════════════════
-- LYSINE (Essential Amino Acid)
-- ═══════════════════════════════════════════════════════════════════════════════
('lysine', 'Beef (Lean)', 'animal', 2380, 'mg', 85, 'g', '🥩', NULL, 'animal_cow_meat_beef', 1, 'high', 'Three ounces lean — richest lysine source'),
('lysine', 'Tuna', 'seafood', 2360, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_tuna', 2, 'high', 'Three ounces — very high lysine fish'),
('lysine', 'Chicken Breast', 'animal', 2330, 'mg', 85, 'g', '🍗', NULL, 'animal_chicken_meat_breast', 3, 'high', 'Three ounces cooked — lean lysine'),
('lysine', 'Salmon', 'seafood', 2180, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_salmon', 4, 'high', 'Three ounces — complete protein'),
('lysine', 'Soybeans', 'legume', 1560, 'mg', 86, 'g', '🫘', NULL, 'plant_legume_bean_soy', 5, 'moderate', 'Half cup cooked — best plant lysine'),
('lysine', 'Lentils', 'legume', 1240, 'mg', 99, 'g', '🫘', NULL, 'plant_legume_bean_lentil', 6, 'moderate', 'Half cup cooked — good legume lysine'),
('lysine', 'Eggs', 'animal', 912, 'mg', 100, 'g', '🥚', NULL, 'animal_chicken_egg', 7, 'high', 'Two large eggs — complete protein'),
('lysine', 'Milk', 'dairy', 670, 'mg', 244, 'ml', '🥛', NULL, 'animal_cow_dairy_milk_whole', 8, 'high', 'One cup — casein is lysine-rich'),

-- ═══════════════════════════════════════════════════════════════════════════════
-- METHIONINE (Essential Amino Acid)
-- ═══════════════════════════════════════════════════════════════════════════════
('methionine', 'Brazil Nuts', 'nut_seed', 1008, 'mg', 100, 'g', '🌰', NULL, 'plant_nut_brazil', 1, 'high', 'Highest methionine per 100g among common foods'),
('methionine', 'Parmesan Cheese', 'dairy', 958, 'mg', 100, 'g', '🧀', NULL, 'animal_cow_dairy_cheese_parmesan', 2, 'high', 'Aged hard cheese — very high methionine'),
('methionine', 'Chicken Breast', 'animal', 780, 'mg', 85, 'g', '🍗', NULL, 'animal_chicken_meat_breast', 3, 'high', 'Three ounces cooked — lean source'),
('methionine', 'Tuna', 'seafood', 755, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_tuna', 4, 'high', 'Three ounces — sulfur amino acid'),
('methionine', 'Cod', 'seafood', 680, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_cod', 5, 'high', 'Three ounces — lean white fish'),
('methionine', 'Beef (Lean)', 'animal', 650, 'mg', 85, 'g', '🥩', NULL, 'animal_cow_meat_beef', 6, 'high', 'Three ounces — complete sulfur amino acids'),
('methionine', 'Salmon', 'seafood', 620, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_salmon', 7, 'high', 'Three ounces — omega-3 bonus'),
('methionine', 'Eggs', 'animal', 392, 'mg', 100, 'g', '🥚', NULL, 'animal_chicken_egg', 8, 'high', 'Two large eggs — sulfur amino acid source'),

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHENYLALANINE (Essential Amino Acid)
-- ═══════════════════════════════════════════════════════════════════════════════
('phenylalanine', 'Peanuts', 'nut_seed', 1337, 'mg', 28, 'g', '🥜', NULL, 'plant_nut_peanut', 1, 'high', 'One ounce — concentrated phenylalanine'),
('phenylalanine', 'Soybeans', 'legume', 1240, 'mg', 86, 'g', '🫘', NULL, 'plant_legume_bean_soy', 2, 'moderate', 'Half cup cooked — top plant source'),
('phenylalanine', 'Chicken Breast', 'animal', 1120, 'mg', 85, 'g', '🍗', NULL, 'animal_chicken_meat_breast', 3, 'high', 'Three ounces cooked — aromatic amino acid'),
('phenylalanine', 'Beef (Lean)', 'animal', 1020, 'mg', 85, 'g', '🥩', NULL, 'animal_cow_meat_beef', 4, 'high', 'Three ounces lean — complete protein'),
('phenylalanine', 'Salmon', 'seafood', 870, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_salmon', 5, 'high', 'Three ounces — aromatic amino acid fish'),
('phenylalanine', 'Lentils', 'legume', 780, 'mg', 99, 'g', '🫘', NULL, 'plant_legume_bean_lentil', 6, 'moderate', 'Half cup cooked — plant phenylalanine'),
('phenylalanine', 'Eggs', 'animal', 680, 'mg', 100, 'g', '🥚', NULL, 'animal_chicken_egg', 7, 'high', 'Two large eggs — precursor to tyrosine'),
('phenylalanine', 'Milk', 'dairy', 430, 'mg', 244, 'ml', '🥛', NULL, 'animal_cow_dairy_milk_whole', 8, 'high', 'One cup — casein phenylalanine'),

-- ═══════════════════════════════════════════════════════════════════════════════
-- THREONINE (Essential Amino Acid)
-- ═══════════════════════════════════════════════════════════════════════════════
('threonine', 'Chicken Breast', 'animal', 1190, 'mg', 85, 'g', '🍗', NULL, 'animal_chicken_meat_breast', 1, 'high', 'Three ounces cooked — lean threonine source'),
('threonine', 'Beef (Lean)', 'animal', 1050, 'mg', 85, 'g', '🥩', NULL, 'animal_cow_meat_beef', 2, 'high', 'Three ounces lean — collagen amino acid'),
('threonine', 'Salmon', 'seafood', 1020, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_salmon', 3, 'high', 'Three ounces — complete fish protein'),
('threonine', 'Soybeans', 'legume', 1000, 'mg', 86, 'g', '🫘', NULL, 'plant_legume_bean_soy', 4, 'moderate', 'Half cup cooked — best plant threonine'),
('threonine', 'Lentils', 'legume', 670, 'mg', 99, 'g', '🫘', NULL, 'plant_legume_bean_lentil', 5, 'moderate', 'Half cup cooked — legume threonine'),
('threonine', 'Eggs', 'animal', 556, 'mg', 100, 'g', '🥚', NULL, 'animal_chicken_egg', 6, 'high', 'Two large eggs — balanced amino acids'),
('threonine', 'Greek Yogurt', 'dairy', 450, 'mg', 170, 'g', '🥛', NULL, 'animal_cow_dairy_yogurt_greek', 7, 'high', 'One container — fermented dairy protein'),
('threonine', 'Milk', 'dairy', 380, 'mg', 244, 'ml', '🥛', NULL, 'animal_cow_dairy_milk_whole', 8, 'high', 'One cup — whey threonine'),

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRYPTOPHAN (Essential Amino Acid)
-- ═══════════════════════════════════════════════════════════════════════════════
('tryptophan', 'Turkey Breast', 'animal', 340, 'mg', 85, 'g', '🦃', NULL, 'animal_turkey_meat_breast', 1, 'high', 'Three ounces — famous serotonin precursor'),
('tryptophan', 'Chicken Breast', 'animal', 330, 'mg', 85, 'g', '🍗', NULL, 'animal_chicken_meat_breast', 2, 'high', 'Three ounces — lean tryptophan'),
('tryptophan', 'Tuna', 'seafood', 315, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_tuna', 3, 'high', 'Three ounces — high protein fish'),
('tryptophan', 'Salmon', 'seafood', 285, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_salmon', 4, 'high', 'Three ounces — omega-3 plus serotonin support'),
('tryptophan', 'Cheese (Cheddar)', 'dairy', 270, 'mg', 50, 'g', '🧀', NULL, 'animal_cow_dairy_cheese_cheddar', 5, 'high', 'Two ounces — dairy tryptophan'),
('tryptophan', 'Soybeans', 'legume', 240, 'mg', 86, 'g', '🫘', NULL, 'plant_legume_bean_soy', 6, 'moderate', 'Half cup cooked — plant tryptophan'),
('tryptophan', 'Pumpkin Seeds', 'nut_seed', 200, 'mg', 28, 'g', '🎃', NULL, 'plant_vegetable_squash_pumpkin_seed', 7, 'moderate', 'One ounce — concentrated seed source'),
('tryptophan', 'Eggs', 'animal', 167, 'mg', 100, 'g', '🥚', NULL, 'animal_chicken_egg', 8, 'high', 'Two large eggs — mood-supporting amino acid'),

-- ═══════════════════════════════════════════════════════════════════════════════
-- HISTIDINE (Essential Amino Acid)
-- ═══════════════════════════════════════════════════════════════════════════════
('histidine', 'Tuna', 'seafood', 1140, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_tuna', 1, 'high', 'Three ounces — highest common histidine source'),
('histidine', 'Beef (Lean)', 'animal', 930, 'mg', 85, 'g', '🥩', NULL, 'animal_cow_meat_beef', 2, 'high', 'Three ounces lean — carnosine precursor'),
('histidine', 'Chicken Breast', 'animal', 900, 'mg', 85, 'g', '🍗', NULL, 'animal_chicken_meat_breast', 3, 'high', 'Three ounces cooked — poultry histidine'),
('histidine', 'Salmon', 'seafood', 680, 'mg', 85, 'g', '🐟', NULL, 'animal_seafood_fish_salmon', 4, 'high', 'Three ounces — fish histidine'),
('histidine', 'Soybeans', 'legume', 620, 'mg', 86, 'g', '🫘', NULL, 'plant_legume_bean_soy', 5, 'moderate', 'Half cup cooked — plant histidine'),
('histidine', 'Lentils', 'legume', 480, 'mg', 99, 'g', '🫘', NULL, 'plant_legume_bean_lentil', 6, 'moderate', 'Half cup cooked — legume source'),
('histidine', 'Eggs', 'animal', 309, 'mg', 100, 'g', '🥚', NULL, 'animal_chicken_egg', 7, 'high', 'Two large eggs — histamine precursor'),
('histidine', 'Greek Yogurt', 'dairy', 280, 'mg', 170, 'g', '🥛', NULL, 'animal_cow_dairy_yogurt_greek', 8, 'high', 'One container — fermented dairy')

ON CONFLICT (element_id, food_name) DO UPDATE SET
  food_category = EXCLUDED.food_category,
  amount_per_serving = EXCLUDED.amount_per_serving,
  unit = EXCLUDED.unit,
  serving_size = EXCLUDED.serving_size,
  serving_unit = EXCLUDED.serving_unit,
  emoji_icon = EXCLUDED.emoji_icon,
  image_url = EXCLUDED.image_url,
  catalog_ingredient_id = EXCLUDED.catalog_ingredient_id,
  rank = EXCLUDED.rank,
  bioavailability = EXCLUDED.bioavailability,
  notes = EXCLUDED.notes;
