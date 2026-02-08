/**
 * Admin Panel Field Configuration
 * ================================
 * Single source of truth for all tab field definitions.
 * Update this file to change what fields appear in list, detail, and edit views.
 * 
 * Field types:
 *   text     - single line input
 *   textarea - multi-line input
 *   number   - numeric input
 *   select   - dropdown with options
 *   boolean  - yes/no toggle
 *   readonly - displayed but not editable
 *   badge    - displayed as a colored badge
 *   date     - formatted date display
 *   json     - JSON object display
 *   array    - array/list display
 *   image    - image URL with preview + file upload
 *   video    - video URL with preview + file upload
 * 
 * AI Suggest:
 *   Set `aiSuggest: true` on any field to show an AI suggest button in the edit modal.
 *   Set `aiPrompt` to customize the prompt sent to the AI.
 */

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'readonly' | 'badge' | 'date' | 'json' | 'array' | 'image' | 'video';
  options?: string[];
  showInList?: boolean;
  showInDetail?: boolean;
  showInEdit?: boolean;
  required?: boolean;
  placeholder?: string;
  aiSuggest?: boolean;
  aiPrompt?: string;
  colSpan?: 1 | 2;
  colorMap?: Record<string, string>;
  section?: string;
}

export interface TabFieldConfig {
  tabId: string;
  label: string;
  nameField: string;
  secondaryField?: string;
  fields: FieldConfig[];
}

// Color map for badges (shared across tabs)
export const badgeColorMap: Record<string, string> = {
  beneficial: 'bg-green-100 text-green-800',
  hazardous: 'bg-red-100 text-red-800',
  both: 'bg-amber-100 text-amber-800',
  meal: 'bg-green-100 text-green-800',
  beverage: 'bg-cyan-100 text-cyan-800',
  condiment: 'bg-amber-100 text-amber-800',
  snack: 'bg-lime-100 text-lime-800',
  supplement: 'bg-purple-100 text-purple-800',
  vegetable: 'bg-green-100 text-green-800',
  fruit: 'bg-orange-100 text-orange-800',
  grain: 'bg-yellow-100 text-yellow-800',
  protein: 'bg-red-100 text-red-800',
  dairy: 'bg-blue-100 text-blue-800',
  raw: 'bg-emerald-100 text-emerald-800',
  processed: 'bg-orange-100 text-orange-800',
  vitamin: 'bg-green-100 text-green-800',
  mineral: 'bg-blue-100 text-blue-800',
  'amino acid': 'bg-purple-100 text-purple-800',
  'fatty acid': 'bg-yellow-100 text-yellow-800',
  antioxidant: 'bg-emerald-100 text-emerald-800',
  'heavy metal': 'bg-red-100 text-red-800',
  pesticide: 'bg-red-100 text-red-800',
  preservative: 'bg-orange-100 text-orange-800',
  'endocrine disruptor': 'bg-red-100 text-red-800',
};

/**
 * ============================================================
 *  WAITLIST TAB
 * ============================================================
 */
const waitlistFields: FieldConfig[] = [
  { key: 'email',         label: 'Email',           type: 'readonly',  showInList: true,  showInDetail: true,  showInEdit: true,  colSpan: 2 },
  { key: 'name',          label: 'Name',            type: 'text',      showInList: true,  showInDetail: true,  showInEdit: true,  placeholder: 'User name' },
  { key: 'position',      label: 'Queue Position',  type: 'number',    showInList: true,  showInDetail: true,  showInEdit: true },
  { key: 'referrals',     label: 'Referrals',       type: 'number',    showInList: true,  showInDetail: true,  showInEdit: true },
  { key: 'confirmed',     label: 'Confirmed',       type: 'boolean',   showInList: true,  showInDetail: true,  showInEdit: true },
  { key: 'emailsSent',    label: 'Email Status',    type: 'readonly',  showInList: true,  showInDetail: true },
  { key: 'referralCode',  label: 'Referral Code',   type: 'readonly',  showInDetail: true },
  { key: 'referredBy',    label: 'Referred By',     type: 'readonly',  showInDetail: true },
  { key: 'source',        label: 'Source',          type: 'readonly',  showInDetail: true },
  { key: 'ipAddress',     label: 'IP Address',      type: 'readonly',  showInDetail: true },
  { key: 'created_at',    label: 'Joined',          type: 'date',      showInDetail: true },
  { key: 'lastEmailSent', label: 'Last Email Sent', type: 'date',      showInDetail: true },
];

