/**
 * Admin helper functions for data processing and utilities
 */

// CSV headers for different data types
export function getCSVHeaders(dataType: string): string[] {
  switch (dataType.toLowerCase()) {
    case 'nutrients':
      return [
        'ID', 'Name', 'Vitamin Name', 'Category', 'Unit', 'RDI', 'Type',
        'Description Simple', 'Description Technical', 'Health Benefits',
        'Food Strategy Animal', 'Food Strategy Plant', 'Pregnancy Considerations',
        'Deficient Range', 'Optimal Range', 'Excess Range',
        'Source', 'API Source', 'Imported At', 'External ID', 'Image URL'
      ];
    case 'pollutants':
      return [
        'ID', 'Name', 'Scientific Name', 'Category', 'Risk Level',
        'Description', 'Health Effects', 'Exposure Routes', 'Safe Levels',
        'Source', 'API Source', 'Imported At', 'External ID', 'Image URL'
      ];
    case 'ingredients':
      return [
        'ID', 'Name', 'Common Name', 'Category', 'Description',
        'Nutritional Info', 'Allergen Info', 'Source', 'API Source',
        'Imported At', 'External ID', 'Image URL'
      ];
    case 'products':
      return [
        'ID', 'Name', 'Brand', 'Category', 'Description', 'Ingredients',
        'Nutritional Profile', 'Source', 'API Source', 'Imported At',
        'External ID', 'Image URL'
      ];
    case 'parasites':
      return [
        'ID', 'Name', 'Scientific Name', 'Common Name', 'Category',
        'Description', 'Transmission', 'Symptoms', 'Treatment', 'Prevention',
        'Geographic Distribution', 'Host Range', 'Life Cycle', 'Health Risk',
        'Food Association', 'Incubation Period', 'Source', 'API Source',
        'Imported At', 'External ID', 'Image URL'
      ];
    case 'scans':
      return [
        'ID', 'Name', 'Scan Type', 'Description', 'Results',
        'Source', 'Imported At', 'External ID', 'Image URL'
      ];
    case 'meals':
      return [
        'ID', 'Name', 'Meal Type', 'Description', 'Ingredients',
        'Nutrition Profile', 'Source', 'Imported At', 'External ID', 'Image URL'
      ];
    default:
      return ['ID', 'Name', 'Description', 'Source', 'Imported At'];
  }
}

// Generate reliable image URLs using Unsplash
export function generateReliableImageUrl(category: string, itemName?: string): string {
  const baseUrl = 'https://images.unsplash.com/photo-';
  
  // Curated high-quality images for different categories
  const imageMap: Record<string, string> = {
    // Nutrients
    'nutrient': '1559757175-0eb30cd8c063', // Vitamin pills
    'vitamin': '1559757175-0eb30cd8c063',
    'mineral': '1587049332-d7e25413b4e6', // Supplement capsules
    
    // Pollutants  
    'pollutant': '1581833971-07be3c5b17c', // Industrial/chemical
    'chemical': '1581833971-07be3c5b17c',
    'heavy_metal': '1581833971-07be3c5b17c',
    
    // Food categories
    'ingredient': '1506905925346-21bda4d32df4', // Fresh ingredients
    'product': '1556909114-5bb2cd73ad40', // Food products
    'meal': '1565299624946-b28f40a0ca4d', // Prepared meals
    'scan': '1551963831-b3b1ca40c98e', // Technology/scanning
    
    // Parasites
    'parasite': '1559757175-0eb30cd8c063', // Microscopic view
    'protozoan': '1559757175-0eb30cd8c063',
    'helminth': '1559757175-0eb30cd8c063',
    
    // Supplements
    'supplement': '1556909114-5bb2cd73ad40',
    
    // Default fallback
    'default': '1556909114-5bb2cd73ad40'
  };
  
  // Try to find specific image based on category or name
  let imageId = imageMap[category.toLowerCase()] || imageMap['default'];
  
  // For specific nutrient names, use more targeted images
  if (itemName) {
    const name = itemName.toLowerCase();
    if (name.includes('vitamin') || name.includes('mineral')) {
      imageId = imageMap['nutrient'];
    } else if (name.includes('protein') || name.includes('amino')) {
      imageId = '1571019613-c6b3f17e6700'; // Protein powder
    } else if (name.includes('omega') || name.includes('fat')) {
      imageId = '1474979266404-7eaacbcd87c5'; // Healthy oils
    }
  }
  
  return `${baseUrl}${imageId}?w=400&h=300&fit=crop&auto=format&q=80`;
}

// Create AI prompt for field completion
export function createAIPrompt(
  recordType: string,
  recordName: string,
  fieldKey: string,
  fieldLabel: string,
  aiHint: string,
  currentValue: any,
  context: any
): string {
  return `
Complete the "${fieldLabel}" field for this ${recordType} record:

Record: ${recordName}
Field: ${fieldKey} (${fieldLabel})
Current value: ${currentValue || 'empty'}
Context: ${JSON.stringify(context, null, 2)}

Instructions: ${aiHint}

Provide a factual, scientific, and helpful response that would be appropriate for a health and nutrition database. Keep it concise but informative (2-3 sentences maximum).
`.trim();
}

