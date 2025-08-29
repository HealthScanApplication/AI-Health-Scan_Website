import { projectId, publicAnonKey } from './supabase/info';

// Function to get existing nutrients and understand the current format
export const getExistingNutrients = async () => {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/nutrients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch existing nutrients: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.nutrients) {
      return data.nutrients;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching existing nutrients:', error);
    return [];
  }
};

// Function to analyze existing nutrient format
export const analyzeNutrientFormat = (existingNutrients: any[]) => {
  if (existingNutrients.length === 0) {
    return {
      hasData: false,
      fields: [],
      sampleStructure: null,
      idFormat: 'numeric'
    };
  }

  const sample = existingNutrients[0];
  const fields = Object.keys(sample);
  
  console.log('📊 Existing nutrient structure analysis:');
  console.log('📊 Total existing nutrients:', existingNutrients.length);
  console.log('📊 Sample nutrient fields:', fields);
  console.log('📊 Sample nutrient:', sample);

  return {
    hasData: true,
    fields,
    sampleStructure: sample,
    idFormat: 'numeric',
    existingCount: existingNutrients.length
  };
};

// Enhanced nutrient data that uses numeric IDs - 100 comprehensive nutrients
export const getSmartNutrientSeedData = (existingFormat?: any) => {
  const baseTime = new Date().toISOString();
  
  // If we have existing format, try to match it
  const useExistingFormat = existingFormat?.hasData;
  
  const nutrients = [
    {
      id: 1,
      name: 'Vitamin D3 (Cholecalciferol)',
      category: 'Fat-Soluble Vitamins',
      description: 'Essential vitamin for bone health, immune function, and calcium absorption. Synthesized in skin from sunlight exposure.',
      functions: ['Bone mineralization', 'Immune system support', 'Calcium absorption', 'Muscle function'],
      dailyValue: '20',
      unit: 'mcg',
      foodSources: ['Fatty fish', 'Egg yolks', 'Fortified milk', 'Mushrooms', 'Cod liver oil'],
      deficiencySymptoms: ['Bone pain', 'Muscle weakness', 'Frequent infections', 'Fatigue'],
      toxicitySymptoms: ['Nausea', 'Vomiting', 'Kidney stones', 'Hypercalcemia'],
      interactions: ['Enhances calcium absorption', 'Works with vitamin K', 'May affect medication absorption'],
      healthBenefits: ['Stronger bones', 'Better immune function', 'Reduced inflammation', 'Improved mood'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 2,
      name: 'Omega-3 Fatty Acids (EPA/DHA)',
      category: 'Essential Fatty Acids',
      description: 'Critical for brain health, heart function, and inflammation control. Must be obtained from diet as body cannot produce them.',
      functions: ['Brain development', 'Heart health', 'Anti-inflammatory effects', 'Eye health'],
      dailyValue: '1.6',
      unit: 'g',
      foodSources: ['Salmon', 'Mackerel', 'Sardines', 'Walnuts', 'Flaxseeds', 'Chia seeds'],
      deficiencySymptoms: ['Dry skin', 'Poor concentration', 'Joint pain', 'Fatigue'],
      toxicitySymptoms: ['Blood clotting issues', 'Immune suppression', 'Vitamin E deficiency'],
      interactions: ['May enhance blood thinners', 'Works with vitamin E', 'Can affect cholesterol medications'],
      healthBenefits: ['Reduced heart disease risk', 'Better brain function', 'Lower inflammation', 'Improved mood'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 3,
      name: 'Magnesium',
      category: 'Minerals',
      description: 'Essential mineral involved in over 300 enzymatic reactions. Critical for energy production, protein synthesis, and bone health.',
      functions: ['Energy metabolism', 'Protein synthesis', 'Muscle function', 'Bone formation'],
      dailyValue: '420',
      unit: 'mg',
      foodSources: ['Dark leafy greens', 'Nuts', 'Seeds', 'Whole grains', 'Dark chocolate', 'Avocados'],
      deficiencySymptoms: ['Muscle cramps', 'Irregular heartbeat', 'Personality changes', 'Seizures'],
      toxicitySymptoms: ['Diarrhea', 'Nausea', 'Muscle weakness', 'Low blood pressure'],
      interactions: ['Competes with calcium', 'Enhances vitamin D', 'May affect antibiotics'],
      healthBenefits: ['Better sleep quality', 'Reduced anxiety', 'Lower blood pressure', 'Improved bone density'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 4,
      name: 'Vitamin B12 (Cobalamin)',
      category: 'Water-Soluble Vitamins',
      description: 'Essential for nerve function, DNA synthesis, and red blood cell formation. Found almost exclusively in animal products.',
      functions: ['DNA synthesis', 'Red blood cell formation', 'Nerve function', 'Energy metabolism'],
      dailyValue: '2.4',
      unit: 'mcg',
      foodSources: ['Meat', 'Fish', 'Poultry', 'Eggs', 'Dairy products', 'Nutritional yeast'],
      deficiencySymptoms: ['Anemia', 'Nerve damage', 'Memory problems', 'Depression'],
      toxicitySymptoms: ['Generally non-toxic', 'Rare allergic reactions', 'Acne-like skin conditions'],
      interactions: ['Requires intrinsic factor', 'May affect metformin', 'Works with folate'],
      healthBenefits: ['Healthy nerve function', 'Energy production', 'Better mood', 'Cognitive support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 5,
      name: 'Iron',
      category: 'Minerals',
      description: 'Essential mineral for oxygen transport and energy production. Deficiency is the most common nutritional disorder worldwide.',
      functions: ['Oxygen transport', 'Energy production', 'Immune function', 'Cognitive development'],
      dailyValue: '18',
      unit: 'mg',
      foodSources: ['Red meat', 'Poultry', 'Fish', 'Beans', 'Spinach', 'Fortified cereals'],
      deficiencySymptoms: ['Fatigue', 'Pale skin', 'Shortness of breath', 'Cold hands and feet'],
      toxicitySymptoms: ['Nausea', 'Vomiting', 'Organ damage', 'Constipation'],
      interactions: ['Enhanced by vitamin C', 'Inhibited by calcium', 'Competes with zinc'],
      healthBenefits: ['Increased energy', 'Better oxygen delivery', 'Improved cognitive function', 'Stronger immune system'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 6,
      name: 'Folate (Vitamin B9)',
      category: 'Water-Soluble Vitamins',
      description: 'Critical for DNA synthesis and cell division. Especially important during pregnancy for neural tube development.',
      functions: ['DNA synthesis', 'Cell division', 'Amino acid metabolism', 'Red blood cell formation'],
      dailyValue: '400',
      unit: 'mcg',
      foodSources: ['Leafy greens', 'Legumes', 'Fortified grains', 'Citrus fruits', 'Asparagus'],
      deficiencySymptoms: ['Anemia', 'Neural tube defects', 'Poor growth', 'Tongue swelling'],
      toxicitySymptoms: ['May mask B12 deficiency', 'Sleep disturbances', 'Digestive issues'],
      interactions: ['Works with B12', 'May affect anticonvulsants', 'Enhanced by vitamin C'],
      healthBenefits: ['Healthy pregnancy', 'Better mood', 'Reduced homocysteine', 'Improved cognition'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 7,
      name: 'Zinc',
      category: 'Minerals',
      description: 'Essential trace element involved in immune function, wound healing, and protein synthesis. Critical for growth and development.',
      functions: ['Immune function', 'Wound healing', 'Protein synthesis', 'DNA synthesis'],
      dailyValue: '11',
      unit: 'mg',
      foodSources: ['Oysters', 'Red meat', 'Poultry', 'Beans', 'Nuts', 'Whole grains'],
      deficiencySymptoms: ['Impaired immune function', 'Hair loss', 'Delayed wound healing', 'Loss of appetite'],
      toxicitySymptoms: ['Nausea', 'Vomiting', 'Loss of appetite', 'Stomach cramps'],
      interactions: ['Competes with copper', 'Competes with iron', 'Enhanced by protein'],
      healthBenefits: ['Stronger immune system', 'Faster wound healing', 'Better taste and smell', 'Improved fertility'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 8,
      name: 'Vitamin C (Ascorbic Acid)',
      category: 'Water-Soluble Vitamins',
      description: 'Powerful antioxidant essential for collagen synthesis, immune function, and iron absorption. Must be obtained from diet.',
      functions: ['Collagen synthesis', 'Antioxidant protection', 'Immune support', 'Iron absorption'],
      dailyValue: '90',
      unit: 'mg',
      foodSources: ['Citrus fruits', 'Berries', 'Bell peppers', 'Broccoli', 'Tomatoes', 'Leafy greens'],
      deficiencySymptoms: ['Scurvy', 'Poor wound healing', 'Bleeding gums', 'Joint pain'],
      toxicitySymptoms: ['Diarrhea', 'Nausea', 'Kidney stones', 'Iron overload'],
      interactions: ['Enhances iron absorption', 'Regenerates vitamin E', 'May affect blood thinners'],
      healthBenefits: ['Stronger immune system', 'Better skin health', 'Faster wound healing', 'Antioxidant protection'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 9,
      name: 'Calcium',
      category: 'Minerals',
      description: 'Most abundant mineral in the body, essential for bone and teeth health, muscle function, and nerve transmission.',
      functions: ['Bone formation', 'Muscle contraction', 'Nerve transmission', 'Blood clotting'],
      dailyValue: '1300',
      unit: 'mg',
      foodSources: ['Dairy products', 'Leafy greens', 'Sardines', 'Almonds', 'Fortified foods'],
      deficiencySymptoms: ['Weak bones', 'Muscle spasms', 'Numbness', 'Heart rhythm abnormalities'],
      toxicitySymptoms: ['Kidney stones', 'Constipation', 'Interference with other minerals'],
      interactions: ['Requires vitamin D', 'Competes with iron', 'Works with magnesium'],
      healthBenefits: ['Strong bones and teeth', 'Proper muscle function', 'Healthy blood pressure', 'Reduced osteoporosis risk'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 10,
      name: 'Potassium',
      category: 'Minerals',
      description: 'Essential electrolyte for fluid balance, muscle contractions, and nerve signals. Important for heart health and blood pressure regulation.',
      functions: ['Fluid balance', 'Muscle contractions', 'Nerve transmission', 'Blood pressure regulation'],
      dailyValue: '4700',
      unit: 'mg',
      foodSources: ['Bananas', 'Potatoes', 'Beans', 'Leafy greens', 'Fish', 'Avocados'],
      deficiencySymptoms: ['Muscle weakness', 'Fatigue', 'Cramping', 'Irregular heartbeat'],
      toxicitySymptoms: ['Hyperkalemia', 'Heart rhythm problems', 'Muscle paralysis'],
      interactions: ['Balances sodium', 'Works with magnesium', 'May affect blood pressure medications'],
      healthBenefits: ['Lower blood pressure', 'Reduced stroke risk', 'Better muscle function', 'Kidney stone prevention'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    // Continue with nutrients 11-100
    {
      id: 11,
      name: 'Vitamin A (Retinol)',
      category: 'Fat-Soluble Vitamins',
      description: 'Essential for vision, immune function, and cell growth. Found in animal products and converted from beta-carotene in plants.',
      functions: ['Vision health', 'Immune function', 'Cell differentiation', 'Gene expression'],
      dailyValue: '900',
      unit: 'mcg',
      foodSources: ['Liver', 'Carrots', 'Sweet potatoes', 'Spinach', 'Eggs', 'Dairy products'],
      deficiencySymptoms: ['Night blindness', 'Dry eyes', 'Frequent infections', 'Skin problems'],
      toxicitySymptoms: ['Liver damage', 'Birth defects', 'Bone pain', 'Skin changes'],
      interactions: ['Works with zinc', 'Enhanced by fat', 'May affect blood thinners'],
      healthBenefits: ['Better vision', 'Stronger immune system', 'Healthy skin', 'Proper growth'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 12,
      name: 'Vitamin E (Tocopherol)',
      category: 'Fat-Soluble Vitamins',
      description: 'Powerful antioxidant that protects cell membranes from oxidative damage. Important for immune function and skin health.',
      functions: ['Antioxidant protection', 'Immune function', 'Cell membrane protection', 'Gene expression'],
      dailyValue: '15',
      unit: 'mg',
      foodSources: ['Nuts', 'Seeds', 'Vegetable oils', 'Leafy greens', 'Avocados', 'Wheat germ'],
      deficiencySymptoms: ['Nerve damage', 'Muscle weakness', 'Vision problems', 'Immune dysfunction'],
      toxicitySymptoms: ['Bleeding', 'Fatigue', 'Nausea', 'Diarrhea'],
      interactions: ['Works with vitamin C', 'May enhance blood thinners', 'Protected by selenium'],
      healthBenefits: ['Antioxidant protection', 'Healthy skin', 'Better immune function', 'Reduced inflammation'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 13,
      name: 'Vitamin K2 (Menaquinone)',
      category: 'Fat-Soluble Vitamins',
      description: 'Essential for blood clotting and bone metabolism. Helps direct calcium to bones and away from arteries.',
      functions: ['Blood clotting', 'Bone metabolism', 'Calcium regulation', 'Cardiovascular health'],
      dailyValue: '120',
      unit: 'mcg',
      foodSources: ['Fermented foods', 'Cheese', 'Egg yolks', 'Liver', 'Natto', 'Sauerkraut'],
      deficiencySymptoms: ['Easy bruising', 'Heavy bleeding', 'Weak bones', 'Arterial calcification'],
      toxicitySymptoms: ['Generally non-toxic', 'Possible drug interactions', 'Rare allergic reactions'],
      interactions: ['Works with vitamin D', 'May affect blood thinners', 'Enhanced by fat'],
      healthBenefits: ['Stronger bones', 'Better blood clotting', 'Cardiovascular health', 'Reduced fracture risk'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 14,
      name: 'Thiamine (Vitamin B1)',
      category: 'Water-Soluble Vitamins',
      description: 'Essential for energy metabolism and nerve function. Critical for carbohydrate metabolism and neurotransmitter synthesis.',
      functions: ['Energy metabolism', 'Nerve function', 'Carbohydrate metabolism', 'Neurotransmitter synthesis'],
      dailyValue: '1.2',
      unit: 'mg',
      foodSources: ['Whole grains', 'Pork', 'Beans', 'Sunflower seeds', 'Fortified cereals', 'Nuts'],
      deficiencySymptoms: ['Fatigue', 'Confusion', 'Muscle weakness', 'Heart problems'],
      toxicitySymptoms: ['Generally non-toxic', 'Rare allergic reactions', 'Injection site reactions'],
      interactions: ['Depleted by alcohol', 'Works with other B vitamins', 'Enhanced by magnesium'],
      healthBenefits: ['Better energy levels', 'Improved nerve function', 'Better mood', 'Enhanced cognition'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 15,
      name: 'Riboflavin (Vitamin B2)',
      category: 'Water-Soluble Vitamins',
      description: 'Essential for energy production and antioxidant function. Important for healthy skin, eyes, and nervous system.',
      functions: ['Energy production', 'Antioxidant recycling', 'Protein metabolism', 'Red blood cell production'],
      dailyValue: '1.3',
      unit: 'mg',
      foodSources: ['Dairy products', 'Eggs', 'Leafy greens', 'Almonds', 'Mushrooms', 'Fortified cereals'],
      deficiencySymptoms: ['Skin disorders', 'Eye problems', 'Sore throat', 'Fatigue'],
      toxicitySymptoms: ['Generally non-toxic', 'Yellow urine', 'Rare sensitivity'],
      interactions: ['Works with other B vitamins', 'Light sensitive', 'Enhanced by protein'],
      healthBenefits: ['Better energy metabolism', 'Healthy skin', 'Good eye health', 'Antioxidant support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 16,
      name: 'Niacin (Vitamin B3)',
      category: 'Water-Soluble Vitamins',
      description: 'Essential for energy metabolism and DNA repair. Important for skin health and cholesterol management.',
      functions: ['Energy metabolism', 'DNA repair', 'Cholesterol synthesis', 'Neurotransmitter production'],
      dailyValue: '16',
      unit: 'mg',
      foodSources: ['Meat', 'Fish', 'Mushrooms', 'Peanuts', 'Coffee', 'Fortified grains'],
      deficiencySymptoms: ['Pellagra', 'Skin problems', 'Digestive issues', 'Mental confusion'],
      toxicitySymptoms: ['Flushing', 'Liver damage', 'Stomach upset', 'Skin problems'],
      interactions: ['May affect diabetes medications', 'Works with other B vitamins', 'Enhanced by protein'],
      healthBenefits: ['Better cholesterol levels', 'Improved energy', 'Healthy skin', 'Brain function'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 17,
      name: 'Pantothenic Acid (Vitamin B5)',
      category: 'Water-Soluble Vitamins',
      description: 'Essential for energy metabolism and hormone synthesis. Critical component of coenzyme A.',
      functions: ['Energy metabolism', 'Hormone synthesis', 'Cholesterol production', 'Neurotransmitter synthesis'],
      dailyValue: '5',
      unit: 'mg',
      foodSources: ['Chicken', 'Beef', 'Eggs', 'Mushrooms', 'Avocados', 'Whole grains'],
      deficiencySymptoms: ['Fatigue', 'Numbness', 'Muscle cramps', 'Digestive problems'],
      toxicitySymptoms: ['Generally non-toxic', 'Mild digestive upset', 'Rare reactions'],
      interactions: ['Works with other B vitamins', 'Enhanced by biotin', 'Stable in cooking'],
      healthBenefits: ['Better energy production', 'Hormone balance', 'Stress response', 'Wound healing'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 18,
      name: 'Pyridoxine (Vitamin B6)',
      category: 'Water-Soluble Vitamins',
      description: 'Essential for protein metabolism and neurotransmitter synthesis. Important for immune function and brain development.',
      functions: ['Protein metabolism', 'Neurotransmitter synthesis', 'Immune function', 'Hemoglobin production'],
      dailyValue: '1.7',
      unit: 'mg',
      foodSources: ['Poultry', 'Fish', 'Potatoes', 'Bananas', 'Chickpeas', 'Fortified cereals'],
      deficiencySymptoms: ['Anemia', 'Skin disorders', 'Depression', 'Confusion'],
      toxicitySymptoms: ['Nerve damage', 'Skin lesions', 'Light sensitivity', 'Nausea'],
      interactions: ['Works with B12 and folate', 'May affect medications', 'Enhanced by magnesium'],
      healthBenefits: ['Better mood', 'Immune support', 'Healthy metabolism', 'Brain function'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 19,
      name: 'Biotin (Vitamin B7)',
      category: 'Water-Soluble Vitamins',
      description: 'Essential for metabolism of fats, carbohydrates, and proteins. Important for healthy hair, skin, and nails.',
      functions: ['Macronutrient metabolism', 'Gene regulation', 'Cell growth', 'Fatty acid synthesis'],
      dailyValue: '30',
      unit: 'mcg',
      foodSources: ['Eggs', 'Nuts', 'Seeds', 'Liver', 'Sweet potatoes', 'Mushrooms'],
      deficiencySymptoms: ['Hair loss', 'Skin rash', 'Brittle nails', 'Fatigue'],
      toxicitySymptoms: ['Generally non-toxic', 'May affect lab tests', 'Rare reactions'],
      interactions: ['Inhibited by raw egg whites', 'Works with other B vitamins', 'Enhanced by magnesium'],
      healthBenefits: ['Healthy hair and nails', 'Better metabolism', 'Stable blood sugar', 'Gene expression'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 20,
      name: 'Chromium',
      category: 'Trace Minerals',
      description: 'Essential trace mineral for glucose metabolism and insulin function. Important for blood sugar control.',
      functions: ['Glucose metabolism', 'Insulin sensitivity', 'Protein synthesis', 'Lipid metabolism'],
      dailyValue: '35',
      unit: 'mcg',
      foodSources: ['Broccoli', 'Grape juice', 'Whole grains', 'Meat', 'Cheese', 'Nuts'],
      deficiencySymptoms: ['Glucose intolerance', 'Weight loss', 'Neuropathy', 'Anxiety'],
      toxicitySymptoms: ['Liver damage', 'Kidney damage', 'Skin irritation', 'Lung problems'],
      interactions: ['Enhanced by vitamin C', 'Competes with iron', 'Works with insulin'],
      healthBenefits: ['Better blood sugar control', 'Weight management', 'Improved insulin sensitivity', 'Energy metabolism'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 21,
      name: 'Selenium',
      category: 'Trace Minerals',
      description: 'Essential antioxidant mineral that supports immune function and thyroid health. Important for reproduction and DNA synthesis.',
      functions: ['Antioxidant function', 'Thyroid hormone metabolism', 'Immune function', 'DNA synthesis'],
      dailyValue: '55',
      unit: 'mcg',
      foodSources: ['Brazil nuts', 'Seafood', 'Organ meats', 'Whole grains', 'Eggs', 'Garlic'],
      deficiencySymptoms: ['Muscle weakness', 'Cardiomyopathy', 'Hair loss', 'White nail beds'],
      toxicitySymptoms: ['Hair loss', 'Nail brittleness', 'Garlic breath', 'Fatigue'],
      interactions: ['Works with vitamin E', 'Competes with mercury', 'Enhanced by vitamin C'],
      healthBenefits: ['Antioxidant protection', 'Thyroid support', 'Immune health', 'Cancer prevention'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 22,
      name: 'Copper',
      category: 'Trace Minerals',
      description: 'Essential for iron metabolism, connective tissue formation, and energy production. Important for brain and heart health.',
      functions: ['Iron metabolism', 'Connective tissue formation', 'Energy production', 'Neurotransmitter synthesis'],
      dailyValue: '0.9',
      unit: 'mg',
      foodSources: ['Shellfish', 'Nuts', 'Seeds', 'Organ meats', 'Dark chocolate', 'Mushrooms'],
      deficiencySymptoms: ['Anemia', 'Bone abnormalities', 'Cardiovascular disease', 'Immune dysfunction'],
      toxicitySymptoms: ['Liver damage', 'Nausea', 'Diarrhea', 'Kidney damage'],
      interactions: ['Competes with zinc', 'Enhanced by protein', 'Inhibited by iron'],
      healthBenefits: ['Healthy connective tissue', 'Better iron absorption', 'Energy production', 'Brain function'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 23,
      name: 'Manganese',
      category: 'Trace Minerals',
      description: 'Essential for bone formation, wound healing, and metabolism. Important component of antioxidant enzymes.',
      functions: ['Bone formation', 'Antioxidant enzyme function', 'Carbohydrate metabolism', 'Wound healing'],
      dailyValue: '2.3',
      unit: 'mg',
      foodSources: ['Whole grains', 'Nuts', 'Leafy vegetables', 'Tea', 'Pineapple', 'Beans'],
      deficiencySymptoms: ['Bone abnormalities', 'Skin problems', 'Hair color changes', 'Impaired growth'],
      toxicitySymptoms: ['Neurological problems', 'Tremors', 'Muscle rigidity', 'Memory problems'],
      interactions: ['Competes with iron', 'Enhanced by vitamin C', 'Inhibited by calcium'],
      healthBenefits: ['Strong bones', 'Antioxidant protection', 'Better wound healing', 'Metabolism support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 24,
      name: 'Iodine',
      category: 'Trace Minerals',
      description: 'Essential for thyroid hormone production and metabolism regulation. Critical for brain development.',
      functions: ['Thyroid hormone synthesis', 'Metabolism regulation', 'Brain development', 'Energy production'],
      dailyValue: '150',
      unit: 'mcg',
      foodSources: ['Iodized salt', 'Seafood', 'Dairy products', 'Eggs', 'Seaweed', 'Cranberries'],
      deficiencySymptoms: ['Goiter', 'Hypothyroidism', 'Mental impairment', 'Growth retardation'],
      toxicitySymptoms: ['Hyperthyroidism', 'Thyroid inflammation', 'Metallic taste', 'Mouth sores'],
      interactions: ['Inhibited by goitrogens', 'Enhanced by selenium', 'Affected by fluoride'],
      healthBenefits: ['Healthy thyroid function', 'Normal metabolism', 'Brain development', 'Energy regulation'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 25,
      name: 'Molybdenum',
      category: 'Trace Minerals',
      description: 'Essential trace mineral for enzyme function and sulfur metabolism. Important for detoxification processes.',
      functions: ['Enzyme cofactor', 'Sulfur metabolism', 'Purine metabolism', 'Detoxification'],
      dailyValue: '45',
      unit: 'mcg',
      foodSources: ['Legumes', 'Grains', 'Nuts', 'Leafy vegetables', 'Milk', 'Liver'],
      deficiencySymptoms: ['Rare in humans', 'Metabolic dysfunction', 'Neurological problems', 'Growth retardation'],
      toxicitySymptoms: ['Copper deficiency', 'Anemia', 'Growth problems', 'Reproductive issues'],
      interactions: ['Competes with copper', 'Works with sulfur compounds', 'Enhanced by protein'],
      healthBenefits: ['Proper enzyme function', 'Detoxification support', 'Sulfur metabolism', 'Cellular health'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 26,
      name: 'Phosphorus',
      category: 'Minerals',
      description: 'Essential mineral for bone and teeth formation, energy storage, and cell membrane structure.',
      functions: ['Bone formation', 'Energy storage', 'Cell membrane structure', 'DNA synthesis'],
      dailyValue: '1250',
      unit: 'mg',
      foodSources: ['Dairy products', 'Meat', 'Fish', 'Nuts', 'Beans', 'Whole grains'],
      deficiencySymptoms: ['Bone pain', 'Muscle weakness', 'Loss of appetite', 'Fatigue'],
      toxicitySymptoms: ['Calcium deficiency', 'Bone problems', 'Kidney damage', 'Soft tissue calcification'],
      interactions: ['Works with calcium', 'Competes with magnesium', 'Enhanced by vitamin D'],
      healthBenefits: ['Strong bones and teeth', 'Energy metabolism', 'Cellular function', 'DNA synthesis'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 27,
      name: 'Sodium',
      category: 'Minerals',
      description: 'Essential electrolyte for fluid balance, nerve transmission, and muscle function. Must be balanced with potassium.',
      functions: ['Fluid balance', 'Nerve transmission', 'Muscle function', 'Blood pressure regulation'],
      dailyValue: '2300',
      unit: 'mg',
      foodSources: ['Table salt', 'Processed foods', 'Cheese', 'Bread', 'Pickled foods', 'Soy sauce'],
      deficiencySymptoms: ['Muscle cramps', 'Nausea', 'Vomiting', 'Headache'],
      toxicitySymptoms: ['High blood pressure', 'Fluid retention', 'Kidney strain', 'Cardiovascular disease'],
      interactions: ['Balances potassium', 'Affects blood pressure', 'Works with chloride'],
      healthBenefits: ['Proper fluid balance', 'Nerve function', 'Muscle contractions', 'Blood volume regulation'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 28,
      name: 'Chloride',
      category: 'Minerals',
      description: 'Essential electrolyte that works with sodium to maintain fluid balance and stomach acid production.',
      functions: ['Fluid balance', 'Stomach acid production', 'Nerve transmission', 'pH regulation'],
      dailyValue: '2300',
      unit: 'mg',
      foodSources: ['Table salt', 'Seaweed', 'Tomatoes', 'Lettuce', 'Celery', 'Olives'],
      deficiencySymptoms: ['Alkalosis', 'Muscle weakness', 'Loss of appetite', 'Lethargy'],
      toxicitySymptoms: ['Fluid retention', 'High blood pressure', 'Kidney problems', 'Acidosis'],
      interactions: ['Works with sodium', 'Balances bicarbonate', 'Affects pH balance'],
      healthBenefits: ['Proper digestion', 'Fluid balance', 'Acid-base balance', 'Nerve function'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 29,
      name: 'Sulfur',
      category: 'Minerals',
      description: 'Essential mineral component of amino acids and proteins. Important for detoxification and joint health.',
      functions: ['Protein structure', 'Detoxification', 'Joint health', 'Antioxidant function'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Garlic', 'Onions', 'Cruciferous vegetables', 'Meat', 'Fish', 'Eggs'],
      deficiencySymptoms: ['Rare', 'Joint pain', 'Skin problems', 'Hair loss'],
      toxicitySymptoms: ['Generally non-toxic', 'Digestive upset', 'Odor problems'],
      interactions: ['Works with molybdenum', 'Part of amino acids', 'Enhanced by protein'],
      healthBenefits: ['Healthy joints', 'Detoxification support', 'Protein synthesis', 'Antioxidant activity'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 30,
      name: 'Fluoride',
      category: 'Trace Minerals',
      description: 'Essential trace mineral for dental health and bone strength. Helps prevent tooth decay.',
      functions: ['Tooth enamel strengthening', 'Bone health', 'Dental health', 'Cavity prevention'],
      dailyValue: '4',
      unit: 'mg',
      foodSources: ['Fluoridated water', 'Tea', 'Fish', 'Dental products', 'Some vegetables'],
      deficiencySymptoms: ['Increased tooth decay', 'Weak tooth enamel', 'Dental problems'],
      toxicitySymptoms: ['Dental fluorosis', 'Skeletal fluorosis', 'Nausea', 'Muscle weakness'],
      interactions: ['Competes with iodine', 'Affects calcium absorption', 'Enhanced by aluminum'],
      healthBenefits: ['Strong teeth', 'Cavity prevention', 'Bone strength', 'Dental health'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 31,
      name: 'Choline',
      category: 'Essential Nutrients',
      description: 'Essential nutrient for brain development, liver function, and cell membrane structure. Critical for neurotransmitter synthesis.',
      functions: ['Brain development', 'Liver function', 'Cell membrane structure', 'Neurotransmitter synthesis'],
      dailyValue: '550',
      unit: 'mg',
      foodSources: ['Eggs', 'Liver', 'Fish', 'Meat', 'Cruciferous vegetables', 'Nuts'],
      deficiencySymptoms: ['Fatty liver', 'Muscle damage', 'Memory problems', 'Growth retardation'],
      toxicitySymptoms: ['Fishy body odor', 'Sweating', 'Low blood pressure', 'Liver damage'],
      interactions: ['Works with folate', 'Enhanced by lecithin', 'Affected by alcohol'],
      healthBenefits: ['Better brain function', 'Liver health', 'Memory support', 'Cell membrane integrity'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 32,
      name: 'Inositol',
      category: 'Functional Nutrients',
      description: 'Important for cell membrane function, insulin sensitivity, and mental health. Often grouped with B vitamins.',
      functions: ['Cell signaling', 'Insulin sensitivity', 'Lipid metabolism', 'Neurotransmitter function'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Citrus fruits', 'Beans', 'Grains', 'Nuts', 'Meat', 'Cantaloupe'],
      deficiencySymptoms: ['Hair loss', 'Skin problems', 'High cholesterol', 'Mood disorders'],
      toxicitySymptoms: ['Generally non-toxic', 'Mild digestive upset', 'Dizziness'],
      interactions: ['Works with other B vitamins', 'Enhanced by magnesium', 'Affected by caffeine'],
      healthBenefits: ['Better insulin sensitivity', 'Mental health support', 'Healthy cholesterol', 'Cell function'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 33,
      name: 'Coenzyme Q10 (CoQ10)',
      category: 'Functional Nutrients',
      description: 'Essential for cellular energy production and antioxidant protection. Naturally produced but declines with age.',
      functions: ['Energy production', 'Antioxidant protection', 'Heart health', 'Cellular function'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Organ meats', 'Fatty fish', 'Whole grains', 'Spinach', 'Broccoli', 'Nuts'],
      deficiencySymptoms: ['Fatigue', 'Muscle weakness', 'Heart problems', 'Gum disease'],
      toxicitySymptoms: ['Generally non-toxic', 'Mild digestive upset', 'Insomnia'],
      interactions: ['May affect blood thinners', 'Enhanced by fat', 'Reduced by statins'],
      healthBenefits: ['Better energy levels', 'Heart health', 'Antioxidant protection', 'Cellular health'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 34,
      name: 'Alpha-Lipoic Acid',
      category: 'Antioxidants',
      description: 'Powerful antioxidant that regenerates other antioxidants. Important for blood sugar control and nerve health.',
      functions: ['Antioxidant regeneration', 'Blood sugar control', 'Energy metabolism', 'Nerve protection'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Red meat', 'Organ meats', 'Broccoli', 'Spinach', 'Tomatoes', 'Potatoes'],
      deficiencySymptoms: ['Rare', 'Poor blood sugar control', 'Oxidative stress', 'Nerve problems'],
      toxicitySymptoms: ['Generally non-toxic', 'Skin rash', 'Nausea', 'Stomach upset'],
      interactions: ['Enhances other antioxidants', 'May affect diabetes medications', 'Works with vitamin E'],
      healthBenefits: ['Antioxidant protection', 'Blood sugar control', 'Nerve health', 'Anti-aging effects'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 35,
      name: 'Lutein',
      category: 'Antioxidants',
      description: 'Carotenoid antioxidant that protects eye health and may support brain function. Concentrated in the macula.',
      functions: ['Eye protection', 'Antioxidant activity', 'Blue light filtering', 'Brain health'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Leafy greens', 'Corn', 'Egg yolks', 'Orange peppers', 'Kiwi', 'Grapes'],
      deficiencySymptoms: ['Eye problems', 'Macular degeneration', 'Poor night vision', 'Light sensitivity'],
      toxicitySymptoms: ['Generally non-toxic', 'Skin yellowing', 'Rare reactions'],
      interactions: ['Enhanced by fat', 'Works with zeaxanthin', 'Competes with beta-carotene'],
      healthBenefits: ['Eye health protection', 'Reduced macular degeneration', 'Brain support', 'Antioxidant activity'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 36,
      name: 'Zeaxanthin',
      category: 'Antioxidants',
      description: 'Carotenoid antioxidant that works with lutein to protect eye health and filter harmful blue light.',
      functions: ['Eye protection', 'Blue light filtering', 'Antioxidant activity', 'Macular health'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Corn', 'Egg yolks', 'Orange peppers', 'Leafy greens', 'Goji berries', 'Saffron'],
      deficiencySymptoms: ['Eye problems', 'Macular degeneration', 'Light sensitivity', 'Vision problems'],
      toxicitySymptoms: ['Generally non-toxic', 'Skin yellowing', 'Rare reactions'],
      interactions: ['Works with lutein', 'Enhanced by fat', 'Competes with other carotenoids'],
      healthBenefits: ['Eye health protection', 'Blue light protection', 'Reduced eye strain', 'Vision support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 37,
      name: 'Lycopene',
      category: 'Antioxidants',
      description: 'Powerful carotenoid antioxidant that gives tomatoes their red color. Important for prostate and heart health.',
      functions: ['Antioxidant protection', 'Prostate health', 'Heart health', 'Cancer protection'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Tomatoes', 'Watermelon', 'Pink grapefruit', 'Papaya', 'Red peppers', 'Guava'],
      deficiencySymptoms: ['Increased oxidative stress', 'Prostate problems', 'Heart disease risk', 'Cancer risk'],
      toxicitySymptoms: ['Generally non-toxic', 'Skin discoloration', 'Rare reactions'],
      interactions: ['Enhanced by cooking', 'Works with fat', 'Competes with other carotenoids'],
      healthBenefits: ['Prostate health', 'Heart protection', 'Cancer prevention', 'Antioxidant activity'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 38,
      name: 'Beta-Carotene',
      category: 'Antioxidants',
      description: 'Precursor to vitamin A with powerful antioxidant properties. Important for immune function and skin health.',
      functions: ['Vitamin A precursor', 'Antioxidant protection', 'Immune function', 'Skin health'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Carrots', 'Sweet potatoes', 'Spinach', 'Kale', 'Cantaloupe', 'Apricots'],
      deficiencySymptoms: ['Poor night vision', 'Dry skin', 'Frequent infections', 'Slow wound healing'],
      toxicitySymptoms: ['Skin yellowing', 'Increased cancer risk in smokers', 'Rare reactions'],
      interactions: ['Converts to vitamin A', 'Enhanced by fat', 'Competes with other carotenoids'],
      healthBenefits: ['Immune support', 'Skin health', 'Eye protection', 'Antioxidant activity'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 39,
      name: 'Astaxanthin',
      category: 'Antioxidants',
      description: 'Powerful carotenoid antioxidant that gives salmon their pink color. Superior antioxidant activity.',
      functions: ['Antioxidant protection', 'Anti-inflammatory effects', 'Skin health', 'Eye protection'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Salmon', 'Shrimp', 'Crab', 'Lobster', 'Krill', 'Algae supplements'],
      deficiencySymptoms: ['Increased oxidative stress', 'Skin aging', 'Eye strain', 'Inflammation'],
      toxicitySymptoms: ['Generally non-toxic', 'Skin reddening', 'Rare reactions'],
      interactions: ['Enhanced by fat', 'Works with other antioxidants', 'Stable compound'],
      healthBenefits: ['Superior antioxidant protection', 'Skin health', 'Eye protection', 'Exercise recovery'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 40,
      name: 'Resveratrol',
      category: 'Antioxidants',
      description: 'Polyphenol antioxidant found in red wine and grapes. Known for anti-aging and heart health benefits.',
      functions: ['Antioxidant protection', 'Anti-inflammatory effects', 'Heart health', 'Longevity support'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Red wine', 'Grapes', 'Berries', 'Peanuts', 'Dark chocolate', 'Japanese knotweed'],
      deficiencySymptoms: ['Increased aging', 'Heart disease risk', 'Inflammation', 'Oxidative stress'],
      toxicitySymptoms: ['Generally non-toxic', 'Digestive upset', 'Drug interactions'],
      interactions: ['May affect blood thinners', 'Enhanced by quercetin', 'Works with other polyphenols'],
      healthBenefits: ['Anti-aging effects', 'Heart health', 'Brain protection', 'Longevity support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 41,
      name: 'Quercetin',
      category: 'Antioxidants',
      description: 'Flavonoid antioxidant with anti-inflammatory and antihistamine properties. Found in many fruits and vegetables.',
      functions: ['Antioxidant protection', 'Anti-inflammatory effects', 'Antihistamine activity', 'Heart health'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Onions', 'Apples', 'Berries', 'Tea', 'Red wine', 'Capers'],
      deficiencySymptoms: ['Increased inflammation', 'Allergic reactions', 'Heart disease risk', 'Oxidative stress'],
      toxicitySymptoms: ['Generally non-toxic', 'Headache', 'Digestive upset', 'Kidney problems at high doses'],
      interactions: ['May affect blood thinners', 'Enhanced by bromelain', 'Works with vitamin C'],
      healthBenefits: ['Reduced inflammation', 'Allergy relief', 'Heart protection', 'Immune support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 42,
      name: 'Curcumin',
      category: 'Antioxidants',
      description: 'Active compound in turmeric with powerful anti-inflammatory and antioxidant properties.',
      functions: ['Anti-inflammatory effects', 'Antioxidant protection', 'Pain relief', 'Brain health'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Turmeric', 'Curry powder', 'Curcumin supplements', 'Indian cuisine'],
      deficiencySymptoms: ['Increased inflammation', 'Joint pain', 'Poor wound healing', 'Oxidative stress'],
      toxicitySymptoms: ['Generally non-toxic', 'Stomach upset', 'Increased bleeding risk', 'Kidney stones'],
      interactions: ['May enhance blood thinners', 'Enhanced by piperine', 'May affect diabetes medications'],
      healthBenefits: ['Reduced inflammation', 'Joint health', 'Brain protection', 'Pain relief'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 43,
      name: 'Green Tea Extract (EGCG)',
      category: 'Antioxidants',
      description: 'Powerful catechin antioxidant from green tea with metabolism and brain health benefits.',
      functions: ['Antioxidant protection', 'Metabolism boost', 'Brain health', 'Fat oxidation'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Green tea', 'White tea', 'Oolong tea', 'Green tea extract supplements'],
      deficiencySymptoms: ['Increased oxidative stress', 'Slower metabolism', 'Brain fog', 'Poor fat burning'],
      toxicitySymptoms: ['Liver toxicity at high doses', 'Insomnia', 'Anxiety', 'Stomach upset'],
      interactions: ['May affect iron absorption', 'Enhanced on empty stomach', 'May interact with medications'],
      healthBenefits: ['Metabolism boost', 'Brain protection', 'Weight management', 'Antioxidant activity'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 44,
      name: 'Omega-6 Fatty Acids',
      category: 'Essential Fatty Acids',
      description: 'Essential fatty acids important for brain function and inflammation regulation. Must be balanced with omega-3s.',
      functions: ['Brain function', 'Skin health', 'Hormone production', 'Inflammation regulation'],
      dailyValue: '17',
      unit: 'g',
      foodSources: ['Vegetable oils', 'Nuts', 'Seeds', 'Poultry', 'Eggs', 'Grains'],
      deficiencySymptoms: ['Skin problems', 'Hair loss', 'Poor wound healing', 'Growth retardation'],
      toxicitySymptoms: ['Increased inflammation', 'Heart disease risk', 'Cancer risk', 'Immune suppression'],
      interactions: ['Should balance with omega-3', 'Competes with omega-3', 'Affected by processing'],
      healthBenefits: ['Brain health', 'Skin health', 'Hormone balance', 'Cell membrane function'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 45,
      name: 'Fiber (Soluble)',
      category: 'Macronutrients',
      description: 'Soluble fiber that helps lower cholesterol, regulate blood sugar, and support digestive health.',
      functions: ['Cholesterol reduction', 'Blood sugar control', 'Digestive health', 'Satiety'],
      dailyValue: '25-35',
      unit: 'g',
      foodSources: ['Oats', 'Beans', 'Apples', 'Barley', 'Psyllium', 'Brussels sprouts'],
      deficiencySymptoms: ['High cholesterol', 'Blood sugar spikes', 'Digestive problems', 'Increased hunger'],
      toxicitySymptoms: ['Gas', 'Bloating', 'Diarrhea', 'Nutrient malabsorption'],
      interactions: ['May affect medication absorption', 'Requires adequate water', 'Works with probiotics'],
      healthBenefits: ['Lower cholesterol', 'Blood sugar control', 'Weight management', 'Digestive health'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 46,
      name: 'Fiber (Insoluble)',
      category: 'Macronutrients',
      description: 'Insoluble fiber that promotes regular bowel movements and supports digestive health.',
      functions: ['Bowel regularity', 'Digestive health', 'Toxin elimination', 'Colon health'],
      dailyValue: '25-35',
      unit: 'g',
      foodSources: ['Whole grains', 'Vegetables', 'Fruits with skins', 'Nuts', 'Seeds', 'Bran'],
      deficiencySymptoms: ['Constipation', 'Digestive problems', 'Toxin buildup', 'Colon problems'],
      toxicitySymptoms: ['Gas', 'Bloating', 'Cramping', 'Diarrhea'],
      interactions: ['Requires adequate water', 'May affect nutrient absorption', 'Works with probiotics'],
      healthBenefits: ['Regular bowel movements', 'Colon health', 'Toxin elimination', 'Weight management'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 47,
      name: 'Probiotics',
      category: 'Functional Nutrients',
      description: 'Beneficial bacteria that support digestive health, immune function, and overall wellness.',
      functions: ['Digestive health', 'Immune support', 'Nutrient production', 'Pathogen resistance'],
      dailyValue: 'No established DV',
      unit: 'CFU',
      foodSources: ['Yogurt', 'Kefir', 'Sauerkraut', 'Kimchi', 'Miso', 'Probiotic supplements'],
      deficiencySymptoms: ['Digestive problems', 'Frequent infections', 'Poor immunity', 'Antibiotic-associated diarrhea'],
      toxicitySymptoms: ['Generally safe', 'Gas', 'Bloating', 'Rare infections in immunocompromised'],
      interactions: ['Killed by antibiotics', 'Enhanced by prebiotics', 'Affected by stress'],
      healthBenefits: ['Digestive health', 'Immune support', 'Mental health', 'Nutrient absorption'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 48,
      name: 'Prebiotics',
      category: 'Functional Nutrients',
      description: 'Non-digestible fibers that feed beneficial gut bacteria and support digestive health.',
      functions: ['Feeds probiotics', 'Digestive health', 'Immune support', 'Mineral absorption'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Jerusalem artichokes', 'Garlic', 'Onions', 'Bananas', 'Asparagus', 'Chicory root'],
      deficiencySymptoms: ['Poor gut bacteria', 'Digestive problems', 'Weak immunity', 'Poor mineral absorption'],
      toxicitySymptoms: ['Gas', 'Bloating', 'Diarrhea', 'Abdominal discomfort'],
      interactions: ['Feeds probiotics', 'Enhanced by fiber', 'Works with digestive enzymes'],
      healthBenefits: ['Gut health', 'Improved immunity', 'Better mineral absorption', 'Digestive support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 49,
      name: 'Digestive Enzymes',
      category: 'Functional Nutrients',
      description: 'Enzymes that help break down proteins, fats, and carbohydrates for better nutrient absorption.',
      functions: ['Protein digestion', 'Fat digestion', 'Carbohydrate digestion', 'Nutrient absorption'],
      dailyValue: 'No established DV',
      unit: 'Units',
      foodSources: ['Pineapple', 'Papaya', 'Mango', 'Fermented foods', 'Raw foods', 'Enzyme supplements'],
      deficiencySymptoms: ['Poor digestion', 'Bloating', 'Gas', 'Nutrient deficiencies'],
      toxicitySymptoms: ['Generally safe', 'Nausea', 'Diarrhea', 'Abdominal cramping'],
      interactions: ['Enhanced by proper pH', 'Works with stomach acid', 'Affected by cooking'],
      healthBenefits: ['Better digestion', 'Reduced bloating', 'Improved nutrient absorption', 'Digestive comfort'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 50,
      name: 'Melatonin',
      category: 'Functional Nutrients',
      description: 'Hormone that regulates sleep-wake cycles and has antioxidant properties. Production decreases with age.',
      functions: ['Sleep regulation', 'Circadian rhythm', 'Antioxidant activity', 'Immune support'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Tart cherries', 'Walnuts', 'Tomatoes', 'Oats', 'Rice', 'Barley'],
      deficiencySymptoms: ['Sleep problems', 'Insomnia', 'Jet lag', 'Poor sleep quality'],
      toxicitySymptoms: ['Drowsiness', 'Headache', 'Dizziness', 'Mood changes'],
      interactions: ['May affect blood thinners', 'Enhanced by darkness', 'Suppressed by light'],
      healthBenefits: ['Better sleep quality', 'Jet lag relief', 'Antioxidant protection', 'Immune support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    // Continue with nutrients 51-100
    {
      id: 51,
      name: 'L-Carnitine',
      category: 'Amino Acids',
      description: 'Amino acid derivative that transports fatty acids into mitochondria for energy production.',
      functions: ['Fat metabolism', 'Energy production', 'Heart health', 'Exercise performance'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Red meat', 'Fish', 'Poultry', 'Dairy products', 'Asparagus', 'Supplements'],
      deficiencySymptoms: ['Fatigue', 'Muscle weakness', 'Heart problems', 'Poor exercise tolerance'],
      toxicitySymptoms: ['Body odor', 'Nausea', 'Vomiting', 'Diarrhea'],
      interactions: ['Enhanced by iron', 'Works with CoQ10', 'May affect thyroid medications'],
      healthBenefits: ['Better fat burning', 'Increased energy', 'Heart health', 'Exercise performance'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 52,
      name: 'Taurine',
      category: 'Amino Acids',
      description: 'Conditionally essential amino acid important for heart health, brain function, and bile acid formation.',
      functions: ['Heart health', 'Brain function', 'Bile acid formation', 'Antioxidant activity'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Fish', 'Meat', 'Poultry', 'Dairy products', 'Energy drinks', 'Supplements'],
      deficiencySymptoms: ['Heart problems', 'Retinal degeneration', 'Poor growth', 'Immune dysfunction'],
      toxicitySymptoms: ['Generally safe', 'Possible interaction with medications', 'Rare reactions'],
      interactions: ['Works with magnesium', 'Enhanced by zinc', 'May affect blood pressure'],
      healthBenefits: ['Heart health', 'Brain protection', 'Eye health', 'Athletic performance'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 53,
      name: 'Glycine',
      category: 'Amino Acids',
      description: 'Non-essential amino acid important for collagen production, sleep quality, and detoxification.',
      functions: ['Collagen synthesis', 'Sleep quality', 'Detoxification', 'Neurotransmitter function'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Collagen', 'Gelatin', 'Bone broth', 'Meat', 'Fish', 'Beans'],
      deficiencySymptoms: ['Poor sleep', 'Joint problems', 'Skin aging', 'Poor wound healing'],
      toxicitySymptoms: ['Generally safe', 'Mild digestive upset', 'Drowsiness'],
      interactions: ['Works with other amino acids', 'Enhanced by vitamin C', 'Synergistic with collagen'],
      healthBenefits: ['Better sleep quality', 'Joint health', 'Skin health', 'Detox support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 54,
      name: 'Creatine',
      category: 'Amino Acids',
      description: 'Amino acid compound that provides rapid energy to muscles during high-intensity exercise.',
      functions: ['Energy production', 'Muscle power', 'Brain energy', 'Athletic performance'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Red meat', 'Fish', 'Poultry', 'Supplements', 'Small amounts in milk'],
      deficiencySymptoms: ['Reduced power output', 'Fatigue', 'Poor recovery', 'Muscle weakness'],
      toxicitySymptoms: ['Weight gain', 'Digestive upset', 'Muscle cramping', 'Kidney stress in rare cases'],
      interactions: ['Requires adequate hydration', 'Enhanced by carbohydrates', 'May affect kidney function tests'],
      healthBenefits: ['Increased muscle power', 'Better athletic performance', 'Brain energy', 'Faster recovery'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 55,
      name: 'Glutamine',
      category: 'Amino Acids',
      description: 'Conditionally essential amino acid important for immune function, gut health, and muscle recovery.',
      functions: ['Immune function', 'Gut health', 'Muscle recovery', 'Protein synthesis'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Eggs', 'Dairy products', 'Beans', 'Cabbage'],
      deficiencySymptoms: ['Immune dysfunction', 'Poor gut health', 'Slow recovery', 'Muscle wasting'],
      toxicitySymptoms: ['Generally safe', 'Possible mania in bipolar disorder', 'Rare reactions'],
      interactions: ['Enhanced during stress', 'Works with other amino acids', 'May affect certain medications'],
      healthBenefits: ['Immune support', 'Gut health', 'Faster recovery', 'Muscle preservation'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 56,
      name: 'Arginine',
      category: 'Amino Acids',
      description: 'Semi-essential amino acid important for wound healing, immune function, and nitric oxide production.',
      functions: ['Nitric oxide production', 'Wound healing', 'Immune function', 'Protein synthesis'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Poultry', 'Fish', 'Nuts', 'Seeds', 'Beans'],
      deficiencySymptoms: ['Poor wound healing', 'Immune dysfunction', 'Hair loss', 'Skin problems'],
      toxicitySymptoms: ['Digestive upset', 'Low blood pressure', 'Herpes outbreaks', 'Allergic reactions'],
      interactions: ['May affect blood pressure medications', 'Enhanced by lysine deficiency', 'Works with nitric oxide'],
      healthBenefits: ['Better circulation', 'Wound healing', 'Immune support', 'Athletic performance'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 57,
      name: 'Lysine',
      category: 'Amino Acids',
      description: 'Essential amino acid important for protein synthesis, collagen formation, and immune function.',
      functions: ['Protein synthesis', 'Collagen formation', 'Calcium absorption', 'Immune function'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Eggs', 'Dairy products', 'Beans', 'Quinoa'],
      deficiencySymptoms: ['Poor growth', 'Fatigue', 'Nausea', 'Dizziness'],
      toxicitySymptoms: ['Generally safe', 'Digestive upset', 'Kidney problems at very high doses'],
      interactions: ['Balances arginine', 'Enhanced by vitamin C', 'Works with other amino acids'],
      healthBenefits: ['Better protein synthesis', 'Immune support', 'Calcium absorption', 'Cold sore prevention'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 58,
      name: 'Methionine',
      category: 'Amino Acids',
      description: 'Essential amino acid important for methylation processes, detoxification, and protein synthesis.',
      functions: ['Methylation', 'Detoxification', 'Protein synthesis', 'Antioxidant production'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Eggs', 'Dairy products', 'Brazil nuts', 'Sesame seeds'],
      deficiencySymptoms: ['Fatty liver', 'Poor detoxification', 'Hair loss', 'Muscle wasting'],
      toxicitySymptoms: ['Elevated homocysteine', 'Heart disease risk', 'Oxidative stress'],
      interactions: ['Requires B vitamins', 'Balanced by glycine', 'Works with SAMe'],
      healthBenefits: ['Detoxification support', 'Methylation support', 'Liver health', 'Antioxidant production'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 59,
      name: 'Phenylalanine',
      category: 'Amino Acids',
      description: 'Essential amino acid that is a precursor to tyrosine and important neurotransmitters.',
      functions: ['Neurotransmitter precursor', 'Protein synthesis', 'Mood regulation', 'Pain relief'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Eggs', 'Dairy products', 'Nuts', 'Seeds'],
      deficiencySymptoms: ['Depression', 'Confusion', 'Memory problems', 'Lack of energy'],
      toxicitySymptoms: ['Anxiety', 'Jitteriness', 'Insomnia', 'High blood pressure'],
      interactions: ['Converts to tyrosine', 'May affect medications', 'Dangerous in PKU'],
      healthBenefits: ['Mood support', 'Cognitive function', 'Pain relief', 'Alertness'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 60,
      name: 'Tyrosine',
      category: 'Amino Acids',
      description: 'Non-essential amino acid that is a precursor to important neurotransmitters and thyroid hormones.',
      functions: ['Neurotransmitter synthesis', 'Thyroid hormone production', 'Stress response', 'Cognitive function'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Eggs', 'Dairy products', 'Almonds', 'Avocados'],
      deficiencySymptoms: ['Depression', 'Fatigue', 'Low body temperature', 'Low blood pressure'],
      toxicitySymptoms: ['Anxiety', 'Jitteriness', 'Headaches', 'Nausea'],
      interactions: ['May affect blood pressure medications', 'Enhanced by iron', 'Works with iodine'],
      healthBenefits: ['Stress management', 'Cognitive enhancement', 'Mood support', 'Thyroid function'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    // Continue with additional nutrients to reach 100
    {
      id: 61,
      name: 'Tryptophan',
      category: 'Amino Acids',
      description: 'Essential amino acid that is a precursor to serotonin and melatonin. Important for mood and sleep.',
      functions: ['Serotonin synthesis', 'Melatonin production', 'Mood regulation', 'Sleep quality'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Turkey', 'Chicken', 'Fish', 'Eggs', 'Cheese', 'Pumpkin seeds'],
      deficiencySymptoms: ['Depression', 'Insomnia', 'Anxiety', 'Carbohydrate cravings'],
      toxicitySymptoms: ['Drowsiness', 'Nausea', 'Headache', 'Light-headedness'],
      interactions: ['Competes with other amino acids', 'Enhanced by carbohydrates', 'May affect medications'],
      healthBenefits: ['Better mood', 'Improved sleep', 'Reduced anxiety', 'Appetite control'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 62,
      name: 'Histidine',
      category: 'Amino Acids',
      description: 'Essential amino acid important for growth, tissue repair, and histamine production.',
      functions: ['Histamine production', 'Tissue repair', 'Growth', 'Immune response'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Poultry', 'Dairy products', 'Grains', 'Beans'],
      deficiencySymptoms: ['Anemia', 'Eczema', 'Fatigue', 'Poor wound healing'],
      toxicitySymptoms: ['Generally safe', 'Possible allergic reactions', 'Rare side effects'],
      interactions: ['Precursor to histamine', 'Works with other amino acids', 'May affect allergies'],
      healthBenefits: ['Tissue repair', 'Immune function', 'Growth support', 'Wound healing'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 63,
      name: 'Threonine',
      category: 'Amino Acids',
      description: 'Essential amino acid important for protein synthesis, immune function, and fat metabolism.',
      functions: ['Protein synthesis', 'Immune function', 'Fat metabolism', 'Collagen production'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Dairy products', 'Eggs', 'Beans', 'Nuts'],
      deficiencySymptoms: ['Poor growth', 'Immune dysfunction', 'Liver problems', 'Intestinal disorders'],
      toxicitySymptoms: ['Generally safe', 'Rare digestive upset', 'No known toxicity'],
      interactions: ['Works with other amino acids', 'Enhanced by B vitamins', 'Stable in cooking'],
      healthBenefits: ['Immune support', 'Protein synthesis', 'Liver health', 'Digestive health'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 64,
      name: 'Valine',
      category: 'Amino Acids',
      description: 'Essential branched-chain amino acid important for muscle metabolism and energy production.',
      functions: ['Muscle metabolism', 'Energy production', 'Nitrogen balance', 'Tissue repair'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Poultry', 'Dairy products', 'Beans', 'Nuts'],
      deficiencySymptoms: ['Muscle wasting', 'Poor coordination', 'Mental agitation', 'Slow healing'],
      toxicitySymptoms: ['Generally safe', 'Possible fatigue', 'Loss of muscle coordination'],
      interactions: ['Works with leucine and isoleucine', 'Enhanced by exercise', 'Balanced with other BCAAs'],
      healthBenefits: ['Muscle preservation', 'Energy production', 'Exercise recovery', 'Tissue repair'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 65,
      name: 'Leucine',
      category: 'Amino Acids',
      description: 'Essential branched-chain amino acid that stimulates protein synthesis and muscle growth.',
      functions: ['Protein synthesis', 'Muscle growth', 'Energy production', 'Wound healing'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Poultry', 'Dairy products', 'Eggs', 'Beans'],
      deficiencySymptoms: ['Muscle wasting', 'Fatigue', 'Poor wound healing', 'Skin problems'],
      toxicitySymptoms: ['Generally safe', 'Possible pellagra-like symptoms', 'Rare reactions'],
      interactions: ['Works with other BCAAs', 'Enhanced by insulin', 'Stimulates mTOR pathway'],
      healthBenefits: ['Muscle growth', 'Protein synthesis', 'Exercise recovery', 'Age-related muscle loss prevention'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 66,
      name: 'Isoleucine',
      category: 'Amino Acids',
      description: 'Essential branched-chain amino acid important for muscle metabolism and immune function.',
      functions: ['Muscle metabolism', 'Immune function', 'Hemoglobin formation', 'Energy regulation'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Poultry', 'Eggs', 'Cheese', 'Beans'],
      deficiencySymptoms: ['Muscle wasting', 'Fatigue', 'Dizziness', 'Headaches'],
      toxicitySymptoms: ['Generally safe', 'Possible urinary problems', 'Rare side effects'],
      interactions: ['Works with other BCAAs', 'Balanced with leucine and valine', 'Enhanced by exercise'],
      healthBenefits: ['Muscle metabolism', 'Immune support', 'Energy regulation', 'Exercise performance'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 67,
      name: 'Beta-Alanine',
      category: 'Amino Acids',
      description: 'Non-essential amino acid that combines with histidine to form carnosine, important for muscle endurance.',
      functions: ['Carnosine formation', 'Muscle endurance', 'pH buffering', 'Fatigue resistance'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Poultry', 'Fish', 'Supplements', 'Small amounts in plants'],
      deficiencySymptoms: ['Reduced muscle endurance', 'Early fatigue', 'Poor athletic performance'],
      toxicitySymptoms: ['Skin tingling', 'Flushing', 'Generally safe', 'Temporary sensations'],
      interactions: ['Combines with histidine', 'Enhanced by consistent dosing', 'Works with creatine'],
      healthBenefits: ['Increased muscle endurance', 'Reduced fatigue', 'Better athletic performance', 'Muscle pH buffering'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 68,
      name: 'Citrulline',
      category: 'Amino Acids',
      description: 'Non-essential amino acid that enhances arginine production and supports cardiovascular health.',
      functions: ['Nitric oxide support', 'Blood flow enhancement', 'Exercise performance', 'Cardiovascular health'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Watermelon', 'Cucumbers', 'Melons', 'Supplements', 'Small amounts in other foods'],
      deficiencySymptoms: ['Poor circulation', 'Fatigue', 'Erectile dysfunction', 'Poor exercise performance'],
      toxicitySymptoms: ['Generally safe', 'Mild digestive upset', 'Rare reactions'],
      interactions: ['More effective than arginine', 'Works with nitric oxide pathway', 'Enhanced by exercise'],
      healthBenefits: ['Better blood flow', 'Exercise performance', 'Cardiovascular health', 'Muscle pumps'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 69,
      name: 'Ornithine',
      category: 'Amino Acids',
      description: 'Non-essential amino acid involved in the urea cycle and important for detoxification.',
      functions: ['Urea cycle', 'Ammonia detoxification', 'Growth hormone support', 'Sleep quality'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Eggs', 'Dairy products', 'Supplements'],
      deficiencySymptoms: ['Poor detoxification', 'Fatigue', 'Poor sleep', 'Muscle weakness'],
      toxicitySymptoms: ['Generally safe', 'Digestive upset', 'Rare reactions'],
      interactions: ['Works with arginine', 'Part of urea cycle', 'May enhance growth hormone'],
      healthBenefits: ['Detoxification support', 'Better sleep', 'Muscle recovery', 'Ammonia clearance'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 70,
      name: 'Proline',
      category: 'Amino Acids',
      description: 'Non-essential amino acid important for collagen synthesis and wound healing.',
      functions: ['Collagen synthesis', 'Wound healing', 'Skin health', 'Joint support'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Collagen', 'Gelatin', 'Meat', 'Dairy products', 'Eggs', 'Bone broth'],
      deficiencySymptoms: ['Poor wound healing', 'Joint problems', 'Skin aging', 'Connective tissue issues'],
      toxicitySymptoms: ['Generally safe', 'No known toxicity', 'Well tolerated'],
      interactions: ['Works with vitamin C', 'Enhanced by glycine', 'Synergistic with collagen'],
      healthBenefits: ['Joint health', 'Skin health', 'Wound healing', 'Connective tissue support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    // Final nutrients 71-100
    {
      id: 71,
      name: 'Serine',
      category: 'Amino Acids',
      description: 'Non-essential amino acid important for brain function, immune system, and fat metabolism.',
      functions: ['Brain function', 'Immune support', 'Fat metabolism', 'Cell membrane synthesis'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Dairy products', 'Eggs', 'Beans', 'Nuts'],
      deficiencySymptoms: ['Cognitive problems', 'Immune dysfunction', 'Poor fat metabolism', 'Cell membrane issues'],
      toxicitySymptoms: ['Generally safe', 'No known toxicity', 'Well tolerated'],
      interactions: ['Works with other amino acids', 'Enhanced by B vitamins', 'Supports neurotransmitters'],
      healthBenefits: ['Brain health', 'Immune support', 'Cellular function', 'Cognitive performance'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 72,
      name: 'Alanine',
      category: 'Amino Acids',
      description: 'Non-essential amino acid that helps convert glucose to energy and supports immune function.',
      functions: ['Glucose metabolism', 'Energy production', 'Immune support', 'Muscle function'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Poultry', 'Fish', 'Eggs', 'Dairy products', 'Beans'],
      deficiencySymptoms: ['Fatigue', 'Poor glucose metabolism', 'Immune dysfunction', 'Muscle weakness'],
      toxicitySymptoms: ['Generally safe', 'No known toxicity', 'Well tolerated'],
      interactions: ['Works with glucose metabolism', 'Enhanced by exercise', 'Supports protein synthesis'],
      healthBenefits: ['Energy production', 'Glucose metabolism', 'Immune support', 'Muscle function'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 73,
      name: 'Aspartic Acid',
      category: 'Amino Acids',
      description: 'Non-essential amino acid important for energy production and neurotransmitter synthesis.',
      functions: ['Energy production', 'Neurotransmitter synthesis', 'Immune function', 'Hormone regulation'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Poultry', 'Fish', 'Eggs', 'Asparagus', 'Beans'],
      deficiencySymptoms: ['Fatigue', 'Poor energy production', 'Neurotransmitter imbalances', 'Immune dysfunction'],
      toxicitySymptoms: ['Generally safe', 'Possible headaches at high doses', 'Rare reactions'],
      interactions: ['Works with energy metabolism', 'Enhanced by B vitamins', 'Supports neurotransmitters'],
      healthBenefits: ['Energy production', 'Brain function', 'Immune support', 'Athletic performance'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 74,
      name: 'Glutamic Acid',
      category: 'Amino Acids',
      description: 'Non-essential amino acid that serves as a neurotransmitter and supports brain function.',
      functions: ['Neurotransmitter function', 'Brain health', 'Learning and memory', 'Protein synthesis'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Fish', 'Eggs', 'Dairy products', 'Tomatoes', 'Cheese'],
      deficiencySymptoms: ['Cognitive problems', 'Learning difficulties', 'Memory issues', 'Brain fog'],
      toxicitySymptoms: ['Excitotoxicity at high doses', 'Headaches', 'Possible allergic reactions'],
      interactions: ['Functions as neurotransmitter', 'Balanced by GABA', 'May affect mood'],
      healthBenefits: ['Brain function', 'Learning and memory', 'Cognitive performance', 'Neurotransmitter balance'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 75,
      name: 'Cysteine',
      category: 'Amino Acids',
      description: 'Semi-essential amino acid important for antioxidant production and detoxification.',
      functions: ['Antioxidant production', 'Detoxification', 'Protein structure', 'Immune function'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Meat', 'Poultry', 'Fish', 'Eggs', 'Dairy products', 'Oats'],
      deficiencySymptoms: ['Poor antioxidant status', 'Impaired detoxification', 'Weak immune system', 'Hair loss'],
      toxicitySymptoms: ['Generally safe', 'Possible nausea', 'Rare allergic reactions'],
      interactions: ['Precursor to glutathione', 'Works with selenium', 'Enhanced by vitamin C'],
      healthBenefits: ['Antioxidant support', 'Detoxification', 'Immune health', 'Hair and nail health'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 76,
      name: 'Asparagine',
      category: 'Amino Acids',
      description: 'Non-essential amino acid important for nervous system function and protein synthesis.',
      functions: ['Nervous system function', 'Protein synthesis', 'Immune support', 'Detoxification'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Asparagus', 'Meat', 'Fish', 'Eggs', 'Dairy products', 'Beans'],
      deficiencySymptoms: ['Nervous system problems', 'Poor protein synthesis', 'Immune dysfunction'],
      toxicitySymptoms: ['Generally safe', 'No known toxicity', 'Well tolerated'],
      interactions: ['Works with other amino acids', 'Supports protein synthesis', 'Enhanced by B vitamins'],
      healthBenefits: ['Nervous system health', 'Protein synthesis', 'Immune support', 'Cellular function'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 77,
      name: 'Hydroxyproline',
      category: 'Amino Acids',
      description: 'Non-essential amino acid that is a major component of collagen and important for skin health.',
      functions: ['Collagen stability', 'Skin health', 'Joint support', 'Wound healing'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Collagen', 'Gelatin', 'Bone broth', 'Connective tissue', 'Supplements'],
      deficiencySymptoms: ['Weak collagen', 'Poor skin health', 'Joint problems', 'Slow wound healing'],
      toxicitySymptoms: ['Generally safe', 'No known toxicity', 'Well tolerated'],
      interactions: ['Works with vitamin C', 'Enhanced by proline', 'Stabilizes collagen'],
      healthBenefits: ['Skin health', 'Joint support', 'Collagen strength', 'Anti-aging'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 78,
      name: 'GABA (Gamma-Aminobutyric Acid)',
      category: 'Functional Nutrients',
      description: 'Inhibitory neurotransmitter that promotes relaxation and reduces anxiety.',
      functions: ['Neurotransmitter function', 'Relaxation', 'Anxiety reduction', 'Sleep support'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Fermented foods', 'Tea', 'Supplements', 'Small amounts in sprouted grains'],
      deficiencySymptoms: ['Anxiety', 'Insomnia', 'Muscle tension', 'Hyperactivity'],
      toxicitySymptoms: ['Generally safe', 'Drowsiness', 'Possible interactions with medications'],
      interactions: ['Balances glutamate', 'Enhanced by magnesium', 'May interact with sedatives'],
      healthBenefits: ['Reduced anxiety', 'Better sleep', 'Relaxation', 'Stress management'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 79,
      name: 'SAMe (S-Adenosyl Methionine)',
      category: 'Functional Nutrients',
      description: 'Important methyl donor involved in neurotransmitter synthesis and liver detoxification.',
      functions: ['Methylation', 'Neurotransmitter synthesis', 'Liver detoxification', 'Joint health'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Produced in the body', 'Supplements', 'Limited dietary sources'],
      deficiencySymptoms: ['Depression', 'Poor methylation', 'Liver dysfunction', 'Joint pain'],
      toxicitySymptoms: ['Generally safe', 'Possible mania in bipolar disorder', 'Digestive upset'],
      interactions: ['Works with B vitamins', 'May interact with antidepressants', 'Enhanced by folate and B12'],
      healthBenefits: ['Mood support', 'Liver health', 'Joint comfort', 'Methylation support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 80,
      name: 'TMG (Trimethylglycine)',
      category: 'Functional Nutrients',
      description: 'Methyl donor that supports methylation processes and cardiovascular health.',
      functions: ['Methylation support', 'Homocysteine reduction', 'Liver health', 'Athletic performance'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Beets', 'Spinach', 'Wheat bran', 'Supplements', 'Quinoa'],
      deficiencySymptoms: ['Poor methylation', 'Elevated homocysteine', 'Liver dysfunction', 'Fatigue'],
      toxicitySymptoms: ['Generally safe', 'Fishy body odor', 'Digestive upset', 'Rare reactions'],
      interactions: ['Works with B vitamins', 'Supports SAMe production', 'Enhanced by choline'],
      healthBenefits: ['Cardiovascular health', 'Liver support', 'Athletic performance', 'Methylation support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 81,
      name: 'PQQ (Pyrroloquinoline Quinone)',
      category: 'Functional Nutrients',
      description: 'Cofactor that supports mitochondrial function and energy production.',
      functions: ['Mitochondrial biogenesis', 'Energy production', 'Neuroprotection', 'Antioxidant activity'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Fermented soybeans', 'Green tea', 'Spinach', 'Parsley', 'Supplements'],
      deficiencySymptoms: ['Poor energy production', 'Mitochondrial dysfunction', 'Cognitive decline', 'Fatigue'],
      toxicitySymptoms: ['Generally safe', 'Headache', 'Insomnia', 'Fatigue'],
      interactions: ['Works with CoQ10', 'Enhanced by other antioxidants', 'Supports cellular energy'],
      healthBenefits: ['Enhanced energy production', 'Brain protection', 'Mitochondrial health', 'Cognitive support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 82,
      name: 'Nicotinamide Riboside',
      category: 'Functional Nutrients',
      description: 'Precursor to NAD+ that supports cellular energy production and longevity.',
      functions: ['NAD+ production', 'Cellular energy', 'DNA repair', 'Longevity support'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Milk', 'Yeast', 'Supplements', 'Small amounts in various foods'],
      deficiencySymptoms: ['Poor cellular energy', 'Accelerated aging', 'DNA damage', 'Fatigue'],
      toxicitySymptoms: ['Generally safe', 'Mild digestive upset', 'Rare reactions'],
      interactions: ['Boosts NAD+ levels', 'Works with sirtuins', 'Enhanced by other B vitamins'],
      healthBenefits: ['Anti-aging effects', 'Cellular energy', 'DNA repair', 'Longevity support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 83,
      name: 'Berberine',
      category: 'Functional Nutrients',
      description: 'Plant alkaloid that supports blood sugar control and cardiovascular health.',
      functions: ['Blood sugar control', 'Cholesterol management', 'Anti-inflammatory effects', 'Gut health'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Goldenseal', 'Barberry', 'Oregon grape', 'Supplements', 'Traditional herbs'],
      deficiencySymptoms: ['Poor blood sugar control', 'High cholesterol', 'Inflammation', 'Gut imbalances'],
      toxicitySymptoms: ['Digestive upset', 'Cramping', 'Diarrhea', 'Possible drug interactions'],
      interactions: ['May affect diabetes medications', 'Enhanced by silymarin', 'Works with metformin-like pathways'],
      healthBenefits: ['Blood sugar control', 'Cholesterol management', 'Weight management', 'Gut health'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 84,
      name: 'Milk Thistle (Silymarin)',
      category: 'Functional Nutrients',
      description: 'Flavonoid complex that supports liver health and detoxification.',
      functions: ['Liver protection', 'Detoxification support', 'Antioxidant activity', 'Anti-inflammatory effects'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Milk thistle seeds', 'Supplements', 'Limited food sources'],
      deficiencySymptoms: ['Poor liver function', 'Impaired detoxification', 'Oxidative stress', 'Inflammation'],
      toxicitySymptoms: ['Generally safe', 'Mild digestive upset', 'Allergic reactions in some'],
      interactions: ['May affect liver enzymes', 'Enhanced by phosphatidylcholine', 'Works with other liver herbs'],
      healthBenefits: ['Liver protection', 'Detoxification support', 'Antioxidant activity', 'Inflammation reduction'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 85,
      name: 'Rhodiola Rosea',
      category: 'Functional Nutrients',
      description: 'Adaptogenic herb that helps the body adapt to stress and supports mental performance.',
      functions: ['Stress adaptation', 'Mental performance', 'Fatigue resistance', 'Mood support'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Rhodiola root', 'Supplements', 'Traditional preparations'],
      deficiencySymptoms: ['Poor stress response', 'Mental fatigue', 'Low mood', 'Reduced endurance'],
      toxicitySymptoms: ['Generally safe', 'Possible agitation', 'Insomnia', 'Headache'],
      interactions: ['May interact with medications', 'Enhanced by consistent use', 'Works with other adaptogens'],
      healthBenefits: ['Stress management', 'Mental clarity', 'Physical endurance', 'Mood support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 86,
      name: 'Ashwagandha',
      category: 'Functional Nutrients',
      description: 'Adaptogenic herb that supports stress management and hormonal balance.',
      functions: ['Stress reduction', 'Cortisol regulation', 'Thyroid support', 'Immune function'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Ashwagandha root', 'Supplements', 'Traditional preparations'],
      deficiencySymptoms: ['Poor stress response', 'Elevated cortisol', 'Fatigue', 'Immune dysfunction'],
      toxicitySymptoms: ['Generally safe', 'Possible drowsiness', 'Digestive upset', 'Drug interactions'],
      interactions: ['May affect thyroid medications', 'Enhanced by consistent use', 'Works with other adaptogens'],
      healthBenefits: ['Stress reduction', 'Better sleep', 'Immune support', 'Hormonal balance'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 87,
      name: 'Ginkgo Biloba',
      category: 'Functional Nutrients',
      description: 'Herb that supports cognitive function and circulation.',
      functions: ['Cognitive enhancement', 'Circulation support', 'Antioxidant activity', 'Memory support'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Ginkgo leaves', 'Supplements', 'Standardized extracts'],
      deficiencySymptoms: ['Poor circulation', 'Memory problems', 'Cognitive decline', 'Oxidative stress'],
      toxicitySymptoms: ['Generally safe', 'Possible bleeding risk', 'Headache', 'Digestive upset'],
      interactions: ['May enhance blood thinners', 'Enhanced by standardized extracts', 'May interact with medications'],
      healthBenefits: ['Cognitive support', 'Better circulation', 'Memory enhancement', 'Brain protection'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 88,
      name: 'Bacopa Monnieri',
      category: 'Functional Nutrients',
      description: 'Herb that supports memory, learning, and cognitive function.',
      functions: ['Memory enhancement', 'Learning support', 'Stress reduction', 'Neuroprotection'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Bacopa herb', 'Supplements', 'Traditional preparations'],
      deficiencySymptoms: ['Poor memory', 'Learning difficulties', 'Stress sensitivity', 'Cognitive decline'],
      toxicitySymptoms: ['Generally safe', 'Digestive upset', 'Fatigue', 'Dry mouth'],
      interactions: ['Enhanced with fat', 'May interact with medications', 'Works best with consistent use'],
      healthBenefits: ['Memory improvement', 'Learning enhancement', 'Stress management', 'Cognitive protection'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 89,
      name: 'Lion\'s Mane Mushroom',
      category: 'Functional Nutrients',
      description: 'Medicinal mushroom that supports nerve growth and cognitive function.',
      functions: ['Nerve growth factor', 'Cognitive support', 'Neuroprotection', 'Digestive health'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Lion\'s mane mushrooms', 'Supplements', 'Mushroom extracts'],
      deficiencySymptoms: ['Poor nerve health', 'Cognitive decline', 'Memory problems', 'Digestive issues'],
      toxicitySymptoms: ['Generally safe', 'Rare allergic reactions', 'Mild digestive upset'],
      interactions: ['Enhanced by other mushrooms', 'Works with nerve health nutrients', 'Synergistic with B vitamins'],
      healthBenefits: ['Nerve regeneration', 'Cognitive enhancement', 'Memory support', 'Brain protection'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 90,
      name: 'Reishi Mushroom',
      category: 'Functional Nutrients',
      description: 'Adaptogenic mushroom that supports immune function and stress management.',
      functions: ['Immune modulation', 'Stress adaptation', 'Sleep support', 'Liver health'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Reishi mushrooms', 'Supplements', 'Mushroom extracts'],
      deficiencySymptoms: ['Poor immune function', 'Stress sensitivity', 'Sleep problems', 'Liver dysfunction'],
      toxicitySymptoms: ['Generally safe', 'Mild drowsiness', 'Digestive upset', 'Rare allergic reactions'],
      interactions: ['May enhance immune therapies', 'Works with other adaptogens', 'Enhanced by consistent use'],
      healthBenefits: ['Immune support', 'Stress management', 'Better sleep', 'Liver protection'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 91,
      name: 'Cordyceps',
      category: 'Functional Nutrients',
      description: 'Medicinal mushroom that supports energy production and athletic performance.',
      functions: ['Energy production', 'Athletic performance', 'Respiratory health', 'Immune support'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Cordyceps mushrooms', 'Supplements', 'Mushroom extracts'],
      deficiencySymptoms: ['Low energy', 'Poor athletic performance', 'Respiratory problems', 'Fatigue'],
      toxicitySymptoms: ['Generally safe', 'Mild digestive upset', 'Rare allergic reactions'],
      interactions: ['Enhanced with exercise', 'Works with energy nutrients', 'Synergistic with other mushrooms'],
      healthBenefits: ['Increased energy', 'Athletic performance', 'Respiratory health', 'Endurance'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 92,
      name: 'Turkey Tail Mushroom',
      category: 'Functional Nutrients',
      description: 'Immune-supporting mushroom rich in polysaccharides and beta-glucans.',
      functions: ['Immune modulation', 'Antioxidant activity', 'Gut health', 'Cancer support'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Turkey tail mushrooms', 'Supplements', 'Mushroom extracts'],
      deficiencySymptoms: ['Weak immune system', 'Poor gut health', 'Increased infection risk', 'Oxidative stress'],
      toxicitySymptoms: ['Generally safe', 'Mild digestive upset', 'Rare allergic reactions'],
      interactions: ['Enhanced by other polysaccharides', 'Works with immune nutrients', 'Synergistic with probiotics'],
      healthBenefits: ['Immune support', 'Gut health', 'Antioxidant protection', 'Cancer adjuvant'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 93,
      name: 'Spirulina',
      category: 'Functional Nutrients',
      description: 'Blue-green algae rich in protein, vitamins, and antioxidants.',
      functions: ['Protein source', 'Antioxidant activity', 'Immune support', 'Detoxification'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Spirulina supplements', 'Spirulina powder', 'Blue-green algae products'],
      deficiencySymptoms: ['Protein deficiency', 'Poor antioxidant status', 'Weak immunity', 'Poor detoxification'],
      toxicitySymptoms: ['Generally safe', 'Possible contaminants in poor quality', 'Digestive upset'],
      interactions: ['Enhanced by vitamin C', 'Works with other antioxidants', 'May affect iron absorption'],
      healthBenefits: ['Complete protein', 'Antioxidant protection', 'Immune support', 'Detoxification'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 94,
      name: 'Chlorella',
      category: 'Functional Nutrients',
      description: 'Green algae rich in chlorophyll, protein, and nutrients.',
      functions: ['Detoxification', 'Protein source', 'Immune support', 'Heavy metal chelation'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Chlorella supplements', 'Chlorella powder', 'Green algae products'],
      deficiencySymptoms: ['Poor detoxification', 'Heavy metal accumulation', 'Protein deficiency', 'Weak immunity'],
      toxicitySymptoms: ['Generally safe', 'Digestive upset', 'Possible contaminants in poor quality'],
      interactions: ['Enhanced by vitamin C', 'Works with chelation therapy', 'May affect medication absorption'],
      healthBenefits: ['Heavy metal detox', 'Immune support', 'Protein source', 'Liver support'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 95,
      name: 'Wheatgrass',
      category: 'Functional Nutrients',
      description: 'Young grass shoots rich in chlorophyll, vitamins, and enzymes.',
      functions: ['Detoxification', 'Antioxidant activity', 'Digestive support', 'Energy enhancement'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Wheatgrass juice', 'Wheatgrass powder', 'Fresh wheatgrass shots'],
      deficiencySymptoms: ['Poor detoxification', 'Low energy', 'Digestive problems', 'Oxidative stress'],
      toxicitySymptoms: ['Generally safe', 'Possible nausea', 'Allergic reactions in some'],
      interactions: ['Enhanced by other greens', 'Works with digestive enzymes', 'May interact with blood thinners'],
      healthBenefits: ['Detoxification', 'Energy boost', 'Digestive health', 'Antioxidant activity'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 96,
      name: 'Barley Grass',
      category: 'Functional Nutrients',
      description: 'Young barley shoots rich in vitamins, minerals, and enzymes.',
      functions: ['Alkalizing', 'Antioxidant activity', 'Digestive support', 'Energy enhancement'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Barley grass powder', 'Barley grass juice', 'Green superfood blends'],
      deficiencySymptoms: ['Acidic pH', 'Poor energy', 'Digestive problems', 'Oxidative stress'],
      toxicitySymptoms: ['Generally safe', 'Possible digestive upset', 'Rare allergic reactions'],
      interactions: ['Enhanced by other greens', 'Works with alkalizing foods', 'Synergistic with enzymes'],
      healthBenefits: ['pH balance', 'Energy support', 'Digestive health', 'Antioxidant protection'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 97,
      name: 'Alfalfa',
      category: 'Functional Nutrients',
      description: 'Nutrient-dense plant rich in vitamins, minerals, and phytonutrients.',
      functions: ['Nutrient density', 'Cholesterol support', 'Detoxification', 'Alkalizing'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Alfalfa sprouts', 'Alfalfa supplements', 'Alfalfa powder'],
      deficiencySymptoms: ['Nutrient deficiencies', 'High cholesterol', 'Poor detoxification', 'Acidic pH'],
      toxicitySymptoms: ['Generally safe', 'Possible autoimmune reactions', 'Estrogen-like effects'],
      interactions: ['May affect blood thinners', 'Enhanced by other nutrients', 'May interact with hormones'],
      healthBenefits: ['Nutrient support', 'Cholesterol management', 'Detoxification', 'pH balance'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 98,
      name: 'Kelp',
      category: 'Functional Nutrients',
      description: 'Sea vegetable rich in iodine, minerals, and trace elements.',
      functions: ['Thyroid support', 'Mineral source', 'Metabolism support', 'Detoxification'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Kelp supplements', 'Seaweed', 'Sea vegetables', 'Iodine sources'],
      deficiencySymptoms: ['Thyroid dysfunction', 'Mineral deficiencies', 'Slow metabolism', 'Poor detoxification'],
      toxicitySymptoms: ['Excessive iodine', 'Thyroid dysfunction', 'Heavy metal contamination'],
      interactions: ['May affect thyroid medications', 'Enhanced by selenium', 'May contain heavy metals'],
      healthBenefits: ['Thyroid support', 'Mineral supplementation', 'Metabolism boost', 'Trace element source'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 99,
      name: 'Dulse',
      category: 'Functional Nutrients',
      description: 'Red seaweed rich in protein, vitamins, and minerals.',
      functions: ['Protein source', 'Mineral supplementation', 'Thyroid support', 'Antioxidant activity'],
      dailyValue: 'No established DV',
      unit: 'g',
      foodSources: ['Dulse flakes', 'Sea vegetables', 'Seaweed snacks', 'Marine supplements'],
      deficiencySymptoms: ['Protein deficiency', 'Mineral deficiencies', 'Thyroid problems', 'Oxidative stress'],
      toxicitySymptoms: ['Generally safe', 'Excessive iodine', 'Possible heavy metal contamination'],
      interactions: ['May affect thyroid function', 'Enhanced by vitamin C', 'Works with other sea vegetables'],
      healthBenefits: ['Protein supplementation', 'Mineral support', 'Thyroid health', 'Antioxidant protection'],
      createdAt: baseTime,
      updatedAt: baseTime
    },
    {
      id: 100,
      name: 'Fulvic Acid',
      category: 'Functional Nutrients',
      description: 'Organic compound that enhances nutrient absorption and supports detoxification.',
      functions: ['Nutrient absorption', 'Detoxification', 'Electrolyte balance', 'Cellular transport'],
      dailyValue: 'No established DV',
      unit: 'mg',
      foodSources: ['Humic/fulvic supplements', 'Pristine soil', 'Some spring waters', 'Organic matter'],
      deficiencySymptoms: ['Poor nutrient absorption', 'Impaired detoxification', 'Electrolyte imbalances', 'Cellular dysfunction'],
      toxicitySymptoms: ['Generally safe', 'Possible digestive upset', 'Quality dependent on source'],
      interactions: ['Enhances other nutrients', 'Works with minerals', 'May affect medication absorption'],
      healthBenefits: ['Better nutrient absorption', 'Enhanced detoxification', 'Electrolyte balance', 'Cellular health'],
      createdAt: baseTime,
      updatedAt: baseTime
    }
  ];

  // If we have existing format, try to match the structure
  if (useExistingFormat && existingFormat.sampleStructure) {
    return nutrients.map(nutrient => {
      const adapted = { ...nutrient };
      
      // Match field names and types from existing data
      const sample = existingFormat.sampleStructure;
      Object.keys(sample).forEach(key => {
        if (!(key in adapted)) {
          // Add missing fields with appropriate defaults
          if (typeof sample[key] === 'string') {
            adapted[key] = '';
          } else if (Array.isArray(sample[key])) {
            adapted[key] = [];
          } else if (typeof sample[key] === 'number') {
            adapted[key] = 0;
          } else {
            adapted[key] = sample[key];
          }
        }
      });
      
      return adapted;
    });
  }

  return nutrients;
};

// Smart seeding function that adapts to existing format
export const seedNutrients = async (): Promise<{ success: boolean; message: string; count?: number }> => {
  try {
    console.log('🌱 Starting smart nutrient seeding process...');
    
    // First, analyze existing nutrients
    const existingNutrients = await getExistingNutrients();
    const formatAnalysis = analyzeNutrientFormat(existingNutrients);
    
    if (formatAnalysis.hasData) {
      console.log(`⚠️ Found ${formatAnalysis.existingCount} existing nutrients. Skipping seeding to prevent duplicates.`);
      return {
        success: false,
        message: `Database already contains ${formatAnalysis.existingCount} nutrients. Use "Clear All Nutrients" first if you want to re-seed with fresh data.`
      };
    }
    
    // Get seed data adapted to existing format
    const nutrientData = getSmartNutrientSeedData(formatAnalysis);
    
    console.log(`🌱 Seeding ${nutrientData.length} nutrients with smart format adaptation...`);
    
    // Seed nutrients one by one to handle any individual failures
    let successCount = 0;
    const errors = [];
    
    for (const nutrient of nutrientData) {
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/nutrients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(nutrient)
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            successCount++;
            console.log(`✅ Seeded nutrient: ${nutrient.name} (ID: ${nutrient.id})`);
          } else {
            errors.push(`${nutrient.name}: ${result.error}`);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          errors.push(`${nutrient.name}: ${errorData.error || `HTTP ${response.status}`}`);
        }
      } catch (error) {
        errors.push(`${nutrient.name}: ${error.message}`);
      }
    }
    
    console.log(`🌱 Smart seeding completed: ${successCount}/${nutrientData.length} nutrients seeded`);
    
    if (errors.length > 0) {
      console.error('❌ Seeding errors:', errors);
      return {
        success: successCount > 0,
        message: `Partially successful: ${successCount}/${nutrientData.length} nutrients seeded. Errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
        count: successCount
      };
    }
    
    return {
      success: true,
      message: `Successfully seeded ${successCount} nutrients with proper formatting!`,
      count: successCount
    };
    
  } catch (error) {
    console.error('💥 Smart nutrient seeding failed:', error);
    return {
      success: false,
      message: `Seeding failed: ${error.message}`
    };
  }
};

// Clear nutrients function for re-seeding
export const clearNutrients = async (): Promise<{ success: boolean; message: string; count?: number }> => {
  try {
    console.log('🧹 Starting nutrient clearing process...');
    
    // Get all nutrients first
    const existingNutrients = await getExistingNutrients();
    
    if (existingNutrients.length === 0) {
      return {
        success: false,
        message: 'No nutrients found to clear'
      };
    }
    
    console.log(`🧹 Found ${existingNutrients.length} nutrients to clear...`);
    
    // Delete nutrients one by one
    let deleteCount = 0;
    const errors = [];
    
    for (const nutrient of existingNutrients) {
      try {
        const deleteResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/nutrients/${nutrient.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Accept': 'application/json'
          }
        });
        
        if (deleteResponse.ok) {
          const result = await deleteResponse.json();
          if (result.success) {
            deleteCount++;
            console.log(`🗑️ Deleted nutrient: ${nutrient.name} (ID: ${nutrient.id})`);
          } else {
            errors.push(`${nutrient.name}: ${result.error}`);
          }
        } else {
          const errorData = await deleteResponse.json().catch(() => ({ error: 'Unknown error' }));
          errors.push(`${nutrient.name}: ${errorData.error || `HTTP ${deleteResponse.status}`}`);
        }
      } catch (error) {
        errors.push(`${nutrient.name}: ${error.message}`);
      }
    }
    
    console.log(`🧹 Clearing completed: ${deleteCount}/${existingNutrients.length} nutrients cleared`);
    
    if (errors.length > 0) {
      console.error('❌ Clearing errors:', errors);
      return {
        success: deleteCount > 0,
        message: `Partially successful: ${deleteCount}/${existingNutrients.length} nutrients cleared. Errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
        count: deleteCount
      };
    }
    
    return {
      success: true,
      message: `Successfully cleared ${deleteCount} nutrients from the database!`,
      count: deleteCount
    };
    
  } catch (error) {
    console.error('💥 Nutrient clearing failed:', error);
    return {
      success: false,
      message: `Clearing failed: ${error.message}`
    };
  }
};

// Utility functions for ID handling
export const validateNumericId = (id: string | number): boolean => {
  const numericId = typeof id === 'string' ? parseInt(id) : id;
  return !isNaN(numericId) && numericId > 0 && numericId <= 9999;
};

export const formatIdDisplay = (id: string | number): string => {
  const numericId = typeof id === 'string' ? parseInt(id) : id;
  return `#${numericId.toString().padStart(2, '0')}`;
};

export const extractNumericId = (id: string | number): number => {
  if (typeof id === 'number') return id;
  const parsed = parseInt(id.toString().replace(/[^0-9]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};