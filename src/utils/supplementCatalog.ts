import { projectId, publicAnonKey } from './supabase/info';
import type { SupplementPick } from './protocolBuilders';

export type SupplementCatalogKind = 'generic' | 'specific';

const compositionSelect = (product: boolean) => product
  ? 'composition_audit:raw_data->supplement_composition_repair,catalog_product_elements(element_id)'
  : 'element_supplements(element_id)';

function compositionCount(row: any, product: boolean): number {
  if (product && row.composition_audit?.status === 'needs_label') return 0;
  const expected: string[] | undefined = product ? row.composition_audit?.expected_element_ids : undefined;
  return new Set((product ? row.catalog_product_elements || [] : row.element_supplements || [])
    .map((link: any) => link.element_id as string)
    .filter((id: string) => id && !['water', 'metabolites'].includes(id) && (!expected || expected.includes(id)))).size;
}

/** Read catalogue records only; their existing element junctions remain authoritative. */
export async function searchSupplements(token: string, kind: SupplementCatalogKind, query: string, signal?: AbortSignal): Promise<SupplementPick[]> {
  const load = async (product: boolean): Promise<SupplementPick[]> => {
    const params = new URLSearchParams({
      select: `${product ? 'id,name_common,name,brand,name_brand,barcode,image_url,image_primary_url' : 'id,name,image_url'},${compositionSelect(product)}`,
      limit: '24',
      order: product ? 'name_common.asc.nullslast' : 'name.asc',
    });
    if (product) {
      params.set('product_kind', 'eq.supplement');
      params.set('is_published', 'eq.true');
      // The catalogue also uses synthetic codes for generic supplement products.
      params.set('barcode', kind === 'specific' ? 'match.^[0-9]{8,14}$' : 'not.match.^[0-9]{8,14}$');
    } else {
      params.set('is_active', 'eq.true');
      params.set('published', 'eq.true');
    }
    // Keep PostgREST filter punctuation out of user input, including wildcard expansion.
    const q = query.trim().replace(/[(),.*%"\\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (q) params.set('or', `(${(product ? ['name_common', 'name', 'brand', 'name_brand', 'barcode'] : ['name']).map((col) => `${col}.ilike.*${q}*`).join(',')})`);
    const response = await fetch(`https://${projectId}.supabase.co/rest/v1/${product ? 'catalog_products' : 'hs_supplements'}?${params}`, {
      signal, headers: { apikey: publicAnonKey, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Could not load supplements. Please try again.');
    const rows = await response.json();
    return rows.map((row: any) => ({ id: row.id, name: row.name_common || row.name || 'Supplement', source: product ? 'product' : 'supplement', image: row.image_url || row.image_primary_url || null, barcode: row.barcode || null, brand: row.brand || row.name_brand || null, elementCount: compositionCount(row, product) }));
  };
  const products = load(true);
  if (kind === 'specific') return products;
  const [catalogue, supplements] = await Promise.all([products, load(false)]);
  return [...catalogue, ...supplements].sort((a, b) => a.name.localeCompare(b.name));
}

/** Saved plans hold record IDs, not an authoritative snapshot of catalogue composition. */
export async function getSupplementComposition(token: string, picks: Array<Pick<SupplementPick, 'id' | 'source'>>, signal?: AbortSignal): Promise<Record<string, number>> {
  const output: Record<string, number> = {};
  await Promise.all((['product', 'supplement'] as const).map(async (source) => {
    const ids = [...new Set(picks.filter((p) => p.source === source).map((p) => p.id))];
    if (!ids.length) return;
    const params = new URLSearchParams({ select: `id,${compositionSelect(source === 'product')}`, id: `in.(${ids.map((id) => `"${id.replace(/["\\]/g, '')}"`).join(',')})` });
    const response = await fetch(`https://${projectId}.supabase.co/rest/v1/${source === 'product' ? 'catalog_products' : 'hs_supplements'}?${params}`, {
      signal, headers: { apikey: publicAnonKey, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Could not refresh supplement composition.');
    const rows = await response.json();
    if (ids.some((id) => !rows.some((row: any) => row.id === id))) throw new Error('A linked supplement is unavailable.');
    for (const row of rows) output[`${source}:${row.id}`] = compositionCount(row, source === 'product');
  }));
  return output;
}
