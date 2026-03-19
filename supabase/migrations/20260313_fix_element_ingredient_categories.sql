-- ============================================================
-- COMPREHENSIVE CATEGORY + TYPE_LABEL CLEANUP
-- Fixes 560 elements + 1285 ingredients
-- Rules:
--   elements.category: ONLY 'beneficial', 'hazardous', or 'both'
--   elements.type_label: standardized flat JSON array
--   ingredients.category: lowercase, no duplicates, no typos
-- ============================================================
BEGIN;

-- ============================================================
-- PART 1: NORMALIZE type_label FORMAT
-- Fix nested arrays like [["antioxidant"]] → ["antioxidant"]
-- Fix underscore variants: fatty_acid → fatty acid
-- ============================================================

-- 1a. Fix nested JSON arrays (type_label stored as [["value"]])
-- Skip if type_label is TEXT - will be handled by specific fixes below

-- 1b. Convert bare strings to arrays (skip - type_label should already be JSONB array)

-- 1c. Standardize underscore variants to spaces (using TEXT LIKE since type_label is TEXT)
UPDATE catalog_elements
SET type_label = '["fatty acid"]'
WHERE type_label LIKE '%fatty_acid%';

UPDATE catalog_elements
SET type_label = '["amino acid"]'
WHERE type_label LIKE '%amino_acid%';

UPDATE catalog_elements
SET type_label = '["environmental contaminant"]'
WHERE type_label LIKE '%environmental_contaminant%';

UPDATE catalog_elements
SET type_label = '["natural toxin"]'
WHERE type_label LIKE '%natural_toxin%';

UPDATE catalog_elements
SET type_label = '["artificial sweetener"]'
WHERE type_label LIKE '%artificial_sweetener%';

UPDATE catalog_elements
SET type_label = '["food additive"]'
WHERE type_label LIKE '%food_additive%';

UPDATE catalog_elements
SET type_label = '["organic acid"]'
WHERE type_label LIKE '%organic_acid%';

UPDATE catalog_elements
SET type_label = '["radioactive contaminant"]'
WHERE type_label LIKE '%radioactive_contaminant%';

UPDATE catalog_elements
SET type_label = '["disinfection byproduct"]'
WHERE type_label LIKE '%disinfection_byproduct%';

UPDATE catalog_elements
SET type_label = '["pharmaceutical residue"]'
WHERE type_label LIKE '%pharmaceutical_residue%';

UPDATE catalog_elements
SET type_label = '["water quality"]'
WHERE type_label LIKE '%water_quality_parameter%' OR type_label LIKE '%macro_water%';

UPDATE catalog_elements
SET type_label = '["processing byproduct"]'
WHERE type_label LIKE '%processing_contaminant%';

UPDATE catalog_elements
SET type_label = '["mineral"]'
WHERE type_label LIKE '%trace_element%';

UPDATE catalog_elements
SET type_label = '["fiber"]'
WHERE type_label LIKE '%soluble_fiber%';

UPDATE catalog_elements
SET type_label = '["phytonutrient"]'
WHERE type_label LIKE '%caffeine_like_stimulant%'
   OR type_label LIKE '%anthraquinone%'
   OR type_label LIKE '%diterpenoid%'
   OR type_label LIKE '%ginsenoside%'
   OR type_label LIKE '%peptide%'
   OR type_label LIKE '%polyphenol%';

UPDATE catalog_elements
SET type_label = '["antioxidant"]'
WHERE type_label LIKE '%catechin%'
   OR type_label LIKE '%flavonoid%';

UPDATE catalog_elements
SET type_label = '["carbohydrate"]'
WHERE type_label LIKE '%sucrose%'
   OR type_label LIKE '%sugar%';

UPDATE catalog_elements
SET type_label = '["food additive"]'
WHERE type_label LIKE '%additive%'
   OR type_label LIKE '%emulsifier%';

UPDATE catalog_elements
SET type_label = '["environmental contaminant"]'
WHERE type_label LIKE '%agricultural_contaminant%';

-- Merge multi-label heavy_metal,toxic_heavy_metal → heavy metal
UPDATE catalog_elements
SET type_label = '["heavy metal"]'
WHERE type_label LIKE '%heavy_metal%' AND type_label LIKE '%toxic_heavy_metal%';

