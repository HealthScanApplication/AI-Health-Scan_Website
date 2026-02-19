/**
 * Nutrient categories for the beneficial elements editor.
 * All 90 essential nutrients grouped by category, matching catalog_elements.
 * Data format stored in elements_beneficial: nested JSON with per_100g/per_serving structure.
 */

export interface NutrientElement {
  id: string;
  name: string;
  unit: string;
  rdi?: string;
}

export interface NutrientCategory {
  key: string;
  label: string;
  icon: string;
  storageKey: string; // path key in the per_100g/per_serving object
  elements: NutrientElement[];
}

export const NUTRIENT_CATEGORIES: NutrientCategory[] = [
  {
    key: 'macronutrients',
    label: 'Macronutrients',
    icon: '🥩',
    storageKey: 'macronutrients',
    elements: [
      { id: 'calories', name: 'Calories', unit: 'kcal', rdi: '2000' },
      { id: 'protein_g', name: 'Protein', unit: 'g', rdi: '50' },
      { id: 'fat_g', name: 'Total Fat', unit: 'g', rdi: '78' },
      { id: 'carbohydrates_g', name: 'Carbohydrates', unit: 'g', rdi: '275' },
      { id: 'fiber_g', name: 'Fiber', unit: 'g', rdi: '28' },
      { id: 'sugars_g', name: 'Sugars', unit: 'g' },
      { id: 'water_content_g', name: 'Water Content', unit: 'g' },
    ],
  },
  {
    key: 'fat_soluble_vitamins',
    label: 'Fat-Soluble Vitamins',
    icon: '☀️',
    storageKey: 'vitamins',
    elements: [
      { id: 'vitamin_a_mcg', name: 'Vitamin A (Retinol)', unit: 'mcg', rdi: '900' },
      { id: 'vitamin_d3_mcg', name: 'Vitamin D3', unit: 'mcg', rdi: '20' },
      { id: 'vitamin_e_mg', name: 'Vitamin E (Tocopherol)', unit: 'mg', rdi: '15' },
      { id: 'vitamin_k2_mcg', name: 'Vitamin K2', unit: 'mcg', rdi: '120' },
    ],
  },
  {
    key: 'water_soluble_vitamins',
    label: 'Water-Soluble Vitamins',
    icon: '💧',
    storageKey: 'vitamins',
    elements: [
      { id: 'vitamin_c_mg', name: 'Vitamin C', unit: 'mg', rdi: '90' },
      { id: 'thiamine_mg', name: 'Thiamine (B1)', unit: 'mg', rdi: '1.2' },
      { id: 'riboflavin_mg', name: 'Riboflavin (B2)', unit: 'mg', rdi: '1.3' },
      { id: 'niacin_mg', name: 'Niacin (B3)', unit: 'mg', rdi: '16' },
      { id: 'pantothenic_acid_mg', name: 'Pantothenic Acid (B5)', unit: 'mg', rdi: '5' },
      { id: 'pyridoxine_mg', name: 'Pyridoxine (B6)', unit: 'mg', rdi: '1.7' },
      { id: 'biotin_mcg', name: 'Biotin (B7)', unit: 'mcg', rdi: '30' },
      { id: 'folate_mcg', name: 'Folate (B9)', unit: 'mcg', rdi: '400' },
      { id: 'vitamin_b12_mcg', name: 'Vitamin B12', unit: 'mcg', rdi: '2.4' },
    ],
  },
  {
    key: 'major_minerals',
    label: 'Major Minerals',
    icon: '💎',
    storageKey: 'minerals',
    elements: [
      { id: 'calcium_mg', name: 'Calcium', unit: 'mg', rdi: '1300' },
      { id: 'phosphorus_mg', name: 'Phosphorus', unit: 'mg', rdi: '1250' },
      { id: 'magnesium_mg', name: 'Magnesium', unit: 'mg', rdi: '420' },
      { id: 'sodium_mg', name: 'Sodium', unit: 'mg', rdi: '2300' },
      { id: 'potassium_mg', name: 'Potassium', unit: 'mg', rdi: '4700' },
      { id: 'chloride_mg', name: 'Chloride', unit: 'mg', rdi: '2300' },
      { id: 'sulfur_mg', name: 'Sulfur', unit: 'mg' },
    ],
  },
  {
    key: 'trace_minerals',
    label: 'Trace Minerals',
    icon: '🔬',
    storageKey: 'minerals',
    elements: [
      { id: 'iron_mg', name: 'Iron', unit: 'mg', rdi: '18' },
      { id: 'zinc_mg', name: 'Zinc', unit: 'mg', rdi: '11' },
      { id: 'copper_mg', name: 'Copper', unit: 'mg', rdi: '0.9' },
      { id: 'manganese_mg', name: 'Manganese', unit: 'mg', rdi: '2.3' },
      { id: 'selenium_mcg', name: 'Selenium', unit: 'mcg', rdi: '55' },
      { id: 'iodine_mcg', name: 'Iodine', unit: 'mcg', rdi: '150' },
      { id: 'chromium_mcg', name: 'Chromium', unit: 'mcg', rdi: '35' },
      { id: 'molybdenum_mcg', name: 'Molybdenum', unit: 'mcg', rdi: '45' },
      { id: 'fluoride_mg', name: 'Fluoride', unit: 'mg', rdi: '4' },
    ],
  },
  {
    key: 'essential_amino_acids',
    label: 'Essential Amino Acids',
    icon: '🧬',
    storageKey: 'amino_acids',
    elements: [
      { id: 'leucine_g', name: 'Leucine', unit: 'g' },
      { id: 'isoleucine_g', name: 'Isoleucine', unit: 'g' },
      { id: 'valine_g', name: 'Valine', unit: 'g' },
      { id: 'lysine_g', name: 'Lysine', unit: 'g' },
      { id: 'methionine_g', name: 'Methionine', unit: 'g' },
      { id: 'phenylalanine_g', name: 'Phenylalanine', unit: 'g' },
      { id: 'threonine_g', name: 'Threonine', unit: 'g' },
      { id: 'tryptophan_g', name: 'Tryptophan', unit: 'g' },
      { id: 'histidine_g', name: 'Histidine', unit: 'g' },
    ],
  },
  {
    key: 'conditional_amino_acids',
    label: 'Conditional Amino Acids',
    icon: '🔗',
    storageKey: 'amino_acids',
    elements: [
      { id: 'arginine_g', name: 'Arginine', unit: 'g' },
      { id: 'tyrosine_g', name: 'Tyrosine', unit: 'g' },
      { id: 'cysteine_g', name: 'Cysteine', unit: 'g' },
      { id: 'glutamine_g', name: 'Glutamine', unit: 'g' },
      { id: 'glycine_g', name: 'Glycine', unit: 'g' },
      { id: 'proline_g', name: 'Proline', unit: 'g' },
      { id: 'serine_g', name: 'Serine', unit: 'g' },
      { id: 'alanine_g', name: 'Alanine', unit: 'g' },
      { id: 'aspartic_acid_g', name: 'Aspartic Acid', unit: 'g' },
      { id: 'glutamic_acid_g', name: 'Glutamic Acid', unit: 'g' },
      { id: 'asparagine_g', name: 'Asparagine', unit: 'g' },
      { id: 'hydroxyproline_g', name: 'Hydroxyproline', unit: 'g' },
      { id: 'taurine_mg', name: 'Taurine', unit: 'mg' },
      { id: 'ornithine_g', name: 'Ornithine', unit: 'g' },
      { id: 'citrulline_g', name: 'Citrulline', unit: 'g' },
      { id: 'beta_alanine_g', name: 'Beta-Alanine', unit: 'g' },
      { id: 'creatine_g', name: 'Creatine', unit: 'g' },
      { id: 'l_carnitine_mg', name: 'L-Carnitine', unit: 'mg' },
    ],
  },
  {
    key: 'fatty_acids',
    label: 'Fatty Acids',
    icon: '🐟',
    storageKey: 'fatty_acids',
    elements: [
      { id: 'omega_3_mg', name: 'Omega-3 (EPA/DHA)', unit: 'mg', rdi: '1600' },
      { id: 'omega_6_g', name: 'Omega-6', unit: 'g', rdi: '17' },
      { id: 'saturated_g', name: 'Saturated Fat', unit: 'g' },
      { id: 'monounsaturated_g', name: 'Monounsaturated Fat', unit: 'g' },
      { id: 'polyunsaturated_g', name: 'Polyunsaturated Fat', unit: 'g' },
    ],
  },
  {
    key: 'antioxidants',
    label: 'Antioxidants & Carotenoids',
    icon: '🛡️',
    storageKey: 'antioxidants',
    elements: [
      { id: 'beta_carotene_mg', name: 'Beta-Carotene', unit: 'mg' },
      { id: 'lutein_mg', name: 'Lutein', unit: 'mg' },
      { id: 'zeaxanthin_mg', name: 'Zeaxanthin', unit: 'mg' },
      { id: 'lycopene_mg', name: 'Lycopene', unit: 'mg' },
      { id: 'astaxanthin_mg', name: 'Astaxanthin', unit: 'mg' },
      { id: 'resveratrol_mg', name: 'Resveratrol', unit: 'mg' },
      { id: 'quercetin_mg', name: 'Quercetin', unit: 'mg' },
      { id: 'curcumin_mg', name: 'Curcumin', unit: 'mg' },
      { id: 'egcg_mg', name: 'EGCG (Green Tea)', unit: 'mg' },
      { id: 'alpha_lipoic_acid_mg', name: 'Alpha-Lipoic Acid', unit: 'mg' },
    ],
  },
  {
    key: 'essential_nutrients',
    label: 'Essential & Functional Nutrients',
    icon: '⚡',
    storageKey: 'functional',
    elements: [
      { id: 'choline_mg', name: 'Choline', unit: 'mg', rdi: '550' },
      { id: 'inositol_mg', name: 'Inositol', unit: 'mg' },
      { id: 'coq10_mg', name: 'Coenzyme Q10', unit: 'mg' },
      { id: 'pqq_mg', name: 'PQQ', unit: 'mg' },
      { id: 'nicotinamide_riboside_mg', name: 'Nicotinamide Riboside', unit: 'mg' },
      { id: 'gaba_mg', name: 'GABA', unit: 'mg' },
      { id: 'same_mg', name: 'SAMe', unit: 'mg' },
      { id: 'tmg_g', name: 'TMG (Betaine)', unit: 'g' },
      { id: 'melatonin_mg', name: 'Melatonin', unit: 'mg' },
    ],
  },
  {
    key: 'bioactive_compounds',
    label: 'Bioactive Compounds',
    icon: '🌱',
    storageKey: 'botanicals',
    elements: [
      { id: 'berberine_mg', name: 'Berberine', unit: 'mg' },
    ],
  },
  {
    key: 'digestive_gut',
    label: 'Digestive & Gut Health',
    icon: '🦠',
    storageKey: 'digestive',
    elements: [
      { id: 'soluble_fiber_g', name: 'Soluble Fiber', unit: 'g' },
      { id: 'insoluble_fiber_g', name: 'Insoluble Fiber', unit: 'g' },
      { id: 'fulvic_acid_mg', name: 'Fulvic Acid', unit: 'mg' },
    ],
  },
];

