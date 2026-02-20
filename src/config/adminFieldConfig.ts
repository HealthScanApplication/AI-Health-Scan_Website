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
  type:
    | "text"
    | "textarea"
    | "number"
    | "select"
    | "tags"
    | "multi_tags"
    | "boolean"
    | "readonly"
    | "badge"
    | "date"
    | "json"
    | "array"
    | "grouped_ingredients"
    | "image"
    | "video"
    | "linked_elements"
    | "linked_ingredients"
    | "taste_profile"
    | "nutrition_editor"
    | "category_tree"
    | "content_links"
    | "cooking_steps"
    | "cooking_tools"
    | "recipe_ingredients_tools";
  categoryTree?: Record<string, Record<string, string[]>>;
  linkedCategory?: "beneficial" | "hazardous" | "all";
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
  optionDescriptions?: Record<string, string>;
  dynamicOptionsMap?: Record<string, string[]>;
  conditionalOn?: string;
  showWhen?: { field: string; not?: string[]; is?: string[] };
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
  beneficial: "bg-green-100 text-green-800",
  hazardous: "bg-red-100 text-red-800",
  both: "bg-amber-100 text-amber-800",
  meal: "bg-green-100 text-green-800",
  beverage: "bg-cyan-100 text-cyan-800",
  condiment: "bg-amber-100 text-amber-800",
  snack: "bg-lime-100 text-lime-800",
  supplement: "bg-purple-100 text-purple-800",
  vegetable: "bg-green-100 text-green-800",
  fruit: "bg-orange-100 text-orange-800",
  grain: "bg-yellow-100 text-yellow-800",
  protein: "bg-red-100 text-red-800",
  dairy: "bg-blue-100 text-blue-800",
  raw: "bg-emerald-100 text-emerald-800",
  processed: "bg-orange-100 text-orange-800",
  vitamin: "bg-green-100 text-green-800",
  mineral: "bg-blue-100 text-blue-800",
  "amino acid": "bg-purple-100 text-purple-800",
  "fatty acid": "bg-yellow-100 text-yellow-800",
  antioxidant: "bg-emerald-100 text-emerald-800",
  "heavy metal": "bg-red-100 text-red-800",
  pesticide: "bg-red-100 text-red-800",
  preservative: "bg-orange-100 text-orange-800",
  "endocrine disruptor": "bg-red-100 text-red-800",
};

/**
 * ============================================================
 *  WAITLIST TAB
 * ============================================================
 */
const waitlistFields: FieldConfig[] = [
  {
    key: "email",
    label: "Email",
    type: "readonly",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
  },
  {
    key: "name",
    label: "Name",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    placeholder: "User name",
  },
  {
    key: "position",
    label: "Queue Position",
    type: "number",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
  },
  {
    key: "referrals",
    label: "Referrals",
    type: "number",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
  },
  {
    key: "confirmed",
    label: "Confirmed",
    type: "boolean",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
  },
  {
    key: "emailsSent",
    label: "Email Status",
    type: "readonly",
    showInList: true,
    showInDetail: true,
  },
  {
    key: "referralCode",
    label: "Referral Code",
    type: "readonly",
    showInDetail: true,
  },
  {
    key: "referredBy",
    label: "Referred By",
    type: "readonly",
    showInDetail: true,
  },
  { key: "source", label: "Source", type: "readonly", showInDetail: true },
  {
    key: "ipAddress",
    label: "IP Address",
    type: "readonly",
    showInDetail: true,
  },
  { key: "created_at", label: "Joined", type: "date", showInDetail: true },
  {
    key: "lastEmailSent",
    label: "Last Email Sent",
    type: "date",
    showInDetail: true,
  },
];

/**
 * ============================================================
 *  ELEMENTS TAB
 * ============================================================
 */
