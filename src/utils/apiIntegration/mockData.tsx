/**
 * Production Data Utilities
 * No mock data generation - production environment only uses real APIs
 */

// This file previously contained mock data generators
// In production mode, all data comes from real external APIs

export class ProductionDataValidator {
  /**
   * Validates data received from real APIs
   */
  static validateAPIData(data: any[], source: string, dataType: string): any[] {
    if (!Array.isArray(data)) {
      throw new Error(`Invalid data format from ${source}: expected array, got ${typeof data}`);
    }

    const validatedData = data.filter(item => {
      // Basic validation for all data types
      if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
        console.warn(`${source}: Skipping item with invalid name:`, item);
        return false;
      }

      // Data type specific validation
      switch (dataType) {
        case 'products':
          return item.name && (item.brand || item.category);
        case 'ingredients':
          return item.name && item.name.length > 1 && item.name.length < 100;
        case 'nutrients':
          return item.name && (item.unit || item.rdi !== undefined);
        case 'pollutants':
          return item.name && (item.risk_level || item.category);
        case 'parasites':
          return item.name && (item.scientific_name || item.common_name);
        default:
          return true;
      }
    });

    console.log(`${source}: Validated ${validatedData.length}/${data.length} ${dataType} records`);
    return validatedData;
  }

  /**
   * Sanitizes data from external APIs
   */
  static sanitizeAPIData(data: any[], source: string): any[] {
    return data.map(item => ({
      ...item,
      // Sanitize text fields
      name: this.sanitizeText(item.name),
      description: item.description ? this.sanitizeText(item.description) : undefined,
      brand: item.brand ? this.sanitizeText(item.brand) : undefined,
      category: item.category ? this.sanitizeText(item.category) : undefined,
      
      // Add metadata
      source: source,
      imported_at: new Date().toISOString(),
      data_quality: 'production_api'
    }));
  }

  /**
   * Sanitizes text content from APIs
   */
  private static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 500); // Limit length
  }

  /**
   * Deduplicates data based on name and external_id
   */
  static deduplicateData(data: any[]): any[] {
    const seen = new Set();
    return data.filter(item => {
      const key = `${item.name}_${item.external_id || ''}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Production environment checker
export class ProductionEnvironment {
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production' || 
           window.location.hostname !== 'localhost';
  }

  static validateProductionSetup(): void {
    if (this.isProduction()) {
      console.log('🚀 Running in PRODUCTION mode - using real APIs only');
      
      // Check for required environment variables
      const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
      const missing = requiredVars.filter(varName => !process.env[varName]);
      
      if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing);
        throw new Error(`Production environment requires: ${missing.join(', ')}`);
      }
    } else {
      console.log('🏗️ Running in DEVELOPMENT mode - still using real APIs only');
    }
  }

  static logAPIUsage(apiName: string, endpoint: string, responseTime: number): void {
    console.log(`📊 API Usage: ${apiName}`, {
      endpoint: endpoint.replace(/api_key=[^&]+/g, 'api_key=[HIDDEN]'),
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  }
}

// Initialize production environment validation
ProductionEnvironment.validateProductionSetup();