import { projectId, publicAnonKey } from './supabase/info';

interface ServerHealthStatus {
  healthy: boolean;
  timestamp: number;
  responseTime?: number;
  error?: string;
  fallbackActive: boolean;
}

interface DatabaseStats {
  totalRecords: number;
  categoryBreakdown: Record<string, number>;
  recentActivity: number;
  dataQuality: number;
}

class ServerHealthManager {
  private healthCache: ServerHealthStatus | null = null;
  private cacheExpiry = 300000; // 5 minutes (much longer cache)
  private retryAttempts = 0;
  private maxRetries = 2; // Reduced retries
  private retryDelay = 2000; // 2 seconds

  private fallbackStats: DatabaseStats = {
    totalRecords: 0,
    categoryBreakdown: {
      nutrients: 0,
      products: 0,
      ingredients: 0,
      pollutants: 0,
      parasites: 0,
      meals: 0,
      scans: 0
    },
    recentActivity: 0,
    dataQuality: 85
  };

  async checkServerHealth(timeout: number = 5000): Promise<ServerHealthStatus> {
    // Return cached result if still valid
    if (this.healthCache && Date.now() - this.healthCache.timestamp < this.cacheExpiry) {
      return this.healthCache;
    }

    const startTime = Date.now();
    
    try {
      console.log('🔍 Checking server health...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Try lightweight ping endpoint first
      let response;
      try {
        response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/ping`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
      } catch (primaryError) {
        // Silently try fallback without logging common network errors
        const commonErrors = ['Failed to fetch', 'AbortError', 'NetworkError'];
        const isCommonError = commonErrors.some(err => primaryError.message?.includes(err));
        
        // Silent fallback - this is expected behavior during server startup/recovery
        // No logging needed as this is handled gracefully
        
        // Try fallback health endpoint
        response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      this.healthCache = {
        healthy: true,
        timestamp: Date.now(),
        responseTime,
        fallbackActive: false
      };

      this.retryAttempts = 0; // Reset retry count on success
      console.log(`✅ Server health check passed (${responseTime}ms)`);
      
      return this.healthCache;

    } catch (error: any) {
      // Only log if it's not a common network error
      const commonErrors = ['Failed to fetch', 'AbortError', 'NetworkError', 'signal is aborted without reason'];
      const isCommonError = commonErrors.some(commonError => error.message.includes(commonError));
      
      if (!isCommonError) {
        console.warn(`⚠️ Server health check failed: ${error.message}`);
      }
      
      this.healthCache = {
        healthy: false,
        timestamp: Date.now(),
        error: error.message,
        fallbackActive: true
      };

      return this.healthCache;
    }
  }

  async fetchDatabaseStats(timeout: number = 8000): Promise<DatabaseStats> {
    try {
      console.log('📊 Fetching database stats...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Try primary stats endpoint first
      let response;
      try {
        response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
      } catch (primaryError) {
        // Silently try fallback without logging common network errors
        const commonErrors = ['Failed to fetch', 'AbortError', 'NetworkError'];
        const isCommonError = commonErrors.some(err => primaryError.message?.includes(err));
        
        // Silent fallback - this is expected behavior, no logging needed
        
        // Try fallback database-stats endpoint
        response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/database-stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('⚠️ Stats endpoints not available, using fallback data');
          return this.fallbackStats;
        }
        throw new Error(`Stats request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success || data.totalRecords !== undefined || data.nutrients !== undefined) {
        console.log('✅ Database stats fetched successfully');
        
        // Handle multiple response formats
        let stats;
        if (data.stats) {
          // New format with nested stats
          stats = data.stats;
        } else if (data.totalRecords !== undefined) {
          // Direct format
          stats = {
            totalRecords: data.totalRecords || 0,
            categoryBreakdown: data.categoryBreakdown || {},
            recentActivity: data.recentActivity || 0,
            dataQuality: data.dataQuality || 0
          };
        } else {
          // Legacy format with individual counters
          const categoryBreakdown = {
            nutrients: data.nutrients || 0,
            products: data.products || 0,
            ingredients: data.ingredients || 0,
            pollutants: data.pollutants || 0,
            parasites: data.parasites || 0,
            meals: data.meals || 0,
            scans: data.scans || 0,
            waitlist: data.waitlist || 0
          };
          
          const totalRecords = Object.values(categoryBreakdown).reduce((sum, count) => sum + count, 0);
          
          stats = {
            totalRecords,
            categoryBreakdown,
            recentActivity: Math.min(totalRecords, 100),
            dataQuality: totalRecords > 0 ? 75 : 25
          };
        }
        
        return stats;
      } else {
        console.warn('⚠️ Unexpected stats response format, using fallback');
        return this.fallbackStats;
      }

    } catch (error: any) {
      // Only log non-common errors to reduce noise
      const commonErrors = ['Failed to fetch', 'AbortError', 'NetworkError', 'signal is aborted without reason', '404'];
      const isCommonError = commonErrors.some(commonError => 
        error.name.includes(commonError) || error.message.includes(commonError)
      );
      
      if (!isCommonError) {
        console.warn(`❌ Error fetching database stats: ${error.name}: ${error.message}`);
      }
      
      if (error.name === 'AbortError') {
        // Silent timeout handling
      } else if (error.message.includes('404')) {
        // Silent 404 handling
      }
      
      return this.fallbackStats;
    }
  }

  async fetchCategoryBreakdown(timeout: number = 6000): Promise<Record<string, number>> {
    try {
      const stats = await this.fetchDatabaseStats(timeout);
      return stats.categoryBreakdown;
    } catch (error: any) {
      // Only log non-common errors to reduce noise
      const commonErrors = ['Failed to fetch', 'AbortError', 'NetworkError', 'signal is aborted without reason'];
      const isCommonError = commonErrors.some(commonError => 
        error.name.includes(commonError) || error.message.includes(commonError)
      );
      
      if (!isCommonError) {
        console.warn(`❌ Error fetching category breakdowns: ${error.name}: ${error.message}`);
      }
      
      return this.fallbackStats.categoryBreakdown;
    }
  }

  async withRetry<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  getServerStatus(): 'healthy' | 'unhealthy' | 'unknown' {
    if (!this.healthCache) return 'unknown';
    if (Date.now() - this.healthCache.timestamp > this.cacheExpiry) return 'unknown';
    return this.healthCache.healthy ? 'healthy' : 'unhealthy';
  }

  clearCache(): void {
    this.healthCache = null;
    this.retryAttempts = 0;
  }

  isUsingFallback(): boolean {
    return this.healthCache?.fallbackActive ?? false;
  }
}

// Export singleton instance
export const serverHealthManager = new ServerHealthManager();

// Convenience functions
export async function checkServerHealth(timeout?: number): Promise<ServerHealthStatus> {
  return serverHealthManager.checkServerHealth(timeout);
}

export async function fetchDatabaseStats(timeout?: number): Promise<DatabaseStats> {
  return serverHealthManager.fetchDatabaseStats(timeout);
}

export async function fetchCategoryBreakdown(timeout?: number): Promise<Record<string, number>> {
  return serverHealthManager.fetchCategoryBreakdown(timeout);
}

export function getServerStatus(): 'healthy' | 'unhealthy' | 'unknown' {
  return serverHealthManager.getServerStatus();
}

export function isUsingFallbackData(): boolean {
  return serverHealthManager.isUsingFallback();
}

export function clearServerHealthCache(): void {
  serverHealthManager.clearCache();
}

// Health check with graceful degradation
export async function safeServerRequest<T>(
  requestFn: () => Promise<T>,
  fallbackValue: T,
  timeout: number = 5000
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const result = await Promise.race([
      requestFn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
    
    clearTimeout(timeoutId);
    return result;
    
  } catch (error: any) {
    // Only log non-common errors to reduce noise
    const commonErrors = ['Failed to fetch', 'AbortError', 'NetworkError', 'Request timeout'];
    const isCommonError = commonErrors.some(commonError => error.message.includes(commonError));
    
    if (!isCommonError) {
      console.warn(`⚠️ Server request failed, using fallback: ${error.message}`);
    }
    
    return fallbackValue;
  }
}

// Initialize health monitoring
let healthCheckInterval: NodeJS.Timeout | null = null;

export function startHealthMonitoring(intervalMs: number = 300000): void {
  // Prevent duplicate intervals
  if (healthCheckInterval) {
    console.log('🏥 Health monitoring already running, skipping duplicate start');
    return;
  }
  
  // Only start monitoring if we're in a browser environment
  if (typeof window === 'undefined') {
    return;
  }
  
  healthCheckInterval = setInterval(async () => {
    try {
      // Only perform health check if we haven't checked recently
      const currentStatus = serverHealthManager.getServerStatus();
      if (currentStatus !== 'unknown') {
        // Skip this check if we have recent data
        return;
      }
      
      await serverHealthManager.checkServerHealth(5000);
    } catch (error: any) {
      // Completely silent background checks to avoid console spam
      // Health issues will be detected when actually needed by UI components
    }
  }, intervalMs);
  
  console.log(`🏥 Started server health monitoring (${intervalMs / 1000}s interval)`);
}

export function stopHealthMonitoring(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('🛑 Stopped server health monitoring');
  }
}

// Auto-start monitoring removed - will be managed by App.tsx for admin users only