const elementsFields: FieldConfig[] = [
  // --- Media ---
  {
    key: "image_url",
    label: "Main Image",
    type: "image",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_raw",
    label: "Raw / Whole",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_powdered",
    label: "Powdered / Capsule",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_cut",
    label: "Cut / Sliced",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "video_url",
    label: "Video",
    type: "video",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },

  // --- Identity ---
  {
    key: "name_common",
    label: "Common Name",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    placeholder: "e.g. Vitamin C",
    section: "Identity",
    aiSuggest: true,
    aiPrompt: "Suggest a clear, commonly used name for this health element.",
  },
  {
    key: "name_other",
    label: "Other Names",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Retinol, Beta-Carotene",
    section: "Identity",
  },
  {
    key: "health_role",
    label: "Health Role",
    type: "tags",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    section: "Identity",
    options: ["beneficial", "hazardous", "both", "conditional"],
    colorMap: {
      beneficial: "bg-green-100 text-green-800",
      hazardous: "bg-red-100 text-red-800",
      both: "bg-amber-100 text-amber-800",
      conditional: "bg-blue-100 text-blue-800",
    },
  },
  {
    key: "type_label",
    label: "Type",
    type: "tags",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Identity",
    options: [
      "vitamin",
      "mineral",
      "amino acid",
      "fatty acid",
      "antioxidant",
      "heavy metal",
      "pesticide",
      "preservative",
      "endocrine disruptor",
      "artificial_sweetener",
      "mycotoxin",
      "processing_contaminant",
      "solvent",
      "plasticizer",
    ],
  },
  {
    key: "subcategory",
    label: "Subcategory",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. fat-soluble vitamin, organochlorine",
    section: "Identity",
  },
  {
    key: "essential_90",
    label: "Essential 90",
    type: "boolean",
    showInDetail: true,
    showInEdit: true,
    section: "Identity",
  },

  // --- Chemistry ---
  {
    key: "chemical_symbol",
    label: "Chemical Symbol",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Fe, Zn, C₂₀H₃₂O₅",
    section: "Chemistry",
  },
  {
    key: "molecular_formula",
    label: "Molecular Formula",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. C₆H₈O₆",
    section: "Chemistry",
  },
  {
    key: "cas_number",
    label: "CAS Number",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. 50-81-7",
    section: "Chemistry",
  },

  // --- Summary Description (Section A2 / B2) ---
  {
    key: "description",
    label: "Short Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Summary",
    placeholder: "Brief overview — what it is and why it matters",
    aiSuggest: true,
    aiPrompt:
      "Write a concise 2-3 sentence description of this health element, its role in the body, and why it matters.",
  },
  {
    key: "description_simple",
    label: "User-Facing Summary",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Summary",
    placeholder:
      "Plain-language summary shown to users in the top card (3-4 sentences)",
  },
  {
    key: "description_technical",
    label: "Technical Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Summary",
    placeholder: "Scientific/biochemical description for advanced users",
  },

  // --- Functions & Benefits (Section A5 — benefit chips) ---
  {
    key: "functions",
    label: "Functions",
    type: "array",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Functions & Benefits",
    placeholder: "e.g. vision_support, immune_defence, cell_growth",
  },
  {
    key: "health_benefits",
    label: "Health Benefits",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Functions & Benefits",
    placeholder:
      'JSON: { "optimal_health": [...], "beneficial_aspects": [...], "safety_considerations": [...] }',
  },
  {
    key: "risk_tags",
    label: "Risk/Hazard Tags",
    type: "array",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Functions & Benefits",
    placeholder: "e.g. endocrine_disruptor, reproductive_harm, liver_damage",
  },

  // --- Thresholds & Range (Section A4 / B4) ---
  {
    key: "thresholds",
    label: "Thresholds / Range",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Thresholds & Range",
    placeholder:
      'JSON: { "deficient": {...}, "optimal": {...}, "excess": {...} }',
  },
  {
    key: "deficiency_ranges",
    label: "Deficiency Ranges",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Thresholds & Range",
    placeholder:
      'JSON: { "unit": "ng/mL", "severe": { "below": 10, "label": "Severe deficiency" }, "moderate": { "below": 20 }, "mild": { "below": 30 } }',
  },
  {
    key: "excess_ranges",
    label: "Excess / Toxicity Ranges",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Thresholds & Range",
    placeholder:
      'JSON: { "unit": "mg/day", "tolerable_ul": 2000, "mild_excess": { "above": 1000, "label": "Mild GI effects" }, "toxicity": { "above": 2000, "label": "Hypercalcemia risk" } }',
  },

  // --- DRV by Population ---
  {
    key: "drv_by_population",
    label: "DRV by Age / Gender / Pregnancy",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "DRV by Population",
    placeholder:
      'JSON: { "unit": "mg/day", "groups": [ { "group": "Infants 0–6 months", "age_range": "0–6m", "gender": "all", "rda": 200, "ul": null }, { "group": "Children 1–3 years", "age_range": "1–3y", "gender": "all", "rda": 700, "ul": 2500 }, { "group": "Adult male", "age_range": "19–50y", "gender": "male", "rda": 1000, "ul": 2500 }, { "group": "Adult female", "age_range": "19–50y", "gender": "female", "rda": 1000, "ul": 2500 }, { "group": "Pregnant", "age_range": "any", "gender": "female", "pregnant": true, "rda": 1300, "ul": 2500 }, { "group": "Lactating", "age_range": "any", "gender": "female", "lactating": true, "rda": 1300, "ul": 2500 }, { "group": "Elderly 70+", "age_range": "70+y", "gender": "all", "rda": 1200, "ul": 2000 } ] }'  ,
  },

  // --- Food Sources (Section A7 / B6) ---
  {
    key: "found_in",
    label: "Found In",
    type: "array",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Food Sources",
    placeholder: "e.g. food, supplements, packaging, cosmetics",
  },
  {
    key: "food_sources_detailed",
    label: "Top Food Sources",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Food Sources",
    placeholder:
      'JSON array: [{ "name": "Beef liver", "amount": "9.00 mg / 100g" }, ...]',
  },
  {
    key: "food_strategy",
    label: "Food Strategy",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Food Sources",
    placeholder:
      'JSON: { "cards": [{ "title": "Animal Retinol", "subtitle": "fast-acting", "body": "..." }, ...] }',
  },
  {
    key: "reason",
    label: "Source / Reason",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Food Sources",
    placeholder:
      "Where this element comes from — natural sources or industrial processes",
  },

  // --- Description Full (Sections A8a–A8h / B7a–B7d) ---
  {
    key: "description_full",
    label: "Full Description Sections",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Detailed Sections",
    placeholder:
      "JSON with keys: simple, technical, harmful_effects, what_depletes, how_builds, how_lasts, when_to_supplement, needed_for_absorption, pregnancy_considerations, summary_bullets, risk_benefit_analysis, therapeutic_window, ...",
  },

  // --- Deficiency (Section A8a — too low) ---
  {
    key: "deficiency",
    label: "Deficiency Info",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Deficiency & Excess",
    placeholder:
      'JSON: { "name": "...", "causes": [...], "symptoms": { "early": [...], "moderate": [...], "severe": [...] }, "treatment": {...} }',
  },

  // --- Interactions (Section A8g) ---
  {
    key: "interactions",
    label: "Key Interactions",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Interactions",
    placeholder:
      'JSON: { "nutrients": [...], "medications": [...], "conditions": [...], "herbs": [...] }',
  },

  // --- Detox / Reduce Exposure (Section B7c) ---
  {
    key: "detox_strategy",
    label: "How to Reduce Exposure",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Detox & Exposure",
    placeholder: "Practical steps to reduce exposure (for hazardous elements)",
  },

  // --- Beneficial / Hazardous Elements ---
  {
    key: "elements_beneficial",
    label: "Beneficial Elements",
    type: "nutrition_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Scoring",
  },
  {
    key: "elements_hazardous",
    label: "Hazardous Elements",
    type: "nutrition_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Scoring",
    linkedCategory: "hazardous",
  },

  // --- Scoring ---
  {
    key: "health_score",
    label: "Health Score",
    type: "number",
    showInDetail: true,
    showInEdit: true,
    placeholder: "0-100",
    section: "Scoring",
  },

  // --- References & Meta ---
  {
    key: "scientific_references",
    label: "Scientific References",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "References & Meta",
  },
  {
    key: "info_sections",
    label: "Info Sections",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "References & Meta",
  },
  {
    key: "source",
    label: "Data Source",
    type: "readonly",
    showInDetail: true,
    section: "References & Meta",
  },
  {
    key: "ai_enriched_at",
    label: "AI Enriched At",
    type: "readonly",
    showInDetail: true,
    section: "References & Meta",
  },
  {
    key: "created_at",
    label: "Created",
    type: "date",
    showInDetail: true,
    section: "References & Meta",
  },
  {
    key: "updated_at",
    label: "Updated",
    type: "date",
    showInDetail: true,
    section: "References & Meta",
  },

  // --- Content ---
  {
    key: "scientific_papers",
    label: "Scientific Papers",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content",
  },
  {
    key: "social_content",
    label: "Social Content",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content",
  },
];

