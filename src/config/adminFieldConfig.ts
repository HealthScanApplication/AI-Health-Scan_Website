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
    | "media_upload"
    | "linked_elements"
    | "linked_ingredients"
    | "taste_profile"
    | "nutrition_editor"
    | "category_tree"
    | "content_links"
    | "cooking_steps"
    | "cooking_tools"
    | "recipe_ingredients_tools"
    | "drv_editor"
    | "health_benefits_editor"
    | "food_sources_editor"
    | "food_strategy_editor"
    | "thresholds_editor"
    | "deficiency_ranges_editor"
    | "excess_ranges_editor"
    | "description_full_editor"
    | "deficiency_editor"
    | "interactions_editor"
    | "references_editor"
    | "element_sources_viewer"
    | "interventions_editor"
    | "herbal_quality_editor"
    | "icon_picker"
    | "cooking_method_equipment";
  categoryTree?: Record<string, Record<string, string[]>>;
  linkedCategory?: "beneficial" | "hazardous" | "all";
  linkedTable?: "catalog_elements" | "catalog_ingredients" | "catalog_cooking_methods" | "catalog_equipment";
  mediaType?: "icon" | "image" | "video";
  accept?: string;
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
  accentColor?: 'orange' | 'green' | 'red';
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
  plasticizer: "bg-red-100 text-red-800",
  microorganism: "bg-red-100 text-red-800",
  parasite: "bg-red-100 text-red-800",
  probiotic: "bg-teal-100 text-teal-800",
  prebiotic: "bg-teal-100 text-teal-800",
  enzyme: "bg-violet-100 text-violet-800",
  phytonutrient: "bg-lime-100 text-lime-800",
  "natural toxin": "bg-orange-100 text-orange-800",
  mycotoxin: "bg-red-100 text-red-800",
  "environmental contaminant": "bg-red-100 text-red-800",
  herbicide: "bg-red-100 text-red-800",
  insecticide: "bg-red-100 text-red-800",
  "processing byproduct": "bg-orange-100 text-orange-800",
  "artificial sweetener": "bg-orange-100 text-orange-800",
  "veterinary drug": "bg-red-100 text-red-800",
  antibiotic: "bg-red-100 text-red-800",
  hormone: "bg-amber-100 text-amber-800",
  "food additive": "bg-orange-100 text-orange-800",
  antinutrient: "bg-orange-100 text-orange-800",
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
    key: "image_url_capsule",
    label: "In Capsules",
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
    colSpan: 1,
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
    colSpan: 1,
  },
  {
    key: "name_scientific",
    label: "Scientific Name",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Ascorbic acid, Retinol",
    section: "Identity",
    colSpan: 1,
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
    colSpan: 1,
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
    colSpan: 2,
    conditionalOn: "health_role",
    options: [
      // Beneficial
      "vitamin", "mineral", "amino acid", "fatty acid", "antioxidant",
      "probiotic", "prebiotic", "enzyme", "phytonutrient",
      // Hazardous
      "natural toxin", "antinutrient", "mycotoxin",
      "heavy metal", "environmental contaminant",
      "pesticide", "herbicide", "insecticide",
      "processing byproduct", "food additive", "preservative", "artificial sweetener",
      "veterinary drug", "hormone", "antibiotic",
      "endocrine disruptor", "plasticizer",
      "microorganism", "parasite",
    ],
    dynamicOptionsMap: {
      beneficial: [
        "vitamin", "mineral", "amino acid", "fatty acid", "antioxidant",
        "probiotic", "prebiotic", "enzyme", "phytonutrient",
      ],
      hazardous: [
        "natural toxin", "antinutrient", "mycotoxin",
        "heavy metal", "environmental contaminant",
        "pesticide", "herbicide", "insecticide",
        "processing byproduct", "food additive", "preservative", "artificial sweetener",
        "veterinary drug", "hormone", "antibiotic",
        "endocrine disruptor", "plasticizer",
        "microorganism", "parasite",
      ],
      both: [
        "vitamin", "mineral", "amino acid", "fatty acid", "antioxidant",
        "probiotic", "prebiotic", "enzyme", "phytonutrient",
        "natural toxin", "antinutrient", "mycotoxin",
        "heavy metal", "environmental contaminant",
        "pesticide", "herbicide", "insecticide",
        "processing byproduct", "food additive", "preservative", "artificial sweetener",
        "veterinary drug", "hormone", "antibiotic",
        "endocrine disruptor", "plasticizer",
        "microorganism", "parasite",
      ],
      conditional: [
        "vitamin", "mineral", "amino acid", "fatty acid", "antioxidant",
        "probiotic", "prebiotic", "enzyme", "phytonutrient",
        "food additive", "preservative", "hormone", "antinutrient",
      ],
    },
  },
  {
    key: "subcategory",
    label: "Subcategory",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. fat-soluble vitamin, organochlorine",
    section: "Identity",
    colSpan: 1,
  },
  {
    key: "essential_90",
    label: "Essential 90",
    type: "boolean",
    showInDetail: true,
    showInEdit: true,
    section: "Identity",
    colSpan: 1,
    showWhen: { field: "health_role", is: ["beneficial", "both"] },
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
    colSpan: 1,
  },
  {
    key: "molecular_formula",
    label: "Molecular Formula",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. C₆H₈O₆",
    section: "Chemistry",
    colSpan: 1,
  },
  {
    key: "cas_number",
    label: "CAS Number",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. 50-81-7",
    section: "Chemistry",
    colSpan: 1,
  },

  // --- Summary Description (Section A2 / B2) ---
  {
    key: "description",
    label: "Short Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
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
    colSpan: 1,
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
    colSpan: 1,
    section: "Summary",
    placeholder: "Scientific/biochemical description for advanced users",
  },

  // --- Functions & Benefits (Section A5 — benefit chips) ---
  {
    key: "functions",
    label: "Functions",
    type: "multi_tags",
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    section: "Functions & Benefits",
    placeholder: "Add function tags",
    showWhen: { field: "health_role", not: ["hazardous"] },
    options: [
      "Vision Support",
      "Immune Defence",
      "Cell Growth",
      "Energy Production",
      "Bone Health",
      "Heart Health",
      "Brain Function",
      "Antioxidant",
      "Anti-inflammatory",
      "Detoxification",
      "Hormone Regulation",
      "Blood Sugar Control",
      "Digestive Health",
      "Skin Health",
      "Muscle Function",
      "Nerve Function",
      "DNA Synthesis",
      "Protein Synthesis",
      "Fat Metabolism",
      "Wound Healing",
    ],
  },
  {
    key: "health_benefits",
    label: "Health Benefits",
    type: "multi_tags",
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    section: "Functions & Benefits",
    placeholder: "Add benefit tags",
    showWhen: { field: "health_role", not: ["hazardous"] },
    options: [
      "Boosts Immunity",
      "Improves Vision",
      "Supports Bone Density",
      "Enhances Energy",
      "Promotes Heart Health",
      "Improves Cognitive Function",
      "Reduces Inflammation",
      "Supports Detoxification",
      "Balances Hormones",
      "Regulates Blood Sugar",
      "Aids Digestion",
      "Improves Skin Quality",
      "Builds Muscle",
      "Strengthens Nerves",
      "Supports DNA Repair",
      "Enhances Protein Synthesis",
      "Optimizes Fat Metabolism",
      "Accelerates Healing",
      "Reduces Oxidative Stress",
      "Improves Sleep Quality",
    ],
  },
  {
    key: "risk_tags",
    label: "Risk/Hazard Tags",
    type: "multi_tags",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Functions & Benefits",
    placeholder: "Add risk/hazard tags",
    showWhen: { field: "health_role", not: ["beneficial"] },
    options: [
      "Endocrine Disruptor",
      "Reproductive Harm",
      "Liver Damage",
      "Kidney Damage",
      "Neurotoxic",
      "Carcinogenic",
      "Teratogenic",
      "Mutagenic",
      "Immunotoxic",
      "Cardiovascular Risk",
      "Respiratory Irritant",
      "Skin Sensitizer",
      "Eye Irritant",
      "Gastrointestinal Irritant",
      "Bone Toxicity",
      "Blood Toxicity",
      "Thyroid Disruption",
      "Metabolic Disruption",
      "Developmental Toxicity",
      "Genotoxic",
    ],
  },

  // --- Deficiency Info (causes, symptoms, treatment — text content, not ranges) ---
  {
    key: "deficiency",
    label: "Deficiency Info (causes, symptoms, treatment)",
    type: "deficiency_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Deficiency Info",
    placeholder: "Causes, early/moderate/severe symptoms, and treatment info",
    showWhen: { field: "health_role", not: ["hazardous"] },
  },

  // --- Food Sources (Section A7 / B6) ---
  {
    key: "found_in",
    label: "Found In",
    type: "multi_tags",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Food Sources",
    placeholder: "Add sources",
    options: [
      "Food",
      "Supplements",
      "Fortified Foods",
      "Water",
      "Soil",
      "Air",
      "Packaging",
      "Cosmetics",
      "Medications",
      "Industrial Products",
      "Pesticides",
      "Cleaning Products",
      "Building Materials",
      "Electronics",
      "Textiles",
    ],
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
    type: "description_full_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Detailed Sections",
    placeholder:
      "JSON with keys: simple, technical, harmful_effects, what_depletes, how_builds, how_lasts, when_to_supplement, needed_for_absorption, pregnancy_considerations, summary_bullets, risk_benefit_analysis, therapeutic_window, ...",
  },

  // --- Interventions & Detox (consolidated) ---
  {
    key: "detox_strategy",
    label: "How to Reduce Exposure",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Interventions",
    placeholder: "Practical steps to reduce exposure (for hazardous elements)",
    showWhen: { field: "health_role", not: ["beneficial"] },
  },
  {
    key: "prevention_items",
    label: "Prevention / Protective Items",
    type: "interventions_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    section: "Interventions",
    placeholder: "Items that help prevent harm or support the body",
  },
  {
    key: "elimination_items",
    label: "Elimination / Detox Items",
    type: "interventions_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    section: "Interventions",
    placeholder: "Binders, chelators, anti-parasitic herbs, etc.",
  },

  // --- Linked records containing this element (ingredients, recipes, products) ---
  {
    key: "_element_sources",
    label: "Linked Records (Ingredients, Recipes, Products)",
    type: "element_sources_viewer",
    showInDetail: false,
    showInEdit: true,
    colSpan: 2,
    section: "Food Sources",
  },

  // --- Nutrient Key Mapping (links element to its key in elements_beneficial JSON) ---
  {
    key: "nutrient_key",
    label: "Nutrient Key",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. vitamin_c_mg, iron_mg, calcium_mg",
    section: "Identity",
    colSpan: 1,
  },
  {
    key: "nutrient_unit",
    label: "Nutrient Unit",
    type: "select",
    showInDetail: true,
    showInEdit: true,
    section: "Identity",
    colSpan: 1,
    options: ["mg", "mcg", "g", "IU", "nmol/L", "ppb", "ppm", "%"],
  },
  {
    key: "nutrient_category",
    label: "Nutrient Category",
    type: "select",
    showInDetail: true,
    showInEdit: true,
    section: "Identity",
    colSpan: 1,
    options: [
      "vitamins",
      "minerals",
      "amino acids",
      "fatty acids",
      "antioxidants",
      "functional",
      "digestive",
      "macronutrients",
      "hazardous",
    ],
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

  // --- Age Ranges & DRV (rich structure: EU + USA deficiency/optimal/excess by age × gender) ---
  {
    key: "age_ranges",
    label: "Age Ranges (EU / USA / HealthScan)",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Age Ranges & DRV",
    placeholder:
      '{"europe":[...], "north_america":[...], "healthscan":[...]} — each entry: {age_group, basis, male: {deficiency, optimal, excess}, female: {...}}',
    aiSuggest: true,
    aiPrompt: "Generate the full age_ranges structure with EU and USA deficiency/optimal/excess values by age group and gender, using real EFSA and NIH DRI data.",
  },
  {
    key: "daily_recommended_adult",
    label: "Adult RDA (Quick Ref)",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    section: "Age Ranges & DRV",
    placeholder: '{"male":{"value":900,"unit":"μg RAE"},"female":{"value":700,"unit":"μg RAE"}}',
  },
  {
    key: "regions_meta",
    label: "Regulatory Authorities",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    section: "Age Ranges & DRV",
    placeholder: '{"europe":{"authority":"EFSA","reference_url":"..."},"north_america":{"authority":"NIH","reference_url":"..."}}',
  },

  // --- Testing & Diagnostics ---
  {
    key: "testing_or_diagnostics",
    label: "Testing & Diagnostics",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Testing & Diagnostics",
    placeholder:
      '{"best_test":"Serum retinol","optimal_range":{"low":1.05,"high":2.27,"unit":"μmol/L"},"methods":[...]}',
    aiSuggest: true,
    aiPrompt: "Generate testing & diagnostics data: best test, optimal range, detection threshold, methods, and clinical guidance.",
  },

  // --- Interventions ---
  {
    key: "interventions",
    label: "Interventions (Supplement / Lifestyle / Herbal)",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Interventions",
    placeholder:
      '[{"title":"Retinyl palmitate","type":"supplement","phase":["deficiency","optimal"],"dosage_by_age_gender":{...}}]',
    aiSuggest: true,
    aiPrompt: "Generate 2-4 evidence-based interventions with dosage_by_age_gender per region, contraindications, and monitoring.",
  },

  // --- Key Interactions (rich) ---
  {
    key: "key_interactions",
    label: "Key Interactions (with references)",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Interactions",
    placeholder:
      '[{"element":"Zinc","type":"synergistic","description":"...","reference":"pubmed_url"}]',
    aiSuggest: true,
    aiPrompt: "Generate 3-6 key element interactions with type (synergistic/antagonistic), description, and PubMed reference URLs.",
  },

  // --- Food Data (rich sources with bioavailability) ---
  {
    key: "food_data",
    label: "Food Sources (Rich)",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Food Sources",
    placeholder:
      '{"strategy":{...},"sources":{"animal":[...],"plant":[...],"fortified":[...]},"bioavailability":{...}}',
    aiSuggest: true,
    aiPrompt: "Generate rich food source data with USDA amounts per 100g, bioavailability %, preparation methods, and strategy per source type.",
  },
  {
    key: "top_foods_list",
    label: "Top 10 Foods (Mobile)",
    type: "readonly",
    showInDetail: true,
    showInEdit: false,
    colSpan: 2,
    section: "Food Sources",
  },

  // --- Identity extras ---
  {
    key: "other_names",
    label: "Other Names (Array)",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    section: "Identity",
    placeholder: '["Retinol","Beta-carotene","Provitamin A"]',
  },
  {
    key: "content_urls",
    label: "Reference URLs",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    section: "References & Meta",
    placeholder: '{"wikipedia":"...","examine":"...","pubmed":"...","nih_factsheet":"..."}',
  },
  {
    key: "confidence",
    label: "Data Confidence",
    type: "select",
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    section: "References & Meta",
    options: ["verified", "ai_generated", "draft", "needs_review"],
  },
  {
    key: "slug_path",
    label: "Slug Path",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    section: "Identity",
    placeholder: "e.g. vitamin_a",
  },
  {
    key: "qa_rules",
    label: "QA Rules",
    type: "json",
    showInDetail: true,
    showInEdit: false,
    colSpan: 2,
    section: "References & Meta",
  },

  // --- Content: Academic ---
  {
    key: "scientific_references",
    label: "Scientific References",
    type: "references_editor",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content: Academic",
  },
  {
    key: "scientific_papers",
    label: "Scientific Papers",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content: Academic",
  },

  // --- Content: Social ---
  {
    key: "social_content",
    label: "Social Content",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content: Social",
  },

  // --- Content: All (images, videos, etc.) ---
  {
    key: "images",
    label: "Image Gallery",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content: All",
  },
  {
    key: "videos",
    label: "Video Content",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content: All",
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
    key: "elements_beneficial",
    label: "Micronutrients (Beneficial)",
    type: "nutrition_editor",
    linkedCategory: "beneficial",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
  },
  {
    key: "nutrition_per_100g",
    label: "Nutrition per 100g (auto)",
    type: "json",
    showInDetail: false,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
  },
  {
    key: "nutrition_per_serving",
    label: "Nutrition per Serving (auto)",
    type: "json",
    showInDetail: false,
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

  // --- Herbal / Medicinal Quality ---
  {
    key: "herbal_quality",
    label: "Herbal / Medicinal Profile",
    type: "herbal_quality_editor",
    showInDetail: false,
    showInEdit: true,
    colSpan: 2,
    section: "Herbal / Medicinal Quality",
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

  // --- Content: Academic ---
  {
    key: "scientific_papers",
    label: "Scientific Papers",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content: Academic",
  },

  // --- Content: Social ---
  {
    key: "social_content",
    label: "Social Content",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content: Social",
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
    label: "Linked Ingredients",
    type: "array",
    showInDetail: false,
    showInEdit: false,
    colSpan: 2,
    section: "Ingredients & Steps",
  },
  {
    key: "equipment",
    label: "Equipment",
    type: "cooking_tools",
    showInDetail: false,
    showInEdit: true,
    colSpan: 2,
    section: "Ingredients & Steps",
  },
  {
    key: "ingredients",
    label: "Ingredients",
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
  {
    key: "cooking_method_ids",
    label: "Cooking Methods Used",
    type: "linked_elements",
    linkedTable: "catalog_cooking_methods",
    showInList: false,
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    placeholder: "Cooking method UUIDs from catalog_cooking_methods",
    section: "Ingredients & Steps",
    aiSuggest: true,
    aiPrompt:
      "Query catalog_cooking_methods table for this recipe '{name_common}'. Return array of cooking method UUIDs used in this recipe. Match by: 1) Analyze recipe instructions/steps for cooking techniques (e.g., 'grill', 'sauté', 'steam'), 2) Consider category '{category}' and cuisine '{cuisine}', 3) Match temperature and time requirements. Format: ['uuid-1','uuid-2']. List method names if UUIDs unavailable.",
  },
  {
    key: "equipment_ids",
    label: "Equipment Needed (IDs)",
    type: "linked_elements",
    linkedTable: "catalog_equipment",
    showInList: false,
    showInDetail: true,
    showInEdit: true,
    colSpan: 1,
    placeholder: "Equipment UUIDs from catalog_equipment",
    section: "Ingredients & Steps",
    aiSuggest: true,
    aiPrompt:
      "Query catalog_equipment table for this recipe '{name_common}'. Return array of equipment UUIDs needed. Match by: 1) Analyze recipe instructions for equipment mentions (e.g., 'wok', 'oven', 'knife'), 2) Consider cooking methods used, 3) Match category '{category}' with typical equipment. Format: ['uuid-1','uuid-2']. List equipment names if UUIDs unavailable.",
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
    key: "elements_beneficial",
    label: "Micronutrients (Beneficial)",
    type: "nutrition_editor",
    linkedCategory: "beneficial",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
  },
  {
    key: "nutrition_per_100g",
    label: "Nutrition per 100g (auto)",
    type: "json",
    showInDetail: false,
    showInEdit: true,
    colSpan: 2,
    section: "Nutrition Data",
  },
  {
    key: "nutrition_per_serving",
    label: "Nutrition per Serving (auto)",
    type: "json",
    showInDetail: false,
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

  // --- Content: Academic ---
  {
    key: "scientific_papers",
    label: "Scientific Papers",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content: Academic",
  },

  // --- Content: Social ---
  {
    key: "social_content",
    label: "Social Content",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content: Social",
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
    key: "elements_beneficial",
    label: "Micronutrients (Beneficial)",
    type: "nutrition_editor",
    linkedCategory: "beneficial",
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

  // --- Content: Academic ---
  {
    key: "scientific_papers",
    label: "Scientific Papers",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content: Academic",
  },

  // --- Content: Social ---
  {
    key: "social_content",
    label: "Social Content",
    type: "content_links",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Content: Social",
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
 *  EQUIPMENT TAB
 * ============================================================
 */
const equipmentFields: FieldConfig[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    placeholder: "e.g. Chef's knife",
    colSpan: 2,
  },
  {
    key: "category",
    label: "Category",
    type: "select",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    options: [
      "Cutting",
      "Cookware",
      "Baking",
      "Prep",
      "Utensils",
      "Measuring",
      "Appliances",
      "Fitness",
      "Other",
    ],
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "What it is and how it's used",
  },
  {
    key: "image_url",
    label: "Image",
    type: "image",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
  },
  {
    key: "brand",
    label: "Brand",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Victorinox",
  },
  {
    key: "material",
    label: "Material",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Stainless steel",
  },
  {
    key: "size_notes",
    label: "Size / Notes",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. 8-inch blade",
  },
  {
    key: "use_case",
    label: "Use Case",
    type: "select",
    showInDetail: true,
    showInEdit: true,
    options: ["Cooking", "Baking", "Fitness", "General"],
  },
  {
    key: "affiliate_url",
    label: "Affiliate / Buy Link",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "https://...",
  },
  {
    key: "cooking_methods_used_with",
    label: "Used With Cooking Methods",
    type: "array",
    showInList: false,
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "Cooking method UUIDs from catalog_cooking_methods",
    aiSuggest: true,
    aiPrompt:
      "CRITICAL: You MUST return ONLY valid UUIDs from the catalog_cooking_methods table, NOT placeholder text. Query the database for cooking methods that use this equipment '{name}' (category: {category}). Match by: 1) Method name contains equipment type (e.g., 'Grilling' for 'Grill'), 2) Method description mentions this equipment, 3) Equipment category '{category}' fits method needs (e.g., 'Cookware' → heat-based methods). Return ONLY the actual UUID values in array format: ['actual-uuid-1','actual-uuid-2']. If you cannot find matching UUIDs in the database, return an empty array []. DO NOT return placeholder text like 'UUID-method-name' or 'uuid-1'.",
  },
  { key: "created_at", label: "Created", type: "date", showInDetail: true },
];

/**
 * ============================================================
 *  COOKING METHODS TAB
 * ============================================================
 */
const cookingMethodsFields: FieldConfig[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    colSpan: 2,
  },
  {
    key: "slug",
    label: "Slug",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. stir-frying",
  },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: [
      "Dry Heat",
      "Moist Heat",
      "Fat-Based",
      "Combination",
      "Smoke & Fire",
      "Dehydration",
      "Fermentation",
      "Raw / Acid",
      "Modern",
      "Specialty",
    ],
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    colorMap: {
      "Dry Heat": "bg-orange-100 text-orange-800",
      "Moist Heat": "bg-blue-100 text-blue-800",
      "Fat-Based": "bg-yellow-100 text-yellow-800",
      Combination: "bg-purple-100 text-purple-800",
      "Smoke & Fire": "bg-red-100 text-red-800",
      Dehydration: "bg-amber-100 text-amber-800",
      Fermentation: "bg-emerald-100 text-emerald-800",
      "Raw / Acid": "bg-lime-100 text-lime-800",
      Modern: "bg-cyan-100 text-cyan-800",
      Specialty: "bg-pink-100 text-pink-800",
    },
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "Brief description of the cooking method",
    aiSuggest: true,
    aiPrompt:
      "Write a concise 1-2 sentence description of this cooking method, explaining the technique.",
  },
  {
    key: "temperature",
    label: "Temperature",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. High (230–370°C / 450–700°F)",
  },
  {
    key: "medium",
    label: "Medium",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. Direct flame, Oil, Steam",
  },
  {
    key: "typical_time",
    label: "Typical Time",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    placeholder: "e.g. 5–20 min",
  },
  {
    key: "health_impact",
    label: "Health Impact",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "Health implications of this cooking method",
    aiSuggest: true,
    aiPrompt:
      "Describe the health impact of this cooking method in 1-2 sentences.",
  },
  {
    key: "nutrient_effect",
    label: "Nutrient Effect",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "How this method affects nutrients",
    aiSuggest: true,
    aiPrompt:
      "Describe how this cooking method affects nutrient retention in 1-2 sentences.",
  },
  {
    key: "best_for",
    label: "Best For",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "e.g. Steaks, vegetables, seafood",
  },
  {
    key: "equipment_ids",
    label: "Equipment Needed",
    type: "cooking_method_equipment",
    showInList: false,
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "Equipment UUIDs from catalog_equipment",
    aiSuggest: true,
    aiPrompt:
      "Query catalog_equipment table for this cooking method '{name}'. Return array of equipment UUIDs needed. Match by: 1) Equipment name/category matches method needs (e.g., 'Grilling' needs 'Grill', 'Tongs'), 2) Equipment use_case includes 'Cooking', 3) Consider temperature ({temperature}) and medium ({medium}). Format: ['uuid-1','uuid-2']. List equipment names if UUIDs unavailable.",
  },
  {
    key: "image_url",
    label: "Image",
    type: "image",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
  },
  { key: "created_at", label: "Created", type: "date", showInDetail: true },
];

/**
 * ============================================================
 *  ACTIVITIES TAB
 * ============================================================
 */
const activitiesFields: FieldConfig[] = [
  {
    key: "id",
    label: "ID (slug)",
    type: "text",
    showInList: false,
    showInDetail: true,
    showInEdit: true,
    required: true,
    placeholder: "e.g. running, cycling, sauna",
  },
  {
    key: "name",
    label: "Name",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    colSpan: 2,
  },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: [
      "sport",
      "wellness",
      "flexibility",
      "outdoor",
      "strength",
      "recovery",
      "other",
    ],
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    colorMap: {
      sport: "bg-blue-100 text-blue-800",
      wellness: "bg-purple-100 text-purple-800",
      flexibility: "bg-pink-100 text-pink-800",
      outdoor: "bg-green-100 text-green-800",
      strength: "bg-orange-100 text-orange-800",
      recovery: "bg-teal-100 text-teal-800",
      other: "bg-gray-100 text-gray-700",
    },
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "Brief description of the activity",
    aiSuggest: true,
    aiPrompt:
      "Write a concise 1-2 sentence description of this activity '{name}' in the '{category}' category. Include what it involves and who it's suitable for.",
  },
  {
    key: "icon_name",
    label: "Icon (Library)",
    type: "icon_picker",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
  },
  {
    key: "icon_url",
    label: "Icon (Upload)",
    type: "media_upload",
    mediaType: "icon",
    accept: "image/svg+xml,image/png,image/jpeg",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "Drop or click to upload icon (SVG, PNG, JPG)",
  },
  {
    key: "image_url",
    label: "Image",
    type: "media_upload",
    mediaType: "image",
    accept: "image/*",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "Drop or click to upload image",
  },
  {
    key: "video_url",
    label: "Video",
    type: "media_upload",
    mediaType: "video",
    accept: "video/*",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "Drop or click to upload video",
  },
  {
    key: "sweat_level",
    label: "Sweat Level",
    type: "select",
    options: ["none", "low", "moderate", "high"],
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    colorMap: {
      none: "bg-gray-100 text-gray-600",
      low: "bg-blue-50 text-blue-600",
      moderate: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-700",
    },
  },
  {
    key: "default_duration_min",
    label: "Default Duration (min)",
    type: "number",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    placeholder: "30",
  },
  {
    key: "calories_per_minute",
    label: "Calories / Minute",
    type: "number",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    placeholder: "5",
  },
  {
    key: "mineral_impact",
    label: "Mineral Impact (per 30 min)",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: '[{"name":"Sodium","lostMg":460}]',
    aiSuggest: true,
    aiPrompt:
      "Based on published sweat composition research, estimate the minerals lost per 30 minutes of '{name}' at moderate intensity with sweat level '{sweat_level}'. Return a JSON array of objects with 'name' (mineral name) and 'lostMg' (milligrams lost). Include Sodium, Potassium, Magnesium, Calcium, Zinc, Iron where relevant. For low-sweat activities return []. Format: [{\"name\":\"Sodium\",\"lostMg\":460}]",
  },
  {
    key: "toxin_loss",
    label: "Toxin Excretion (per 30 min)",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: '[{"name":"Lead (Pb)","lostUg":1.2,"note":"Heavy metal"}]',
    aiSuggest: true,
    aiPrompt:
      "Based on published sweat analysis research, estimate toxins excreted per 30 minutes of '{name}' at moderate intensity with sweat level '{sweat_level}'. Return a JSON array with 'name' (toxin), 'lostUg' (micrograms), and 'note' (category). Include heavy metals (Lead, Cadmium, Mercury, Arsenic), endocrine disruptors (BPA, Phthalates), and metabolic waste (Urea, Ammonia) where relevant. For non-sweating activities return []. Format: [{\"name\":\"Lead (Pb)\",\"lostUg\":1.2,\"note\":\"Heavy metal\"}]",
  },
  {
    key: "benefits",
    label: "Health Benefits",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: '["Cardiovascular health","Endurance"]',
    aiSuggest: true,
    aiPrompt:
      "List 4-6 key health benefits of '{name}' ({category}). Return as a JSON string array. Include physical, mental, and wellness benefits. Format: [\"Benefit 1\",\"Benefit 2\"]",
  },
  {
    key: "strava_types",
    label: "Strava Sport Types",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: '["Run","TrailRun","VirtualRun"]',
    aiSuggest: true,
    aiPrompt:
      "What Strava SportType strings map to '{name}'? Reference the Strava API docs (https://developers.strava.com/docs/reference/#api-models-SportType). Return as a JSON string array. If no Strava mapping exists, return []. Format: [\"Run\",\"TrailRun\"]",
  },
  {
    key: "intensity_levels",
    label: "Intensity Levels",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    placeholder: '["Low","Moderate","High"]',
  },
  {
    key: "equipment_needed",
    label: "Equipment Needed",
    type: "array",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "e.g. Running shoes, Heart rate monitor",
  },
  {
    key: "muscle_groups",
    label: "Muscle Groups",
    type: "array",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "e.g. Quadriceps, Hamstrings, Core",
    aiSuggest: true,
    aiPrompt:
      "List the primary muscle groups targeted by '{name}'. Return as a simple array of muscle group names. Format: [\"Quadriceps\",\"Hamstrings\",\"Core\"]",
  },
  {
    key: "contraindications",
    label: "Contraindications",
    type: "array",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "e.g. Heart conditions, Joint problems",
    aiSuggest: true,
    aiPrompt:
      "List health conditions where '{name}' should be approached with caution or avoided. Return as a simple array. Format: [\"Heart conditions\",\"Joint problems\"]",
  },
  {
    key: "is_active",
    label: "Active",
    type: "boolean",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
  },
  {
    key: "sort_order",
    label: "Sort Order",
    type: "number",
    showInDetail: true,
    showInEdit: true,
    placeholder: "100",
  },
  { key: "created_at", label: "Created", type: "date", showInDetail: true },
];

/**
 * ============================================================
 *  SYMPTOMS TAB
 * ============================================================
 */
const symptomsFields: FieldConfig[] = [
  {
    key: "name",
    label: "Symptom Name",
    type: "text",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    colSpan: 2,
  },
  {
    key: "slug",
    label: "Slug",
    type: "text",
    showInDetail: true,
    showInEdit: true,
    placeholder: "auto-generated-from-name",
  },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: [
      "neurological",
      "dermatological",
      "muscular",
      "visual",
      "digestive",
      "cardiovascular",
      "skeletal",
      "immune",
      "hormonal",
      "psychological",
      "respiratory",
      "oral",
      "hepatic",
      "developmental",
      "general",
    ],
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    required: true,
    colorMap: {
      neurological: "bg-purple-100 text-purple-800",
      dermatological: "bg-pink-100 text-pink-800",
      muscular: "bg-orange-100 text-orange-800",
      visual: "bg-blue-100 text-blue-800",
      digestive: "bg-yellow-100 text-yellow-800",
      cardiovascular: "bg-red-100 text-red-800",
      skeletal: "bg-stone-100 text-stone-800",
      immune: "bg-green-100 text-green-800",
      hormonal: "bg-amber-100 text-amber-800",
      psychological: "bg-indigo-100 text-indigo-800",
      respiratory: "bg-cyan-100 text-cyan-800",
      oral: "bg-rose-100 text-rose-800",
      hepatic: "bg-lime-100 text-lime-800",
      developmental: "bg-violet-100 text-violet-800",
      general: "bg-gray-100 text-gray-700",
    },
  },
  {
    key: "body_system",
    label: "Body System",
    type: "select",
    options: [
      "nervous system",
      "skin",
      "eyes",
      "muscles",
      "gut",
      "heart",
      "bones",
      "immune",
      "endocrine",
      "brain",
      "lungs",
      "mouth",
      "liver",
      "nails",
      "hair",
      "whole body",
    ],
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    colorMap: {
      "nervous system": "bg-purple-50 text-purple-700",
      skin: "bg-pink-50 text-pink-700",
      eyes: "bg-blue-50 text-blue-700",
      muscles: "bg-orange-50 text-orange-700",
      gut: "bg-yellow-50 text-yellow-700",
      heart: "bg-red-50 text-red-700",
      bones: "bg-stone-50 text-stone-700",
      immune: "bg-green-50 text-green-700",
      endocrine: "bg-amber-50 text-amber-700",
      brain: "bg-indigo-50 text-indigo-700",
      lungs: "bg-cyan-50 text-cyan-700",
      mouth: "bg-rose-50 text-rose-700",
      liver: "bg-lime-50 text-lime-700",
      nails: "bg-slate-50 text-slate-700",
      hair: "bg-fuchsia-50 text-fuchsia-700",
      "whole body": "bg-gray-50 text-gray-700",
    },
  },
  {
    key: "severity",
    label: "Severity",
    type: "select",
    options: ["mild", "moderate", "severe"],
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    colorMap: {
      mild: "bg-green-100 text-green-800",
      moderate: "bg-yellow-100 text-yellow-800",
      severe: "bg-red-100 text-red-800",
    },
  },
  {
    key: "onset_type",
    label: "Onset Type",
    type: "select",
    options: ["acute", "gradual", "chronic"],
    showInDetail: true,
    showInEdit: true,
    colorMap: {
      acute: "bg-red-50 text-red-700",
      gradual: "bg-amber-50 text-amber-700",
      chronic: "bg-gray-100 text-gray-700",
    },
  },
  {
    key: "description",
    label: "Description (Technical)",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    aiSuggest: true,
    aiPrompt:
      "Write a concise medical description of the symptom '{name}' in the '{category}' category, explaining its pathophysiology and relation to nutrient deficiency/excess. 1-2 sentences.",
  },
  {
    key: "description_simple",
    label: "Description (Simple)",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    aiSuggest: true,
    aiPrompt:
      "Write a simple, plain-English explanation of the symptom '{name}' that anyone can understand. One sentence, no medical jargon.",
  },
  {
    key: "linked_elements_deficiency",
    label: "Linked Elements (Deficiency)",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Element Linkage",
    placeholder: '[{"element_name": "Vitamin A", "strength": "strong"}]',
  },
  {
    key: "linked_elements_excess",
    label: "Linked Elements (Excess)",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Element Linkage",
    placeholder: '[{"element_name": "Iron", "strength": "moderate"}]',
  },
  {
    key: "common_causes",
    label: "Common Non-Element Causes",
    type: "array",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Clinical Data",
    aiSuggest: true,
    aiPrompt:
      "List 3-5 common non-nutrient causes of '{name}' (e.g. diseases, lifestyle factors). Return as a JSON array of strings.",
  },
  {
    key: "related_symptoms",
    label: "Related Symptoms",
    type: "array",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Clinical Data",
    aiSuggest: true,
    aiPrompt:
      "List 3-5 symptoms commonly seen alongside '{name}'. Return as a JSON array of strings.",
  },
  {
    key: "reversible",
    label: "Reversible",
    type: "boolean",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Clinical Data",
  },
  {
    key: "population_risk",
    label: "At-Risk Populations",
    type: "array",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Clinical Data",
  },
  {
    key: "diagnostic_notes",
    label: "Diagnostic Notes",
    type: "textarea",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Clinical Data",
    aiSuggest: true,
    aiPrompt:
      "Write a brief note on how to confirm or test for '{name}' in a clinical setting. 1-2 sentences.",
  },

  // --- Herbal Treatments (reverse link from ingredients) ---
  {
    key: "herbal_treatments",
    label: "Herbal Treatments",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Herbal Treatments",
    placeholder: '[{"ingredient_id": "...", "ingredient_name": "Turmeric", "effectiveness": "high"}]',
  },

  {
    key: "icon_name",
    label: "Icon (Library)",
    type: "icon_picker",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Presentation",
  },
  {
    key: "icon_url",
    label: "Icon (Upload)",
    type: "media_upload",
    mediaType: "icon",
    accept: "image/svg+xml,image/png,image/jpeg",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "Drop or click to upload icon (SVG, PNG, JPG)",
    section: "Presentation",
  },
  {
    key: "image_url",
    label: "Image",
    type: "media_upload",
    mediaType: "image",
    accept: "image/*",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "Drop or click to upload image",
    section: "Presentation",
  },
  {
    key: "video_url",
    label: "Video",
    type: "media_upload",
    mediaType: "video",
    accept: "video/*",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    placeholder: "Drop or click to upload video",
    section: "Presentation",
  },
  {
    key: "tags",
    label: "Tags",
    type: "array",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "Presentation",
  },
  {
    key: "health_score_impact",
    label: "Health Score Impact",
    type: "number",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
    section: "Scoring",
    placeholder: "0-100",
  },
  {
    key: "scientific_references",
    label: "Scientific References",
    type: "json",
    showInDetail: true,
    showInEdit: true,
    colSpan: 2,
    section: "References",
  },
  {
    key: "is_active",
    label: "Active",
    type: "boolean",
    showInList: true,
    showInDetail: true,
    showInEdit: true,
  },
  {
    key: "sort_order",
    label: "Sort Order",
    type: "number",
    showInDetail: true,
    showInEdit: true,
    placeholder: "100",
  },
  { key: "created_at", label: "Created", type: "date", showInDetail: true },
];

/**
 * ============================================================
 *  HS_TESTS TAB — HealthScan test catalog
 * ============================================================
 */
const hsTestsFields: FieldConfig[] = [
  // ── Identity ───────────────────────────────────────────────────────
  { key: "name",            label: "Test Name",       type: "text",    showInList: true,  showInDetail: true, showInEdit: true,  placeholder: "e.g. Vitamin D Test", section: "Identity" },
  { key: "slug",            label: "Slug",            type: "text",    showInList: true,  showInDetail: true, showInEdit: true,  placeholder: "e.g. vitamin-d-test", section: "Identity" },
  { key: "category",        label: "Category",        type: "select",  showInList: true,  showInDetail: true, showInEdit: true, section: "Identity",
    options: ["Vitamins","Minerals","Essential Fatty Acids","Amino Acids","Metabolic & Hormones","Toxins & Hazards","DNA Tests","Microbiome"] },
  { key: "element_key",     label: "Element Key",     type: "text",    showInList: true,  showInDetail: true, showInEdit: true,  placeholder: "e.g. vitamin-d", section: "Identity" },
  { key: "sample_type",     label: "Sample Type",     type: "select",  showInList: true,  showInDetail: true, showInEdit: true, section: "Identity",
    options: ["BLOOD_FINGER_PRICK","URINE","SALIVA","STOOL","DRIED_URINE"] },
  { key: "turnaround_days", label: "TAT (days)",      type: "number",  showInList: true,  showInDetail: true, showInEdit: true, section: "Identity" },
  { key: "is_active",       label: "Active",          type: "badge",   showInList: true,  showInDetail: true, showInEdit: true, section: "Identity" },
  { key: "is_featured",     label: "Featured",        type: "badge",   showInList: false, showInDetail: true, showInEdit: true, section: "Identity" },
  { key: "description",     label: "Description",     type: "textarea",showInList: false, showInDetail: true, showInEdit: true, section: "Identity", colSpan: 2 },
  // ── Media ──────────────────────────────────────────────────────────
  { key: "icon_url",    label: "Icon",       type: "image",   showInList: false, showInDetail: true, showInEdit: true, section: "Media" },
  { key: "image_url",   label: "Image",      type: "image",   showInList: false, showInDetail: true, showInEdit: true, section: "Media" },
  { key: "video_url",   label: "Video URL",  type: "text",    showInList: false, showInDetail: true, showInEdit: true, section: "Media", placeholder: "https://youtube.com/..." },
  // ── Pricing ─────────────────────────────────────────────────────────
  { key: "retail_price_eur",   label: "Retail €",     type: "number", showInList: true,  showInDetail: true, showInEdit: true, section: "Pricing" },
  { key: "wholesale_cost_eur", label: "Wholesale €",  type: "number", showInList: false, showInDetail: true, showInEdit: true, section: "Pricing" },
  { key: "shipping_cost_eur",  label: "Shipping €",   type: "number", showInList: false, showInDetail: true, showInEdit: true, section: "Pricing" },
  { key: "support_cost_eur",   label: "Support €",    type: "number", showInList: false, showInDetail: true, showInEdit: true, section: "Pricing" },
  { key: "gross_margin_pct",   label: "Margin %",     type: "number", showInList: true,  showInDetail: true, showInEdit: true, section: "Pricing" },
  // ── Buy Links ───────────────────────────────────────────────────────
  { key: "buy_url",          label: "Buy URL",           type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Buy Links", placeholder: "https://..." },
  { key: "sample_order_url", label: "Order Sample URL",  type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Buy Links", placeholder: "https://..." },
  { key: "link_type",        label: "Link Type", type: "select", showInList: true, showInDetail: true, showInEdit: true, section: "Buy Links",
    options: ["dropship","affiliate","direct","mixed"] },
  // ── Providers ───────────────────────────────────────────────────────
  { key: "provider_eu",     label: "Provider EU Name",  type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Providers" },
  { key: "provider_eu_url", label: "Provider EU URL",   type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Providers", placeholder: "https://..." },
  { key: "provider_eu_cost",label: "Provider EU Cost €",type: "number", showInList: false, showInDetail: true, showInEdit: true, section: "Providers" },
  { key: "provider_uk",     label: "Provider UK Name",  type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Providers" },
  { key: "provider_uk_url", label: "Provider UK URL",   type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Providers", placeholder: "https://..." },
  { key: "provider_uk_cost",label: "Provider UK Cost",  type: "number", showInList: false, showInDetail: true, showInEdit: true, section: "Providers" },
  { key: "provider_us",     label: "Provider US Name",  type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Providers" },
  { key: "provider_us_url", label: "Provider US URL",   type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Providers", placeholder: "https://..." },
  { key: "provider_us_cost",label: "Provider US Cost",  type: "number", showInList: false, showInDetail: true, showInEdit: true, section: "Providers" },
  { key: "provider_au",     label: "Provider AU Name",  type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Providers" },
  { key: "provider_au_url", label: "Provider AU URL",   type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Providers", placeholder: "https://..." },
  { key: "provider_au_cost",label: "Provider AU Cost",  type: "number", showInList: false, showInDetail: true, showInEdit: true, section: "Providers" },
  // ── API / Dropship ─────────────────────────────────────────────────
  { key: "api_dropship_available",  label: "API Dropship Available",  type: "badge",    showInList: true,  showInDetail: true, showInEdit: true, section: "API & Setup" },
  { key: "api_dropship_connected",  label: "API Dropship Connected",  type: "badge",    showInList: true,  showInDetail: true, showInEdit: true, section: "API & Setup" },
  { key: "api_dropship_notes",      label: "API Dropship Notes",      type: "textarea", showInList: false, showInDetail: true, showInEdit: true, section: "API & Setup", colSpan: 2 },
  { key: "setup_notes",             label: "Setup Notes",             type: "textarea", showInList: false, showInDetail: true, showInEdit: true, section: "API & Setup", colSpan: 2 },
  { key: "supplier_website",        label: "Supplier Website",        type: "text",     showInList: false, showInDetail: true, showInEdit: true, section: "API & Setup", placeholder: "https://supplier.com" },
  { key: "supplier_email",          label: "Supplier Contact Email",  type: "text",     showInList: false, showInDetail: true, showInEdit: true, section: "API & Setup", placeholder: "support@supplier.com" },
  // ── Shopify Webstore ──────────────────────────────────────────────────────
  { key: "shopify_product_url", label: "Shopify Public URL", type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Shopify Webstore", placeholder: "https://healthscan.myshopify.com/products/..." },
  { key: "shopify_product_id",  label: "Shopify Product ID", type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Shopify Webstore", placeholder: "gid://shopify/Product/..." },
  // ── Meta ───────────────────────────────────────────────────────────
  { key: "notes",      label: "Internal Notes", type: "textarea", showInList: false, showInDetail: true, showInEdit: true, colSpan: 2 },
  { key: "created_at", label: "Created",         type: "date",    showInDetail: true },
];

/**
 * ============================================================
 *  HS_SUPPLEMENTS TAB — HealthScan supplement products
 * ============================================================
 */
const hsSupplementsFields: FieldConfig[] = [
  // ── Identity ───────────────────────────────────────────────────────
  { key: "name",           label: "Supplement Name", type: "text",    showInList: true,  showInDetail: true, showInEdit: true, placeholder: "e.g. Vitamin D3", section: "Identity" },
  { key: "slug",           label: "Slug",            type: "text",    showInList: true,  showInDetail: true, showInEdit: true, section: "Identity" },
  { key: "element_key",    label: "Element Key",     type: "text",    showInList: true,  showInDetail: true, showInEdit: true, placeholder: "e.g. vitamin-d", section: "Identity" },
  { key: "category",       label: "Category",        type: "select",  showInList: true,  showInDetail: true, showInEdit: true, section: "Identity",
    options: ["Vitamin","Mineral","Omega","Herb","Probiotic","Other"] },
  { key: "region",         label: "Region",          type: "select",  showInList: true,  showInDetail: true, showInEdit: true, section: "Identity",
    options: ["EU","UK","US","AU","ROW"] },
  { key: "currency",       label: "Currency",        type: "text",    showInList: true,  showInDetail: true, showInEdit: true, placeholder: "EUR", section: "Identity" },
  { key: "is_active",      label: "Active",          type: "badge",   showInList: true,  showInDetail: true, showInEdit: true, section: "Identity" },
  { key: "published",      label: "Published",       type: "badge",   showInList: true,  showInDetail: true, showInEdit: true, section: "Identity" },
  // ── Media ──────────────────────────────────────────────────────────
  { key: "icon_url",   label: "Supplier Logo",      type: "image", showInList: true, showInDetail: true, showInEdit: true, section: "Media" },
  { key: "image_url",  label: "Product Image",     type: "image", showInList: false, showInDetail: true, showInEdit: true, section: "Media" },
  { key: "video_url",  label: "Video URL", type: "text",  showInList: false, showInDetail: true, showInEdit: true, section: "Media", placeholder: "https://youtube.com/..." },
  // ── Pricing ─────────────────────────────────────────────────────────
  { key: "retail_price",   label: "Retail Price",  type: "number", showInList: true,  showInDetail: true, showInEdit: true, section: "Pricing" },
  { key: "estimated_cost", label: "Cost",     type: "number", showInList: true,  showInDetail: true, showInEdit: true, section: "Pricing" },
  { key: "margin_pct",     label: "Margin %",      type: "number", showInList: true,  showInDetail: true, showInEdit: true, section: "Pricing" },
  { key: "supplier",       label: "Supplier",      type: "text",   showInList: true,  showInDetail: true, showInEdit: true, section: "Pricing" },
  // ── Buy Links ───────────────────────────────────────────────────────
  { key: "buy_url",       label: "Buy URL",       type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Buy Links", placeholder: "https://..." },
  { key: "affiliate_url", label: "Affiliate URL", type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Buy Links", placeholder: "https://..." },
  { key: "amazon_url",    label: "Amazon URL",    type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Buy Links", placeholder: "https://amazon.com/..." },
  { key: "iherb_url",     label: "iHerb URL",     type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Buy Links", placeholder: "https://iherb.com/..." },
  { key: "link_type",     label: "Link Type", type: "select", showInList: true, showInDetail: true, showInEdit: true, section: "Buy Links",
    options: ["affiliate","direct","mixed"] },
  { key: "supplier_website", label: "Supplier Website",    type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Buy Links", placeholder: "https://supplier.com" },
  { key: "supplier_email",   label: "Supplier Contact Email", type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Buy Links", placeholder: "support@supplier.com" },
  // ── Setup ──────────────────────────────────────────────────────────
  { key: "setup_notes", label: "Setup Notes", type: "textarea", showInList: false, showInDetail: true, showInEdit: true, section: "Setup", colSpan: 2 },
  // ── Shopify Webstore ──────────────────────────────────────────────────────
  { key: "shopify_product_url", label: "Shopify Public URL", type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Shopify Webstore", placeholder: "https://healthscan.myshopify.com/products/..." },
  { key: "shopify_product_id",  label: "Shopify Product ID", type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Shopify Webstore", placeholder: "gid://shopify/Product/..." },
  // ── Meta ──────────────────────────────────────────────────────────
  { key: "notes",       label: "Internal Notes", type: "textarea", showInList: false, showInDetail: true, showInEdit: true, colSpan: 2 },
  { key: "created_at",  label: "Created",         type: "date",    showInDetail: true },
];

/**
 * ============================================================
 *  HS_PRODUCTS TAB — HealthScan physical products (filters, devices)
 * ============================================================
 */
const hsProductsFields: FieldConfig[] = [
  // ── Identity ───────────────────────────────────────────────────────
  { key: "name",         label: "Product Name",  type: "text",   showInList: true,  showInDetail: true, showInEdit: true,  placeholder: "e.g. Desktop HEPA Air Purifier", section: "Identity" },
  { key: "slug",         label: "Slug",           type: "text",   showInList: true,  showInDetail: true, showInEdit: true,  section: "Identity" },
  { key: "product_type", label: "Type",           type: "select", showInList: true,  showInDetail: true, showInEdit: true,  section: "Identity",
    options: ["filter","monitor","device","kit","accessory","supplement","other"] },
  { key: "category",     label: "Category",       type: "select", showInList: true,  showInDetail: true, showInEdit: true,  section: "Identity",
    options: ["Air Quality","Water Quality","Health Monitoring","Sleep & Light","Nutrition","Lab Kit","Other"] },
  { key: "element_key",  label: "Element Key",    type: "text",   showInList: false, showInDetail: true, showInEdit: true,  placeholder: "optional element link", section: "Identity" },
  { key: "is_active",    label: "Active",         type: "badge",  showInList: true,  showInDetail: true, showInEdit: true,  section: "Identity" },
  { key: "is_featured",  label: "Featured",       type: "badge",  showInList: false, showInDetail: true, showInEdit: true,  section: "Identity" },
  { key: "description",  label: "Description",    type: "textarea",showInList: false, showInDetail: true, showInEdit: true, section: "Identity", colSpan: 2 },
  // ── Media ──────────────────────────────────────────────────────────
  { key: "icon_url",    label: "Icon",       type: "image",  showInList: false, showInDetail: true, showInEdit: true, section: "Media" },
  { key: "image_url",   label: "Image 1",    type: "image",  showInList: false, showInDetail: true, showInEdit: true, section: "Media" },
  { key: "image_url_2", label: "Image 2",    type: "image",  showInList: false, showInDetail: true, showInEdit: true, section: "Media" },
  { key: "image_url_3", label: "Image 3",    type: "image",  showInList: false, showInDetail: true, showInEdit: true, section: "Media" },
  { key: "video_url",   label: "Video URL",  type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Media", placeholder: "https://youtube.com/..." },
  // ── Source & Buying ─────────────────────────────────────────────────
  { key: "source_platform", label: "Source Platform", type: "select", showInList: true,  showInDetail: true, showInEdit: true, section: "Source & Buy",
    options: ["temu","amazon","iherb","aliexpress","shopify","direct","other"] },
  { key: "source_url",       label: "Supplier Product URL",       type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Source & Buy", placeholder: "Original supplier product page" },
  { key: "buy_url",          label: "Buy / Affiliate URL", type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Source & Buy", placeholder: "Customer purchase link" },
  { key: "link_type",        label: "Link Type", type: "select", showInList: true, showInDetail: true, showInEdit: true, section: "Source & Buy",
    options: ["dropship","affiliate","direct","mixed"] },
  { key: "supplier",         label: "Supplier Name",       type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Source & Buy" },
  { key: "supplier_website", label: "Supplier Website",    type: "text",   showInList: false, showInDetail: true, showInEdit: true, section: "Source & Buy", placeholder: "https://supplier.com" },
  { key: "supplier_email",   label: "Supplier Contact Email", type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Source & Buy", placeholder: "support@supplier.com" },
  // ── Pricing ─────────────────────────────────────────────────────────
  { key: "retail_price",   label: "Retail Price",  type: "number", showInList: true,  showInDetail: true, showInEdit: true, section: "Pricing" },
  { key: "currency",       label: "Currency",       type: "text",   showInList: false, showInDetail: true, showInEdit: true, placeholder: "EUR", section: "Pricing" },
  { key: "region",         label: "Region",         type: "select", showInList: true,  showInDetail: true, showInEdit: true, section: "Pricing",
    options: ["EU","UK","US","AU","ROW","GLOBAL"] },
  { key: "estimated_cost", label: "Est. Cost (Dropship/Wholesale)",      type: "number", showInList: false, showInDetail: true, showInEdit: true, section: "Pricing" },
  { key: "margin_pct",     label: "Margin % (Retail - Cost)",       type: "number", showInList: true, showInDetail: true, showInEdit: true, section: "Pricing" },
  // ── Affiliate & Dropship ──────────────────────────────────────────────────────
  { key: "affiliate_available", label: "Affiliate Program Available", type: "badge",    showInList: true,  showInDetail: true, showInEdit: true, section: "Affiliate & Dropship" },
  { key: "affiliate_connected", label: "Affiliate Program Connected", type: "badge",    showInList: true,  showInDetail: true, showInEdit: true, section: "Affiliate & Dropship" },
  { key: "affiliate_notes",     label: "Affiliate/Dropship Notes",     type: "textarea", showInList: false, showInDetail: true, showInEdit: true, section: "Affiliate & Dropship", colSpan: 2, placeholder: "Commission rate, dropship terms, API details" },
  { key: "setup_notes",         label: "Product Setup/Usage Notes",         type: "textarea", showInList: false, showInDetail: true, showInEdit: true, section: "Affiliate & Dropship", colSpan: 2 },
  // ── Shopify Webstore ──────────────────────────────────────────────────────
  { key: "shopify_product_url", label: "Shopify Public URL", type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Shopify Webstore", placeholder: "https://healthscan.myshopify.com/products/..." },
  { key: "shopify_product_id",  label: "Shopify Product ID", type: "text", showInList: false, showInDetail: true, showInEdit: true, section: "Shopify Webstore", placeholder: "gid://shopify/Product/..." },
  // ── Meta ───────────────────────────────────────────────────────────
  { key: "notes",      label: "Internal Notes", type: "textarea", showInList: false, showInDetail: true, showInEdit: true, colSpan: 2 },
  { key: "created_at", label: "Created",         type: "date",    showInDetail: true },
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
  equipment: {
    tabId: "equipment",
    label: "Equipment",
    nameField: "name",
    secondaryField: "category",
    fields: equipmentFields,
  },
  cooking_methods: {
    tabId: "cooking_methods",
    label: "Cooking Method",
    nameField: "name",
    secondaryField: "category",
    fields: cookingMethodsFields,
  },
  activities: {
    tabId: "activities",
    label: "Activity",
    nameField: "name",
    secondaryField: "category",
    fields: activitiesFields,
  },
  symptoms: {
    tabId: "symptoms",
    label: "Symptom",
    nameField: "name",
    secondaryField: "category",
    fields: symptomsFields,
  },
  hs_products: {
    tabId: "hs_products",
    label: "HS Product",
    nameField: "name",
    secondaryField: "product_type",
    fields: hsProductsFields,
  },
  hs_tests: {
    tabId: "hs_tests",
    label: "HS Test",
    nameField: "name",
    secondaryField: "category",
    fields: hsTestsFields,
  },
  hs_supplements: {
    tabId: "hs_supplements",
    label: "HS Supplement",
    nameField: "name",
    secondaryField: "element_key",
    fields: hsSupplementsFields,
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
