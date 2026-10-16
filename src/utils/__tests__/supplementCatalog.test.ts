import { afterEach, expect, it, vi } from 'vitest';
import { searchSupplements } from '../supplementCatalog';

afterEach(() => vi.unstubAllGlobals());

it('searches published supplement products by barcode and preserves their catalogue link', async () => {
  vi.stubGlobal('fetch', async (url: string) => {
    const params = new URL(url).searchParams;
    expect(params.get('product_kind')).toBe('eq.supplement');
    expect(params.get('is_published')).toBe('eq.true');
    expect(params.get('or')).toContain('barcode.ilike.*0012345678905*');
    return new Response(JSON.stringify([{ id: 'p1', name_common: 'D3', brand: 'Brand', barcode: '0012345678905', image_url: 'd3.jpg', catalog_product_elements: [{ count: 2 }] }]));
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