/**
 * ============================================================
 *  ELEMENTS TAB
 * ============================================================
 */
const elementsFields: FieldConfig[] = [
  { key: 'image_url',          label: 'Image',             type: 'image',     showInList: true,  showInDetail: true,  showInEdit: true },
  { key: 'name_common',        label: 'Common Name',       type: 'text',      showInList: true,  showInDetail: true,  showInEdit: true,  required: true, placeholder: 'e.g. Vitamin C',
    aiSuggest: true, aiPrompt: 'Suggest a clear, commonly used name for this health element.' },
  { key: 'name',               label: 'Scientific Name',   type: 'text',      showInList: false, showInDetail: true,  showInEdit: true,  placeholder: 'e.g. Ascorbic Acid',
    aiSuggest: true, aiPrompt: 'Suggest the scientific/chemical name for this health element.' },
  { key: 'category',           label: 'Category',          type: 'select',    showInList: true,  showInDetail: true,  showInEdit: true,
    options: ['beneficial', 'hazardous', 'both'] },
  { key: 'type',               label: 'Type',              type: 'select',    showInList: true,  showInDetail: true,  showInEdit: true,
    options: ['vitamin', 'mineral', 'amino acid', 'fatty acid', 'antioxidant', 'heavy metal', 'pesticide', 'preservative', 'endocrine disruptor'] },
  { key: 'description',        label: 'Description',       type: 'textarea',  showInDetail: true,  showInEdit: true,  colSpan: 2,
    aiSuggest: true, aiPrompt: 'Write a concise 2-3 sentence description of this health element, its role in the body, and why it matters.' },
  { key: 'unit',               label: 'Unit',              type: 'text',      showInDetail: true,  showInEdit: true,  placeholder: 'e.g. mg, µg, IU' },
  { key: 'rdi',                label: 'RDI',               type: 'text',      showInDetail: true,  showInEdit: true,  placeholder: 'Recommended Daily Intake' },
  { key: 'health_benefits',    label: 'Health Benefits',   type: 'textarea',  showInDetail: true,  showInEdit: true,  colSpan: 2,
    aiSuggest: true, aiPrompt: 'List the key health benefits of this element as a comma-separated list.' },
  { key: 'food_sources',       label: 'Food Sources',      type: 'textarea',  showInDetail: true,  showInEdit: true,  colSpan: 2,
    aiSuggest: true, aiPrompt: 'List common food sources rich in this element as a comma-separated list.' },
  { key: 'risks',              label: 'Risks',             type: 'textarea',  showInDetail: true,  showInEdit: true,  colSpan: 2,
    aiSuggest: true, aiPrompt: 'Describe potential health risks or side effects of excessive exposure to this element.' },
  { key: 'source',             label: 'Data Source',       type: 'readonly',  showInDetail: true },
  { key: 'created_at',         label: 'Created',           type: 'date',      showInDetail: true },
];

/**
 * ============================================================
 *  INGREDIENTS TAB
 * ============================================================
 */
