/**
 * Admin constants for data population
 * Contains large data arrays and configuration constants
 */

export const TARGET_COUNTS = {
  nutrient: 100,
  pollutant: 100,
  ingredient: 100,
  product: 50,
  parasite: 100,
  scan: 20,
  meal: 20
};

// Regional and age-based RDI data structure
export const RDI_REGIONS = ['EU', 'USA'];
export const AGE_GROUPS = [
  { key: 'infants_0_6m', label: 'Infants (0-6 months)', min_age: 0, max_age: 0.5 },
  { key: 'infants_6_12m', label: 'Infants (6-12 months)', min_age: 0.5, max_age: 1 },
  { key: 'toddlers_1_3y', label: 'Toddlers (1-3 years)', min_age: 1, max_age: 3 },
  { key: 'children_4_8y', label: 'Children (4-8 years)', min_age: 4, max_age: 8 },
  { key: 'children_9_13y', label: 'Children (9-13 years)', min_age: 9, max_age: 13 },
  { key: 'adolescents_14_18y', label: 'Adolescents (14-18 years)', min_age: 14, max_age: 18 },
  { key: 'adults_19_30y', label: 'Adults (19-30 years)', min_age: 19, max_age: 30 },
  { key: 'adults_31_50y', label: 'Adults (31-50 years)', min_age: 31, max_age: 50 },
  { key: 'adults_51_70y', label: 'Adults (51-70 years)', min_age: 51, max_age: 70 },
  { key: 'adults_70plus', label: 'Adults (70+ years)', min_age: 70, max_age: 120 },
  { key: 'pregnant', label: 'Pregnant Women', min_age: 18, max_age: 45 },
  { key: 'lactating', label: 'Lactating Women', min_age: 18, max_age: 45 }
];

