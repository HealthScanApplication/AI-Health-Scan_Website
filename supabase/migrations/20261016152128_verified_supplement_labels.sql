BEGIN;

-- Verified on 2026-10-16. Ingredient identities and declared quantities only;
-- never infer a full formula from a generic product name or a similar supplier.
CREATE TEMP TABLE verified_label_products(product_id text PRIMARY KEY, source text, evidence text) ON COMMIT DROP;
INSERT INTO verified_label_products VALUES
('product_hs_max_detox','https://healthscan.myshopify.com/products/healthscan-max-detox','Exact variant 57911295639935 / SKU HS-MAXDETOX-60. Store discloses five ingredients, not a complete excipient panel.'),
('prod_us_4270000981708','https://www.xbyx.ch/products/energie-veganes-proteinpulver','Original 500 g variant, barcode 4270000981708. Nutrients per 30 g serving. Not a complete excipient analysis.'),
('trelune_baja_gold_minerals','https://bajagoldminerals.com/products/liquid-ocean-minerals','12 oz refill, manufacturer barcode 850034199290. Supplement Facts declare 2 ml serving; only five minerals quantified.');

CREATE TEMP TABLE verified_label_rows(product_id text, element_id text, ingredient text, amount numeric, unit text, serving text) ON COMMIT DROP;
INSERT INTO verified_label_rows VALUES
('product_hs_max_detox','supplement_ingredient_psyllium_husk','Psyllium husk',NULL,NULL,NULL),
('product_hs_max_detox','supplement_ingredient_acai','Acai',NULL,NULL,NULL),
('product_hs_max_detox','supplement_ingredient_chlorella','Chlorella',NULL,NULL,NULL),
('product_hs_max_detox','supplement_ingredient_slippery_elm_bark','Slippery elm bark',NULL,NULL,NULL),
('product_hs_max_detox','supplement_ingredient_black_walnut','Black walnut',NULL,NULL,NULL),
('trelune_baja_gold_minerals','calcium','Calcium',1,'mg','2 ml'),
('trelune_baja_gold_minerals','magnesium','Magnesium',3,'mg','2 ml'),
('trelune_baja_gold_minerals','chloride','Chloride',350,'mg','2 ml'),
('trelune_baja_gold_minerals','sodium','Sodium',200,'mg','2 ml'),
('trelune_baja_gold_minerals','potassium','Potassium',2,'mg','2 ml'),
('prod_us_4270000981708','retinol_vitamin_a','Vitamin A',360,'ug','30 g'),
('prod_us_4270000981708','ascorbic_acid_vitamin_c','Vitamin C',36.3,'mg','30 g'),
('prod_us_4270000981708','niacin_vitamin_b3','Niacin',7.3,'mg','30 g'),
('prod_us_4270000981708','tocopherol_vitamin_e','Vitamin E',7.4,'mg','30 g'),
('prod_us_4270000981708','pantothenic_acid_vitamin_b5','Pantothenic acid',2.7,'mg','30 g'),
('prod_us_4270000981708','pyridoxine_vitamin_b6','Vitamin B6',1.4,'mg','30 g'),
('prod_us_4270000981708','riboflavin_vitamin_b2','Riboflavin',0.63,'mg','30 g'),
('prod_us_4270000981708','thiamine_vitamin_b1','Thiamine',0.53,'mg','30 g'),
('prod_us_4270000981708','folate_vitamin_b9','Folate',213,'ug','30 g'),
('prod_us_4270000981708','biotin_vitamin_b7','Biotin',22.5,'ug','30 g'),
('prod_us_4270000981708','cobalamin_vitamin_b12','Vitamin B12',2.6,'ug','30 g'),
('prod_us_4270000981708','cholecalciferol_vitamin_d','Vitamin D',5.9,'ug','30 g'),
('prod_us_4270000981708','phylloquinone_vitamin_k','Vitamin K',35.5,'ug','30 g'),
('prod_us_4270000981708','calcium','Calcium',331,'mg','30 g'),
('prod_us_4270000981708','magnesium','Magnesium',173,'mg','30 g'),
('prod_us_4270000981708','potassium','Potassium',921,'mg','30 g'),
('prod_us_4270000981708','iron','Iron',6,'mg','30 g'),
('prod_us_4270000981708','zinc','Zinc',4.1,'mg','30 g'),
('prod_us_4270000981708','iodine','Iodine',63.8,'ug','30 g'),
('prod_us_4270000981708','selenium','Selenium',18.9,'ug','30 g'),
('prod_us_4270000981708','copper','Copper',0.39,'mg','30 g'),
('prod_us_4270000981708','manganese','Manganese',1.6,'mg','30 g'),
('prod_us_4270000981708','chromium','Chromium',21.3,'ug','30 g'),
('prod_us_4270000981708','molybdenum','Molybdenum',25.6,'ug','30 g'),
('prod_us_4270000981708','choline','Choline',NULL,NULL,'30 g'),
('prod_us_4270000981708','bromelain','Bromelain',NULL,NULL,'30 g'),
('prod_us_4270000981708','taurine','Taurine',NULL,NULL,'30 g'),
('prod_us_4270000981708','coenzyme_q10','Coenzyme Q10',NULL,NULL,'30 g'),
('prod_us_4270000981708','compound_prebiotic_inulin','Inulin',NULL,NULL,'30 g'),
('prod_us_4270000981708','pectin','Apple pectin',NULL,NULL,'30 g'),
('prod_us_4270000981708','actinidin','Actinidin (kiwi protease)',NULL,NULL,'30 g');