/**
 * ============================================================
 *  INGREDIENTS TAB
 * ============================================================
 */
const ingredientsFields: FieldConfig[] = [
  // --- Media (side-by-side) ---
  {
    key: "image_url",
    label: "Main Image",
    type: "image",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_raw",
    label: "Raw / Whole",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_powdered",
    label: "Powdered / Ground",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_cut",
    label: "Cut / Sliced",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_cubed",
    label: "Cubed / Diced",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_cooked",
    label: "Cooked / Prepared",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "video_url",
    label: "Video",
    type: "video",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },

  // --- Descriptions (shown right under images, full-width) ---
  {
    key: "description_simple",
    label: "Simple Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
    colSpan: 2,
    placeholder: "Short consumer-friendly description",
  },
  {
    key: "description_technical",
    label: "Technical Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
    colSpan: 2,
    placeholder: "Detailed scientific/nutritional description",
  },
  {
    key: "health_benefits",
    label: "Health Benefits",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
    colSpan: 2,
    placeholder: "Key health benefits of this ingredient",
  },

  // --- Basic Info ---
  {
    key: "name_common",
    label: "Common Name",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    placeholder: "e.g. Quinoa, Maitake Mushroom",
    section: "Basic Info",
  },
  {
    key: "name_other",
    label: "Other Names",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Hen of the Woods, Dancing Mushroom",
    section: "Basic Info",
  },
  {
    key: "name_scientific",
    label: "Scientific Name",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Grifola frondosa",
    section: "Basic Info",
  },
  {
    key: "processing_type",
    label: "Raw or Processed?",
    type: "tags",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Basic Info",
    colSpan: 2,
    options: ["raw", "minimally processed", "processed", "ultra-processed"],
  },
  {
    key: "description_processing",
    label: "How It's Made",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Basic Info",
    showWhen: { field: "processing_type", not: ["raw"] },
    placeholder:
      "Describe how this processed ingredient is made from its raw ingredients",
  },
  {
    key: "category",
    label: "Category",
    type: "category_tree",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Basic Info",
    colSpan: 2,
    categoryTree: {
      "Plant": {
        "Vegetable": [
          "Root",
          "Leafy Green",
          "Cruciferous",
          "Allium",
          "Nightshade",
          "Squash",
          "Stem",
          "Tuber",
          "Bulb",
          "Sea Vegetable",
          "Sprout",
        ],
        "Fruit": [
          "Citrus",
          "Berry",
          "Stone Fruit",
          "Tropical",
          "Melon",
          "Pome",
          "Dried Fruit",
          "Exotic",
        ],
        "Grain": [
          "Whole Grain",
          "Refined",
          "Ancient Grain",
          "Pseudocereal",
          "Gluten-Free",
          "Flour",
          "Pasta",
        ],
        "Legume": ["Bean", "Lentil", "Pea", "Chickpea", "Soybean", "Peanut"],
        "Nut": ["Tree Nut", "Tropical Nut", "Pine Nut"],
        "Seed": ["Oilseed", "Pseudocereal Seed", "Flower Seed", "Tree Seed"],
        "Herb": [
          "Mediterranean",
          "Asian",
          "Fresh",
          "Dried",
          "Medicinal",
          "Aromatic",
        ],
        "Spice": [
          "Warm Spice",
          "Hot Spice",
          "Earthy",
          "Floral",
          "Citrus",
          "Smoky",
          "Seed Spice",
          "Bark Spice",
        ],
        "Sweetener": ["Natural", "Refined", "Sugar Alcohol", "Syrup", "Raw"],
        "Plant Oil": [
          "Olive",
          "Coconut",
          "Avocado",
          "Sesame",
          "Nut Oil",
          "Seed Oil",
        ],
      },
      "Animal": {
        "Meat": [
          "Red Meat",
          "Poultry",
          "Game",
          "Organ Meat",
          "Cured",
          "Ground",
        ],
        "Seafood": [
          "Fish",
          "Shellfish",
          "Crustacean",
          "Mollusk",
          "Seaweed",
          "Freshwater",
          "Saltwater",
        ],
        "Dairy": [
          "Milk",
          "Cheese",
          "Yogurt",
          "Butter",
          "Cream",
          "Fermented",
          "Plant-Based Alternative",
        ],
        "Egg": [
          "Chicken Egg",
          "Duck Egg",
          "Quail Egg",
          "Egg White",
          "Egg Yolk",
        ],
        "Animal Fat": ["Rendered", "Clarified", "Cultured", "Smoked"],
      },
      "Fungi": {
        "Mushroom": [
          "Culinary",
          "Medicinal",
          "Adaptogenic",
          "Wild",
          "Cultivated",
        ],
      },
      "Processed": {
        "Oil": [
          "Cold-Pressed",
          "Refined",
          "Extra Virgin",
          "Infused",
          "Cooking Oil",
          "Finishing Oil",
        ],
        "Beverage": [
          "Tea",
          "Coffee",
          "Juice",
          "Fermented",
          "Herbal",
          "Functional",
        ],
        "Additive": [
          "Preservative",
          "Emulsifier",
          "Stabilizer",
          "Colorant",
          "Flavor Enhancer",
          "Thickener",
          "Acidulant",
        ],
        "Protein": [
          "Plant Protein",
          "Animal Protein",
          "Fermented Protein",
          "Protein Isolate",
        ],
      },
    },
  },

  // --- Processing ---
  {
    key: "processing_methods",
    label: "Processing Methods",
    type: "multi_tags",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Processing",
    showWhen: { field: "processing_type", not: ["raw"] },
    options: [
      "dried",
      "powdered",
      "ground",
      "milled",
      "crushed",
      "flaked",
      "fermented",
      "cultured",
      "pickled",
      "brined",
      "smoked",
      "roasted",
      "toasted",
      "baked",
      "fried",
      "grilled",
      "steamed",
      "boiled",
      "blanched",
      "pasteurized",
      "homogenized",
      "UHT treated",
      "cold-pressed",
      "expeller-pressed",
      "solvent-extracted",
      "refined",
      "unrefined",
      "extra virgin",
      "bleached",
      "deodorized",
      "hydrogenated",
      "partially hydrogenated",
      "interesterified",
      "freeze-dried",
      "spray-dried",
      "dehydrated",
      "concentrated",
      "evaporated",
      "canned",
      "jarred",
      "vacuum-packed",
      "retort-packed",
      "fortified",
      "enriched",
      "iodized",
      "cured",
      "salted",
      "sugared",
      "candied",
      "caramelized",
      "distilled",
      "filtered",
      "clarified",
      "decaffeinated",
      "irradiated",
      "nixtamalized",
      "extruded",
      "puffed",
    ],
  },
  {
    key: "raw_ingredients",
    label: "Raw Ingredients",
    type: "linked_ingredients",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Processing",
    showWhen: { field: "processing_type", not: ["raw"] },
    placeholder: "Source ingredients (e.g. Garlic Powder → Garlic)",
  },

  // --- Culinary Origin ---
  {
    key: "origin_country",
    label: "Country of Origin",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Mexico, Japan, Ethiopia",
    section: "Culinary Origin",
  },
  {
    key: "origin_region",
    label: "Region",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Oaxaca, Hokkaido, Tigray",
    section: "Culinary Origin",
  },
  {
    key: "origin_city",
    label: "City / Locality",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Parma, Champagne, Darjeeling",
    section: "Culinary Origin",
  },
  {
    key: "culinary_history",
    label: "Culinary History",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Culinary Origin",
    placeholder:
      "History of culinary use — when it was first cultivated, how it spread, traditional uses, cultural significance",
  },

  // --- Taste & Texture Profile ---
  {
    key: "taste_profile",
    label: "Taste & Texture Profile",
    type: "taste_profile",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Flavor Profile",
  },

  // --- Nutrition Data ---
  {
    key: "nutrition_per_100g",
    label: "Macros per 100g",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
    placeholder: 'JSON: { "calories": 354, "protein_g": 14, "carbohydrates_g": 64, "fats_g": 6, "fiber_g": 7, "sugar_g": 1, "sodium_mg": 7 }',
  },
  {
    key: "elements_beneficial",
    label: "Micronutrients (Beneficial)",
    type: "nutrition_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
  },

  // --- Hazardous Elements ---
  {
    key: "elements_hazardous",
    label: "Hazardous Elements",
    type: "nutrition_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Hazards & Risks",
    linkedCategory: "hazardous",
  },

  // --- Health & Scoring ---
  {
    key: "health_score",
    label: "Health Score",
    type: "number",
    showInDetail: true,
    showInEdit: true,
    placeholder: "0-100",
    section: "Health & Scoring",
  },

  // --- References & Meta ---
  {
    key: "scientific_references",
    label: "Scientific References",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "References & Meta",
  },
  {
    key: "source",
    label: "Data Source",
    type: "readonly",
    showInDetail: true,
    section: "References & Meta",
  },
  {
    key: "created_at",
    label: "Created",
    type: "date",
    showInDetail: true,
    section: "References & Meta",
  },

  // --- Content ---
  {
    key: "scientific_papers",
    label: "Scientific Papers",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content",
  },
  {
    key: "social_content",
    label: "Social Content",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content",
  },
];