export const NUTRIENTS_DATA = [
  // Essential Vitamins with comprehensive mobile app data and regional RDI
  {
    name: 'Vitamin A (Retinol)',
    vitamin_name: 'Retinol / Carotenoid',
    category: 'Vitamins',
    unit: 'μg',
    rdi: 900,
    type: 'Fat-soluble vitamin',
    description_text_simple: 'Is essential for keeping your body strong, sharp, and resilient. It supports clear vision, especially at night, and helps regulate over 500 genes involved in cell repair, growth, and immune defence.',
    description_text_technical: 'Retinol and beta-carotene are the primary forms of vitamin A. Retinol is the active form found in animal products, while carotenoids from plants are converted to retinol in the body. It functions as a cofactor in rhodopsin for night vision and regulates gene expression through retinoic acid receptors.',
    health_benefits: [
      'Improves Vision',
      'Immune Defence',
      'Cellular Growth',
      'Fetal Development',
      'Skin Health',
      'Reproductive Health'
    ],
    food_strategy_animal: 'Small amounts go a long way. Just 25g of beef liver provides 2.25 mg of Vitamin A, which is 150-300% of the daily requirement. Because it\'s so potent, it\'s best consumed only once or twice a month. Cod liver oil is another highly concentrated source—1 teaspoon provides around 1.3 mg, or over 100% of daily needs.',
    food_strategy_plant: 'Are from vegetables are converted into Vitamin A as needed by the body, making them safer for daily intake. A combination of cooked carrots (~0.8 mg per medium carrot), kale (~0.9 mg per cup), sweet potatoes (~1.0 mg per 100g), and spinach (~0.5 mg per cup) can meet daily requirements without the risk of overdose.',
    pregnancy_considerations: 'Crucial for fetal organ and nervous system development. However, excess (>10,000 IU/day or >3 mg retinol) can be teratogenic, especially in the first 60 days of gestation. Safe zone: ~0.75 mg/day (2,500 IU). Prefer provitamin A (beta-carotene) sources over high-dose retinol supplements during pregnancy.'
  },
  {
    name: 'Vitamin B1 (Thiamine)',
    vitamin_name: 'Thiamine',
    category: 'Vitamins',
    unit: 'mg',
    rdi: 1.2,
    type: 'Water-soluble vitamin',
    description_text_simple: 'Essential for energy metabolism and nervous system function. Helps convert carbohydrates into energy and supports proper nerve, muscle, and heart function.',
    description_text_technical: 'Thiamine functions as a coenzyme in the form of thiamine pyrophosphate (TPP) in carbohydrate metabolism, particularly in the pentose phosphate pathway and citric acid cycle. Critical for neurotransmitter synthesis and nerve signal transmission.',
    health_benefits: [
      'Energy Metabolism',
      'Nervous System Health',
      'Heart Function',
      'Brain Health',
      'Muscle Function'
    ],
    food_strategy_animal: 'Pork is the richest source, with 100g providing about 0.9mg. Fish like trout and salmon also provide good amounts. Organ meats contain moderate levels.',
    food_strategy_plant: 'Whole grains, legumes, nuts, and seeds are excellent sources. Sunflower seeds, navy beans, and brown rice are particularly rich. Fortified cereals can also contribute significantly.',
    pregnancy_considerations: 'Increased need during pregnancy due to higher energy demands. Generally safe in normal dietary amounts. Deficiency can lead to pregnancy complications.'
  },
  {
    name: 'Vitamin C (Ascorbic Acid)',
    vitamin_name: 'Ascorbic Acid',
    category: 'Vitamins',
    unit: 'mg',
    rdi: 90,
    type: 'Water-soluble vitamin',
    description_text_simple: 'Powerful antioxidant that supports immune function, collagen synthesis, and wound healing. Enhances iron absorption and protects against oxidative stress.',
    description_text_technical: 'Functions as a cofactor for collagen hydroxylation, carnitine synthesis, and neurotransmitter production. Acts as an electron donor in numerous enzymatic reactions.',
    health_benefits: [
      'Immune Function',
      'Collagen Synthesis',
      'Antioxidant Protection',
      'Iron Absorption',
      'Wound Healing'
    ],
    food_strategy_animal: 'Not naturally found in significant amounts in animal products except organ meats.',
    food_strategy_plant: 'Citrus fruits, berries, bell peppers, broccoli, and leafy greens. Guava and papaya are exceptionally rich sources.',
    pregnancy_considerations: 'Increased needs during pregnancy for tissue growth and immune function. Generally safe in recommended amounts.'
  },
  {
    name: 'Vitamin D (Cholecalciferol)',
    vitamin_name: 'Cholecalciferol',
    category: 'Vitamins',
    unit: 'μg',
    rdi: 15,
    type: 'Fat-soluble vitamin',
    description_text_simple: 'Essential for bone health, immune function, and muscle strength. Helps the body absorb calcium and phosphorus while supporting overall well-being.',
    description_text_technical: 'Functions as a hormone precursor, converting to calcitriol (1,25-dihydroxyvitamin D3) which regulates calcium homeostasis, bone mineralization, and immune cell function.',
    health_benefits: [
      'Bone Health',
      'Immune Function',
      'Muscle Strength',
      'Calcium Absorption',
      'Mood Support'
    ],
    food_strategy_animal: 'Fatty fish (salmon, mackerel, sardines), egg yolks, and fortified dairy products. Fish liver oils are particularly rich.',
    food_strategy_plant: 'Few natural plant sources. Fortified plant milks, mushrooms exposed to UV light, and fortified cereals can help.',
    pregnancy_considerations: 'Critical for fetal bone development and maternal health. Deficiency linked to complications. Safe supplementation recommended.'
  },
  {
    name: 'Iron',
    vitamin_name: 'Iron',
    category: 'Minerals',
    unit: 'mg',
    rdi: 18,
    type: 'Essential mineral',
    description_text_simple: 'Essential for oxygen transport, energy production, and immune function. Critical component of hemoglobin and many enzymes.',
    description_text_technical: 'Functions in oxygen transport via hemoglobin, electron transport in cellular respiration, and as a cofactor in numerous enzymatic processes.',
    health_benefits: [
      'Oxygen Transport',
      'Energy Production',
      'Immune Function',
      'Cognitive Function',
      'Temperature Regulation'
    ],
    food_strategy_animal: 'Heme iron from meat, poultry, and fish is highly bioavailable. Liver, beef, and shellfish are excellent sources.',
    food_strategy_plant: 'Non-heme iron from legumes, fortified cereals, spinach, and pumpkin seeds. Enhance absorption with vitamin C.',
    pregnancy_considerations: 'Dramatically increased needs during pregnancy. Iron deficiency anemia is common. Supplementation often recommended.'
  }
];

