import { projectId, publicAnonKey } from '../utils/supabase/info'
import { 
  ApiErrorHandler, 
  fetchWithErrorHandling, 
  postWithErrorHandling, 
  deleteWithErrorHandling,
  type ApiResponse,
  handleAdminApiError
} from '../utils/apiErrorHandler'
import { toast } from 'sonner@2.0.3'

// Base URL for all admin API calls
const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2`

// Standard headers for admin requests
const getAuthHeaders = (accessToken: string) => ({
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
})

export interface AdminStats {
  nutrients: { total: number; withImages: number; table: string; category: string }
  ingredients: { total: number; withImages: number; table: string; category: string }
  products: { total: number; withImages: number; table: string; category: string }
  pollutants: { total: number; withImages: number; table: string; category: string }
  scans: { total: number; withImages: number; table: string; category: string }
  meals: { total: number; withImages: number; table: string; category: string }
  parasites: { total: number; withImages: number; table: string; category: string }
  users: { total: number; confirmed: number }
}

export class AdminApiService {
  // Fetch admin statistics with proper error handling
  static async fetchAdminStats(accessToken: string): Promise<AdminStats> {
    console.log('📊 Fetching admin statistics...')
    
    const response = await fetchWithErrorHandling<any>(
      `${BASE_URL}/admin/stats`,
      {
        method: 'GET',
        headers: getAuthHeaders(accessToken),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      },
      'fetch admin statistics'
    )

    if (ApiErrorHandler.isApiError(response)) {
      handleAdminApiError(response, 'fetch statistics')
      return this.getFallbackStats()
    }

    // Transform the response to match expected format
    if (response.data && response.data.detailedStats) {
      return this.transformServerStats(response.data.detailedStats)
    } else {
      console.warn('⚠️ Unexpected stats response format:', response)
      return this.getFallbackStats()
    }
  }

  // Fetch data by type with comprehensive error handling
  static async fetchDataByType<T>(
    dataType: string,
    accessToken: string,
    timeout = 15000
  ): Promise<T[]> {
    console.log(`📊 Fetching ${dataType}...`)
    
    const response = await fetchWithErrorHandling<T[]>(
      `${BASE_URL}/${dataType}`,
      {
        method: 'GET',
        headers: getAuthHeaders(accessToken),
        signal: AbortSignal.timeout(timeout)
      },
      `fetch ${dataType}`
    )

    if (ApiErrorHandler.isApiError(response)) {
      // Handle specific error types
      if (response.code === 404) {
        console.info(`ℹ️ No ${dataType} found - this is expected for new installations`)
        toast.info(`No ${dataType} data found. This is normal for new installations.`, { duration: 3000 })
        return []
      } else {
        handleAdminApiError(response, `fetch ${dataType}`)
        return []
      }
    }

    if (Array.isArray(response.data)) {
      console.log(`✅ Retrieved ${response.data.length} ${dataType}`)
      return response.data
    } else {
      console.warn(`⚠️ Expected array for ${dataType}, got:`, response.data)
      return []
    }
  }

  // Save data with error handling
  static async saveData<T>(
    dataType: string,
    data: T,
    accessToken: string
  ): Promise<boolean> {
    console.log(`💾 Saving ${dataType}...`)
    
    const response = await postWithErrorHandling<T>(
      `${BASE_URL}/${dataType}`,
      data,
      {
        headers: getAuthHeaders(accessToken),
        signal: AbortSignal.timeout(10000)
      },
      `save ${dataType}`
    )

    if (ApiErrorHandler.isApiError(response)) {
      handleAdminApiError(response, `save ${dataType}`)
      return false
    }

    console.log(`✅ ${dataType} saved successfully`)
    toast.success(`${dataType.slice(0, -1)} saved successfully!`)
    return true
  }

  // Delete data with error handling
  static async deleteData(
    dataType: string,
    id: string,
    accessToken: string
  ): Promise<boolean> {
    console.log(`🗑️ Deleting ${dataType}/${id}...`)
    
    const response = await deleteWithErrorHandling<any>(
      `${BASE_URL}/${dataType}/${id}`,
      {
        headers: getAuthHeaders(accessToken),
        signal: AbortSignal.timeout(10000)
      },
      `delete ${dataType}`
    )

    if (ApiErrorHandler.isApiError(response)) {
      handleAdminApiError(response, `delete ${dataType}`)
      return false
    }

    console.log(`✅ ${dataType}/${id} deleted successfully`)
    toast.success(`${dataType.slice(0, -1)} deleted successfully!`)
    return true
  }

  // Bulk operations with error handling
  static async bulkSaveData<T>(
    dataType: string,
    dataArray: T[],
    accessToken: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<number> {
    console.log(`📦 Bulk saving ${dataArray.length} ${dataType}...`)
    let successCount = 0

    for (let i = 0; i < dataArray.length; i++) {
      const item = dataArray[i]
      const success = await this.saveData(dataType, item, accessToken)
      
      if (success) {
        successCount++
      }
      
      onProgress?.(i + 1, dataArray.length)
      
      // Small delay to prevent overwhelming the server
      if (i < dataArray.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`✅ Bulk save complete: ${successCount}/${dataArray.length} ${dataType} saved`)
    return successCount
  }

  // Health check with error handling
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetchWithErrorHandling<any>(
        `${BASE_URL}/health`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        },
        'health check'
      )

      if (ApiErrorHandler.isApiSuccess(response)) {
        console.log('✅ Server health check passed')
        return true
      } else {
        console.warn('⚠️ Server health check failed')
        return false
      }
    } catch (error) {
      console.error('❌ Health check error:', error)
      return false
    }
  }

  // Utility methods
  private static transformServerStats(detailedStats: any): AdminStats {
    const transformed: Partial<AdminStats> = {}
    
    Object.keys(detailedStats).forEach(key => {
      const stat = detailedStats[key]
      if (key in this.getDefaultStats()) {
        transformed[key as keyof AdminStats] = {
          total: stat?.current || stat?.total || 0,
          withImages: stat?.withImages || 0
        } as any
      }
    })
    
    return { ...this.getDefaultStats(), ...transformed } as AdminStats
  }

  private static getDefaultStats(): AdminStats {
    return {
      nutrients: { total: 0, withImages: 0 },
      ingredients: { total: 0, withImages: 0 },
      products: { total: 0, withImages: 0 },
      pollutants: { total: 0, withImages: 0 },
      scans: { total: 0, withImages: 0 },
      meals: { total: 0, withImages: 0 },
      parasites: { total: 0, withImages: 0 },
      users: { total: 0, confirmed: 0 }
    }
  }

  private static getFallbackStats(): AdminStats {
    console.warn('⚠️ Using fallback stats due to API failure')
    return this.getDefaultStats()
  }

  // Specific data type methods with proper error handling
  static async fetchNutrients(accessToken: string) {
    return this.fetchDataByType('nutrients', accessToken)
  }

  static async fetchIngredients(accessToken: string) {
    return this.fetchDataByType('ingredients', accessToken)
  }

  static async fetchProducts(accessToken: string) {
    return this.fetchDataByType('products', accessToken)
  }

  static async fetchPollutants(accessToken: string) {
    return this.fetchDataByType('pollutants', accessToken)
  }

  static async fetchScans(accessToken: string) {
    return this.fetchDataByType('scans', accessToken)
  }

  static async fetchMeals(accessToken: string) {
    return this.fetchDataByType('meals', accessToken)
  }

  static async fetchParasites(accessToken: string) {
    return this.fetchDataByType('parasites', accessToken)
  }

  // Testing and validation methods
  static async validateConnection(accessToken: string): Promise<{
    connected: boolean
    endpoints: Array<{ name: string; status: 'ok' | 'error' | 'missing'; message?: string }>
  }> {
    const endpoints = [
      'health',
      'nutrients', 
      'ingredients', 
      'products', 
      'pollutants', 
      'scans', 
      'meals', 
      'parasites'
    ]

    const results = []
    
    for (const endpoint of endpoints) {
      try {
        const url = endpoint === 'health' ? `${BASE_URL}/${endpoint}` : `${BASE_URL}/${endpoint}`
        const headers = endpoint === 'health' ? {} : getAuthHeaders(accessToken)
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(5000)
        })

        if (response.ok) {
          results.push({ name: endpoint, status: 'ok' as const })
        } else if (response.status === 404) {
          results.push({ 
            name: endpoint, 
            status: 'missing' as const,
            message: 'Endpoint not implemented'
          })
        } else {
          results.push({ 
            name: endpoint, 
            status: 'error' as const,
            message: `HTTP ${response.status}`
          })
        }
      } catch (error) {
        results.push({ 
          name: endpoint, 
          status: 'error' as const,
          message: error.message
        })
      }
    }

    const connected = results.some(r => r.status === 'ok')
    
    return { connected, endpoints: results }
  }
}