const ingredientsFields: FieldConfig[] = [
  { key: 'image_url',          label: 'Image',             type: 'image',     showInList: true,  showInDetail: true,  showInEdit: true },
  { key: 'name',               label: 'Name',              type: 'text',      showInList: true,  showInDetail: true,  showInEdit: true,  required: true, placeholder: 'e.g. Organic Quinoa',
    aiSuggest: true, aiPrompt: 'Suggest a clear name for this food ingredient.' },
  { key: 'category',           label: 'Category',          type: 'select',    showInList: true,  showInDetail: true,  showInEdit: true,
    options: ['vegetable', 'fruit', 'grain', 'protein', 'dairy', 'oil', 'spice', 'herb', 'sweetener', 'additive', 'legume', 'nut', 'seed'] },
  { key: 'type',               label: 'Type',              type: 'select',    showInList: true,  showInDetail: true,  showInEdit: true,
    options: ['raw', 'processed', 'whole grain', 'vegetable', 'fruit', 'fish', 'poultry', 'red meat', 'dairy', 'fermented'] },
  { key: 'description',        label: 'Description',       type: 'textarea',  showInDetail: true,  showInEdit: true,  colSpan: 2,
    aiSuggest: true, aiPrompt: 'Write a concise 2-3 sentence description of this ingredient, its nutritional profile, and common uses.' },
  { key: 'allergens',          label: 'Allergens',         type: 'text',      showInDetail: true,  showInEdit: true,  placeholder: 'e.g. Gluten, Dairy, Nuts',
    aiSuggest: true, aiPrompt: 'List common allergens associated with this ingredient.' },
  { key: 'nutritional_value',  label: 'Nutritional Value', type: 'json',      showInDetail: true },
  { key: 'uses',               label: 'Uses',              type: 'array',     showInDetail: true },
  { key: 'benefits',           label: 'Benefits',          type: 'array',     showInDetail: true },
  { key: 'concerns',           label: 'Concerns',          type: 'array',     showInDetail: true },
  { key: 'source',             label: 'Data Source',       type: 'readonly',  showInDetail: true },
  { key: 'created_at',         label: 'Created',           type: 'date',      showInDetail: true },
];

/**
 * ============================================================
 *  RECIPES TAB
 * ============================================================
 */
const recipesFields: FieldConfig[] = [
  { key: 'image_url',          label: 'Image',             type: 'image',     showInList: true,  showInDetail: true,  showInEdit: true },
  { key: 'name',               label: 'Name',              type: 'text',      showInList: true,  showInDetail: true,  showInEdit: true,  required: true, placeholder: 'e.g. Mediterranean Salad',
    aiSuggest: true, aiPrompt: 'Suggest a catchy name for this recipe.' },
  { key: 'category',           label: 'Category',          type: 'select',    showInList: true,  showInDetail: true,  showInEdit: true,
    options: ['meal', 'beverage', 'condiment', 'snack', 'dessert'] },
  { key: 'type',               label: 'Type',              type: 'select',    showInList: true,  showInDetail: true,  showInEdit: true,
    options: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'side dish'] },
  { key: 'description',        label: 'Description',       type: 'textarea',  showInDetail: true,  showInEdit: true,  colSpan: 2,
    aiSuggest: true, aiPrompt: 'Write a short appetizing description of this recipe in 2-3 sentences.' },
  { key: 'prep_time',          label: 'Prep Time',         type: 'text',      showInDetail: true,  showInEdit: true,  placeholder: 'e.g. 15 min' },
  { key: 'cook_time',          label: 'Cook Time',         type: 'text',      showInDetail: true,  showInEdit: true,  placeholder: 'e.g. 30 min' },
  { key: 'servings',           label: 'Servings',          type: 'number',    showInDetail: true,  showInEdit: true },
  { key: 'difficulty',         label: 'Difficulty',        type: 'select',    showInDetail: true,  showInEdit: true,
    options: ['easy', 'medium', 'hard'] },
  { key: 'ingredients',        label: 'Ingredients',       type: 'array',     showInDetail: true },
  { key: 'instructions',       label: 'Instructions',      type: 'array',     showInDetail: true },
  { key: 'nutrition_facts',    label: 'Nutrition Facts',   type: 'json',      showInDetail: true },
  { key: 'video_url',          label: 'Video',             type: 'video',     showInDetail: true,  showInEdit: true,  colSpan: 2 },
  { key: 'source',             label: 'Data Source',       type: 'readonly',  showInDetail: true },
  { key: 'created_at',         label: 'Created',           type: 'date',      showInDetail: true },
];