export const POLLUTANTS_DATA = [
  {
    name: 'Bisphenol A (BPA)',
    category: 'Chemical Pollutants',
    type: 'Endocrine Disruptor',
    toxicity_level: 'Moderate',
    regulatory_limit: 0.05,
    unit: 'mg/kg',
    description: 'Chemical compound used in plastic production that can leach into food and beverages.',
    health_effects: ['Hormonal disruption', 'Reproductive issues', 'Cardiovascular effects'],
    sources: ['Plastic containers', 'Canned foods', 'Thermal receipts'],
    detection_methods: ['HPLC-MS/MS', 'ELISA'],
    mitigation: ['Use BPA-free products', 'Avoid heating plastic', 'Choose glass containers']
  },
  {
    name: 'Lead',
    category: 'Heavy Metals',
    type: 'Neurotoxin',
    toxicity_level: 'High',
    regulatory_limit: 0.01,
    unit: 'mg/L',
    description: 'Toxic heavy metal that accumulates in the body and affects multiple organ systems.',
    health_effects: ['Neurological damage', 'Developmental delays', 'Kidney damage'],
    sources: ['Old pipes', 'Paint', 'Contaminated soil'],
    detection_methods: ['ICP-MS', 'Atomic absorption'],
    mitigation: ['Test water sources', 'Replace old pipes', 'Proper soil remediation']
  },
  {
    name: 'Mercury',
    category: 'Heavy Metals',
    type: 'Neurotoxin',
    toxicity_level: 'High',
    regulatory_limit: 0.002,
    unit: 'mg/L',
    description: 'Highly toxic heavy metal that primarily affects the nervous system.',
    health_effects: ['Neurological damage', 'Memory problems', 'Motor skill impairment'],
    sources: ['Fish consumption', 'Dental amalgams', 'Industrial emissions'],
    detection_methods: ['Cold vapor atomic absorption', 'ICP-MS'],
    mitigation: ['Limit high-mercury fish', 'Proper amalgam removal', 'Industrial controls']
  }
];

export const INGREDIENTS_DATA = [
  { 
    name: 'Organic Quinoa', 
    category: 'Grains', 
    type: 'Whole Grain',
    description: 'Complete protein grain with all essential amino acids.',
    allergens: ['None'],
    nutritional_value: {
      protein: 14.1,
      fiber: 7.0,
      iron: 4.6,
      magnesium: 197
    },
    uses: ['Salads', 'Side dishes', 'Protein bowls'],
    benefits: ['Complete protein', 'Gluten-free', 'High fiber'],
    concerns: []
  },
  { 
    name: 'Fresh Spinach', 
    category: 'Leafy Greens', 
    type: 'Vegetable',
    description: 'Nutrient-dense leafy green vegetable.',
    allergens: ['None'],
    nutritional_value: {
      iron: 2.7,
      folate: 194,
      vitamin_k: 483,
      vitamin_a: 469
    },
    uses: ['Salads', 'Smoothies', 'Cooking'],
    benefits: ['High in iron', 'Rich in folate', 'Antioxidants'],
    concerns: ['Oxalates', 'Potential contamination']
  },
  { 
    name: 'Wild Salmon', 
    category: 'Fish & Seafood', 
    type: 'Fish',
    description: 'Premium omega-3 rich wild-caught salmon.',
    allergens: ['Fish'],
    nutritional_value: {
      protein: 25.4,
      omega_3: 1.8,
      vitamin_d: 11.0,
      selenium: 59.9
    },
    uses: ['Grilling', 'Baking', 'Sashimi'],
    benefits: ['High omega-3', 'Quality protein', 'Vitamin D'],
    concerns: ['Mercury content', 'Sustainability']
  }
];

export const PRODUCTS_DATA = [
  {
    name: 'Organic Blueberry Yogurt',
    brand: 'Nature Valley',
    category: 'Dairy',
    type: 'Yogurt',
    barcode: '123456789012',
    ingredients: ['Organic milk', 'Organic blueberries', 'Live cultures', 'Natural flavors'],
    nutrition_facts: {
      calories: 150,
      protein: 12,
      carbs: 18,
      fat: 4,
      sugar: 15,
      fiber: 2
    },
    allergens: ['Milk'],
    description: 'Creamy organic yogurt with real blueberries and live probiotics.',
    serving_size: '1 cup (170g)',
    warnings: [],
    certifications: ['USDA Organic', 'Non-GMO']
  },
  {
    name: 'Whole Grain Bread',
    brand: 'Artisan Bakery',
    category: 'Bakery',
    type: 'Bread',
    barcode: '234567890123',
    ingredients: ['Whole wheat flour', 'Water', 'Yeast', 'Salt', 'Honey'],
    nutrition_facts: {
      calories: 80,
      protein: 4,
      carbs: 15,
      fat: 1,
      sugar: 2,
      fiber: 3
    },
    allergens: ['Wheat', 'Gluten'],
    description: 'Hearty whole grain bread with no artificial preservatives.',
    serving_size: '1 slice (28g)',
    warnings: ['Contains gluten'],
    certifications: ['Non-GMO']
  }
];

