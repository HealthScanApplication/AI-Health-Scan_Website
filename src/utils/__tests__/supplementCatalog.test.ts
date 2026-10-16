import { afterEach, expect, it, vi } from 'vitest';
import { getSupplementComposition, searchSupplements } from '../supplementCatalog';

afterEach(() => vi.unstubAllGlobals());

it('searches published supplement products by barcode and preserves their catalogue link', async () => {
  vi.stubGlobal('fetch', async (url: string) => {
    const params = new URL(url).searchParams;
    expect(params.get('product_kind')).toBe('eq.supplement');
    expect(params.get('is_published')).toBe('eq.true');
    expect(params.get('or')).toContain('barcode.ilike.*0012345678905*');
    return new Response(JSON.stringify([{ id: 'p1', name_common: 'D3', brand: 'Brand', barcode: '0012345678905', image_url: 'd3.jpg', catalog_product_elements: [{ element_id: 'd3' }, { element_id: 'k2' }] }]));
  });
  expect(await searchSupplements('token', 'specific', '0012345678905')).toEqual([
    { id: 'p1', name: 'D3', source: 'product', image: 'd3.jpg', barcode: '0012345678905', brand: 'Brand', elementCount: 2 },
  ]);
});

it('includes generic catalogue products as well as published generic supplement records', async () => {
  vi.stubGlobal('fetch', async (url: string) => new Response(JSON.stringify(url.includes('/catalog_products?')
    ? [{ id: 'p2', name_common: 'Vitamin C', barcode: 'generic_vitamin_c' }]
    : [{ id: 's1', name: 'Zinc', image_url: null }])));
  const results = await searchSupplements('token', 'generic', '');
  expect(results).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'p2', name: 'Vitamin C', source: 'product' }),
    expect.objectContaining({ id: 's1', name: 'Zinc', source: 'supplement' }),
  ]));
});

it('surfaces catalogue failures instead of showing an empty successful search', async () => {
  vi.stubGlobal('fetch', async () => new Response('denied', { status: 403 }));
  await expect(searchSupplements('token', 'specific', 'zinc')).rejects.toThrow('Could not load');
});

it('does not treat placeholder junctions or an undisclosed blend as completed composition', async () => {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify([
    { id: 'unresolved', name_common: 'Unknown blend', composition_audit: { status: 'needs_label' }, catalog_product_elements: [{ element_id: 'water' }, { element_id: 'metabolites' }] },
    { id: 'fixed', name_common: 'Vitamin C', composition_audit: { status: 'linked', expected_element_ids: ['ascorbic_acid_vitamin_c'] }, catalog_product_elements: [{ element_id: 'water' }, { element_id: 'ascorbic_acid_vitamin_c' }] },
  ])));
  const results = await searchSupplements('token', 'specific', '');
  expect(results.map((r) => r.elementCount)).toEqual([0, 1]);
});

it('refreshes composition for saved IDs rather than using stale saved counts', async () => {
  vi.stubGlobal('fetch', async (url: string) => {
    expect(new URL(url).searchParams.get('id')).toBe('in.("fixed")');
    return new Response(JSON.stringify([{ id: 'fixed', composition_audit: { status: 'linked', expected_element_ids: ['magnesium'] }, catalog_product_elements: [{ element_id: 'magnesium' }, { element_id: 'water' }] }]));
  });
  expect(await getSupplementComposition('token', [{ id: 'fixed', source: 'product', name: 'Magnesium', image: null, elementCount: 0 }])).toEqual({ 'product:fixed': 1 });
});

it('reports a saved record that is missing or unreadable rather than checking forever', async () => {
  vi.stubGlobal('fetch', async () => new Response('[]'));
  await expect(getSupplementComposition('token', [{ id: 'missing', source: 'product', name: 'Missing', image: null }])).rejects.toThrow(/unavailable/);
});
