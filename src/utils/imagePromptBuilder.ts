/*
 * imagePromptBuilder — turns a catalog record into a focused image-generation
 * prompt, per record type, so AI-generated images share a consistent house style.
 * Used by the single-record "Generate with AI" button and the batch generator.
 */

type Rec = Record<string, any>;

const name = (r: Rec) => r?.name_common || r?.name || r?.name_brand || r?.market_name || r?.display_name || 'item';
const cat = (r: Rec) => r?.category || r?.category_sub || r?.subcategory || '';
const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();

const STYLE = {
  food: 'professional food photography, soft natural light, shallow depth of field, white seamless background, no text, no watermark, appetising, high detail',
  product: 'professional product photography, studio lighting, clean white background, centered, no text, no watermark, high detail',
  activity: 'clean modern editorial photography, natural light, simple uncluttered background, no text, no watermark',
  abstract: 'clean minimal 3D render, soft studio lighting, neutral background, no text, no watermark',
};

// Ingredient variants map to the image_url_* columns (raw / cut / cooked / …).
const VARIANT_DESC: Record<string, string> = {
  raw: 'raw and whole, unprocessed',
  powdered: 'finely ground into a powder, in a small pile',
  cut: 'sliced / chopped on a wooden cutting board',
  cubed: 'cut into neat cubes',
  cooked: 'cooked, in a sauté pan',
  plated: 'plated and served, 45-degree angle',
  closeup: 'extreme close-up macro shot',
};

/** Build an image prompt for a record. `tabType` is the admin tab id
 *  (ingredients/recipes/products/activities/…). `variant` targets a specific
 *  image column (raw/cut/cooked/plated…). */
export function buildImagePrompt(tabType: string, record: Rec, variant?: string | null): string {
  const n = name(record);
  const c = cat(record);
  const v = variant ? VARIANT_DESC[variant] || variant : '';
  const t = (tabType || '').toLowerCase();

  if (t === 'ingredients' || t === 'recipes') {
    if (t === 'recipes') {
      const cuisine = record?.cuisine ? `${record.cuisine} cuisine` : '';
      return clean(`A single serving of "${n}"${c ? `, a ${c}` : ''}${cuisine ? `, ${cuisine}` : ''}, ${v || 'freshly plated'}, ${STYLE.food}`);
    }
    return clean(`"${n}"${c ? `, ${c}` : ''}, a single food ingredient, ${v || 'fresh and whole'}, ${STYLE.food}`);
  }
  if (t === 'products' || t === 'hs_products' || t === 'hs_supplements') {
    const brand = record?.name_brand || record?.brand || '';
    return clean(`Product shot of "${n}"${brand && brand !== n ? ` by ${brand}` : ''}${c ? `, a ${c}` : ''}, ${STYLE.product}`);
  }
  if (t === 'activities') {
    return clean(`A person performing "${n}"${c ? `, ${c}` : ''}, mid-action, ${STYLE.activity}`);
  }
  if (t === 'equipment') {
    return clean(`"${n}", kitchen / fitness equipment, ${STYLE.product}`);
  }
  // elements, symptoms, cooking_methods, fallback
  return clean(`A clean conceptual illustration representing "${n}"${c ? `, ${c}` : ''}, ${STYLE.abstract}`);
}

/** The image columns a record type can carry variants for (single is image_url). */
export function imageVariantFields(tabType: string): { field: string; variant: string | null; label: string }[] {
  const t = (tabType || '').toLowerCase();
  if (t === 'ingredients') return [
    { field: 'image_url', variant: null, label: 'Main' },
    { field: 'image_url_raw', variant: 'raw', label: 'Raw' },
    { field: 'image_url_cut', variant: 'cut', label: 'Cut' },
    { field: 'image_url_cooked', variant: 'cooked', label: 'Cooked' },
    { field: 'image_url_powdered', variant: 'powdered', label: 'Powdered' },
  ];
  if (t === 'recipes') return [
    { field: 'image_url', variant: 'plated', label: 'Main' },
    { field: 'image_url_plated', variant: 'plated', label: 'Plated' },
    { field: 'image_url_closeup', variant: 'closeup', label: 'Close-up' },
  ];
  return [{ field: 'image_url', variant: null, label: 'Main' }];
}
