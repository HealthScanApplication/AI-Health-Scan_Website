-- Repair declared ingredient identities, not clinical claims or inferred nutrient quantities.
-- Unknown blends remain explicitly uncurated. Existing junctions/quantities are preserved.
BEGIN;
CREATE TEMP TABLE supplement_composition_input (
  product_id text, ingredient text, source text, amount numeric, unit text, serving text
) ON COMMIT DROP;

INSERT INTO supplement_composition_input(product_id,ingredient,source)
SELECT p.id, i->>'name', 'catalog_products.supplement_facts'
FROM public.catalog_products p
CROSS JOIN LATERAL jsonb_array_elements(
  coalesce(p.supplement_facts->'ingredients','[]'::jsonb) ||
  coalesce(p.supplement_facts->'active_ingredients','[]'::jsonb)
) i
WHERE p.product_kind='supplement' AND nullif(trim(i->>'name'),'') IS NOT NULL
AND lower(trim(i->>'name')) NOT IN ('full spectrum vitamins and minerals');

-- Exact GTIN/UPC identities checked on the manufacturer's product pages, 2026-10-16.
INSERT INTO supplement_composition_input VALUES
('prod_ca_0733739012890','Magnesium','https://www.nowfoods.com/products/supplements/magnesium-glycinate-tablets',200,'mg','2 tablets'),
('prod_pl_5901330014734','Magnesium','https://olimpstore.pl/olimp-chela-mag-b6-60-capsules-568',100,'mg','1 capsule'),
('prod_pl_5901330014734','Vitamin B6','https://olimpstore.pl/olimp-chela-mag-b6-60-capsules-568',2.1,'mg','1 capsule'),
('prod_ca_0733739025401','Bee Propolis Extract','https://www.nowfoods.com/products/supplements/propolis-1500-capsules',300,'mg','1 capsule');

-- These names describe a single ingredient, not an undisclosed stack or blend.
INSERT INTO supplement_composition_input(product_id,ingredient,source) VALUES
('activity_bo_l_glutamine','L-Glutamine','catalog_products.name_common'),
('activity_bo_food_grade_diatomaceous_earth','Amorphous Silica (Diatomaceous Earth)','catalog_products.name_common'),
('activity_bo_high_dose_vitamin_c','Vitamin C (Ascorbic Acid)','catalog_products.name_common'),
('activity_bo_elderberry_syrup','Elderberry','catalog_products.name_common'),
('activity_bo_psyllium_fibre_to_flush','Psyllium Husk Fiber','catalog_products.name_common'),
('activity_bo_slippery_elm_before_meals','Slippery Elm','catalog_products.name_common'),
('activity_oneill_slippery_elm','Slippery Elm Bark','catalog_products.description (ingredient identity only)'),
('activity_oneill_olive_leaf_extract','Olive Leaf Extract','catalog_products.name_common'),
('activity_oneill_castor_oil_oral','Castor Oil','catalog_products.name_common'),
('activity_oneill_flaxseed','Flaxseed','catalog_products.name_common'),
('activity_oneill_acv_tonic','Apple Cider Vinegar','catalog_products.name_common'),
('activity_oneill_cayenne_water','Cayenne Pepper','catalog_products.name_common'),
('activity_bo_wormwood_black_walnut_clove_trio','Wormwood','catalog_products.name_common'),
('activity_bo_wormwood_black_walnut_clove_trio','Black Walnut','catalog_products.name_common'),
('activity_bo_wormwood_black_walnut_clove_trio','Clove','catalog_products.name_common'),
('activity_bo_probiotics_to_restore_flora','Mixed Probiotic Strains','catalog_products.name_common'),
('activity_oneill_activated_charcoal','Activated Charcoal','catalog_products.name_common'),
('activity_oneill_st_johns_wort','St John''s Wort','catalog_products.name_common'),
('prod_custom_magnesium_threonate','Magnesium','catalog_products.name_common'),
('prod_custom_vitamin_d3_k2','Vitamin D3 (Cholecalciferol)','catalog_products.name_common'),
('prod_custom_vitamin_d3_k2','Vitamin K2','catalog_products.name_common'),
('prod_custom_zinc_bisglycinate','Zinc','catalog_products.name_common');