/**
 * ============================================================
 *  PRODUCTS TAB
 * ============================================================
 */
const productsFields: FieldConfig[] = [
  { key: 'image_url',          label: 'Image',             type: 'image',     showInList: true,  showInDetail: true,  showInEdit: true },
  { key: 'name',               label: 'Name',              type: 'text',      showInList: true,  showInDetail: true,  showInEdit: true,  required: true, placeholder: 'e.g. Organic Blueberry Yogurt',
    aiSuggest: true, aiPrompt: 'Suggest a clear product name.' },
  { key: 'brand',              label: 'Brand',             type: 'text',      showInList: true,  showInDetail: true,  showInEdit: true,  placeholder: 'e.g. Nature Valley' },
  { key: 'category',           label: 'Category',          type: 'select',    showInList: true,  showInDetail: true,  showInEdit: true,
    options: ['meal', 'snack', 'beverage', 'condiment', 'supplement', 'dairy', 'bakery', 'frozen', 'canned', 'fresh'] },
  { key: 'type',               label: 'Type',              type: 'select',    showInList: true,  showInDetail: true,  showInEdit: true,
    options: ['organic', 'conventional', 'fortified', 'dietary', 'yogurt', 'bread', 'cereal', 'juice', 'supplement'] },
  { key: 'barcode',            label: 'Barcode',           type: 'text',      showInDetail: true,  showInEdit: true,  placeholder: 'e.g. 123456789012' },
  { key: 'description',        label: 'Description',       type: 'textarea',  showInDetail: true,  showInEdit: true,  colSpan: 2,
    aiSuggest: true, aiPrompt: 'Write a concise product description highlighting key features and health benefits.' },
  { key: 'serving_size',       label: 'Serving Size',      type: 'text',      showInDetail: true,  showInEdit: true,  placeholder: 'e.g. 1 cup (170g)' },
  { key: 'ingredients',        label: 'Ingredients',       type: 'array',     showInDetail: true },
  { key: 'nutrition_facts',    label: 'Nutrition Facts',   type: 'json',      showInDetail: true },
  { key: 'allergens',          label: 'Allergens',         type: 'array',     showInDetail: true },
  { key: 'warnings',           label: 'Warnings',          type: 'array',     showInDetail: true },
  { key: 'certifications',     label: 'Certifications',    type: 'array',     showInDetail: true },
  { key: 'video_url',          label: 'Video',             type: 'video',     showInDetail: true,  showInEdit: true,  colSpan: 2 },
  { key: 'source',             label: 'Data Source',       type: 'readonly',  showInDetail: true },
  { key: 'created_at',         label: 'Created',           type: 'date',      showInDetail: true },
];

/**
 * ============================================================
 *  SCANS TAB (User Scans from mobile app)
 * ============================================================
 */