/**
 * ============================================================
 *  RECIPES TAB
 * ============================================================
 */
const recipesFields: FieldConfig[] = [
  // --- Media ---
  {
    key: "image_url",
    label: "Main Image",
    type: "image",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_raw",
    label: "Raw / Ingredients",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_plated",
    label: "Plated / Served",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_closeup",
    label: "Close-up / Detail",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "video_url",
    label: "Video",
    type: "video",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },

  // --- Basic Info ---
  {
    key: "name_common",
    label: "Name",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    placeholder: "e.g. Mediterranean Salad",
    section: "Basic Info",
    aiSuggest: true,
    aiPrompt: "Suggest a catchy name for this recipe.",
  },
  {
    key: "category",
    label: "Category",
    type: "tags",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Basic Info",
    options: [
      "meal",
      "beverage",
      "condiment",
      "snack",
      "dessert",
      "soup",
      "salad",
      "smoothie",
      "baked goods",
    ],
  },
  {
    key: "category_sub",
    label: "Subcategory",
    type: "multi_tags",
    showInDetail: true,
    showInEdit: true,
    section: "Basic Info",
    conditionalOn: "category",
    dynamicOptionsMap: {
      "meal": [
        "Breakfast",
        "Lunch",
        "Dinner",
        "Brunch",
        "One-Pot",
        "Bowl",
        "Wrap",
        "Stir-Fry",
        "Casserole",
        "Curry",
      ],
      "beverage": [
        "Smoothie",
        "Juice",
        "Tea",
        "Coffee",
        "Cocktail",
        "Mocktail",
        "Infused Water",
        "Shake",
      ],
      "condiment": [
        "Sauce",
        "Dressing",
        "Dip",
        "Spread",
        "Marinade",
        "Pesto",
        "Chutney",
        "Vinaigrette",
      ],
      "snack": [
        "Energy Bar",
        "Trail Mix",
        "Chips",
        "Crackers",
        "Bites",
        "Popcorn",
        "Nuts",
      ],
      "dessert": [
        "Cake",
        "Cookie",
        "Pudding",
        "Ice Cream",
        "Pie",
        "Tart",
        "Mousse",
        "Fruit-Based",
      ],
      "soup": [
        "Broth",
        "Cream Soup",
        "Stew",
        "Chili",
        "Bisque",
        "Chowder",
        "Gazpacho",
      ],
      "salad": [
        "Green Salad",
        "Grain Salad",
        "Protein Salad",
        "Fruit Salad",
        "Pasta Salad",
        "Slaw",
      ],
      "smoothie": [
        "Green Smoothie",
        "Protein Smoothie",
        "Fruit Smoothie",
        "Detox Smoothie",
      ],
      "baked goods": [
        "Bread",
        "Muffin",
        "Scone",
        "Flatbread",
        "Pizza",
        "Pastry",
      ],
    },
  },
  {
    key: "meal_slot",
    label: "Meal Slot",
    type: "tags",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Basic Info",
    options: [
      "breakfast",
      "lunch",
      "dinner",
      "snack",
      "dessert",
      "appetizer",
      "side dish",
    ],
  },

  // --- Cooking Details ---
  {
    key: "prep_time",
    label: "Prep Time",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. 15 min",
    section: "Cooking Details",
  },
  {
    key: "cook_time",
    label: "Cook Time",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. 30 min",
    section: "Cooking Details",
  },
  {
    key: "servings",
    label: "Servings",
    type: "number",
    showInDetail: true,
    showInEdit: true,
    section: "Cooking Details",
  },
  {
    key: "difficulty",
    label: "Difficulty",
    type: "tags",
    showInDetail: true,
    showInEdit: true,
    section: "Cooking Details",
    options: ["easy", "medium", "hard"],
  },
  // --- Ingredients & Steps ---
  {
    key: "linked_ingredients",
    label: "Ingredients & Tools",
    type: "recipe_ingredients_tools",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Ingredients & Steps",
  },
  {
    key: "ingredients",
    label: "Ingredients (text)",
    type: "grouped_ingredients",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Ingredients & Steps",
  },
  {
    key: "instructions",
    label: "Cooking Steps",
    type: "cooking_steps",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Ingredients & Steps",
  },

  // --- Descriptions ---
  {
    key: "description",
    label: "Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    section: "Descriptions",
    aiSuggest: true,
    aiPrompt:
      "Write a short appetizing description of this recipe in 2-3 sentences.",
  },
  {
    key: "description_simple",
    label: "Simple Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    section: "Descriptions",
    placeholder: "Short consumer-friendly description",
  },
  {
    key: "description_technical",
    label: "Technical Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    section: "Descriptions",
    placeholder: "Detailed nutritional/scientific description of this recipe",
  },
  {
    key: "health_benefits",
    label: "Health Benefits",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    section: "Descriptions",
    placeholder: "Key health benefits of this recipe",
  },

  // --- Taste & Texture Profile ---
  {
    key: "taste_profile",
    label: "Taste & Texture Profile",
    type: "taste_profile",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Flavor Profile",
  },

  // --- Nutrition Data ---
  {
    key: "nutrition_per_100g",
    label: "Macros per 100g",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
    placeholder: 'JSON: { "calories": 250, "protein_g": 8, "carbohydrates_g": 30, "fats_g": 12, "fiber_g": 4, "sugar_g": 6, "sodium_mg": 120 }',
  },
  {
    key: "nutrition_per_serving",
    label: "Macros per Serving",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
    placeholder: 'JSON: { "calories": 375, "protein_g": 12, "carbohydrates_g": 45, "fats_g": 18, "fiber_g": 6, "sugar_g": 9, "sodium_mg": 180 }',
  },
  {
    key: "elements_beneficial",
    label: "Micronutrients (Beneficial)",
    type: "nutrition_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
  },

  // --- Hazards & Risks ---
  {
    key: "elements_hazardous",
    label: "Hazardous Elements",
    type: "nutrition_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Hazards & Risks",
    linkedCategory: "hazardous",
  },

  // --- Health & Scoring ---
  {
    key: "health_score",
    label: "Health Score",
    type: "number",
    showInDetail: true,
    showInEdit: true,
    placeholder: "0-100",
    section: "Health & Scoring",
  },

  // --- References & Meta ---
  {
    key: "scientific_references",
    label: "Scientific References",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "References & Meta",
  },
  {
    key: "source",
    label: "Data Source",
    type: "readonly",
    showInDetail: true,
    section: "References & Meta",
  },
  {
    key: "created_at",
    label: "Created",
    type: "date",
    showInDetail: true,
    section: "References & Meta",
  },

  // --- Content ---
  {
    key: "scientific_papers",
    label: "Scientific Papers",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content",
  },
  {
    key: "social_content",
    label: "Social Content",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content",
  },
];