CREATE TEMP TABLE supplement_element_alias(ingredient text PRIMARY KEY, element_id text) ON COMMIT DROP;
INSERT INTO supplement_element_alias VALUES
('magnesium','magnesium'),('vitamin b6','pyridoxine_vitamin_b6'),
('vitamin b6 (pyridoxine hcl)','pyridoxine_vitamin_b6'),
('vitamin c (ascorbic acid)','ascorbic_acid_vitamin_c'),
('vitamin d3 (cholecalciferol)','cholecalciferol_vitamin_d'),('vitamin k2','menaquinone_vitamin_k2'),
('vitamin b12','cobalamin_vitamin_b12'),('biotin (vitamin b7)','biotin_vitamin_b7'),
('b1 (thiamine)','thiamine_vitamin_b1'),('b2 (riboflavin)','riboflavin_vitamin_b2'),
('b3 (niacin)','niacin_vitamin_b3'),('b5 (pantothenic acid)','pantothenic_acid_vitamin_b5'),
('b6 (pyridoxine)','pyridoxine_vitamin_b6'),('b7 (biotin)','biotin_vitamin_b7'),
('b9 (folate)','folate_vitamin_b9'),('b12 (methylcobalamin)','cobalamin_vitamin_b12'),
('niacin (nicotinic acid)','niacin_vitamin_b3'),
('calcium','calcium'),('zinc','zinc'),('iron','iron'),('iodine','iodine'),('selenium','selenium'),
('sodium','sodium'),('potassium','potassium'),('chloride','chloride'),
('magnesium aspartate','magnesium'),('zinc monomethionine','zinc'),
('l-leucine','leucine'),('l-isoleucine','isoleucine'),('l-valine','valine'),
('l-glycine','glycine'),('l-glutamine','glutamine'),('l-citrulline','citrulline'),
('l-carnitine','l_carnitine'),('l-theanine','l_theanine'),
('alpha lipoic acid (r-ala)','alpha_lipoic_acid'),('apigenin','compound_flavone_apigenin'),
('berberine hcl','compound_alkaloid_berberine'),('coenzyme q10','coenzyme_q10'),
('coq10 (ubiquinol)','coenzyme_q10'),('melatonin','melatonin'),
('inulin','compound_prebiotic_inulin'),('mixed probiotic strains','probiotics'),
('phosphatidylcholine','phosphatidylcholine'),('quercetin','quercetin'),
('trans-resveratrol','compound_polyphenol_resveratrol'),
('n-acetyl l-cysteine','n_acetyl_cysteine'),('nicotinamide mononucleotide (nmn)','nmn_nicotinamide_mononucleotide'),
('glycerol (glycerin)','glycerol'),('glucosamine sulfate','glucosamine'),('chondroitin sulfate','chondroitin'),
('hydrolyzed collagen peptides','collagen'),('ashwagandha root extract','ashwagandha'),
('rhodiola rosea root extract','rhodiola_rosea'),('bromelain','bromelain'),
('curcumin','3cb37b86-4f97-4d92-8eeb-ba6735054885'),
('egcg (epigallocatechin gallate)','e36f8f40-51c0-45c0-847f-fd919a3812bb'),
('epa (eicosapentaenoic acid)','epa'),('dha (docosahexaenoic acid)','dha'),
('caffeine anhydrous','caffeine'),('caffeine','caffeine'),
('activated charcoal','f7953659-11d0-4f9f-9137-99ae27f0b05e'),
('amorphous silica (diatomaceous earth)','silica_water');

CREATE TEMP TABLE supplement_composition_resolved ON COMMIT DROP AS
SELECT i.*, coalesce(a.element_id,
  'supplement_ingredient_' || trim(both '_' from regexp_replace(lower(i.ingredient),'[^a-z0-9]+','_','g'))
) AS element_id
FROM supplement_composition_input i
JOIN public.catalog_products p ON p.id=i.product_id AND p.product_kind='supplement'
LEFT JOIN supplement_element_alias a ON a.ingredient=lower(trim(i.ingredient));

-- Missing catalogue entries are ingredient identities (including botanical extracts),
-- not fabricated molecular analyses. No formula, health benefit, dose or nutrient value is invented.
INSERT INTO public.catalog_elements(id,slug,name_common,category,classification,is_beneficial,description_simple,raw_data)
SELECT DISTINCT ON (r.element_id) r.element_id,replace(r.element_id,'_','-'),r.ingredient,'Supplement Ingredients','supplement_ingredient',NULL,
  'Declared supplement ingredient identity; constituent quantities and health effects are not inferred.',
  jsonb_build_object('source',r.source,'source_product_id',r.product_id,'created_by','supplement_composition_repair_20261016','identity_only',true)
