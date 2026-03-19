/**
 * Midjourney Prompt Generator
 * ============================
 * Master templates for generating consistent food/element/recipe imagery.
 * Uses the "crisp food shot / centred / buffer / shallow DOF" system.
 */

export type PromptType =
  | 'recipe_bowl'
  | 'recipe_plate'
  | 'recipe_wrap'
  | 'ingredient_raw'
  | 'ingredient_raw_bowl'
  | 'ingredient_powder'
  | 'ingredient_liquid'
  | 'store_item'
  | 'element_powder'
  | 'element_liquid'
  | 'process'
  | 'equipment';

export interface PromptTemplate {
  id: PromptType;
  label: string;
  description: string;
  applicableTabs: string[];
  sizePx: number;
  template: string;
}

// ── Size bands ──
// tiny (test tube, small herb): < 420px
// small (ingredient bowl/jar): < 640px
// plate/bowl meal: < 680px

const GLOBAL_SUFFIX = ', no labels, no text, no cropping';

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'recipe_bowl',
    label: 'Recipe — Bowl',
    description: 'Full serving in a ceramic bowl, hand-held',
    applicableTabs: ['recipes'],
    sizePx: 680,
    template: `A crisp food shot of a full serving of {NAME} centred in the frame, in a {BOWL_TYPE} ({VISUAL_DETAILS}), hand holding the bowl facing the camera, warm natural light, {BACKGROUND}, shallow depth of field, background softly blurred, bowl slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 680px of its actual size (1920x1920) in diameter, generous buffer space around all sides, absolutely no cropping, no labels, no text`,
  },
  {
    id: 'recipe_plate',
    label: 'Recipe — Plate (restaurant)',
    description: 'Restaurant-style plated meal, hand-held',
    applicableTabs: ['recipes'],
    sizePx: 680,
    template: `A crisp food shot of a full serving of {NAME} centred in the frame, on a wide matte ceramic dinner plate ({VISUAL_DETAILS}), hand holding the plate facing the camera, warm natural light, high-end restaurant background with rich contrast colors and soft bokeh, shallow depth of field, background softly blurred, plate slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 680px of its actual size (1920x1920) in diameter, generous buffer space around all sides, absolutely no cropping, no labels, no text`,
  },
  {
    id: 'recipe_wrap',
    label: 'Recipe — Wrap/Sandwich',
    description: 'Single wrap or sandwich on a plate',
    applicableTabs: ['recipes'],
    sizePx: 680,
    template: `A crisp food shot of a single {NAME} centred in the frame, on a small ceramic plate (one wrap only, tightly wrapped flatbread with a clean cut revealing {VISUAL_DETAILS}, visible texture and sauces, neatly plated), hand holding the plate facing the camera, warm natural light, high-end restaurant background with rich contrast colors and soft bokeh, shallow depth of field, background softly blurred, plate slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 680px of its actual size (1920x1920) in diameter, generous buffer space around all sides, absolutely no cropping, no labels, no text`,
  },
  {
    id: 'ingredient_raw',
    label: 'Ingredient — Raw (no bowl)',
    description: 'Single raw ingredient held in hand',
    applicableTabs: ['ingredients'],
    sizePx: 640,
    template: `A crisp food shot of a single {NAME} centred in the frame ({VISUAL_DETAILS}), held in one hand facing the camera, warm natural light, kitchen or herb garden background, shallow depth of field, background softly blurred, main object slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 640px of its actual size (1920x1920) in diameter, generous buffer space around all sides, absolutely no cropping, no packaging, no labels, no text`,
  },
  {
    id: 'ingredient_raw_bowl',
    label: 'Ingredient — Raw in glass bowl',
    description: 'Raw ingredient in a small glass prep bowl',
    applicableTabs: ['ingredients'],
    sizePx: 640,
    template: `A crisp food shot of {NAME} centred in the frame, in a small clear glass prep bowl ({VISUAL_DETAILS}), hand holding the bowl facing the camera, warm natural light, kitchen or herb garden background, shallow depth of field, background softly blurred, bowl slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 640px of its actual size (1920x1920) in diameter, generous buffer space around all sides, absolutely no cropping, no packaging, no labels, no text`,
  },
  {
    id: 'ingredient_powder',
    label: 'Ingredient — Powder in glass bowl',
    description: 'Ground/powder ingredient in a prep bowl',
    applicableTabs: ['ingredients'],
    sizePx: 640,
    template: `A crisp food shot of {NAME} centred in the frame, in a small clear glass prep bowl (fine {COLOR} powder, slightly mounded, soft matte texture, tiny granules visible), hand holding the bowl facing the camera, warm natural light, kitchen or herb garden background, shallow depth of field, background softly blurred, bowl slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 640px of its actual size (1920x1920) in diameter, generous buffer space around all sides, absolutely no cropping, no packaging, no labels, no text`,
  },
  {
    id: 'ingredient_liquid',
    label: 'Ingredient — Liquid in glass jar',
    description: 'Liquid ingredient in a small glass jar',
    applicableTabs: ['ingredients'],
    sizePx: 640,
    template: `A crisp food shot of {NAME} centred in the frame, in a small clear glass jar ({COLOR} liquid, visible meniscus, clean glass reflections), hand holding the jar facing the camera, warm natural light, kitchen background, shallow depth of field, background softly blurred, jar slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 640px of its actual size (1920x1920) in diameter, generous buffer space around all sides, absolutely no cropping, no labels, no text`,
  },
  {
    id: 'store_item',
    label: 'Store Item — Packaged',
    description: 'Packaged food item in hand (grocery store)',
    applicableTabs: ['ingredients', 'products'],
    sizePx: 640,
    template: `A crisp food shot of {NAME} centred in the frame, sealed in clear plastic retail packaging (fresh raw {VISUAL_DETAILS}, store price label removed or blank, condensation and plastic reflections visible), held in one hand facing the camera inside a grocery store, bright store lighting with soft background blur, shallow depth of field, main object slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 640px of its actual size (1920x1920) in diameter, generous buffer space around all sides, absolutely no cropping, no readable labels, no text`,
  },
  {
    id: 'element_powder',
    label: 'Element — Powder in test tube',
    description: 'Chemical/element as powder in a corked test tube',
    applicableTabs: ['elements'],
    sizePx: 420,
    template: `A crisp food shot of {NAME} centred in the frame, shown as a fine {COLOR} crystalline powder (slight sparkle, settled at the bottom) inside a small clear glass test tube with a cork lid, held in one hand facing the camera, warm natural light, kitchen or clean lab-kitchen background, shallow depth of field, background softly blurred, test tube very small in frame with generous buffer space around all sides, main object slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 420px of its actual size (1920x1920) in diameter, no labels, no text, no cropping`,
  },
  {
    id: 'element_liquid',
    label: 'Element — Liquid in test tube',
    description: 'Chemical/element as liquid in a corked test tube',
    applicableTabs: ['elements'],
    sizePx: 420,
    template: `A crisp food shot of {NAME} centred in the frame, shown as a clear {COLOR} liquid sample inside a small clear glass test tube with a cork lid (visible meniscus, glass reflections), held in one hand facing the camera, warm natural light, kitchen or clean lab-kitchen background, shallow depth of field, background softly blurred, test tube very small in frame with generous buffer space around all sides, main object slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 420px of its actual size (1920x1920) in diameter, no labels, no text, no cropping`,
  },
  {
    id: 'process',
    label: 'Process — Abstract test tube',
    description: 'Abstract process/reaction in a test tube',
    applicableTabs: ['elements', 'cooking_methods'],
    sizePx: 420,
    template: `A crisp food shot of {NAME} centred in the frame, represented as a small clear glass test tube with a cork lid containing {VISUAL_DETAILS} (visible gradient, haze, sediment, bubbles, separation layers, etc.), held in one hand facing the camera, warm natural light, kitchen background, shallow depth of field, background softly blurred, test tube very small in frame with generous buffer space around all sides, main object slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 420px of its actual size (1920x1920) in diameter, no labels, no text, no cropping`,
  },
  {
    id: 'equipment',
    label: 'Equipment — Kitchen tool',
    description: 'Kitchen tool held in hand',
    applicableTabs: ['equipment'],
    sizePx: 640,
    template: `A crisp product-style photo of a {NAME} centred in the frame (clean, unbranded, realistic materials, subtle use-wear, professional grade), held in one hand facing the camera, warm natural light, kitchen background, shallow depth of field, background softly blurred, tool slightly moved up and perfectly centred for 1:1, main object occupies approximately less than 640px of its actual size (1920x1920) in diameter, generous buffer space around all sides, absolutely no cropping, no logos, no labels, no text`,
  },
];

