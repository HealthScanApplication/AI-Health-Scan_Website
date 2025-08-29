/**
 * Admin helper functions for data processing and management
 * Contains utility functions used by admin endpoints
 */

// Helper function to generate reliable image URLs - NEVER use api.placeholder.com
export function generateReliableImageUrl(type: string, name?: string): string {
  // Use only reliable, tested Unsplash URLs that actually work
  const reliableImageUrls: Record<string, string> = {
    'nutrient': 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'pollutant': 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'ingredient': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'product': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'parasite': 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'scan': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'meal': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&crop=center&auto=format&q=80'
  };
  
  // Always return a reliable Unsplash URL
  return reliableImageUrls[type] || reliableImageUrls['nutrient'];
}

// Helper functions for nutrient categorization and defaults
export function categorizeNutrient(nutrientName: string): string {
  const name = nutrientName.toLowerCase();
  if (name.includes('vitamin')) return 'Vitamins';
  if (name.includes('calcium') || name.includes('iron') || name.includes('zinc') || name.includes('magnesium')) return 'Minerals';
  if (name.includes('protein') || name.includes('amino')) return 'Amino Acids';
  if (name.includes('fat') || name.includes('fatty')) return 'Fatty Acids';
  if (name.includes('fiber')) return 'Fiber';
  if (name.includes('carbohydrate') || name.includes('sugar')) return 'Carbohydrates';
  return 'General Nutrients';
}

export function getDefaultUnit(nutrientName: string): string {
  const name = nutrientName.toLowerCase();
  if (name.includes('vitamin a') || name.includes('vitamin d') || name.includes('folate') || name.includes('b12')) return 'μg';
  if (name.includes('vitamin') || name.includes('calcium') || name.includes('magnesium') || name.includes('potassium')) return 'mg';
  if (name.includes('amino') || name.includes('protein')) return 'g';
  return 'mg';
}

export function getDefaultRDI(nutrientName: string): number {
  const name = nutrientName.toLowerCase();
  if (name.includes('vitamin c')) return 90;
  if (name.includes('vitamin d')) return 15;
  if (name.includes('calcium')) return 1000;
  if (name.includes('iron')) return 18;
  if (name.includes('magnesium')) return 420;
  if (name.includes('potassium')) return 4700;
  if (name.includes('zinc')) return 11;
  if (name.includes('b12')) return 2.4;
  if (name.includes('folate')) return 400;
  return 100; // Default RDI
}

export function getDefaultType(nutrientName: string): string {
  const name = nutrientName.toLowerCase();
  if (name.includes('vitamin a') || name.includes('vitamin d') || name.includes('vitamin e') || name.includes('vitamin k')) return 'Fat-soluble vitamin';
  if (name.includes('vitamin')) return 'Water-soluble vitamin';
  if (name.includes('calcium') || name.includes('phosphorus') || name.includes('magnesium') || name.includes('potassium')) return 'Macromineral';
  if (name.includes('iron') || name.includes('zinc') || name.includes('copper')) return 'Trace mineral';
  if (name.includes('amino')) return 'Amino acid';
  if (name.includes('omega') || name.includes('fatty')) return 'Fatty acid';
  return 'Essential nutrient';
}

export function getDefaultFoodSources(nutrientName: string): string[] {
  const name = nutrientName.toLowerCase();
  if (name.includes('vitamin c')) return ['Citrus fruits', 'Berries', 'Bell peppers', 'Broccoli'];
  if (name.includes('calcium')) return ['Dairy products', 'Leafy greens', 'Almonds', 'Sardines'];
  if (name.includes('iron')) return ['Red meat', 'Spinach', 'Lentils', 'Tofu'];
  if (name.includes('omega-3')) return ['Fish', 'Walnuts', 'Flaxseeds', 'Chia seeds'];
  if (name.includes('vitamin d')) return ['Sunlight', 'Fatty fish', 'Fortified milk', 'Egg yolks'];
  return ['Fruits', 'Vegetables', 'Whole grains', 'Lean proteins'];
}

// Pollutant helper functions
export function categorizePollutant(parameter: string): string {
  const param = parameter.toLowerCase();
  if (param.includes('pm')) return 'Particulate Matter';
  if (param.includes('no2') || param.includes('no')) return 'Nitrogen Compounds';
  if (param.includes('o3')) return 'Ozone';
  if (param.includes('so2') || param.includes('so')) return 'Sulfur Compounds';
  if (param.includes('co')) return 'Carbon Compounds';
  return 'Air Pollutants';
}