INSERT INTO public.catalog_elements(id,slug,name_common,category,classification,is_beneficial,description_simple,raw_data)
SELECT DISTINCT r.element_id,replace(r.element_id,'_','-'),r.ingredient,'Supplement Ingredients','supplement_ingredient',NULL::boolean,
 'Declared ingredient identity only; no constituent analysis or health effect inferred.',
 jsonb_build_object('source',p.source,'created_by','verified_label_20261016','identity_only',true)
FROM verified_label_rows r JOIN verified_label_products p USING(product_id)
WHERE r.element_id IN ('supplement_ingredient_acai','supplement_ingredient_chlorella')
ON CONFLICT(id) DO NOTHING;

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM verified_label_rows r LEFT JOIN public.catalog_elements e ON e.id=r.element_id WHERE e.id IS NULL) THEN
  RAISE EXCEPTION 'Verified label refers to a missing canonical element';
 END IF;
 IF (SELECT count(*) FROM public.catalog_products WHERE id IN (SELECT product_id FROM verified_label_products) AND product_kind='supplement') <> 3 THEN
  RAISE EXCEPTION 'Expected supplement records are missing';
 END IF;
END $$;

SELECT set_config('fv1.skip_product_recompute','on',true);
INSERT INTO public.catalog_product_elements(product_id,element_id,amount_per_serving,is_beneficial,likelihood_percent,likelihood_reason,metadata)
SELECT r.product_id,r.element_id,r.amount,NULL,100,'Manufacturer/store declared identity; not laboratory measured.',
 jsonb_strip_nulls(jsonb_build_object('composition_source',p.source,'declared_ingredient',r.ingredient,
 'serving_unit',r.unit,'serving_size',r.serving,'composition_link_status','declared','repair_id','verified_label_20261016')) ||
 jsonb_build_object('verified_label_20261016',jsonb_strip_nulls(jsonb_build_object('source',p.source,'evidence',p.evidence,
 'ingredient',r.ingredient,'amount',r.amount,'unit',r.unit,'serving',r.serving,'retrieved_on','2026-10-16')))
FROM verified_label_rows r JOIN verified_label_products p USING(product_id)
ON CONFLICT(product_id,element_id) DO UPDATE SET
 -- Retain existing quantities and their associated units/servings as a bundle.
 -- New label values live in their own namespace, even if historical data differs.
 metadata=coalesce(catalog_product_elements.metadata,'{}'::jsonb)||jsonb_build_object('verified_label_20261016',excluded.metadata->'verified_label_20261016');
SELECT set_config('fv1.skip_product_recompute','off',true);
SELECT public.fn_sync_product_elements_jsonb(product_id) FROM verified_label_products;

UPDATE public.catalog_products p SET raw_data=coalesce(p.raw_data,'{}'::jsonb)||jsonb_build_object('supplement_composition_repair',
 jsonb_build_object('status','linked','scope','declared_ingredient_identities_only','complete_formula',false,
 'expected_element_ids',(SELECT jsonb_agg(r.element_id ORDER BY r.element_id) FROM verified_label_rows r WHERE r.product_id=p.id),
 'reason',v.evidence,'source',v.source,'retrieved_on','2026-10-16','repair_id','verified_label_20261016',
 'label_image',CASE WHEN p.id='trelune_baja_gold_minerals' THEN 'https://cdn.shopify.com/s/files/1/0749/6538/5526/files/B-LIQ-SOLE-12-SupplementFacts_Directions.png?v=1751300299' END))
FROM verified_label_products v WHERE p.id=v.product_id;

UPDATE public.catalog_products p SET raw_data=coalesce(p.raw_data,'{}'::jsonb)||jsonb_build_object('supplement_composition_repair',
 coalesce(p.raw_data->'supplement_composition_repair','{}'::jsonb)||jsonb_build_object('status','needs_label','expected_element_ids','[]'::jsonb,'reason',v.reason))
FROM (VALUES
 ('activity_bj_supplement_stack','Unversioned stack activity (40+ pills), not an identifiable packaged formula. Supply its exact dated ingredient list.'),
 ('activity_root_supplement_stack','Grouped supplement activity with no ingredient list. Select individual products or supply the exact formula.'),
 ('activity_oneill_bentonite_clay','Bentonite OR green clay is an alternative, not a verified blend. Select the exact clay product and label.'),
 ('prod_generic_multivitamin','Generic multivitamin has no standard composition. Select a brand and exact variant/barcode before assigning ingredients.')
) v(id,reason) WHERE p.id=v.id;
COMMIT;
