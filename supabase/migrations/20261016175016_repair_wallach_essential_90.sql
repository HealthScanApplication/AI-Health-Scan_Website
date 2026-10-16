-- Historical Wallach core90 membership repair, not dietary or safety advice.
-- Sources/counting decision: src/config/wallachEssential90.json and docs/wallach-essential-90.md.
-- Never deletes/merges element rows, changes their safety classification or fabricates intake targets.
BEGIN;
SET LOCAL statement_timeout='60s';
CREATE TEMP TABLE wallach90_members (
 id text PRIMARY KEY, label text NOT NULL, key text UNIQUE NOT NULL,
 source_group text NOT NULL, ordinal integer UNIQUE NOT NULL
) ON COMMIT DROP;
INSERT INTO wallach90_members VALUES
('calcium','Calcium','calcium_mg','minerals',1),
('magnesium','Magnesium','magnesium_mg','minerals',2),
('phosphorus','Phosphorus','phosphorus_mg','minerals',3),
('potassium','Potassium','potassium_mg','minerals',4),
('sodium','Sodium','sodium_mg','minerals',5),
('chloride','Chloride','chloride_mg','minerals',6),
('sulfur','Sulfur','sulfur_mg','minerals',7),
('cobalt','Cobalt','cobalt_mcg','minerals',8),
('copper','Copper','copper_mg','minerals',9),
('aluminum','Aluminum','aluminum_mg','minerals',10),
('arsenic','Arsenic','arsenic_mcg','minerals',11),
('barium','Barium','barium_mg','minerals',12),
('beryllium','Beryllium','beryllium_mcg','minerals',13),
('boron','Boron','boron_mg','minerals',14),
('bromine','Bromine','bromine_mg','minerals',15),
('carbon','Carbon','carbon_mg','minerals',16),
('iodine','Iodine','iodine_mcg','minerals',17),
('iron','Iron','iron_mg','minerals',18),
('manganese','Manganese','manganese_mg','minerals',19),
('selenium','Selenium','selenium_mcg','minerals',20),
('zinc','Zinc','zinc_mg','minerals',21),
('cerium','Cerium','cerium_mg','minerals',22),
('cesium','Cesium','cesium_mcg','minerals',23),
('chromium','Chromium','chromium_mcg','minerals',24),
('dysprosium','Dysprosium','dysprosium_mg','minerals',25),
('erbium','Erbium','erbium_mg','minerals',26),
('europium','Europium','europium_mg','minerals',27),
('gadolinium','Gadolinium','gadolinium_mg','minerals',28),
('gallium','Gallium','gallium_mg','minerals',29),
('germanium','Germanium','germanium_mcg','minerals',30),
('gold','Gold','gold_mg','minerals',31),
('hafnium','Hafnium','hafnium_mg','minerals',32),
('holmium','Holmium','holmium_mg','minerals',33),
('hydrogen','Hydrogen','hydrogen_mg','minerals',34),
('lanthanum','Lanthanum','lanthanum_mg','minerals',35),
('lithium','Lithium','lithium_mg','minerals',36),
('lutetium','Lutetium','lutetium_mg','minerals',37),
('molybdenum','Molybdenum','molybdenum_mcg','minerals',38),
('neodymium','Neodymium','neodymium_mg','minerals',39),
('nickel','Nickel','nickel_mcg','minerals',40),
('niobium','Niobium','niobium_mcg','minerals',41),
('nitrogen','Nitrogen','nitrogen_mg','minerals',42),
('oxygen','Oxygen','oxygen_mg','minerals',43),
('praseodymium','Praseodymium','praseodymium_mg','minerals',44),
('rhenium','Rhenium','rhenium_mg','minerals',45),
('rubidium','Rubidium','rubidium_mg','minerals',46),
('samarium','Samarium','samarium_mg','minerals',47),
('scandium','Scandium','scandium_mg','minerals',48),
('silica_water','Silica','silica_mg','minerals',49),
('silver','Silver','silver_mcg','minerals',50),
('strontium','Strontium','strontium_mg','minerals',51),
('tantalum','Tantalum','tantalum_mg','minerals',52),
('terbium','Terbium','terbium_mg','minerals',53),
('thulium','Thulium','thulium_mg','minerals',54),
('tin','Tin','tin_mg','minerals',55),
('titanium','Titanium','titanium_mg','minerals',56),
('vanadium','Vanadium','vanadium_mcg','minerals',57),
('ytterbium','Ytterbium','ytterbium_mg','minerals',58),
('yttrium','Yttrium','yttrium_mcg','minerals',59),
('zirconium','Zirconium','zirconium_mg','minerals',60),
('retinol_vitamin_a','Vitamin A','vitamin_a_mcg','vitamins',61),
('thiamine_vitamin_b1','Vitamin B1 (Thiamine)','thiamine_mg','vitamins',62),
('riboflavin_vitamin_b2','Vitamin B2 (Riboflavin)','riboflavin_mg','vitamins',63),
('niacin_vitamin_b3','Vitamin B3 (Niacin)','niacin_mg','vitamins',64),
('pantothenic_acid_vitamin_b5','Vitamin B5 (Pantothenic acid)','pantothenic_acid_mg','vitamins',65),
('pyridoxine_vitamin_b6','Vitamin B6','vitamin_b6_mg','vitamins',66),
('cobalamin_vitamin_b12','Vitamin B12','vitamin_b12_mcg','vitamins',67),
('ascorbic_acid_vitamin_c','Vitamin C','vitamin_c_mg','vitamins',68),
('cholecalciferol_vitamin_d','Vitamin D','vitamin_d_mcg','vitamins',69),
('tocopherol_vitamin_e','Vitamin E','vitamin_e_mg','vitamins',70),
('phylloquinone_vitamin_k','Vitamin K','vitamin_k_mcg','vitamins',71),
('biotin_vitamin_b7','Biotin (B7)','biotin_mcg','vitamins',72),
('choline','Choline','choline_mg','vitamins',73),
('flavonoids','Flavonoids (Bioflavonoids)','flavonoids_mg','vitamins',74),
('folate_vitamin_b9','Folic acid (Folate/B9)','folate_mcg','vitamins',75),
('myo_inositol_inositol','Inositol','inositol_mg','vitamins',76),
('valine','Valine','valine_g','amino_acids',77),
('lysine','Lysine','lysine_g','amino_acids',78),
('threonine','Threonine','threonine_g','amino_acids',79),
('leucine','Leucine','leucine_g','amino_acids',80),
('isoleucine','Isoleucine','isoleucine_g','amino_acids',81),
('tryptophan','Tryptophan','tryptophan_g','amino_acids',82),
('phenylalanine','Phenylalanine','phenylalanine_g','amino_acids',83),
('methionine','Methionine','methionine_g','amino_acids',84),
('histidine','Histidine','histidine_g','amino_acids',85),
('arginine','Arginine','arginine_mg','amino_acids',86),
('taurine','Taurine','taurine_mg','amino_acids',87),
('tyrosine','Tyrosine','tyrosine_mg','amino_acids',88),
('omega_3','Omega-3','omega_3_g','fatty_acids',89),
('omega_6','Omega-6','omega_6_g','fatty_acids',90);

