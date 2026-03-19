-- ============================================================
-- FOLLOW-UP PATCH: Fix element misclassifications, normalize
-- type_label to bracket JSON format, add microorganism nicknames
-- ============================================================
BEGIN;

-- ============================================================
-- 1. Fix WRONG items in 'Vitamin' type_label
-- (these are NOT vitamins — reclassify correctly)
-- ============================================================
UPDATE catalog_elements SET type_label = '["phytonutrient"]', category = 'beneficial' WHERE name_common = 'Chlorophyll';
UPDATE catalog_elements SET type_label = '["carbohydrate"]', category = 'both' WHERE name_common = 'Complex Carbohydrates';
UPDATE catalog_elements SET type_label = '["antioxidant"]', category = 'beneficial' WHERE name_common = 'Provitamin • Beta-Carotene';
UPDATE catalog_elements SET type_label = '["carbohydrate"]', category = 'both' WHERE name_common = 'Starch';
UPDATE catalog_elements SET type_label = '["natural toxin"]', category = 'both' WHERE name_common = 'Vitamin B17 • Amygdalin';

-- ============================================================
-- 2. Fix WRONG items in 'pesticide' type_label
-- ============================================================
UPDATE catalog_elements SET type_label = '["bacteria"]' WHERE name_common = 'Yersinia enterocolitica';
UPDATE catalog_elements SET type_label = '["PAH"]' WHERE name_common = 'pahs';
UPDATE catalog_elements SET type_label = '["PFAS"]' WHERE name_common = 'pfas';

-- ============================================================
-- 3. Fix case-inconsistent type_labels → bracket format
-- ============================================================
UPDATE catalog_elements SET type_label = '["phytonutrient"]'
WHERE type_label = 'Phytonutrient';

UPDATE catalog_elements SET type_label = '["vitamin"]'
WHERE type_label = 'Vitamin' AND name_common LIKE 'Vitamin%';
UPDATE catalog_elements SET type_label = '["vitamin"]'
WHERE type_label = 'Vitamin' AND name_common = 'Choline';

-- ============================================================
-- 4. Normalize ALL plain-text type_labels → bracket JSON format
-- Mobile app expects ["value"] format for grouping
-- mineral → ["mineral"], antioxidant → ["antioxidant"], etc.
-- Only update rows NOT already in bracket format
-- ============================================================
UPDATE catalog_elements
SET type_label = '["' || LOWER(type_label) || '"]'
WHERE type_label IS NOT NULL
  AND type_label NOT LIKE '["%"]'
  AND type_label != '';

-- ============================================================
-- 5. Add seed oil risk items to cooking byproducts
-- ============================================================
UPDATE catalog_elements SET type_label = '["cooking byproduct"]'
WHERE name_common IN (
  '3 Mcpd Esters', '4 Hne', 'Aldehydes', 'Glycidyl Esters',
  'Hcas', 'Lipid Peroxidation', 'Mda', 'Polar Compounds',
  'Polymerization', 'Trans Isomers', 'Oxidation'
);

UPDATE catalog_elements SET type_label = '["cooking byproduct"]'
WHERE name_common IN (
  'Acrylamide', 'Anthracene', 'Benzo(a)pyrene', 'Benzo(b)fluoranthene',
  'Benzo(k)fluoranthene', 'Dibenz(a,h)anthracene', 'Fluoranthene',
  'Indeno(1,2,3-cd)pyrene', 'Naphthalene', 'Nitrosamines',
  'Phenanthrene', 'Pyrene', 'Potassium Bromate', 'Acetaldehyde'
);

-- ============================================================
-- 6. Add common nicknames to microorganisms
-- Format: Scientific Name (Common Name)
-- ============================================================

-- Parasites
UPDATE catalog_elements SET name_common = 'Anisakis simplex (Herring Worm)' WHERE name_common = 'Anisakis simplex';
UPDATE catalog_elements SET name_common = 'Ascaris lumbricoides (Roundworm)' WHERE name_common = 'Ascaris lumbricoides';
UPDATE catalog_elements SET name_common = 'Clonorchis sinensis (Chinese Liver Fluke)' WHERE name_common = 'Clonorchis sinensis';
UPDATE catalog_elements SET name_common = 'Cryptosporidium parvum (Crypto)' WHERE name_common = 'Cryptosporidium parvum';
UPDATE catalog_elements SET name_common = 'Cyclospora cayetanensis (Cyclosporiasis)' WHERE name_common = 'Cyclospora cayetanensis';
UPDATE catalog_elements SET name_common = 'Diphyllobothrium latum (Fish Tapeworm)' WHERE name_common = 'Diphyllobothrium latum';
UPDATE catalog_elements SET name_common = 'Echinococcus granulosus (Hydatid Worm)' WHERE name_common = 'Echinococcus granulosus';
UPDATE catalog_elements SET name_common = 'Entamoeba histolytica (Amoebic Dysentery)' WHERE name_common = 'Entamoeba histolytica';
-- Fasciola Hepatica already has (Liver Fluke) — skip
UPDATE catalog_elements SET name_common = 'Giardia lamblia (Beaver Fever)' WHERE name_common = 'Giardia lamblia';
UPDATE catalog_elements SET name_common = 'Schistosoma mansoni (Blood Fluke)' WHERE name_common = 'Schistosoma mansoni';
UPDATE catalog_elements SET name_common = 'Strongyloides stercoralis (Threadworm)' WHERE name_common = 'Strongyloides stercoralis';
UPDATE catalog_elements SET name_common = 'Taenia saginata (Beef Tapeworm)' WHERE name_common = 'Taenia saginata';
UPDATE catalog_elements SET name_common = 'Taenia solium (Pork Tapeworm)' WHERE name_common = 'Taenia solium';
UPDATE catalog_elements SET name_common = 'Toxoplasma gondii (Toxoplasmosis)' WHERE name_common = 'Toxoplasma gondii';
UPDATE catalog_elements SET name_common = 'Trichinella spiralis (Trichina Worm)' WHERE name_common = 'Trichinella spiralis';