/**
 * ============================================================
 *  PRODUCTS TAB
 * ============================================================
 */
const productsFields: FieldConfig[] = [
  // --- Media ---
  {
    key: "image_url",
    label: "Main Image",
    type: "image",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_raw",
    label: "Raw / Unpackaged",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_back",
    label: "Back / Label",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "image_url_detail",
    label: "Detail / Closeup",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },
  {
    key: "video_url",
    label: "Video",
    type: "video",
    showInDetail: true,
    showInEdit: true,
    section: "Media",
  },

  // --- Basic Info ---
  {
    key: "name_common",
    label: "Name",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    placeholder: "e.g. Organic Blueberry Yogurt",
    section: "Basic Info",
    aiSuggest: true,
    aiPrompt: "Suggest a clear product name.",
  },
  {
    key: "name_brand",
    label: "Brand Name",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Nature Valley Organic",
    section: "Basic Info",
  },
  {
    key: "brand",
    label: "Brand",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    placeholder: "e.g. Nature Valley",
    section: "Basic Info",
  },
  {
    key: "category",
    label: "Category",
    type: "tags",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Basic Info",
    options: [
      "meal",
      "snack",
      "beverage",
      "condiment",
      "supplement",
      "dairy",
      "bakery",
      "frozen",
      "canned",
      "fresh",
      "cereal",
      "protein bar",
      "sauce",
    ],
  },
  {
    key: "subcategory",
    label: "Subcategory",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Fermented foods",
    section: "Basic Info",
  },
  {
    key: "barcode",
    label: "Barcode",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. 123456789012",
    section: "Basic Info",
  },
  {
    key: "quantity",
    label: "Quantity",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. 200 g",
    section: "Basic Info",
  },
  {
    key: "manufacturer",
    label: "Manufacturer",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    section: "Basic Info",
  },

  // --- Ingredients ---
  {
    key: "ingredients_text",
    label: "Ingredients Text",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Ingredients",
  },
  {
    key: "allergen_info",
    label: "Allergen Info",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Ingredients",
  },

  // --- Descriptions ---
  {
    key: "description",
    label: "Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Descriptions",
    aiSuggest: true,
    aiPrompt:
      "Write a concise product description highlighting key features and health benefits.",
  },
  {
    key: "description_simple",
    label: "Simple Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Descriptions",
    placeholder: "Short consumer-friendly description",
  },

  // --- Scores & Labels ---
  {
    key: "nutri_score",
    label: "Nutri-Score",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "a-e",
    section: "Scores & Labels",
  },
  {
    key: "nova_group",
    label: "NOVA Group",
    type: "number",
    showInDetail: true,
    showInEdit: true,
    placeholder: "1-4",
    section: "Scores & Labels",
  },
  {
    key: "eco_score",
    label: "Eco-Score",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "a-e",
    section: "Scores & Labels",
  },
  {
    key: "health_score",
    label: "Health Score",
    type: "number",
    showInDetail: true,
    showInEdit: true,
    placeholder: "0-100",
    section: "Scores & Labels",
  },

  // --- Taste & Texture Profile ---
  {
    key: "taste_profile",
    label: "Taste & Texture Profile",
    type: "taste_profile",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Flavor Profile",
  },

  // --- Nutrition Data ---
  {
    key: "nutrition_per_100g",
    label: "Nutrition per 100g",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
    placeholder: 'JSON: { "calories": 250, "protein_g": 8, "carbohydrates_g": 30, "fats_g": 12, "fiber_g": 4, "sugar_g": 6, "sodium_mg": 120 }',
  },
  {
    key: "nutrition_per_serving",
    label: "Nutrition per Serving",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
    placeholder: 'JSON: { "calories": 375, "protein_g": 12, "carbohydrates_g": 45, "fats_g": 18, "fiber_g": 6, "sugar_g": 9, "sodium_mg": 180 }',
  },
  {
    key: "elements_beneficial",
    label: "Micronutrients (Beneficial)",
    type: "nutrition_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
  },
  {
    key: "elements_hazardous",
    label: "Hazardous Elements",
    type: "nutrition_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Hazards & Risks",
    linkedCategory: "hazardous",
  },

  // --- References & Meta ---
  {
    key: "scientific_references",
    label: "Scientific References",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "References & Meta",
  },
  {
    key: "source",
    label: "Data Source",
    type: "readonly",
    showInDetail: true,
    section: "References & Meta",
  },
  {
    key: "created_at",
    label: "Created",
    type: "date",
    showInDetail: true,
    section: "References & Meta",
  },

  // --- Content ---
  {
    key: "scientific_papers",
    label: "Scientific Papers",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content",
  },
  {
    key: "social_content",
    label: "Social Content",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content",
  },
];

