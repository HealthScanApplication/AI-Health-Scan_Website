/** Read-only live REST audit. Run: node --import tsx scripts/audit-supplement-composition.ts */
import { projectId, publicAnonKey } from '../src/utils/supabase/info';
import { getSupplementComposition } from '../src/utils/supplementCatalog';

async function audit() {
  const params = new URLSearchParams({
    select: 'id,name_common,composition_audit:raw_data->supplement_composition_repair,catalog_product_elements(element_id,catalog_elements(id))',
    product_kind: 'eq.supplement', is_published: 'eq.true', limit: '1000',
  });
  const response = await fetch(`https://${projectId}.supabase.co/rest/v1/catalog_products?${params}`, { headers: { apikey: publicAnonKey, Authorization: `Bearer ${publicAnonKey}` } });
  if (!response.ok) throw new Error(`REST audit failed: ${response.status}`);
  const rows = await response.json();
  if (!rows.length || rows.length >= 1000) throw new Error('Catalogue audit empty or truncated');
  const counts = await getSupplementComposition(publicAnonKey, rows.map((row: any) => ({ id: row.id, source: 'product', name: row.name_common, image: null })));
  const unresolved = [];
  for (const row of rows) {
    const status = row.composition_audit?.status;
    if (!['linked', 'needs_label'].includes(status)) throw new Error(`${row.id}: missing composition audit`);
    const links: any[] = row.catalog_product_elements;
    if (links.some((link) => !link.catalog_elements?.id)) throw new Error(`${row.id}: element is not readable through REST`);
    if (new Set(links.map((link) => link.element_id)).size !== links.length) throw new Error(`${row.id}: duplicate junctions`);
    if (status === 'linked') {
      const expected = row.composition_audit.expected_element_ids;
      if (!expected?.length || expected.some((id: string) => !links.some((link) => link.element_id === id))) throw new Error(`${row.id}: missing declared ingredient junction`);
      if (counts[`product:${row.id}`] !== expected.length) throw new Error(`${row.id}: picker count differs from declared ingredient links`);
    } else {
      if (counts[`product:${row.id}`] !== 0) throw new Error(`${row.id}: unverified composition is presented as complete`);
      unresolved.push({ id: row.id, name: row.name_common });
    }
  }
  console.log(JSON.stringify({ checked: rows.length, linked: rows.length - unresolved.length, needsLabel: unresolved.length, unresolved }, null, 2));
}
audit().catch((error) => { console.error(error.message); process.exitCode = 1; });