-- Merge pesticide,preservative → keep as pesticide (Thymol will be overridden below)
UPDATE catalog_elements
SET type_label = '["pesticide"]'
WHERE type_label LIKE '%pesticide%' AND type_label LIKE '%preservative%';

-- Merge environmental contaminant,natural toxin → environmental contaminant
UPDATE catalog_elements
SET type_label = '["environmental contaminant"]'
WHERE type_label LIKE '%environmental contaminant%' AND type_label LIKE '%natural toxin%';

-- ============================================================
-- PART 2: RECLASSIFY MISPLACED ELEMENTS
-- Parasites, bacteria, viruses wrongly in pesticide/heavy metal/mycotoxin
-- PFAS, industrial chemicals wrongly in pesticide
-- ============================================================

-- 2a. PARASITES (wrongly classified as pesticide, heavy metal, mycotoxin)
UPDATE catalog_elements
SET type_label = '["parasite"]'
WHERE name_common IN (
  'Anisakis simplex', 'Clonorchis sinensis', 'Cryptosporidium parvum',
  'Cyclospora cayetanensis', 'Echinococcus granulosus', 'Entamoeba histolytica',
  'Giardia lamblia', 'Schistosoma mansoni', 'Strongyloides stercoralis',
  'Taenia saginata', 'Toxoplasma gondii', 'Trichinella spiralis',
  'Ascaris lumbricoides', 'Diphyllobothrium latum', 'Taenia solium',
  'Fasciola Hepatica (Liver Fluke)'
);

-- 2b. BACTERIA (wrongly classified as pesticide, mycotoxin, heavy metal, microorganism)
UPDATE catalog_elements
SET type_label = '["bacteria"]'
WHERE name_common IN (
  'Campylobacter jejuni', 'Clostridium perfringens', 'Cronobacter sakazakii',
  'E. coli', 'Listeria monocytogenes', 'Salmonella', 'Salmonella Enteritidis',
  'Shigella dysenteriae', 'Bacillus cereus', 'Clostridium botulinum',
  'Vibrio parahaemolyticus', 'Vibrio cholerae', 'Staphylococcus aureus'
);

-- 2c. VIRUSES (NULL type_label or microorganism)
UPDATE catalog_elements
SET type_label = '["virus"]'
WHERE name_common IN (
  'astrovirus', 'Hepatitis E', 'influenza a', 'influenza b',
  'measles', 'Norovirus', 'Poliovirus', 'Rotavirus', 'sapovirus', 'sars cov 2',
  'Adenovirus', 'Hepatitis A Virus'
);

-- 2d. PFAS (wrongly classified as pesticide or endocrine disruptor)
UPDATE catalog_elements
SET type_label = '["PFAS"]'
WHERE name_common IN (
  'PFBS', 'PFDA', 'PFHpA', 'PFNA', 'PFOA', 'PFOS', 'PFUnDA',
  'GenX (PFOA Replacement)', 'PFDoDA', 'PFHxS'
);

-- 2e. VETERINARY DRUGS (NULL type_label, category=vet_drugs)
UPDATE catalog_elements
SET type_label = '["veterinary drug"]'
WHERE name_common IN (
  'Chloramphenicol', 'Clenbuterol', 'Diflubenzuron', 'Emamectin Benzoate',
  'Enrofloxacin', 'Erythromycin', 'Estradiol', 'Ethoxyquin', 'Fenbendazole',
  'Florfenicol', 'Igf 1', 'Ivermectin', 'Malachite Green',
  'Melengestrol Acetate', 'Oxytetracycline', 'Progesterone', 'Ractopamine',
  'Rbgh Rbst', 'Sulfamethazine', 'Synthetic Astaxanthin',
  'Testosterone', 'Tetracycline', 'Trenbolone Acetate', 'Zeranol'
);

-- 2f. PAH compounds (from processing_contaminant or env contaminant)
UPDATE catalog_elements
SET type_label = '["PAH"]'
WHERE name_common IN (
  'Dibenz(a,h)anthracene', 'Benzo(a)pyrene', 'Benzo(b)fluoranthene',
  'Benzo(k)fluoranthene', 'Fluoranthene', 'Indeno(1,2,3-cd)pyrene',
  'Phenanthrene', 'Pyrene', 'Anthracene', 'Naphthalene'
);