/**
 * ============================================================
 *  SCANS TAB (User Scans from mobile app)
 * ============================================================
 */
const scansFields: FieldConfig[] = [
  {
    key: "image_url",
    label: "Scan Photo",
    type: "image",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
  },
  {
    key: "name",
    label: "Name",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    placeholder: "e.g. Morning Breakfast Scan",
  },
  {
    key: "scan_type",
    label: "Scan Type",
    type: "tags",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    options: ["meal", "ingredient", "product", "barcode", "label"],
  },
  {
    key: "category",
    label: "Category",
    type: "tags",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    options: ["consumed", "planned", "analyzed"],
  },
  {
    key: "status",
    label: "Status",
    type: "tags",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    options: ["completed", "processing", "failed", "pending"],
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    aiSuggest: true,
    aiPrompt: "Describe what was scanned and the key findings.",
  },
  {
    key: "overall_score",
    label: "Health Score",
    type: "number",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Score",
  },
  {
    key: "ingredients",
    label: "Ingredients",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Ingredients",
  },
  {
    key: "nutrients_detected",
    label: "Micronutrients",
    type: "json",
    showInDetail: true,
    section: "Micronutrients",
  },
  {
    key: "macro_nutrition",
    label: "Macro Nutrition",
    type: "json",
    showInDetail: true,
    section: "Macro Nutrition",
  },
  {
    key: "hazards",
    label: "Hazards",
    type: "json",
    showInDetail: true,
    section: "Hazards",
  },
  {
    key: "pollutants_detected",
    label: "Pollutants",
    type: "json",
    showInDetail: true,
    section: "Hazards",
  },
  {
    key: "recommendations",
    label: "Recommendations",
    type: "array",
    showInDetail: true,
    section: "Recommendations",
  },
  {
    key: "results",
    label: "Full Results",
    type: "json",
    showInDetail: true,
    colSpan: 2,
  },
  { key: "user_id", label: "User ID", type: "readonly", showInDetail: true },
  {
    key: "scanned_at",
    label: "Scanned At",
    type: "date",
    showInList: true,
    showInDetail: true,
  },
  {
    key: "video_url",
    label: "Video",
    type: "video",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
  },
  { key: "source", label: "Source", type: "readonly", showInDetail: true },
  { key: "created_at", label: "Created", type: "date", showInDetail: true },
];

