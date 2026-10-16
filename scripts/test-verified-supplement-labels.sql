DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM (VALUES ('product_hs_max_detox',5),('prod_us_4270000981708',31),('trelune_baja_gold_minerals',5)) v(id,n) LEFT JOIN public.catalog_products p ON p.id=v.id WHERE p.id IS NULL OR p.raw_data->'supplement_composition_repair'->>'status' IS DISTINCT FROM 'linked' OR jsonb_array_length(p.raw_data->'supplement_composition_repair'->'expected_element_ids') IS DISTINCT FROM v.n) THEN
    RAISE EXCEPTION 'Verified product status or expected ingredient count is incorrect';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.catalog_product_elements WHERE product_id='trelune_baja_gold_minerals' AND element_id='chloride' AND metadata->'verified_label_20261016'->>'amount'='350' AND metadata->'verified_label_20261016'->>'unit'='mg' AND metadata->'verified_label_20261016'->>'serving'='2 ml') THEN
    RAISE EXCEPTION 'Baja Gold refill requires label-declared chloride 350 mg per 2 ml';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.catalog_product_elements WHERE product_id='prod_us_4270000981708' AND element_id='cobalamin_vitamin_b12' AND metadata->'verified_label_20261016'->>'amount'='2.6' AND metadata->'verified_label_20261016'->>'unit'='ug') THEN
    RAISE EXCEPTION 'Exact XbyX barcode requires B12 2.6 micrograms, not milligrams';
  END IF;
  IF (SELECT count(*) FROM public.catalog_product_elements WHERE product_id='product_hs_max_detox' AND metadata ? 'verified_label_20261016') <> 5 THEN
    RAISE EXCEPTION 'Max Detox must have exactly the five ingredients disclosed for its exact storefront variant';
  END IF;
  IF EXISTS (SELECT 1 FROM public.catalog_products WHERE id IN ('activity_bj_supplement_stack','activity_root_supplement_stack','activity_oneill_bentonite_clay','prod_generic_multivitamin') AND (raw_data->'supplement_composition_repair'->>'status' IS DISTINCT FROM 'needs_label' OR raw_data->'supplement_composition_repair'->'expected_element_ids' IS DISTINCT FROM '[]'::jsonb)) THEN
    RAISE EXCEPTION 'Unspecified formulas must not be presented as verified compositions';
  END IF;
  IF EXISTS (SELECT 1 FROM public.catalog_products p CROSS JOIN LATERAL jsonb_array_elements_text(p.raw_data->'supplement_composition_repair'->'expected_element_ids') e(id) WHERE p.id IN ('product_hs_max_detox','prod_us_4270000981708','trelune_baja_gold_minerals') AND NOT EXISTS (SELECT 1 FROM public.catalog_product_elements pe WHERE pe.product_id=p.id AND pe.element_id=e.id AND pe.metadata ? 'verified_label_20261016')) THEN
    RAISE EXCEPTION 'Verified label identity is missing its sourced junction';
  END IF;
  IF EXISTS (SELECT 1 FROM public.catalog_product_elements WHERE metadata->>'repair_id'='verified_label_20261016' AND is_beneficial IS NOT NULL) THEN
    RAISE EXCEPTION 'New ingredient links must not invent beneficial/hazardous classifications';
  END IF;
END $$;