const scansFields: FieldConfig[] = [
  { key: 'image_url',            label: 'Scan Photo',         type: 'image',     showInList: true,  showInDetail: true,  showInEdit: true },
  { key: 'name',                 label: 'Name',               type: 'text',      showInList: true,  showInDetail: true,  showInEdit: true,  required: true, placeholder: 'e.g. Morning Breakfast Scan' },
  { key: 'scan_type',            label: 'Scan Type',          type: 'select',    showInList: true,  showInDetail: true,  showInEdit: true,
    options: ['meal', 'ingredient', 'product', 'barcode', 'label'] },
  { key: 'category',             label: 'Category',           type: 'select',    showInList: true,  showInDetail: true,  showInEdit: true,
    options: ['consumed', 'planned', 'analyzed'] },
  { key: 'status',               label: 'Status',             type: 'select',    showInList: true,  showInDetail: true,  showInEdit: true,
    options: ['completed', 'processing', 'failed', 'pending'] },
  { key: 'description',          label: 'Description',        type: 'textarea',  showInDetail: true,  showInEdit: true,  colSpan: 2,
    aiSuggest: true, aiPrompt: 'Describe what was scanned and the key findings.' },
  { key: 'overall_score',        label: 'Health Score',       type: 'number',    showInList: true,  showInDetail: true,  showInEdit: true,  section: 'Score' },
  { key: 'ingredients',          label: 'Ingredients',        type: 'json',      showInDetail: true,  showInEdit: true,  colSpan: 2, section: 'Ingredients' },
  { key: 'nutrients_detected',   label: 'Micronutrients',     type: 'json',      showInDetail: true,  section: 'Micronutrients' },
  { key: 'macro_nutrition',      label: 'Macro Nutrition',    type: 'json',      showInDetail: true,  section: 'Macro Nutrition' },
  { key: 'hazards',              label: 'Hazards',            type: 'json',      showInDetail: true,  section: 'Hazards' },
  { key: 'pollutants_detected',  label: 'Pollutants',         type: 'json',      showInDetail: true,  section: 'Hazards' },
  { key: 'recommendations',      label: 'Recommendations',    type: 'array',     showInDetail: true,  section: 'Recommendations' },
  { key: 'results',              label: 'Full Results',       type: 'json',      showInDetail: true,  colSpan: 2 },
  { key: 'user_id',              label: 'User ID',            type: 'readonly',  showInDetail: true },
  { key: 'scanned_at',           label: 'Scanned At',         type: 'date',      showInList: true,  showInDetail: true },
  { key: 'video_url',            label: 'Video',              type: 'video',     showInDetail: true,  showInEdit: true,  colSpan: 2 },
  { key: 'source',               label: 'Source',             type: 'readonly',  showInDetail: true },
  { key: 'created_at',           label: 'Created',            type: 'date',      showInDetail: true },
];

/**
 * ============================================================
 *  MASTER CONFIG - exported for use in SimplifiedAdminPanel
 * ============================================================
 */
export const adminFieldConfig: Record<string, TabFieldConfig> = {
  waitlist: {
    tabId: 'waitlist',
    label: 'Waitlist User',
    nameField: 'email',
    fields: waitlistFields,
  },
  elements: {
    tabId: 'elements',
    label: 'Element',
    nameField: 'name_common',
    secondaryField: 'name',
    fields: elementsFields,
  },
  ingredients: {
    tabId: 'ingredients',
    label: 'Ingredient',
    nameField: 'name',
    fields: ingredientsFields,
  },
  recipes: {
    tabId: 'recipes',
    label: 'Recipe',
    nameField: 'name',
    fields: recipesFields,
  },
  products: {
    tabId: 'products',
    label: 'Product',
    nameField: 'name',
    secondaryField: 'brand',
    fields: productsFields,
  },
  scans: {
    tabId: 'scans',
    label: 'Scan',
    nameField: 'name',
    fields: scansFields,
  },
};

/**
 * Helper: get fields for a specific view
 */
export function getFieldsForView(tabId: string, view: 'list' | 'detail' | 'edit'): FieldConfig[] {
  const config = adminFieldConfig[tabId];
  if (!config) return [];
  
  switch (view) {
    case 'list':
      return config.fields.filter(f => f.showInList);
    case 'detail':
      return config.fields.filter(f => f.showInDetail);
    case 'edit':
      return config.fields.filter(f => f.showInEdit);
    default:
      return [];
  }
}

/**
 * Helper: get AI-suggestable fields for a tab
 */
export function getAiSuggestFields(tabId: string): FieldConfig[] {
  const config = adminFieldConfig[tabId];
  if (!config) return [];
  return config.fields.filter(f => f.aiSuggest);
}