DO $guard$ BEGIN
 IF (SELECT count(*) FROM wallach90_members) <> 90
 OR (SELECT count(*) FROM wallach90_members WHERE source_group='minerals') <> 60
 OR (SELECT count(*) FROM wallach90_members WHERE source_group='vitamins') <> 16
 OR (SELECT count(*) FROM wallach90_members WHERE source_group='amino_acids') <> 12
 OR (SELECT count(*) FROM wallach90_members WHERE source_group='fatty_acids') <> 2
 THEN RAISE EXCEPTION 'Invalid historical core90 manifest'; END IF;
END $guard$;

-- Snapshot every existing record to assert that unrelated fields and safety data do not change.
CREATE TEMP TABLE wallach90_before ON COMMIT DROP AS
 SELECT id,to_jsonb(e)-'essential_90'-'raw_data'-'updated_at' AS original
 FROM public.catalog_elements e;

-- Identity-only rows for genuinely absent source-list elements. No beneficial status,
-- nutrient measurement, dose or reference value is inferred from historical membership.
INSERT INTO public.catalog_elements (id,slug,name_common,category,classification,essential_90,is_beneficial,nutrient_key,daily_value_amount,daily_value_unit,raw_data)
SELECT m.id,'wallach-reference-'||replace(m.id,'_','-'),m.label,'Historical reference','historical_reference','true',
 NULL,NULL,NULL,NULL,
 jsonb_build_object('identity_only',true,'created_by','wallach-core-90-2026-10-16',
  'wallach90_repair',jsonb_build_object('version','wallach-core-90-2026-10-16','previous_essential_90',null,'created_identity',true))