-- 2g. VOC compounds
UPDATE catalog_elements
SET type_label = '["VOC"]'
WHERE name_common IN (
  'Benzene', 'Xylene', 'Ethylbenzene', 'Styrene', 'Toluene',
  'Formaldehyde', 'Chloroform', 'Methylene Chloride', 'Acrolein',
  '1,3-Butadiene', 'Tetrachloroethylene'
);

-- 2h. INDUSTRIAL CHEMICALS (wrongly in pesticide)
UPDATE catalog_elements
SET type_label = '["industrial chemical"]'
WHERE name_common IN (
  'Ethylene Oxide', 'Hexachlorobenzene', 'PCBs', 'Perchlorate',
  'Furans', 'Nanomaterials', 'Nitrosamines', 'Polycyclic Oil Mist',
  'Propylene Oxide', 'Residual Formaldehyde'
);

-- 2i. NATURAL TOXINS (wrongly in pesticide/heavy metal)
UPDATE catalog_elements
SET type_label = '["natural toxin"]'
WHERE name_common IN (
  'Goitrogens', 'Grayanotoxins', 'Lectins', 'Ciguatoxin',
  'Hypoglycin A', 'Sambunigrin'
);

-- 2j. AIR POLLUTANTS → environmental contaminant
UPDATE catalog_elements
SET type_label = '["environmental contaminant"]'
WHERE name_common IN (
  'Ground-level Ozone', 'Carbon Monoxide', 'Nitrogen Dioxide', 'PM10', 'PM2.5'
);

-- 2k. PROCESSING BYPRODUCTS (seed oil risks + others with NULL type_label)
UPDATE catalog_elements
SET type_label = '["processing byproduct"]'
WHERE name_common IN (
  '3 Mcpd Esters', '4 Hne', 'Aldehydes', 'Glycidyl Esters',
  'Hcas', 'Lipid Peroxidation', 'Mda', 'Polar Compounds',
  'Polymerization', 'Trans Isomers', 'Acrylamide', 'Potassium Bromate',
  'Acetaldehyde', 'Oxidation'
);

-- 2l. FOOD COLORINGS (wrongly in artificial_sweetener)
UPDATE catalog_elements
SET type_label = '["food coloring"]'
WHERE name_common IN (
  'Brilliant Blue', 'Erythrosine', 'Green S', 'Indigotine',
  'Patent Blue V', 'Ponceau 4R', 'Quinoline Yellow', 'Sunset Yellow',
  'Tartrazine', 'Amaranth', 'Brown HT', 'Allura Red AC'
);

-- 2m. SPECIFIC ELEMENT FIXES
-- Minerals wrongly in heavy metal
UPDATE catalog_elements SET type_label = '["mineral"]'
WHERE name_common IN ('Aluminum', 'Bismuth', 'Nickel', 'Palladium', 'Praseodymium', 'Rhodium', 'Silver', 'Tin');

-- Beneficial items with wrong/null type_label
UPDATE catalog_elements SET type_label = '["vitamin"]' WHERE name_common IN ('Vitamin B12 • Cobalamin', 'PABA');
UPDATE catalog_elements SET type_label = '["protein"]' WHERE name_common = 'Collagen';
UPDATE catalog_elements SET type_label = '["prebiotic"]' WHERE name_common = 'Inulin';
UPDATE catalog_elements SET type_label = '["probiotic"]' WHERE name_common = 'Probiotics';
UPDATE catalog_elements SET type_label = '["fatty acid"]' WHERE name_common IN ('Phospholipids', 'MUFAs');
UPDATE catalog_elements SET type_label = '["fiber"]' WHERE name_common = 'Pectin';
UPDATE catalog_elements SET type_label = '["amino acid"]' WHERE name_common IN ('Asparagine', 'Aspartate', 'Glutamine', 'Glycine', 'Proline', 'Serine', 'Dopamine');
UPDATE catalog_elements SET type_label = '["antioxidant"]' WHERE name_common IN ('Pterostilbene', 'Resveratrol');
UPDATE catalog_elements SET type_label = '["phytonutrient"]' WHERE name_common IN (
  'D-Chiro-Inositol', 'Thymoquinone', 'Ginsenosides', 'Oleuropein', 'Limonene',
  'Camphor', 'Thymol', 'Caffeine', 'Carvone', 'Citral', 'Withanolides'
);
UPDATE catalog_elements SET type_label = '["organic acid"]' WHERE name_common IN ('Citric acid', 'Tartaric acid', 'Acetic acid', 'Lactic acid');
UPDATE catalog_elements SET type_label = '["carbohydrate"]' WHERE name_common IN ('Trehalose', 'Invert Sugar', 'Fructose');

