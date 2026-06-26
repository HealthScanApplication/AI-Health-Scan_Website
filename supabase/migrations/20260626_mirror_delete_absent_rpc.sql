-- ============================================================
-- Migration: mirror_delete_absent() RPC — for the "mirror to prod" sync
-- Created: 2026-06-26
--
-- Deletes every row in p_table whose id is NOT in p_keep_ids, in a single
-- set-based statement (so self-referential FKs like catalog_ingredients.
-- parent_ingredient_id and ON DELETE CASCADE junctions resolve correctly).
-- SECURITY DEFINER + admin-gated. Refuses an empty keep-list so it can never
-- wipe a whole table by accident.
-- ============================================================

CREATE OR REPLACE FUNCTION public.mirror_delete_absent(p_table text, p_keep_ids text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  IF NOT public.is_healthscan_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF p_keep_ids IS NULL OR array_length(p_keep_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'keep_ids is empty — refusing to delete all rows of %', p_table;
  END IF;
  EXECUTE format('DELETE FROM %I WHERE id::text <> ALL($1)', p_table) USING p_keep_ids;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mirror_delete_absent(text, text[]) TO authenticated;