-- Bacteria
UPDATE catalog_elements SET name_common = 'Bacillus cereus (Fried Rice Syndrome)' WHERE name_common = 'Bacillus cereus';
UPDATE catalog_elements SET name_common = 'Campylobacter jejuni (Campylobacter)' WHERE name_common = 'Campylobacter jejuni';
UPDATE catalog_elements SET name_common = 'Clostridium botulinum (Botulism)' WHERE name_common = 'Clostridium botulinum';
UPDATE catalog_elements SET name_common = 'Clostridium perfringens (Food Poisoning)' WHERE name_common = 'Clostridium perfringens';
UPDATE catalog_elements SET name_common = 'Cronobacter sakazakii (Infant Formula Contamination)' WHERE name_common = 'Cronobacter sakazakii';
UPDATE catalog_elements SET name_common = 'E. coli O157:H7 (Hamburger Disease)' WHERE name_common = 'E. coli';
UPDATE catalog_elements SET name_common = 'Listeria monocytogenes (Listeriosis)' WHERE name_common = 'Listeria monocytogenes';
UPDATE catalog_elements SET name_common = 'Salmonella Enteritidis (Egg Salmonella)' WHERE name_common = 'Salmonella Enteritidis';
UPDATE catalog_elements SET name_common = 'Shigella dysenteriae (Bacillary Dysentery)' WHERE name_common = 'Shigella dysenteriae';
UPDATE catalog_elements SET name_common = 'Staphylococcus aureus (Staph Infection)' WHERE name_common = 'Staphylococcus aureus';
UPDATE catalog_elements SET name_common = 'Vibrio cholerae (Cholera)' WHERE name_common = 'Vibrio cholerae';
UPDATE catalog_elements SET name_common = 'Vibrio parahaemolyticus (Seafood Poisoning)' WHERE name_common = 'Vibrio parahaemolyticus';
UPDATE catalog_elements SET name_common = 'Yersinia enterocolitica (Yersiniosis)' WHERE name_common = 'Yersinia enterocolitica';

-- Viruses (fix capitalization + add nicknames)
UPDATE catalog_elements SET name_common = 'Adenovirus (Common Cold)' WHERE name_common = 'Adenovirus';
UPDATE catalog_elements SET name_common = 'Astrovirus (Stomach Flu)' WHERE name_common = 'astrovirus';
UPDATE catalog_elements SET name_common = 'Hepatitis A Virus (HAV)' WHERE name_common = 'Hepatitis A Virus';
UPDATE catalog_elements SET name_common = 'Hepatitis E (HEV)' WHERE name_common = 'Hepatitis E';
UPDATE catalog_elements SET name_common = 'Influenza A (Flu)' WHERE name_common = 'influenza a';
UPDATE catalog_elements SET name_common = 'Influenza B (Flu)' WHERE name_common = 'influenza b';
UPDATE catalog_elements SET name_common = 'Measles (Rubeola)' WHERE name_common = 'measles';
UPDATE catalog_elements SET name_common = 'Norovirus (Stomach Bug)' WHERE name_common = 'Norovirus';
UPDATE catalog_elements SET name_common = 'Poliovirus (Polio)' WHERE name_common = 'Poliovirus';
UPDATE catalog_elements SET name_common = 'Rotavirus (Infant Diarrhea)' WHERE name_common = 'Rotavirus';
UPDATE catalog_elements SET name_common = 'Sapovirus (Stomach Flu)' WHERE name_common = 'sapovirus';
UPDATE catalog_elements SET name_common = 'SARS-CoV-2 (COVID-19)' WHERE name_common = 'sars cov 2';

-- Fix pahs/pfas names (after type_label already fixed above)
UPDATE catalog_elements SET name_common = 'PAHs (Polycyclic Aromatic Hydrocarbons)' WHERE name_common = 'pahs';
UPDATE catalog_elements SET name_common = 'PFAS (Forever Chemicals)' WHERE name_common = 'pfas';

-- ============================================================
-- 7. Ensure category is correct for all reclassified items
-- ============================================================
UPDATE catalog_elements SET category = 'hazardous'
WHERE type_label IN ('["bacteria"]', '["PAH"]', '["PFAS"]', '["cooking byproduct"]')
  AND category IS DISTINCT FROM 'hazardous';

-- ============================================================
-- 8. Final category consistency — no invalid values
-- ============================================================
UPDATE catalog_elements SET category = 'hazardous'
WHERE category NOT IN ('beneficial', 'hazardous', 'both');

COMMIT;