-- B17 is controversial
UPDATE catalog_elements SET type_label = '["natural toxin"]' WHERE name_common = 'B17 • Amygdalin';

-- Alcohol
UPDATE catalog_elements SET type_label = '["natural toxin"]' WHERE name_common = 'Alcohol';

-- ============================================================
-- PART 3: FIX CATEGORY FIELD
-- Derive category from type_label using correct mapping
-- category must ONLY be: beneficial, hazardous, or both
-- ============================================================

-- 3a. BENEFICIAL types
UPDATE catalog_elements SET category = 'beneficial'
WHERE (type_label LIKE '%vitamin%' OR type_label LIKE '%mineral%' OR type_label LIKE '%amino acid%' OR type_label LIKE '%fatty acid%'
  OR type_label LIKE '%antioxidant%' OR type_label LIKE '%phytonutrient%' OR type_label LIKE '%probiotic%' OR type_label LIKE '%prebiotic%' OR type_label LIKE '%enzyme%'
  OR type_label LIKE '%fiber%' OR type_label LIKE '%organic acid%' OR type_label LIKE '%protein%' OR type_label LIKE '%water quality%')
  AND category IS DISTINCT FROM 'beneficial';

-- 3b. HAZARDOUS types
UPDATE catalog_elements SET category = 'hazardous'
WHERE (type_label LIKE '%heavy metal%' OR type_label LIKE '%pesticide%' OR type_label LIKE '%herbicide%' OR type_label LIKE '%insecticide%'
  OR type_label LIKE '%mycotoxin%' OR type_label LIKE '%natural toxin%' OR type_label LIKE '%environmental contaminant%' OR type_label LIKE '%processing byproduct%'
  OR type_label LIKE '%food additive%' OR type_label LIKE '%artificial sweetener%' OR type_label LIKE '%food coloring%' OR type_label LIKE '%preservative%'
  OR type_label LIKE '%endocrine disruptor%' OR type_label LIKE '%plasticizer%' OR type_label LIKE '%solvent%' OR type_label LIKE '%radioactive contaminant%'
  OR type_label LIKE '%disinfection byproduct%' OR type_label LIKE '%disinfectant%' OR type_label LIKE '%pharmaceutical residue%'
  OR type_label LIKE '%veterinary drug%' OR type_label LIKE '%PFAS%' OR type_label LIKE '%bacteria%' OR type_label LIKE '%virus%' OR type_label LIKE '%parasite%'
  OR type_label LIKE '%PAH%' OR type_label LIKE '%VOC%' OR type_label LIKE '%industrial chemical%' OR type_label LIKE '%hormone%' OR type_label LIKE '%antibiotic%')
  AND category IS DISTINCT FROM 'hazardous';

-- 3c. BOTH types (beneficial in right context, hazardous otherwise)
UPDATE catalog_elements SET category = 'both'
WHERE (type_label LIKE '%antinutrient%' OR type_label LIKE '%carbohydrate%')
  AND category IS DISTINCT FROM 'both';

-- 3d. Specific BOTH overrides (minerals that can be toxic, phytonutrients with risks)
UPDATE catalog_elements SET category = 'both'
WHERE name_common IN (
  -- Minerals that are both helpful and toxic in excess
  'Aluminum', 'Bismuth', 'Nickel', 'Palladium', 'Praseodymium', 'Rhodium', 'Silver', 'Tin',
  'Fluoride', 'Nitrate', 'Barium', 'Beryllium',
  -- Phytonutrients/foods that are both
  'Camphor', 'Thymol', 'Caffeine', 'Theobromine', 'Artemisinin',
  'Carvone', 'Citral', 'B17 • Amygdalin', 'emodin', 'Triptolide',
  'Melittin', 'Alcohol', 'Ethanol',
  -- Fatty acids that are both
  'Omega-6', 'Trans Fats',
  -- Organic acids that are both
  'Citric acid', 'Tartaric acid',
  -- Carbs
  'Trehalose', 'Invert Sugar', 'Fructose'
);

