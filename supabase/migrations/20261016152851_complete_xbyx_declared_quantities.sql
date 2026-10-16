BEGIN;
-- Manufacturer additional-nutrient panel: both 50 mg per 30 g serving.
-- https://www.xbyx.ch/products/energie-veganes-proteinpulver
-- Follow-up migration rather than rewriting an already applied migration.
SELECT set_config('fv1.skip_product_recompute','on',true);
UPDATE public.catalog_product_elements SET
 metadata=metadata||jsonb_build_object('verified_label_20261016',
   (metadata->'verified_label_20261016')||jsonb_build_object('amount',50,'unit','mg','serving','30 g'))||
   CASE WHEN amount_per_serving IS NULL AND metadata->>'repair_id'='verified_label_20261016' AND NOT (metadata ? 'serving_unit')
    THEN jsonb_build_object('serving_unit','mg','serving_size','30 g') ELSE '{}'::jsonb END,
 amount_per_serving=CASE WHEN amount_per_serving IS NULL AND metadata->>'repair_id'='verified_label_20261016' AND NOT (metadata ? 'serving_unit') THEN 50 ELSE amount_per_serving END
WHERE product_id='prod_us_4270000981708' AND element_id IN ('taurine','coenzyme_q10') AND metadata ? 'verified_label_20261016';
DO $$ BEGIN
 IF (SELECT count(*) FROM public.catalog_product_elements WHERE product_id='prod_us_4270000981708' AND element_id IN ('taurine','coenzyme_q10') AND metadata->'verified_label_20261016'->>'amount'='50' AND metadata->'verified_label_20261016'->>'unit'='mg') <> 2 THEN
  RAISE EXCEPTION 'Missing XbyX additional nutrient label junctions';
 END IF;
END $$;
SELECT set_config('fv1.skip_product_recompute','off',true);
SELECT public.fn_sync_product_elements_jsonb('prod_us_4270000981708');
COMMIT;
