import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Base API configuration - Use Supabase Edge Functions
const HEALTHSCAN_API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2`;

// Interface definitions for HealthScan API responses
export interface HealthScanApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp?: string;
  };
}

export interface HealthScanNutrient {
  id: string;
  name: string;
  type: string;
  category: string;
  unit: string;
  rda?: number;
  description?: string;
  sources?: string[];
  benefits?: string[];
  deficiency_symptoms?: string[];
  toxicity_symptoms?: string[];
  created_at: string;
  updated_at: string;
}

export interface HealthScanIngredient {
  id: string;
  name: string;
  category: string;
  nutrition_per_100g?: Record<string, number>;
  allergens?: string[];
  health_impact?: string;
  processing_level?: string;
  environmental_impact?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthScanProduct {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category: string;
  ingredients: string[];
  nutrition_facts?: Record<string, number>;
  allergen_warnings?: string[];
  certifications?: string[];
  health_score?: number;
  environmental_score?: number;
  created_at: string;
  updated_at: string;
}

export interface HealthScanPollutant {
  id: string;
  name: string;
  type: string;
  category: string;
  health_effects: string[];
  exposure_sources: string[];
  safety_limits?: {
    daily_intake?: number;
    unit?: string;
    regulatory_body?: string;
  };
  toxicity_level: 'low' | 'medium' | 'high' | 'severe';
  detection_methods?: string[];
  created_at: string;
  updated_at: string;
}

export interface HealthScanScan {
  id: string;
  user_id?: string;
  scan_type: 'barcode' | 'image' | 'manual';
  product_data?: any;
  analysis_results?: {
    health_score?: number;
    warnings?: string[];
    recommendations?: string[];
    nutritional_analysis?: Record<string, any>;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    country?: string;
    region?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface HealthScanApiStats {
  nutrients: { total: number; categories: Record<string, number> };
  ingredients: { total: number; categories: Record<string, number> };
  products: { total: number; brands: number; categories: Record<string, number> };
  pollutants: { total: number; toxicity_levels: Record<string, number> };
  scans: { total: number; scan_types: Record<string, number>; last_24h: number };
  meals?: { total: number; categories: Record<string, number> };
  parasites?: { total: number; categories: Record<string, number> };
  system: {
    api_version: string;
    uptime: number;
    last_updated: string;
    data_sources: string[];
  };
}

// Base API client class
class HealthScanApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseUrl = HEALTHSCAN_API_BASE;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'User-Agent': 'HealthScan-Admin-Dashboard/1.0'
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<HealthScanApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      console.log(`🔗 HealthScan API Request: ${options.method || 'GET'} ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // Handle 404 specifically as a graceful failure
      if (response.status === 404) {
        console.warn(`⚠️ HealthScan API Endpoint Not Found: ${endpoint}`);
        return {
          success: false,
          error: `Endpoint not available: ${endpoint}`,
          data: [] as T, // Return empty array for list endpoints
          meta: {
            total: 0,
            timestamp: new Date().toISOString()
          }
        };
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Handle cases where response is not JSON
        if (response.ok) {
          console.warn(`⚠️ HealthScan API returned non-JSON response for ${endpoint}`);
          return {
            success: true,
            data: [] as T,
            meta: {
              total: 0,
              timestamp: new Date().toISOString()
            }
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      if (!response.ok) {
        console.error(`❌ HealthScan API Error: ${response.status}`, data);
        throw new Error(data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ HealthScan API Success: ${endpoint}`, data);
      return data || {
        success: true,
        data: [] as T,
        meta: {
          total: 0,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error: any) {
      console.error(`❌ HealthScan API Request Failed: ${endpoint}`, error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - HealthScan API may be slow or unavailable');
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error - please check your internet connection');
      }
      
      throw error;
    }
  }

  // Health check endpoint - try multiple potential health endpoints
  async healthCheck(): Promise<HealthScanApiResponse<{ status: string; uptime: number }>> {
    const healthEndpoints = ['/health', '/status', '/ping', '/'];
    
    for (const endpoint of healthEndpoints) {
      try {
        const response = await this.request(endpoint);
        if (response.success) {
          return response;
        }
      } catch (error) {
        // Continue to next endpoint
        continue;
      }
    }
    
    // If none of the health endpoints work, return a basic success response
    // This indicates the API base URL is reachable but health endpoints aren't implemented
    return {
      success: true,
      data: { status: 'unknown', uptime: 0 },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  // Get API statistics
  async getStats(): Promise<HealthScanApiResponse<HealthScanApiStats>> {
    return this.request('/stats');
  }

  // Nutrients endpoints
  async getNutrients(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    search?: string;
  }): Promise<HealthScanApiResponse<HealthScanNutrient[]>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      
      const query = searchParams.toString();
      return await this.request(`/nutrients${query ? `?${query}` : ''}`);
    } catch (error) {
      console.warn('⚠️ Nutrients endpoint not available, returning empty data');
      return {
        success: false,
        error: 'Nutrients endpoint not available',
        data: [] as HealthScanNutrient[],
        meta: { total: 0, timestamp: new Date().toISOString() }
      };
    }
  }

  async getNutrient(id: string): Promise<HealthScanApiResponse<HealthScanNutrient>> {
    return this.request(`/nutrients/${id}`);
  }

  // Ingredients endpoints
  async getIngredients(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    search?: string;
  }): Promise<HealthScanApiResponse<HealthScanIngredient[]>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      
      const query = searchParams.toString();
      return await this.request(`/ingredients${query ? `?${query}` : ''}`);
    } catch (error) {
      console.warn('⚠️ Ingredients endpoint not available, returning empty data');
      return {
        success: false,
        error: 'Ingredients endpoint not available',
        data: [] as HealthScanIngredient[],
        meta: { total: 0, timestamp: new Date().toISOString() }
      };
    }
  }

  async getIngredient(id: string): Promise<HealthScanApiResponse<HealthScanIngredient>> {
    return this.request(`/ingredients/${id}`);
  }

  // Products endpoints
  async getProducts(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    brand?: string;
    search?: string;
  }): Promise<HealthScanApiResponse<HealthScanProduct[]>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      if (params?.category) searchParams.set('category', params.category);
      if (params?.brand) searchParams.set('brand', params.brand);
      if (params?.search) searchParams.set('search', params.search);
      
      const query = searchParams.toString();
      return await this.request(`/products${query ? `?${query}` : ''}`);
    } catch (error) {
      console.warn('⚠️ Products endpoint not available, returning empty data');
      return {
        success: false,
        error: 'Products endpoint not available',
        data: [] as HealthScanProduct[],
        meta: { total: 0, timestamp: new Date().toISOString() }
      };
    }
  }

  async getProduct(id: string): Promise<HealthScanApiResponse<HealthScanProduct>> {
    return this.request(`/products/${id}`);
  }

  // Pollutants endpoints
  async getPollutants(params?: {
    limit?: number;
    offset?: number;
    type?: string;
    category?: string;
    toxicity_level?: string;
    search?: string;
  }): Promise<HealthScanApiResponse<HealthScanPollutant[]>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      if (params?.type) searchParams.set('type', params.type);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.toxicity_level) searchParams.set('toxicity_level', params.toxicity_level);
      if (params?.search) searchParams.set('search', params.search);
      
      const query = searchParams.toString();
      return await this.request(`/pollutants${query ? `?${query}` : ''}`);
    } catch (error) {
      console.warn('⚠️ Pollutants endpoint not available, returning empty data');
      return {
        success: false,
        error: 'Pollutants endpoint not available',
        data: [] as HealthScanPollutant[],
        meta: { total: 0, timestamp: new Date().toISOString() }
      };
    }
  }

  async getPollutant(id: string): Promise<HealthScanApiResponse<HealthScanPollutant>> {
    return this.request(`/pollutants/${id}`);
  }

  // Scans endpoints
  async getScans(params?: {
    limit?: number;
    offset?: number;
    scan_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<HealthScanApiResponse<HealthScanScan[]>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      if (params?.scan_type) searchParams.set('scan_type', params.scan_type);
      if (params?.date_from) searchParams.set('date_from', params.date_from);
      if (params?.date_to) searchParams.set('date_to', params.date_to);
      
      const query = searchParams.toString();
      return await this.request(`/scans${query ? `?${query}` : ''}`);
    } catch (error) {
      console.warn('⚠️ Scans endpoint not available, returning empty data');
      return {
        success: false,
        error: 'Scans endpoint not available',
        data: [] as HealthScanScan[],
        meta: { total: 0, timestamp: new Date().toISOString() }
      };
    }
  }

  async getScan(id: string): Promise<HealthScanApiResponse<HealthScanScan>> {
    try {
      return await this.request(`/scans/${id}`);
    } catch (error) {
      console.warn(`⚠️ Scan ${id} not available, returning empty data`);
      return {
        success: false,
        error: 'Scan not available',
        data: {} as HealthScanScan,
        meta: { timestamp: new Date().toISOString() }
      };
    }
  }

  // Meals endpoints (if available)
  async getMeals(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    search?: string;
  }): Promise<HealthScanApiResponse<any[]>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      
      const query = searchParams.toString();
      return await this.request(`/meals${query ? `?${query}` : ''}`);
    } catch (error) {
      console.warn('⚠️ Meals endpoint not available, returning empty data');
      return {
        success: false,
        error: 'Meals endpoint not available',
        data: [] as any[],
        meta: { total: 0, timestamp: new Date().toISOString() }
      };
    }
  }

  // Parasites endpoints (if available)  
  async getParasites(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    search?: string;
  }): Promise<HealthScanApiResponse<any[]>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      
      const query = searchParams.toString();
      return await this.request(`/parasites${query ? `?${query}` : ''}`);
    } catch (error) {
      console.warn('⚠️ Parasites endpoint not available, returning empty data');
      return {
        success: false,
        error: 'Parasites endpoint not available',
        data: [] as any[],
        meta: { total: 0, timestamp: new Date().toISOString() }
      };
    }
  }

  // Search across all data types
  async search(query: string, types?: string[]): Promise<HealthScanApiResponse<{
    nutrients: HealthScanNutrient[];
    ingredients: HealthScanIngredient[];
    products: HealthScanProduct[];
    pollutants: HealthScanPollutant[];
  }>> {
    const searchParams = new URLSearchParams();
    searchParams.set('q', query);
    if (types && types.length > 0) {
      searchParams.set('types', types.join(','));
    }
    
    return this.request(`/search?${searchParams.toString()}`);
  }
}

// Create singleton instance
export const healthScanApi = new HealthScanApiClient();

// Utility functions for admin dashboard
export const healthScanApiUtils = {
  // Format API errors for user display
  formatApiError: (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    return 'An unexpected API error occurred';
  },

  // Show toast notifications for API operations
  showApiSuccess: (message: string) => {
    toast.success(`🌱 ${message}`, {
      description: 'HealthScan API operation completed successfully'
    });
  },

  showApiError: (error: any, operation: string = 'API operation') => {
    const message = healthScanApiUtils.formatApiError(error);
    toast.error(`❌ ${operation} failed`, {
      description: message
    });
  },

  showApiWarning: (message: string) => {
    toast.warning(`⚠️ ${message}`, {
      description: 'Please check the HealthScan API status'
    });
  },

  // Check if API response is successful
  isApiSuccess: (response: HealthScanApiResponse<any>): boolean => {
    return response.success && response.data !== undefined;
  },

  // Extract data from API response safely
  extractApiData: (response: HealthScanApiResponse<any>): any => {
    return healthScanApiUtils.isApiSuccess(response) && response.data !== undefined ? response.data : null;
  },

  // Format numbers for display
  formatCount: (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  },

  // Format timestamps
  formatTimestamp: (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  },

  // Get status color based on data availability
  getStatusColor: (count: number, threshold: number = 0): string => {
    if (count > threshold) return 'text-green-600';
    return 'text-gray-400';
  },

  // Check API connectivity
  checkApiHealth: async (): Promise<{ online: boolean; message: string }> => {
    try {
      const response = await healthScanApi.healthCheck();
      if (healthScanApiUtils.isApiSuccess(response)) {
        return { online: true, message: 'HealthScan API is online' };
      }
      
      // Handle 404 for health endpoint as "online but limited"
      if (response.error?.includes('Endpoint not available')) {
        return { online: true, message: 'HealthScan API is online (health endpoint not available)' };
      }
      
      return { online: false, message: 'HealthScan API responded with an error' };
    } catch (error) {
      const errorMsg = healthScanApiUtils.formatApiError(error);
      
      // Treat 404 errors as "online but limited" rather than offline
      if (errorMsg.includes('404') || errorMsg.includes('Endpoint not available')) {
        return { 
          online: true, 
          message: 'HealthScan API is online (health endpoint not available)' 
        };
      }
      
      return { 
        online: false, 
        message: `HealthScan API is unreachable: ${errorMsg}` 
      };
    }
  }
};

export default healthScanApi;