// Generate fallback content when AI is not available
export function generateFallbackContent(
  recordType: string,
  recordName: string,
  fieldKey: string,
  fieldLabel: string,
  context: any
): string {
  const fallbacks: Record<string, Record<string, string>> = {
    nutrient: {
      description_text_simple: `${recordName} is an essential nutrient that plays important roles in maintaining optimal health and supporting various bodily functions.`,
      description_text_technical: `${recordName} functions as a cofactor in enzymatic reactions and metabolic pathways essential for cellular function and homeostasis.`,
      health_benefits: 'Supports immune function, energy metabolism, cellular health, and overall wellness.',
      food_strategy_animal: `Animal sources of ${recordName} include meat, fish, poultry, dairy products, and eggs, which generally provide highly bioavailable forms.`,
      food_strategy_plant: `Plant sources include fruits, vegetables, whole grains, legumes, nuts, and seeds. May require larger quantities to meet daily needs.`,
      pregnancy_considerations: `${recordName} needs may be increased during pregnancy and lactation. Consult healthcare provider for appropriate dosing.`,
      deficiency_symptoms: `Deficiency in ${recordName} may lead to various health issues. Consult healthcare provider for specific information.`
    },
    pollutant: {
      description: `${recordName} is an environmental contaminant that may pose health risks through various exposure routes.`,
      health_effects: `Exposure to ${recordName} may cause various health effects. Risk assessment depends on exposure level and duration.`,
      exposure_routes: 'Common exposure routes include inhalation, ingestion, and dermal contact.',
      prevention: 'Limit exposure through proper safety measures, water filtration, and avoiding contaminated sources.'
    },
    ingredient: {
      description: `${recordName} is a food ingredient commonly used in various culinary applications.`,
      nutritional_info: 'Contains various nutrients that contribute to dietary intake and nutritional needs.',
      allergen_info: 'Check product labels for specific allergen information and potential cross-contamination.',
      preparation_tips: 'Store properly and prepare according to food safety guidelines.'
    },
    product: {
      description: `${recordName} is a food product that provides nutrition and dietary components.`,
      ingredients: 'See product packaging for complete ingredient list and nutritional information.',
      usage_tips: 'Follow package instructions for optimal storage and preparation.',
      nutritional_benefits: 'Contributes to daily nutritional needs as part of a balanced diet.'
    },
    parasite: {
      description: `${recordName} is a parasitic organism that can cause health issues in humans.`,
      symptoms: 'Symptoms may vary depending on infection severity and individual health status.',
      treatment: 'Consult healthcare provider for proper diagnosis and treatment options.',
      prevention: 'Practice good hygiene, safe food handling, and avoid contaminated water sources.'
    }
  };
  
  const typeDefaults = fallbacks[recordType.toLowerCase()] || {};
  return typeDefaults[fieldKey] || `Information about ${fieldLabel} for ${recordName}. Consult healthcare provider or relevant authorities for specific details.`;
}

// Validate record data structure
export function validateRecordData(recordType: string, data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Common required fields
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!data.source || data.source.trim().length === 0) {
    errors.push('Source is required');
  }
  
  // Type-specific validation
  switch (recordType.toLowerCase()) {
    case 'nutrient':
      if (typeof data.rdi !== 'number' || data.rdi < 0) {
        errors.push('RDI must be a positive number');
      }
      if (!data.unit || data.unit.trim().length === 0) {
        errors.push('Unit is required for nutrients');
      }
      if (!data.category || data.category.trim().length === 0) {
        errors.push('Category is required for nutrients');
      }
      break;
      
    case 'pollutant':
      if (!data.risk_level || !['Low', 'Moderate', 'High', 'Very High'].includes(data.risk_level)) {
        errors.push('Valid risk level is required for pollutants');
      }
      break;
      
    case 'ingredient':
      if (!data.category || data.category.trim().length === 0) {
        errors.push('Category is required for ingredients');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Format numbers for display
export function formatNumber(value: number, decimals: number = 2): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  return value.toFixed(decimals);
}

// Format dates for display
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
}

// Clean and validate text input
export function cleanText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  return text.trim().replace(/\s+/g, ' ').substring(0, 10000); // Limit to reasonable length
}

// Generate unique ID
export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

// Sanitize data for storage
export function sanitizeForStorage(data: any): any {
  if (typeof data === 'string') {
    return cleanText(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForStorage(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      sanitized[key] = sanitizeForStorage(data[key]);
    });
    return sanitized;
  }
  
  return data;
}

// Check if URL is valid
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Calculate percentage with error handling
export function calculatePercentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

// Parse JSON safely
export function parseJsonSafely(jsonString: string, fallback: any = null): any {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

// Create slug from text
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}