/**
 * ============================================================
 *  MASTER CONFIG - exported for use in SimplifiedAdminPanel
 * ============================================================
 */
export const adminFieldConfig: Record<string, TabFieldConfig> = {
  waitlist: {
    tabId: "waitlist",
    label: "Waitlist User",
    nameField: "email",
    fields: waitlistFields,
  },
  elements: {
    tabId: "elements",
    label: "Element",
    nameField: "name_common",
    secondaryField: "type_label",
    fields: elementsFields,
  },
  ingredients: {
    tabId: "ingredients",
    label: "Ingredient",
    nameField: "name_common",
    fields: ingredientsFields,
  },
  recipes: {
    tabId: "recipes",
    label: "Recipe",
    nameField: "name_common",
    fields: recipesFields,
  },
  products: {
    tabId: "products",
    label: "Product",
    nameField: "name_common",
    secondaryField: "brand",
    fields: productsFields,
  },
  scans: {
    tabId: "scans",
    label: "Scan",
    nameField: "name",
    fields: scansFields,
  },
};

/**
 * Helper: get fields for a specific view
 */
export function getFieldsForView(
  tabId: string,
  view: "list" | "detail" | "edit",
): FieldConfig[] {
  const config = adminFieldConfig[tabId];
  if (!config) return [];

  switch (view) {
    case "list":
      return config.fields.filter((f) => f.showInList);
    case "detail":
      return config.fields.filter((f) => f.showInDetail);
    case "edit":
      return config.fields.filter((f) => f.showInEdit);
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
  return config.fields.filter((f) => f.aiSuggest);
}