// Single PARASITES_DATA declaration - removing any duplicates
export const PARASITES_DATA = [
  {
    name: 'Giardia lamblia',
    scientific_name: 'Giardia duodenalis',
    category: 'Intestinal Parasites',
    type: 'Protozoan',
    host: 'Humans',
    transmission: ['Contaminated water', 'Person-to-person', 'Contaminated food'],
    symptoms: ['Diarrhea', 'Abdominal cramps', 'Bloating', 'Nausea', 'Fatigue'],
    description: 'Common intestinal parasite that causes giardiasis, affecting the small intestine.',
    prevention: ['Water purification', 'Good hygiene', 'Proper sanitation'],
    treatment: ['Metronidazole', 'Tinidazole', 'Nitazoxanide'],
    geographic_distribution: ['Worldwide', 'More common in developing countries'],
    lifecycle: ['Cyst ingestion', 'Excystation', 'Trophozoite multiplication', 'Encystment']
  },
  {
    name: 'Cryptosporidium parvum',
    scientific_name: 'Cryptosporidium parvum',
    category: 'Intestinal Parasites',
    type: 'Protozoan',
    host: 'Humans and animals',
    transmission: ['Contaminated water', 'Swimming pools', 'Animal contact'],
    symptoms: ['Watery diarrhea', 'Stomach cramps', 'Dehydration', 'Fever'],
    description: 'Waterborne parasite that causes cryptosporidiosis, particularly dangerous for immunocompromised individuals.',
    prevention: ['Water filtration', 'Avoid contaminated water', 'Hand hygiene'],
    treatment: ['Nitazoxanide', 'Supportive care', 'Fluid replacement'],
    geographic_distribution: ['Worldwide', 'Common in water supplies'],
    lifecycle: ['Oocyst ingestion', 'Sporozoite release', 'Infection of intestinal cells']
  },
  {
    name: 'Entamoeba histolytica',
    scientific_name: 'Entamoeba histolytica',
    category: 'Intestinal Parasites',
    type: 'Protozoan',
    host: 'Humans',
    transmission: ['Fecal-oral route', 'Contaminated food', 'Contaminated water'],
    symptoms: ['Bloody diarrhea', 'Abdominal pain', 'Fever', 'Liver abscess'],
    description: 'Parasitic amoeba that causes amebic dysentery and can lead to serious complications.',
    prevention: ['Safe water practices', 'Food safety', 'Proper sanitation'],
    treatment: ['Metronidazole', 'Paromomycin', 'Iodoquinol'],
    geographic_distribution: ['Tropical and subtropical regions', 'Areas with poor sanitation'],
    lifecycle: ['Cyst ingestion', 'Excystation', 'Trophozoite invasion', 'Tissue damage']
  },
  {
    name: 'Ascaris lumbricoides',
    scientific_name: 'Ascaris lumbricoides',
    category: 'Soil-transmitted Helminths',
    type: 'Roundworm',
    host: 'Humans',
    transmission: ['Ingestion of eggs', 'Contaminated soil', 'Poor sanitation'],
    symptoms: ['Abdominal pain', 'Cough', 'Shortness of breath', 'Intestinal blockage'],
    description: 'Large roundworm that causes ascariasis, one of the most common parasitic infections worldwide.',
    prevention: ['Proper sanitation', 'Hand washing', 'Safe food practices'],
    treatment: ['Albendazole', 'Mebendazole', 'Ivermectin'],
    geographic_distribution: ['Worldwide', 'More prevalent in tropical regions'],
    lifecycle: ['Egg ingestion', 'Larval migration', 'Lung phase', 'Adult intestinal phase']
  },
  {
    name: 'Trichuris trichiura',
    scientific_name: 'Trichuris trichiura',
    category: 'Soil-transmitted Helminths',
    type: 'Whipworm',
    host: 'Humans',
    transmission: ['Ingestion of eggs', 'Contaminated soil', 'Poor hygiene'],
    symptoms: ['Bloody diarrhea', 'Rectal prolapse', 'Anemia', 'Growth retardation'],
    description: 'Whipworm that causes trichuriasis, particularly affecting children in endemic areas.',
    prevention: ['Improved sanitation', 'Hand hygiene', 'Safe water'],
    treatment: ['Mebendazole', 'Albendazole', 'Ivermectin'],
    geographic_distribution: ['Tropical and subtropical regions', 'Areas with poor sanitation'],
    lifecycle: ['Egg ingestion', 'Larval development', 'Adult attachment to colon']
  },
  {
    name: 'Hookworm (Necator americanus)',
    scientific_name: 'Necator americanus',
    category: 'Soil-transmitted Helminths', 
    type: 'Hookworm',
    host: 'Humans',
    transmission: ['Skin penetration', 'Walking barefoot', 'Contaminated soil'],
    symptoms: ['Iron deficiency anemia', 'Abdominal pain', 'Diarrhea', 'Fatigue'],
    description: 'Blood-feeding hookworm that causes significant anemia and nutritional deficiency.',
    prevention: ['Wearing shoes', 'Improved sanitation', 'Mass drug administration'],
    treatment: ['Albendazole', 'Mebendazole', 'Iron supplementation'],
    geographic_distribution: ['Tropical and subtropical regions', 'Rural areas'],
    lifecycle: ['Skin penetration', 'Lung migration', 'Intestinal maturation', 'Blood feeding']
  },
  {
    name: 'Taenia solium',
    scientific_name: 'Taenia solium',
    category: 'Tapeworms',
    type: 'Pork tapeworm',
    host: 'Humans (definitive), Pigs (intermediate)',
    transmission: ['Undercooked pork', 'Fecal-oral contamination', 'Cysticercosis'],
    symptoms: ['Abdominal discomfort', 'Seizures', 'Neurological symptoms', 'Cysts in tissues'],
    description: 'Pork tapeworm that can cause both intestinal infection and dangerous cysticercosis.',
    prevention: ['Proper meat cooking', 'Good hygiene', 'Sanitation improvements'],
    treatment: ['Praziquantel', 'Niclosamide', 'Surgical removal for cysts'],
    geographic_distribution: ['Latin America', 'Asia', 'Sub-Saharan Africa'],
    lifecycle: ['Egg ingestion', 'Cysticercus development', 'Adult tapeworm formation']
  },
  {
    name: 'Plasmodium falciparum',
    scientific_name: 'Plasmodium falciparum',
    category: 'Blood Parasites',
    type: 'Malaria parasite',
    host: 'Humans',
    transmission: ['Mosquito bites', 'Anopheles mosquitoes', 'Blood transfusion'],
    symptoms: ['Fever', 'Chills', 'Headache', 'Severe anemia', 'Organ failure'],
    description: 'Most dangerous malaria parasite causing severe and potentially fatal malaria.',
    prevention: ['Mosquito control', 'Bed nets', 'Antimalarial prophylaxis'],
    treatment: ['Artemisinin combination therapy', 'Severe malaria protocols'],
    geographic_distribution: ['Sub-Saharan Africa', 'Southeast Asia', 'South America'],
    lifecycle: ['Mosquito bite', 'Liver stage', 'Blood stage', 'Sexual stage']
  },
  {
    name: 'Toxoplasma gondii',
    scientific_name: 'Toxoplasma gondii',
    category: 'Tissue Parasites',
    type: 'Protozoan',
    host: 'Cats (definitive), Many mammals (intermediate)',
    transmission: ['Cat feces', 'Undercooked meat', 'Contaminated water'],
    symptoms: ['Flu-like symptoms', 'Lymph node swelling', 'Eye problems', 'Brain infections'],
    description: 'Common parasite that can cause serious illness in immunocompromised individuals and pregnant women.',
    prevention: ['Cat litter precautions', 'Proper meat cooking', 'Hand hygiene'],
    treatment: ['Sulfadiazine', 'Pyrimethamine', 'Leucovorin'],
    geographic_distribution: ['Worldwide', 'Higher prevalence in some regions'],
    lifecycle: ['Oocyst ingestion', 'Tissue cyst formation', 'Sexual reproduction in cats']
  },
  {
    name: 'Schistosoma mansoni',
    scientific_name: 'Schistosoma mansoni',
    category: 'Blood Flukes',
    type: 'Trematode',
    host: 'Humans',
    transmission: ['Freshwater contact', 'Snail intermediate host', 'Skin penetration'],
    symptoms: ['Blood in urine/stool', 'Abdominal pain', 'Liver damage', 'Kidney problems'],
    description: 'Blood fluke that causes schistosomiasis, a major tropical disease affecting millions.',
    prevention: ['Avoid contaminated water', 'Snail control', 'Mass drug administration'],
    treatment: ['Praziquantel', 'Supportive care for complications'],
    geographic_distribution: ['Africa', 'Middle East', 'Brazil', 'Caribbean'],
    lifecycle: ['Water penetration', 'Vascular migration', 'Egg production', 'Snail development']
  }
];