FROM supplement_composition_resolved r
WHERE NOT EXISTS(SELECT 1 FROM public.catalog_elements e WHERE e.id=r.element_id)
ORDER BY r.element_id,r.product_id
ON CONFLICT(id) DO NOTHING;

-- Supported batch mode: avoid recalculating product JSON once per ingredient.
SELECT set_config('fv1.skip_product_recompute','on',true);
INSERT INTO public.catalog_product_elements(product_id,element_id,amount_per_serving,is_beneficial,likelihood_percent,likelihood_reason,metadata)
SELECT DISTINCT ON (r.product_id,r.element_id) r.product_id,r.element_id,r.amount,NULL,100,
  'Declared ingredient; not a measured laboratory composition.',
  jsonb_build_object('composition_source',r.source,'declared_ingredient',r.ingredient,
    'serving_unit',r.unit,'serving_size',r.serving,'composition_link_status','declared',
    'repair_id','supplement_composition_repair_20261016')
FROM supplement_composition_resolved r
ORDER BY r.product_id,r.element_id,r.amount NULLS LAST
ON CONFLICT(product_id,element_id) DO UPDATE SET
  metadata=jsonb_strip_nulls(excluded.metadata)||coalesce(catalog_product_elements.metadata,'{}'::jsonb)||
    jsonb_build_object('supplement_composition_repair',jsonb_strip_nulls(excluded.metadata)),
  amount_per_serving=coalesce(catalog_product_elements.amount_per_serving,excluded.amount_per_serving);
SELECT set_config('fv1.skip_product_recompute','off',true);
SELECT public.fn_sync_product_elements_jsonb(product_id) FROM (SELECT DISTINCT product_id FROM supplement_composition_resolved) p;

-- Keep an auditable per-product result, including unresolved labels. This is not a
-- publication change and does not claim a complete molecular or excipient analysis.
UPDATE public.catalog_products p SET raw_data=coalesce(p.raw_data,'{}'::jsonb)||jsonb_build_object(
  'supplement_composition_repair',jsonb_build_object(
    'status',CASE WHEN EXISTS(SELECT 1 FROM supplement_composition_resolved r WHERE r.product_id=p.id) THEN 'linked' ELSE 'needs_label' END,
    'scope','declared_ingredient_identities_only',
    'expected_element_ids',coalesce((SELECT jsonb_agg(DISTINCT r.element_id) FROM supplement_composition_resolved r WHERE r.product_id=p.id),'[]'::jsonb),
    'reason',CASE WHEN NOT EXISTS(SELECT 1 FROM supplement_composition_resolved r WHERE r.product_id=p.id) THEN 'No individually identified ingredients have been verified by this repair. Supply a product label or review existing composition.' ELSE 'Ingredient identities linked; generic typical-dose text was not used as measured composition.' END,
    'repair_id','supplement_composition_repair_20261016'
  ))
WHERE p.product_kind='supplement';

-- Exact existing element keys: do not map marketing targets such as nicotine detox
-- to nicotine as though it were an ingredient. Unpublished records stay unpublished.
INSERT INTO public.element_supplements(element_id,supplement_id,is_primary,notes)
SELECT CASE s.element_key WHEN 'vitamin_d' THEN 'cholecalciferol_vitamin_d' ELSE s.element_key END,
  s.id,true,'Composition repair: exact named nutrient identity; no dose inferred.'
FROM public.hs_supplements s
WHERE s.element_key IN ('vitamin_d','omega_3','magnesium','zinc')
AND EXISTS(SELECT 1 FROM public.catalog_elements e WHERE e.id=CASE s.element_key WHEN 'vitamin_d' THEN 'cholecalciferol_vitamin_d' ELSE s.element_key END)
AND NOT EXISTS(SELECT 1 FROM public.element_supplements es WHERE es.supplement_id=s.id AND es.element_id=CASE s.element_key WHEN 'vitamin_d' THEN 'cholecalciferol_vitamin_d' ELSE s.element_key END);
COMMIT;
