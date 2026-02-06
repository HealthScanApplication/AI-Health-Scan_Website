/**
 * API Integration Utilities - Main Export File
 * Refactored into smaller, focused modules for better maintainability
 */

// Re-export all constants, types, and interfaces
export * from './apiIntegration/constants';

// Re-export utility classes
export { rateLimiter, RateLimiter } from './apiIntegration/rateLimiting';
export { APIErrorHandler } from './apiIntegration/errorHandling';
export { MockDataGenerator } from './apiIntegration/mockData';

// Re-export API integration classes
export { EuropeanAPIs } from './apiIntegration/europeanAPIs';
export { USAPIs } from './apiIntegration/usAPIs';
export { GlobalAPIs } from './apiIntegration/globalAPIs';

// Utility functions for data transformation and validation
export class DataTransformUtils {
  
  static validateNutrientData(data: any): boolean {
    return !!(data.name && data.category && data.unit);
  }

  static validateIngredientData(data: any): boolean {
    return !!(data.name && data.category);
  }

  static validatePollutantData(data: any): boolean {
    return !!(data.name && data.category && data.risk_level);
  }

  static validateProductData(data: any): boolean {
    return !!(data.name && data.category);
  }

  static sanitizeData(data: any): any {
    // Remove null/undefined values and sanitize strings
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === null || sanitized[key] === undefined) {
        delete sanitized[key];
      } else if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim().substring(0, 1000); // Limit string length
      }
    });

    return sanitized;
  }

  static generateUniqueId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static mapDataTypeToTable(dataType: string): string {
    const mapping: Record<string, string> = {
      'nutrients': 'nutrients',
      'ingredients': 'ingredients',
      'products': 'products',
      'pollutants': 'pollutants',
      'parasites': 'parasites',
      'scans': 'scans',
      'meals': 'meals'
    };
    return mapping[dataType] || 'unknown';
  }

  static formatApiResponse<T>(data: T[], source: string, total?: number): {
    success: boolean;
    data: T[];
    metadata: {
      total: number;
      imported: number;
      skipped: number;
      errors: string[];
    };
  } {
    return {
      success: true,
      data,
      metadata: {
        total: total || data.length,
        imported: data.length,
        skipped: 0,
        errors: []
      }
    };
  }
}

// Main API integration orchestrator
export class APIIntegrationOrchestrator {
  static async importFromSource(
    source: string,
    dataType: string,
    apiKey?: string,
    additionalParams?: any
  ) {
    console.log(`🔄 Starting import from ${source} for ${dataType}`);
    
    try {
      switch (source.toLowerCase()) {
        case 'efsa':
          return await EuropeanAPIs.importEFSAData(dataType as 'pollutants' | 'parasites');
        case 'ciqual':
          return await EuropeanAPIs.importCIQUALData();
        case 'eurofir':
          return await EuropeanAPIs.importEuroFIRData(apiKey || '');
        case 'usda':
          return await USAPIs.importUSDAData(apiKey || '', dataType as 'nutrients' | 'products');
        case 'epa':
          return await USAPIs.importEPAData(apiKey);
        case 'fda':
          return await USAPIs.importFDAData();
        case 'openfood':
        case 'openfoodfacts':
          return await GlobalAPIs.importOpenFoodFactsData(dataType as 'products' | 'ingredients');
        case 'spoonacular':
          return await GlobalAPIs.importSpoonacularData(apiKey || '', dataType as 'ingredients' | 'products');
        case 'nutritionix':
          return await GlobalAPIs.importNutritionixData(
            additionalParams?.appId || '',
            additionalParams?.appKey || apiKey || ''
          );
        default:
          throw new Error(`Unsupported API source: ${source}`);
      }
    } catch (error) {
      console.error(`❌ Import failed for ${source}:`, error);
      return APIErrorHandler.handleError(error, source);
    }
  }
}

// Export the toast utility for backward compatibility
export { toast } from 'sonner';