export interface ServingPreset {
  label: string;
  size_g: number;
}

export const SERVING_PRESETS: ServingPreset[] = [
  { label: '1 slice', size_g: 24 },
  { label: '1 loaf', size_g: 450 },
  { label: '1 cup', size_g: 240 },
  { label: '1/2 cup', size_g: 120 },
  { label: '1 tbsp', size_g: 15 },
  { label: '1 tsp', size_g: 5 },
  { label: '1 piece', size_g: 30 },
  { label: '1 medium', size_g: 150 },
  { label: '1 large', size_g: 200 },
  { label: '1 small', size_g: 80 },
  { label: '100g', size_g: 100 },
  { label: '1 oz', size_g: 28 },
  { label: '1 handful', size_g: 30 },
  { label: '1 fillet', size_g: 170 },
  { label: '1 breast', size_g: 175 },
  { label: '1 thigh', size_g: 115 },
  { label: '1 egg', size_g: 50 },
  { label: '1 glass', size_g: 250 },
  { label: '1 can', size_g: 330 },
  { label: '1 bottle', size_g: 500 },
  { label: '1 scoop', size_g: 32 },
  { label: '1 bar', size_g: 40 },
  { label: '1 bowl', size_g: 300 },
  { label: '1 plate', size_g: 400 },
];