export function getPollutantName(parameter: string): string {
  const names: Record<string, string> = {
    'pm25': 'PM2.5 (Fine Particulate Matter)',
    'pm10': 'PM10 (Coarse Particulate Matter)',
    'no2': 'Nitrogen Dioxide',
    'o3': 'Ground-level Ozone',
    'so2': 'Sulfur Dioxide',
    'co': 'Carbon Monoxide'
  };
  return names[parameter.toLowerCase()] || parameter.toUpperCase();
}

export function getPollutantHealthEffects(parameter: string): string {
  const effects: Record<string, string> = {
    'pm25': 'Respiratory and cardiovascular problems, lung irritation',
    'pm10': 'Respiratory irritation, reduced lung function',
    'no2': 'Respiratory inflammation, increased asthma risk',
    'o3': 'Lung irritation, breathing difficulties, chest pain',
    'so2': 'Respiratory irritation, bronchospasm in asthmatics',
    'co': 'Reduced oxygen delivery, cardiovascular stress'
  };
  return effects[parameter.toLowerCase()] || 'Potential respiratory and health effects';
}

export function getUsableSafeLevels(parameter: string): string {
  const levels: Record<string, string> = {
    'pm25': 'WHO: 15 μg/m³ annual, 45 μg/m³ 24-hour',
    'pm10': 'WHO: 45 μg/m³ annual, 150 μg/m³ 24-hour',
    'no2': 'WHO: 10 μg/m³ annual, 25 μg/m³ 24-hour',
    'o3': 'WHO: 100 μg/m³ 8-hour average',
    'so2': 'WHO: 40 μg/m³ 24-hour average',
    'co': 'WHO: 30 mg/m³ 1-hour, 10 mg/m³ 8-hour'
  };
  return levels[parameter.toLowerCase()] || 'Refer to WHO air quality guidelines';
}

export function assessRiskLevel(value: number, parameter: string): string {
  // Simplified risk assessment based on WHO guidelines
  const thresholds: Record<string, number[]> = {
    'pm25': [15, 35, 75], // Low, Moderate, High thresholds
    'pm10': [45, 100, 200],
    'no2': [25, 50, 100],
    'o3': [100, 160, 240],
    'so2': [40, 80, 150],
    'co': [10, 20, 40]
  };

  const threshold = thresholds[parameter.toLowerCase()];
  if (!threshold) return 'Unknown';

  if (value <= threshold[0]) return 'Low';
  if (value <= threshold[1]) return 'Moderate';
  if (value <= threshold[2]) return 'High';
  return 'Very High';
}

export function getRewardTier(referralCount: number): string {
  if (referralCount >= 30) return 'Free Premium (1 Year)';
  if (referralCount >= 20) return 'Free Premium (6 Months)';
  if (referralCount >= 10) return 'Free Premium (3 Months)';
  if (referralCount >= 5) return 'Early Access';
  return 'No reward yet';
}

// Helper function to get CSV headers for different data types
export function getCSVHeaders(dataType: string): string[] {
  const commonHeaders = ['ID', 'Name', 'Description', 'Source', 'Imported At', 'External ID', 'Image URL'];
  
  switch (dataType) {
    case 'nutrients':
      return [...commonHeaders, 'Category', 'Unit', 'RDI', 'Health Benefits', 'Deficiency Symptoms', 'Food Sources'];
    case 'pollutants':
      return [...commonHeaders, 'Scientific Name', 'Category', 'Risk Level', 'Health Effects', 'Exposure Routes', 'Safe Levels'];
    case 'ingredients':
      return [...commonHeaders, 'Common Name', 'Category', 'Nutritional Info', 'Allergen Info'];
    case 'products':
      return [...commonHeaders, 'Brand', 'Category', 'Ingredients', 'Nutritional Profile'];
    case 'parasites':
      return [...commonHeaders, 'Scientific Name', 'Category', 'Health Effects'];
    case 'scans':
      return [...commonHeaders, 'Scan Type', 'Results', 'Status'];
    case 'meals':
      return [...commonHeaders, 'Meal Type', 'Ingredients', 'Nutrition Profile'];
    default:
      return commonHeaders;
  }
}