/**
 * Production Global API Integrations
 * Real API calls only - no mock data fallbacks
 */

import { APIResponse, RATE_LIMITS, API_ENDPOINTS, DEFAULT_HEADERS } from './constants';
import { rateLimiter } from './rateLimiting';
import { APIErrorHandler, APIMonitoring } from './errorHandling';

export class GlobalAPIs {
  
  /**
   * OpenFood Facts - Global Collaborative Database
   * Real API integration with comprehensive error handling
   */
  static async importOpenFoodFactsData(dataType: 'products' | 'ingredients'): Promise<APIResponse<any>> {
    const startTime = Date.now();
    console.log(`🌍 Starting OpenFood Facts ${dataType} import from real API...`);
    
    try {
      // Check rate limits
      if (!rateLimiter.canMakeRequest('openfood', RATE_LIMITS.OPENFOOD.requests, RATE_LIMITS.OPENFOOD.window)) {
        throw APIErrorHandler.createRateLimitError('OpenFood Facts');
      }

      // Construct real API endpoint
      let endpoint: string;
      if (dataType === 'products') {
        endpoint = `${API_ENDPOINTS.OPENFOOD_SEARCH}&page_size=50&fields=product_name,brands,categories,code,ingredients_text,nutriments,image_url,countries&sort_by=popularity`;
      } else {
        endpoint = `${API_ENDPOINTS.OPENFOOD_SEARCH}&tagtype_0=categories&tag_contains_0=contains&tag_0=ingredients&page_size=100&fields=ingredients_text,product_name`;
      }

      console.log(`🔍 Fetching from OpenFood Facts API: ${endpoint}`);

      const response = await APIErrorHandler.handleAPICall(
        () => fetch(endpoint, {
          method: 'GET',
          headers: {
            ...DEFAULT_HEADERS,
            'User-Agent': 'HealthScan-Production/1.0 (contact@healthscan.live)'
          }
        }),
        'OpenFood Facts',
        15000 // 15 second timeout
      );

      rateLimiter.recordRequest('openfood');
      
      const data = await response.json();
      console.log(`📊 OpenFood Facts API response:`, {
        productsCount: data.products?.length || 0,
        totalCount: data.count,
        page: data.page
      });
      
      if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('OpenFood Facts API returned no products. The search may have no results or the API may be experiencing issues.');
      }

      let transformedData = [];
      
      if (dataType === 'products') {
        transformedData = data.products
          .filter((product: any) => product.product_name && product.product_name.trim())
          .map((product: any) => ({
            name: product.product_name.trim(),
            brand: product.brands || 'Unknown Brand',
            category: Array.isArray(product.categories_tags) 
              ? product.categories_tags.slice(0, 3).join(', ') 
              : (product.categories || 'Food Products'),
            barcode: product.code || null,
            description: `Real OpenFood Facts product: ${product.product_name}`,
            ingredients: product.ingredients_text || 'Ingredients not available',
            nutritional_profile: product.nutriments ? JSON.stringify(product.nutriments) : '{}',
            source: 'OpenFood Facts',
            api_source: 'OpenFood Facts API',
            imported_at: new Date().toISOString(),
            external_id: product.code || product.id || `off_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            image_url: product.image_url || null,
            countries: product.countries || null
          }));
      } else {
        // Extract unique ingredients from products
        const ingredientSet = new Set<string>();
        data.products.forEach((product: any) => {
          if (product.ingredients_text) {
            const ingredients = product.ingredients_text
              .split(/[,;()\[\].]/)
              .map((ing: string) => ing.trim().toLowerCase())
              .filter((ing: string) => 
                ing.length > 2 && 
                ing.length < 50 && 
                !ing.includes('*') && 
                !ing.match(/^\d/) &&
                !ing.includes('%')
              )
              .slice(0, 5);
            
            ingredients.forEach((ing: string) => {
              if (ingredientSet.size < 200) { // Limit to prevent memory issues
                ingredientSet.add(ing);
              }
            });
          }
        });

        if (ingredientSet.size === 0) {
          throw new Error('No valid ingredients could be extracted from OpenFood Facts products');
        }

        transformedData = Array.from(ingredientSet).map((ingredient: string, index: number) => ({
          name: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
          common_name: ingredient,
          category: 'Food Ingredients',
          description: `Real ingredient from OpenFood Facts: ${ingredient}`,
          source: 'OpenFood Facts',
          api_source: 'OpenFood Facts API',
          imported_at: new Date().toISOString(),
          external_id: `off_ingredient_${Date.now()}_${index}`,
          origin: 'Global Food Products'
        }));
      }

      const responseTime = Date.now() - startTime;
      APIMonitoring.recordAPICall('OpenFood Facts', true, responseTime);

      console.log(`✅ Successfully imported ${transformedData.length} real ${dataType} from OpenFood Facts`);

      return {
        success: true,
        data: transformedData,
        metadata: {
          total: data.count || transformedData.length,
          imported: transformedData.length,
          skipped: 0,
          errors: []
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      APIMonitoring.recordAPICall('OpenFood Facts', false, responseTime, error.message);
      
      console.error('💥 OpenFood Facts API integration failed:', error);
      return APIErrorHandler.handleError(error, 'OpenFood Facts');
    }
  }

  /**
   * Spoonacular API - Commercial Food Database
   */
  static async importSpoonacularData(apiKey: string, dataType: 'ingredients' | 'products'): Promise<APIResponse<any>> {
    const startTime = Date.now();
    console.log(`🍴 Starting Spoonacular ${dataType} import from real API...`);
    
    try {
      if (!apiKey) {
        throw new Error('Spoonacular API key is required for production use. Please configure your API key.');
      }
      
      if (!rateLimiter.canMakeRequest('spoonacular', RATE_LIMITS.SPOONACULAR.requests, RATE_LIMITS.SPOONACULAR.window)) {
        throw APIErrorHandler.createRateLimitError('Spoonacular');
      }

      const endpoint = dataType === 'ingredients' 
        ? `${API_ENDPOINTS.SPOONACULAR_INGREDIENTS}?apiKey=${apiKey}&number=100&sort=popularity`
        : `${API_ENDPOINTS.SPOONACULAR_PRODUCTS}?apiKey=${apiKey}&number=100&sort=popularity`;

      console.log(`🔍 Fetching from Spoonacular API: ${endpoint.replace(apiKey, '[API_KEY]')}`);

      const response = await APIErrorHandler.handleAPICall(
        () => fetch(endpoint, {
          method: 'GET',
          headers: DEFAULT_HEADERS
        }),
        'Spoonacular',
        20000
      );

      rateLimiter.recordRequest('spoonacular');
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Spoonacular API returned invalid response format');
      }

      let transformedData = [];
      
      if (dataType === 'ingredients') {
        transformedData = data.results.map((ingredient: any) => ({
          name: ingredient.name,
          category: 'Commercial Ingredients',
          description: `Spoonacular ingredient: ${ingredient.name}`,
          source: 'Spoonacular',
          api_source: 'Spoonacular API',
          imported_at: new Date().toISOString(),
          external_id: ingredient.id?.toString(),
          image_url: ingredient.image
        }));
      } else {
        transformedData = data.results.map((product: any) => ({
          name: product.title,
          category: 'Commercial Products',
          description: `Spoonacular product: ${product.title}`,
          brand: 'Spoonacular',
          source: 'Spoonacular',
          api_source: 'Spoonacular API',
          imported_at: new Date().toISOString(),
          external_id: product.id?.toString(),
          image_url: product.image
        }));
      }

      const responseTime = Date.now() - startTime;
      APIMonitoring.recordAPICall('Spoonacular', true, responseTime);

      console.log(`✅ Successfully imported ${transformedData.length} real ${dataType} from Spoonacular`);

      return {
        success: true,
        data: transformedData,
        metadata: {
          total: data.totalResults || transformedData.length,
          imported: transformedData.length,
          skipped: 0,
          errors: []
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      APIMonitoring.recordAPICall('Spoonacular', false, responseTime, error.message);
      
      console.error('💥 Spoonacular API integration failed:', error);
      return APIErrorHandler.handleError(error, 'Spoonacular');
    }
  }

  /**
   * Nutritionix API - Commercial Nutrition Database
   */
  static async importNutritionixData(appId: string, appKey: string, query: string = 'apple'): Promise<APIResponse<any>> {
    const startTime = Date.now();
    console.log(`🥗 Starting Nutritionix import from real API...`);
    
    try {
      if (!appId || !appKey) {
        throw new Error('Nutritionix API credentials (app ID and app key) are required for production use.');
      }
      
      if (!rateLimiter.canMakeRequest('nutritionix', RATE_LIMITS.NUTRITIONIX.requests, RATE_LIMITS.NUTRITIONIX.window)) {
        throw APIErrorHandler.createRateLimitError('Nutritionix');
      }

      const endpoint = `${API_ENDPOINTS.NUTRITIONIX}?query=${encodeURIComponent(query)}`;

      console.log(`🔍 Fetching from Nutritionix API: ${endpoint}`);

      const response = await APIErrorHandler.handleAPICall(
        () => fetch(endpoint, {
          method: 'GET',
          headers: {
            'x-app-id': appId,
            'x-app-key': appKey,
            'Accept': 'application/json',
            'User-Agent': 'HealthScan-Production/1.0'
          }
        }),
        'Nutritionix',
        15000
      );

      rateLimiter.recordRequest('nutritionix');
      
      const data = await response.json();
      
      const transformedData = [
        ...(data.common?.map((item: any) => ({
          name: item.food_name,
          category: 'Natural Foods',
          unit: 'per serving',
          rdi: item.nf_calories || 0,
          description: `Nutritionix nutrition data for ${item.food_name}`,
          nutritional_profile: JSON.stringify({
            calories: item.nf_calories,
            protein: item.nf_protein,
            carbs: item.nf_total_carbohydrate,
            fat: item.nf_total_fat,
            fiber: item.nf_dietary_fiber,
            sugar: item.nf_sugars
          }),
          source: 'Nutritionix',
          api_source: 'Nutritionix API',
          imported_at: new Date().toISOString(),
          external_id: item.nix_item_id,
          image_url: item.photo?.thumb
        })) || []),
        ...(data.branded?.map((item: any) => ({
          name: item.food_name,
          brand: item.brand_name,
          category: 'Branded Products',
          unit: 'per serving',
          rdi: item.nf_calories || 0,
          description: `Nutritionix branded product: ${item.food_name}`,
          source: 'Nutritionix',
          api_source: 'Nutritionix API',
          imported_at: new Date().toISOString(),
          external_id: item.nix_item_id,
          image_url: item.photo?.thumb
        })) || [])
      ];

      if (transformedData.length === 0) {
        throw new Error(`No nutrition data found for query: ${query}`);
      }

      const responseTime = Date.now() - startTime;
      APIMonitoring.recordAPICall('Nutritionix', true, responseTime);

      console.log(`✅ Successfully imported ${transformedData.length} real items from Nutritionix`);

      return {
        success: true,
        data: transformedData,
        metadata: {
          total: (data.common?.length || 0) + (data.branded?.length || 0),
          imported: transformedData.length,
          skipped: 0,
          errors: []
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      APIMonitoring.recordAPICall('Nutritionix', false, responseTime, error.message);
      
      console.error('💥 Nutritionix API integration failed:', error);
      return APIErrorHandler.handleError(error, 'Nutritionix');
    }
  }
}