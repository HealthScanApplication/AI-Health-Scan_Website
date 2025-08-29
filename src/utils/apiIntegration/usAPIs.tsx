/**
 * US Government API Integrations - Production Only
 * Real USDA, EPA, and other US government APIs
 */

import { APIResponse, RATE_LIMITS, API_ENDPOINTS, DEFAULT_HEADERS } from './constants';
import { rateLimiter } from './rateLimiting';
import { APIErrorHandler, APIMonitoring } from './errorHandling';
import { ProductionDataValidator } from './mockData';

export class USAPIs {
  
  /**
   * USDA FoodData Central - Real API Integration
   */
  static async importUSDAData(apiKey: string, query: string = 'apple', dataType: 'nutrients' | 'products' = 'nutrients'): Promise<APIResponse<any>> {
    const startTime = Date.now();
    console.log(`🇺🇸 Starting USDA FoodData Central ${dataType} import...`);
    
    try {
      if (!apiKey) {
        throw new Error('USDA API key is required. Get one free at: https://fdc.nal.usda.gov/api-key-signup.html');
      }
      
      if (!rateLimiter.canMakeRequest('usda', RATE_LIMITS.USDA.requests, RATE_LIMITS.USDA.window)) {
        throw APIErrorHandler.createRateLimitError('USDA FoodData Central');
      }

      const endpoint = `${API_ENDPOINTS.USDA_FOOD_DATA}?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=50&dataType=Foundation,SR%20Legacy,Survey%20%28FNDDS%29&sortBy=description&sortOrder=asc`;

      console.log(`🔍 Fetching from USDA API: ${endpoint.replace(apiKey, '[API_KEY]')}`);

      const response = await APIErrorHandler.handleAPICall(
        () => fetch(endpoint, {
          method: 'GET',
          headers: DEFAULT_HEADERS
        }),
        'USDA FoodData Central',
        20000
      );

      rateLimiter.recordRequest('usda');
      
      const data = await response.json();
      
      if (!data.foods || !Array.isArray(data.foods) || data.foods.length === 0) {
        throw new Error(`No USDA data found for query: ${query}. Try a different search term.`);
      }

      console.log(`📊 USDA API returned ${data.foods.length} foods`);

      let transformedData = [];
      
      if (dataType === 'nutrients') {
        transformedData = data.foods
          .filter((food: any) => food.foodNutrients && food.foodNutrients.length > 0)
          .flatMap((food: any) => 
            food.foodNutrients
              .filter((nutrient: any) => nutrient.nutrientName && nutrient.value != null)
              .map((nutrient: any) => ({
                name: nutrient.nutrientName,
                category: this.categorizeNutrient(nutrient.nutrientName),
                unit: nutrient.unitName || 'per 100g',
                rdi: nutrient.value || 0,
                description: `USDA nutrition data for ${nutrient.nutrientName} from ${food.description}`,
                food_source: food.description,
                health_benefits: `Essential nutrient found in ${food.description}`,
                deficiency_symptoms: 'Consult healthcare provider for deficiency information',
                food_sources: JSON.stringify([food.description]),
                source: 'USDA FoodData Central',
                api_source: 'USDA FoodData Central API',
                imported_at: new Date().toISOString(),
                external_id: `${food.fdcId}_${nutrient.nutrientId}`,
                data_type: food.dataType
              }))
          );
      } else {
        transformedData = data.foods.map((food: any) => ({
          name: food.description,
          category: this.categorizeFoodType(food.description),
          brand: food.brandOwner || 'USDA',
          description: `USDA FoodData Central entry: ${food.description}`,
          ingredients: food.ingredients || 'Not specified',
          nutritional_profile: JSON.stringify(this.extractNutritionalProfile(food.foodNutrients || [])),
          source: 'USDA FoodData Central',
          api_source: 'USDA FoodData Central API',
          imported_at: new Date().toISOString(),
          external_id: food.fdcId.toString(),
          data_type: food.dataType,
          publication_date: food.publicationDate
        }));
      }

      // Validate and sanitize the data
      transformedData = ProductionDataValidator.validateAPIData(transformedData, 'USDA', dataType);
      transformedData = ProductionDataValidator.sanitizeAPIData(transformedData, 'USDA FoodData Central');
      transformedData = ProductionDataValidator.deduplicateData(transformedData);

      const responseTime = Date.now() - startTime;
      APIMonitoring.recordAPICall('USDA FoodData Central', true, responseTime);

      console.log(`✅ Successfully imported ${transformedData.length} real ${dataType} from USDA`);

      return {
        success: true,
        data: transformedData,
        metadata: {
          total: data.totalHits || transformedData.length,
          imported: transformedData.length,
          skipped: 0,
          errors: []
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      APIMonitoring.recordAPICall('USDA FoodData Central', false, responseTime, error.message);
      
      console.error('💥 USDA API integration failed:', error);
      return APIErrorHandler.handleError(error, 'USDA FoodData Central');
    }
  }

  /**
   * EPA ECOTOX Database - Real API Integration
   */
  static async importEPAData(apiKey: string, chemical: string = 'mercury'): Promise<APIResponse<any>> {
    const startTime = Date.now();
    console.log(`🏭 Starting EPA ECOTOX import for chemical: ${chemical}...`);
    
    try {
      if (!apiKey) {
        throw new Error('EPA API key is required. Register at: https://cfpub.epa.gov/ecotox/');
      }
      
      if (!rateLimiter.canMakeRequest('epa', RATE_LIMITS.EPA.requests, RATE_LIMITS.EPA.window)) {
        throw APIErrorHandler.createRateLimitError('EPA ECOTOX');
      }

      const endpoint = `${API_ENDPOINTS.EPA_ECOTOX}?chemical=${encodeURIComponent(chemical)}&limit=100`;

      console.log(`🔍 Fetching from EPA ECOTOX API: ${endpoint}`);

      const response = await APIErrorHandler.handleAPICall(
        () => fetch(endpoint, {
          method: 'GET',
          headers: {
            ...DEFAULT_HEADERS,
            'X-API-Key': apiKey
          }
        }),
        'EPA ECOTOX',
        25000
      );

      rateLimiter.recordRequest('epa');
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
        throw new Error(`No EPA ECOTOX data found for chemical: ${chemical}`);
      }

      const transformedData = data.results.map((record: any) => ({
        name: record.chemical_name || chemical,
        scientific_name: record.scientific_name,
        category: this.categorizePollutant(record.chemical_name),
        risk_level: this.assessRiskLevel(record.effect_measurement),
        description: `EPA ECOTOX data for ${record.chemical_name}`,
        health_effects: record.effect || 'Toxicity data available',
        exposure_routes: record.exposure_type || 'Various routes',
        safe_levels: record.effect_measurement ? `${record.effect_measurement} ${record.measurement_unit}` : 'See EPA guidelines',
        test_species: record.species_common_name,
        study_duration: record.study_duration_value,
        source: 'EPA ECOTOX',
        api_source: 'EPA ECOTOX API',
        imported_at: new Date().toISOString(),
        external_id: record.test_id || `epa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reference: record.reference
      }));

      // Validate and process the data
      const validatedData = ProductionDataValidator.validateAPIData(transformedData, 'EPA ECOTOX', 'pollutants');
      const sanitizedData = ProductionDataValidator.sanitizeAPIData(validatedData, 'EPA ECOTOX');
      const finalData = ProductionDataValidator.deduplicateData(sanitizedData);

      const responseTime = Date.now() - startTime;
      APIMonitoring.recordAPICall('EPA ECOTOX', true, responseTime);

      console.log(`✅ Successfully imported ${finalData.length} real pollutant records from EPA ECOTOX`);

      return {
        success: true,
        data: finalData,
        metadata: {
          total: data.total_results || finalData.length,
          imported: finalData.length,
          skipped: transformedData.length - finalData.length,
          errors: []
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      APIMonitoring.recordAPICall('EPA ECOTOX', false, responseTime, error.message);
      
      console.error('💥 EPA ECOTOX API integration failed:', error);
      return APIErrorHandler.handleError(error, 'EPA ECOTOX');
    }
  }

  // Helper methods for data categorization
  private static categorizeNutrient(nutrientName: string): string {
    const name = nutrientName.toLowerCase();
    if (name.includes('vitamin')) return 'Vitamins';
    if (name.includes('calcium') || name.includes('iron') || name.includes('zinc') || name.includes('magnesium')) return 'Minerals';
    if (name.includes('protein') || name.includes('amino')) return 'Amino Acids';
    if (name.includes('fat') || name.includes('fatty')) return 'Fatty Acids';
    if (name.includes('fiber')) return 'Fiber';
    if (name.includes('carbohydrate') || name.includes('sugar')) return 'Carbohydrates';
    return 'General Nutrients';
  }

  private static categorizeFoodType(description: string): string {
    const desc = description.toLowerCase();
    if (desc.includes('milk') || desc.includes('cheese') || desc.includes('yogurt')) return 'Dairy Products';
    if (desc.includes('meat') || desc.includes('beef') || desc.includes('chicken') || desc.includes('pork')) return 'Meat & Poultry';
    if (desc.includes('fish') || desc.includes('seafood') || desc.includes('salmon')) return 'Seafood';
    if (desc.includes('fruit') || desc.includes('apple') || desc.includes('banana')) return 'Fruits';
    if (desc.includes('vegetable') || desc.includes('carrot') || desc.includes('spinach')) return 'Vegetables';
    if (desc.includes('bread') || desc.includes('cereal') || desc.includes('grain')) return 'Grains & Cereals';
    return 'General Foods';
  }

  private static categorizePollutant(chemicalName: string): string {
    const name = (chemicalName || '').toLowerCase();
    if (name.includes('mercury') || name.includes('lead') || name.includes('cadmium')) return 'Heavy Metals';
    if (name.includes('pesticide') || name.includes('herbicide')) return 'Pesticides';
    if (name.includes('dioxin') || name.includes('pcb')) return 'Industrial Chemicals';
    if (name.includes('pm2.5') || name.includes('ozone')) return 'Air Pollutants';
    return 'Chemical Contaminants';
  }

  private static assessRiskLevel(effectMeasurement: any): string {
    if (!effectMeasurement) return 'Unknown';
    const value = parseFloat(effectMeasurement);
    if (isNaN(value)) return 'Unknown';
    
    // This is a simplified risk assessment - in production, use proper EPA guidelines
    if (value < 1) return 'High';
    if (value < 10) return 'Moderate';
    if (value < 100) return 'Low';
    return 'Very Low';
  }

  private static extractNutritionalProfile(nutrients: any[]): object {
    const profile: any = {};
    nutrients.forEach(nutrient => {
      if (nutrient.nutrientName && nutrient.value != null) {
        const key = nutrient.nutrientName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        profile[key] = {
          value: nutrient.value,
          unit: nutrient.unitName
        };
      }
    });
    return profile;
  }
}