FROM wallach90_members m WHERE NOT EXISTS (SELECT 1 FROM public.catalog_elements e WHERE e.id=m.id)
ON CONFLICT (id) DO NOTHING;

-- Preserve the previous flag once, so this change remains recoverable. Raw JSON is merged,
-- not replaced; all ingredient/supplement junctions continue referencing the same IDs.
UPDATE public.catalog_elements e SET
 essential_90=CASE WHEN m.id IS NOT NULL THEN 'true' ELSE 'false' END,
 raw_data=coalesce(e.raw_data,'{}'::jsonb) || jsonb_build_object(
 'wallach90_repair',coalesce(e.raw_data->'wallach90_repair',
  jsonb_build_object('version','wallach-core-90-2026-10-16','previous_essential_90',e.essential_90)),
 'wallach90_membership',jsonb_build_object(
  'version','wallach-core-90-2026-10-16','member',m.id IS NOT NULL,'ordinal',m.ordinal,
  'group',m.source_group,'key',m.key,'label',m.label,
  'source_urls','["https://youngevityrc.com/wp-content/uploads/HBSP-2pt0_trifold-brochure4-0715-4review.pdf","https://youngevityproducts.co.uk/pages/the-90-nutrients"]'::jsonb,
  'counting_note','Core 90: 60 minerals, 16 vitamins, 12 amino acids, 2 fatty-acid groups. Published variants also list Omega-9, making 91; Omega-9 remains outside this core collection. Membership is historical attribution, not scientific essentiality, safety or intake advice.'))
FROM (SELECT e0.id AS element_id,m0.* FROM public.catalog_elements e0
 LEFT JOIN wallach90_members m0 ON m0.id=e0.id
 WHERE e0.essential_90='true' OR m0.id IS NOT NULL) m
WHERE e.id=m.element_id;

DO $verify$ BEGIN
 IF EXISTS (SELECT 1 FROM public.catalog_elements e LEFT JOIN wallach90_before b ON b.id=e.id
 WHERE b.id IS NULL AND (e.is_beneficial IS NOT NULL OR e.nutrient_key IS NOT NULL OR e.daily_value_amount IS NOT NULL OR e.daily_value_unit IS NOT NULL))
 THEN RAISE EXCEPTION 'New historical identities must not acquire beneficial status or intake targets'; END IF;
 IF (SELECT count(*) FROM public.catalog_elements WHERE essential_90='true') <> 90
 OR EXISTS (SELECT 1 FROM wallach90_members m LEFT JOIN public.catalog_elements e ON e.id=m.id
 WHERE e.id IS NULL OR e.essential_90 IS DISTINCT FROM 'true')
 THEN RAISE EXCEPTION 'Historical core90 membership verification failed'; END IF;
 IF EXISTS (SELECT 1 FROM wallach90_before b LEFT JOIN public.catalog_elements e ON e.id=b.id
 WHERE e.id IS NULL OR to_jsonb(e)-'essential_90'-'raw_data'-'updated_at' IS DISTINCT FROM b.original)
 THEN RAISE EXCEPTION 'An existing identity, safety field, target or unrelated field changed'; END IF;
END $verify$;
SELECT m.source_group,count(*) AS members,
 count(*) FILTER (WHERE b.id IS NULL) AS identity_only_rows_added
FROM wallach90_members m JOIN public.catalog_elements e ON e.id=m.id
LEFT JOIN wallach90_before b ON b.id=e.id GROUP BY m.source_group ORDER BY m.source_group;
COMMIT;
