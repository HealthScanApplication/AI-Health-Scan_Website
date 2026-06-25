-- ============================================================
-- Migration: merge_catalog_records() RPC
-- Created: 2026-06-25
--
-- Admin "Merge 2 records" needs to fold a duplicate catalog row into a survivor:
-- re-point EVERY row that references the duplicate onto the survivor, then delete
-- the duplicate. Doing this column-by-column on the client is fragile — there are
-- many FKs (junctions, element links, and a self-referential
-- catalog_ingredients.parent_ingredient_id that BLOCKS the delete unless moved).
--
-- This function discovers all single-column FKs that reference the target table
-- from the catalog (pg_constraint), re-points them (de-duping rows that would
-- violate a UNIQUE/PK constraint once moved), then deletes the duplicate — all in
-- one transaction. SECURITY DEFINER so it bypasses per-table RLS; gated to
-- HealthScan admins. Returns a jsonb map of "table.column": rows_repointed.
-- ============================================================

CREATE OR REPLACE FUNCTION public.merge_catalog_records(
  p_table text, p_survivor text, p_duplicate text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fk        RECORD;
  uq        RECORD;
  v_count   int;
  result    jsonb := '{}'::jsonb;
  join_cond text;
BEGIN
  IF NOT public.is_healthscan_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_survivor IS NULL OR p_duplicate IS NULL OR p_survivor = p_duplicate THEN
    RAISE EXCEPTION 'survivor and duplicate must differ and be non-null';
  END IF;

  -- every single-column FK that references p_table
  FOR fk IN
    SELECT con.conrelid AS child_oid,
           con.conrelid::regclass::text AS child_table,
           att.attname AS child_col
    FROM pg_constraint con
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND con.confrelid = p_table::regclass
      AND array_length(con.conkey, 1) = 1
  LOOP
    -- collision pre-clean: for each UNIQUE/PK on the child table that includes
    -- this FK column, delete duplicate-side rows that would clash with an
    -- existing survivor-side row once re-pointed.
    FOR uq IN
      SELECT con2.conkey
      FROM pg_constraint con2
      WHERE con2.conrelid = fk.child_oid
        AND con2.contype IN ('u', 'p')
        AND (SELECT a.attnum FROM pg_attribute a
             WHERE a.attrelid = fk.child_oid AND a.attname = fk.child_col) = ANY (con2.conkey)
    LOOP
      SELECT string_agg(format('d.%1$I IS NOT DISTINCT FROM s.%1$I', a.attname), ' AND ')
        INTO join_cond
        FROM unnest(uq.conkey) AS k(attnum)
        JOIN pg_attribute a ON a.attrelid = fk.child_oid AND a.attnum = k.attnum
        WHERE a.attname <> fk.child_col;

      IF join_cond IS NULL THEN
        -- unique key is the FK column alone: any survivor row collides
        EXECUTE format(
          'DELETE FROM %1$s d WHERE d.%2$I = %3$L AND EXISTS (SELECT 1 FROM %1$s s WHERE s.%2$I = %4$L)',
          fk.child_table, fk.child_col, p_duplicate, p_survivor);
      ELSE
        EXECUTE format(
          'DELETE FROM %1$s d WHERE d.%2$I = %3$L AND EXISTS (SELECT 1 FROM %1$s s WHERE s.%2$I = %4$L AND %5$s)',
          fk.child_table, fk.child_col, p_duplicate, p_survivor, join_cond);
      END IF;
    END LOOP;

    EXECUTE format('UPDATE %s SET %I = %L WHERE %I = %L',
                   fk.child_table, fk.child_col, p_survivor, fk.child_col, p_duplicate);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    result := result || jsonb_build_object(fk.child_table || '.' || fk.child_col, v_count);
  END LOOP;

  EXECUTE format('DELETE FROM %s WHERE id = %L', p_table, p_duplicate);
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_catalog_records(text, text, text) TO authenticated;