// ── Helpers: derive visual description hints from record data ──

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Guess a color keyword from the record for element/powder prompts */
function guessColor(record: Record<string, any>): string {
  const desc = (record.description || record.description_simple || '').toLowerCase();
  const colors = ['white', 'yellow', 'golden', 'amber', 'orange', 'red', 'pink', 'green', 'brown', 'dark brown', 'black', 'clear', 'pale yellow', 'light green'];
  for (const c of colors) {
    if (desc.includes(c)) return c;
  }
  const cat = (record.category || '').toLowerCase();
  if (cat.includes('vitamin')) return 'pale yellow';
  if (cat.includes('mineral')) return 'white';
  if (cat.includes('heavy metal')) return 'dark gray';
  return 'white';
}

/** Build a visual description from record fields */
function buildVisualDetails(record: Record<string, any>, tab: string): string {
  const parts: string[] = [];
  const name = record.name_common || record.name || '';
  const desc = record.description_simple || record.description || '';

  if (tab === 'recipes') {
    if (record.cuisine) parts.push(`${record.cuisine} style`);
    if (desc) {
      const short = desc.length > 120 ? desc.slice(0, 120).replace(/[^a-zA-Z0-9,. ]+$/, '') + '...' : desc;
      parts.push(short);
    }
  } else if (tab === 'ingredients') {
    if (record.processing_type === 'raw' || !record.processing_type) {
      parts.push('fresh, raw, natural colors and texture');
    }
    const cat = record.category || '';
    if (cat) parts.push(cat.toLowerCase());
    if (desc) {
      const short = desc.length > 80 ? desc.slice(0, 80).replace(/[^a-zA-Z0-9,. ]+$/, '') : desc;
      parts.push(short);
    }
  } else if (tab === 'elements') {
    parts.push(`fine ${guessColor(record)} crystalline substance`);
  } else {
    if (desc) parts.push(desc.slice(0, 100));
  }

  return parts.filter(Boolean).join(', ') || 'vibrant colors, detailed textures, appetizing presentation';
}

