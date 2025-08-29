// AI Image Generation utility types and functions

export interface GeneratedImage {
  url: string;
  prompt: string;
  recordType: string;
  itemName: string;
  category?: string;
  isPlaceholder?: boolean;
  generatedAt: string;
}

export const createImageGenerationPrompt = (recordType: string, itemName: string, category?: string): string => {
  const baseContext = "Professional, high-quality photograph with a clean white background";
  
  switch (recordType) {
    case 'nutrient':
      return `${baseContext}, showing fresh ${itemName} foods being held above a shopping cart in a grocery store, vibrant colors, healthy lifestyle photography`;
    
    case 'ingredient':
      return `${baseContext}, showing premium ${itemName} package being held above a shopping basket in grocery shopping context, product photography style`;
    
    case 'pollutant':
      return `${baseContext}, showing a smartphone displaying HealthScan app interface scanning a product for ${itemName} contamination warning, modern mobile app UI`;
    
    case 'product':
      return `${baseContext}, showing ${itemName} product package being held above a shopping basket, realistic product photography`;
    
    case 'scan':
      return `${baseContext}, showing HealthScan mobile app interface scanning ${itemName}, clean modern app design with green accents`;
    
    case 'parasite':
      return `${baseContext}, scientific illustration of ${itemName} parasite with educational diagram elements, medical textbook style`;
    
    case 'meal':
      return `${baseContext}, showing beautifully plated ${itemName} meal on a restaurant table, food photography style`;
    
    default:
      return `${baseContext}, ${itemName} in professional photography style`;
  }
};

export const createPlaceholderImage = (itemName: string, recordType: string): GeneratedImage => {
  const placeholderUrl = `https://via.placeholder.com/400x300/16a34a/ffffff?text=${encodeURIComponent(itemName)}`;
  
  return {
    url: placeholderUrl,
    prompt: `Placeholder for ${itemName}`,
    recordType,
    itemName,
    isPlaceholder: true,
    generatedAt: new Date().toISOString()
  };
};

export const validateImageUrl = (url: string): boolean => {
  try {
    const validUrl = new URL(url);
    return validUrl.protocol === 'http:' || validUrl.protocol === 'https:';
  } catch {
    return false;
  }
};