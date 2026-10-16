-- Read-only assertions: run before/after the repair against the website catalogue.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.catalog_product_elements WHERE product_id='prod_generic_vitamin_c' AND element_id='ascorbic_acid_vitamin_c') THEN
    RAISE EXCEPTION 'Vitamin C is missing its actual active ingredient';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.catalog_product_elements WHERE product_id='prod_ca_0733739012890' AND element_id='magnesium' AND amount_per_serving=200 AND metadata->>'serving_unit'='mg') THEN
    RAISE EXCEPTION 'NOW barcode 0733739012890 is missing label-sourced magnesium (200 mg per 2 tablets)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.catalog_product_elements WHERE product_id='prod_pl_5901330014734' AND element_id='pyridoxine_vitamin_b6' AND amount_per_serving=2.1) THEN
    RAISE EXCEPTION 'Olimp barcode 5901330014734 is missing label-sourced vitamin B6';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.catalog_product_elements WHERE product_id='prod_ca_0733739025401' AND element_id='supplement_ingredient_bee_propolis_extract' AND amount_per_serving=300) THEN
    RAISE EXCEPTION 'Propolis extract must be 300 mg, not the 1500 mg raw-equivalent marketing quantity';
  END IF;
  -- Seek each distinct identity through the existing element index. GROUP BY
  -- still walks 1.5M repeated keys; recursive keyset seeks visit each identity
  -- once. NULL links are checked separately rather than silently excluded.
  IF EXISTS (
    WITH RECURSIVE identities(element_id) AS (
      (SELECT element_id FROM public.catalog_product_elements WHERE element_id IS NOT NULL ORDER BY element_id LIMIT 1)
      UNION ALL
      SELECT (SELECT pe.element_id FROM public.catalog_product_elements pe WHERE pe.element_id>i.element_id ORDER BY pe.element_id LIMIT 1)
      FROM identities i WHERE i.element_id IS NOT NULL
    )
    SELECT 1 FROM identities i LEFT JOIN public.catalog_elements e ON e.id=i.element_id
    WHERE i.element_id IS NOT NULL AND e.id IS NULL
    UNION ALL
    SELECT 1 FROM public.catalog_product_elements WHERE element_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Dangling element junction';
  END IF;
  -- A valid, immediate, unfiltered unique index on both NOT NULL identities
  -- proves uniqueness for ALL products. Do not repeatedly aggregate 1.5M keys.
  -- If that protection is absent (including fixtures), inspect every row instead.
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_attribute p ON p.attrelid=i.indrelid AND p.attname='product_id' AND p.attnotnull AND NOT p.attisdropped
    JOIN pg_attribute e ON e.attrelid=i.indrelid AND e.attname='element_id' AND e.attnotnull AND NOT e.attisdropped
    WHERE i.indrelid='public.catalog_product_elements'::regclass
      AND i.indisunique AND i.indisvalid AND i.indisready AND i.indimmediate
      AND i.indpred IS NULL AND i.indexprs IS NULL AND i.indnkeyatts=2
      AND ((i.indkey[0]=p.attnum AND i.indkey[1]=e.attnum) OR (i.indkey[0]=e.attnum AND i.indkey[1]=p.attnum))
  ) THEN
    IF EXISTS (SELECT 1 FROM public.catalog_product_elements GROUP BY product_id,element_id HAVING count(*)>1) THEN
      RAISE EXCEPTION 'Duplicate product-element junction';
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM public.catalog_product_elements WHERE product_id IN ('prod_ca_0733739012890','prod_pl_5901330014734','prod_ca_0733739025401') AND metadata->>'repair_id'='supplement_composition_repair_20261016' AND is_beneficial IS NOT NULL) THEN
    RAISE EXCEPTION 'Ingredient presence must not invent a beneficial/hazardous classification';
  END IF;
  IF EXISTS (SELECT 1 FROM public.catalog_products p
    CROSS JOIN LATERAL jsonb_array_elements(coalesce(p.raw_data->'supplement_composition_repair'->'expected_element_ids','[]')) expected
    WHERE p.product_kind='supplement' AND NOT EXISTS (SELECT 1 FROM public.catalog_product_elements pe WHERE pe.product_id=p.id AND pe.element_id=expected#>>'{}')) THEN
    RAISE EXCEPTION 'A repaired product is missing one of its expected ingredient links';
  END IF;
END $$;

SELECT count(*) AS supplement_products,
  count(*) FILTER (WHERE raw_data->'supplement_composition_repair'->>'status'='linked') AS ingredient_lists_linked,
  count(*) FILTER (WHERE raw_data->'supplement_composition_repair'->>'status'='needs_label') AS needs_label,
  jsonb_agg(jsonb_build_object('id',id,'name',name_common)) FILTER (WHERE raw_data->'supplement_composition_repair'->>'status'='needs_label') AS unresolved
FROM public.catalog_products WHERE product_kind='supplement';