/** Get default background for a tab */
function getBackground(tab: string): string {
  if (tab === 'recipes') return 'high-end restaurant background with rich contrast colors and soft bokeh';
  return 'kitchen or herb garden background';
}

/** Get default bowl type */
function getBowlType(record: Record<string, any>): string {
  const cat = (record.category_sub || record.category || '').toLowerCase();
  if (cat.includes('soup')) return 'deep ceramic soup bowl on a small ceramic underplate';
  if (cat.includes('salad') || cat.includes('bowl')) return 'shallow ceramic bowl';
  return 'medium ceramic bowl';
}

/**
 * Get applicable prompt templates for a given tab
 */
export function getTemplatesForTab(tab: string): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter((t) => t.applicableTabs.includes(tab));
}

/**
 * Generate a Midjourney prompt from a template and record data.
 * Returns { prompt, slug } ready to copy.
 */
export function generatePrompt(
  templateId: PromptType,
  record: Record<string, any>,
  tab: string,
  overrides?: { visualDetails?: string; color?: string; bowlType?: string; background?: string },
): { prompt: string; slug: string; prefix: string } {
  const template = PROMPT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return { prompt: '', slug: '', prefix: '' };

  const name = record.name_common || record.name || 'Unknown';
  const slug = slugify(name);
  const category = record.category || tab;
  const catSlug = slugify(category);

  const color = overrides?.color || guessColor(record);
  const visual = overrides?.visualDetails || buildVisualDetails(record, tab);
  const bg = overrides?.background || getBackground(tab);
  const bowl = overrides?.bowlType || getBowlType(record);

  // Build prefix: ###/190 {type}_{slug}
  const prefixMap: Record<string, string> = {
    recipe_bowl: `blueprint_${slug}`,
    recipe_plate: `meal_${slug}`,
    recipe_wrap: `meal_${slug}_wrap`,
    ingredient_raw: `${catSlug}_${slug}_raw`,
    ingredient_raw_bowl: `${catSlug}_${slug}_raw_bowl`,
    ingredient_powder: `${catSlug}_${slug}_powder_bowl`,
    ingredient_liquid: `${catSlug}_${slug}_liquid_jar`,
    store_item: `store_${slug}_plastic`,
    element_powder: `element_${slug}_powder_test-tube_cork`,
    element_liquid: `element_${slug}_liquid_test-tube_cork`,
    process: `process_${slug}_test-tube_cork`,
    equipment: `kitchen_tool_${slug}`,
  };
  const prefix = `###/190 ${prefixMap[templateId] || slug}`;

  let prompt = template.template
    .replace(/{NAME}/g, name)
    .replace(/{VISUAL_DETAILS}/g, visual)
    .replace(/{COLOR}/g, color)
    .replace(/{BACKGROUND}/g, bg)
    .replace(/{BOWL_TYPE}/g, bowl);

  return { prompt: `${prefix}   ${prompt}`, slug, prefix };
}
