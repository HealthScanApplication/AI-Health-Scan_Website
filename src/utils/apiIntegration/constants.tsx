/**
 * Production API Integration Constants
 * All endpoints and configurations for real external APIs
 */

export interface APIResponse<T> {
  success: boolean;
  data?: T[];
  error?: string;
  metadata?: {
    total: number;
    imported: number;
    skipped: number;
    errors: string[];
  };
}

// Real Production API Endpoints
export const API_ENDPOINTS = {
  // US Government APIs
  USDA_FOOD_DATA: 'https://api.nal.usda.gov/fdc/v1/foods/search',
  EPA_ECOTOX: 'https://cfpub.epa.gov/ecotox/api/search',
  
  // European APIs
  EFSA_OPENFOODTOX: 'https://www.efsa.europa.eu/en/data/chemical-hazards-database/api',
  EUROFIR: 'https://www.eurofir.org/api/v1',
  
  // Global APIs
  OPENFOOD_SEARCH: 'https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1',
  OPENFOOD_PRODUCT: 'https://world.openfoodfacts.org/api/v0/product',
  OPENAQ: 'https://api.openaq.org/v2/measurements',
  
  // Commercial APIs
  SPOONACULAR_INGREDIENTS: 'https://api.spoonacular.com/food/ingredients/search',
  SPOONACULAR_PRODUCTS: 'https://api.spoonacular.com/food/products/search',
  NUTRITIONIX: 'https://trackapi.nutritionix.com/v2/search/instant',
  EDAMAM_NUTRITION: 'https://api.edamam.com/api/nutrition-data/v2/nutrients'
};

// Production Rate Limits (per hour)
export const RATE_LIMITS = {
  USDA: { requests: 3600, window: 3600000 }, // 1 hour
  EPA: { requests: 500, window: 3600000 },
  EFSA: { requests: 1000, window: 3600000 },
  OPENFOOD: { requests: 10000, window: 3600000 },
  OPENAQ: { requests: 10000, window: 3600000 },
  SPOONACULAR: { requests: 150, window: 86400000 }, // 24 hours for free tier
  NUTRITIONIX: { requests: 1000, window: 86400000 },
  EDAMAM: { requests: 5, window: 60000 } // 5 per minute
};

// Standard HTTP Headers
export const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'HealthScan/1.0 Production (contact@healthscan.live)'
};

// Data type mappings for consistent categorization
export const DATA_TYPE_MAPPINGS = {
  NUTRIENT_CATEGORIES: [
    'Vitamins', 'Minerals', 'Amino Acids', 'Fatty Acids', 'Antioxidants', 
    'Fiber', 'Probiotics', 'Enzymes', 'Phytochemicals'
  ],
  INGREDIENT_CATEGORIES: [
    'Natural Flavors', 'Preservatives', 'Emulsifiers', 'Stabilizers', 
    'Colorings', 'Sweeteners', 'Thickeners', 'Acidity Regulators'
  ],
  PRODUCT_CATEGORIES: [
    'Dairy Products', 'Meat & Poultry', 'Seafood', 'Fruits & Vegetables', 
    'Grains & Cereals', 'Beverages', 'Snack Foods', 'Condiments & Sauces'
  ],
  POLLUTANT_CATEGORIES: [
    'Heavy Metals', 'Pesticides', 'Industrial Chemicals', 'Air Pollutants', 
    'Water Contaminants', 'Food Additives', 'Microplastics'
  ],
  RISK_LEVELS: ['Low', 'Moderate', 'High', 'Very High', 'Extreme']
};

// API Service Status
export const API_SERVICE_STATUS = {
  PRODUCTION: 'production',
  MAINTENANCE: 'maintenance',
  DEGRADED: 'degraded',
  OUTAGE: 'outage'
};

// Real API Authentication Requirements
export const API_AUTH_REQUIREMENTS = {
  USDA_FOOD_DATA: { keyRequired: true, type: 'query_param', param: 'api_key' },
  EPA_ECOTOX: { keyRequired: true, type: 'header', param: 'X-API-Key' },
  SPOONACULAR: { keyRequired: true, type: 'query_param', param: 'apiKey' },
  NUTRITIONIX: { keyRequired: true, type: 'header', param: 'x-app-id' },
  EDAMAM: { keyRequired: true, type: 'query_param', param: 'app_id' },
  OPENFOOD: { keyRequired: false },
  OPENAQ: { keyRequired: false }
};

// Error codes for real API failures
export const API_ERROR_CODES = {
  AUTHENTICATION_FAILED: 401,
  RATE_LIMIT_EXCEEDED: 429,
  API_UNAVAILABLE: 503,
  INVALID_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

// Production environment validation
export const validateProductionEnvironment = () => {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for production: ${missing.join(', ')}`);
  }
};