-- 3e. Fix any remaining elements that still have invalid category
-- Catch-all: if category is not valid, set based on health_role or default to hazardous
UPDATE catalog_elements SET category = 'hazardous'
WHERE category NOT IN ('beneficial', 'hazardous', 'both')
  AND category IS NOT NULL;

UPDATE catalog_elements SET category = 'hazardous'
WHERE category IS NULL;

-- ============================================================
-- PART 4: FIX REMAINING NULL TYPE_LABELS
-- Elements that still have no type_label after all fixes
-- ============================================================
UPDATE catalog_elements SET type_label = '["processing byproduct"]'
WHERE type_label IS NULL AND category = 'hazardous';

UPDATE catalog_elements SET type_label = '["phytonutrient"]'
WHERE type_label IS NULL AND category = 'beneficial';

UPDATE catalog_elements SET type_label = '["phytonutrient"]'
WHERE type_label IS NULL AND category = 'both';

-- ============================================================
-- PART 5: FIX INGREDIENT CATEGORIES
-- Normalize case, fix typos, merge duplicates
-- ============================================================

-- 5a. Case normalization
UPDATE catalog_ingredients SET category = lower(trim(category))
WHERE category IS NOT NULL AND category != lower(trim(category));

-- 5b. Fix specific typos and duplicates
UPDATE catalog_ingredients SET category = 'dairy' WHERE lower(trim(category)) = 'dariy';
UPDATE catalog_ingredients SET category = 'sweetener' WHERE lower(trim(category)) IN ('sweetner', 'sweeteners', 'sweetner
', 'syrup');
UPDATE catalog_ingredients SET category = 'vegetable' WHERE lower(trim(category)) IN ('vegetables', 'vegtable', 'plant_vegetable');
UPDATE catalog_ingredients SET category = 'spice' WHERE lower(trim(category)) IN ('spices', 'spice
', 'plant_spice');
UPDATE catalog_ingredients SET category = 'herb' WHERE lower(trim(category)) IN ('plant_herb', 'medicinal_herb', 'culinary_herb');
UPDATE catalog_ingredients SET category = 'fruit' WHERE lower(trim(category)) = 'plant_fruit';
UPDATE catalog_ingredients SET category = 'plant oil' WHERE lower(trim(category)) IN ('plant oil', 'culinary_oil');
UPDATE catalog_ingredients SET category = 'meat' WHERE lower(trim(category)) IN ('red meat', 'white meat');
UPDATE catalog_ingredients SET category = 'mushroom' WHERE lower(trim(category)) = 'mushroom';
UPDATE catalog_ingredients SET category = 'seafood' WHERE lower(trim(category)) IN ('animal_seafood', 'seafood');
UPDATE catalog_ingredients SET category = 'plant' WHERE lower(trim(category)) = 'plant';
UPDATE catalog_ingredients SET category = 'starch' WHERE lower(trim(category)) = 'starch';

-- 5c. Normalize subcategory for ingredients with useful sub-classification
-- Set subcategory for meat types
UPDATE catalog_ingredients SET subcategory = 'red meat'
WHERE lower(trim(category)) = 'meat' AND subcategory IS NULL
  AND (lower(name_common) LIKE '%beef%' OR lower(name_common) LIKE '%lamb%'
    OR lower(name_common) LIKE '%pork%' OR lower(name_common) LIKE '%venison%'
    OR lower(name_common) LIKE '%bison%' OR lower(name_common) LIKE '%goat%');

UPDATE catalog_ingredients SET subcategory = 'poultry'
WHERE lower(trim(category)) = 'meat' AND subcategory IS NULL
  AND (lower(name_common) LIKE '%chicken%' OR lower(name_common) LIKE '%turkey%'
    OR lower(name_common) LIKE '%duck%' OR lower(name_common) LIKE '%quail%');

-- 5d. Final lowercase pass on category
UPDATE catalog_ingredients SET category = lower(trim(category))
WHERE category IS NOT NULL AND category != lower(trim(category));

COMMIT;
