import { toast } from 'sonner@2.0.3'

export interface ApiError {
  success: false
  error: string
  details?: string
  message?: string
  timestamp?: string
  code?: number
}

export interface ApiSuccess<T = any> {
  success: true
  data: T
  count?: number
  message?: string
  timestamp?: string
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

export class ApiErrorHandler {
  static isApiError(response: any): response is ApiError {
    return response && response.success === false
  }

  static isApiSuccess<T>(response: any): response is ApiSuccess<T> {
    return response && response.success === true
  }

  static handleApiError(error: ApiError, context = 'API operation') {
    console.error(`❌ ${context} failed:`, error)

    // Determine appropriate user message
    let userMessage = error.message || error.error || 'An unexpected error occurred'

    // Show specific guidance based on error type
    if (error.details?.includes('Network') || error.details?.includes('fetch')) {
      userMessage = 'Network connection issue. Please check your internet connection and try again.'
      toast.error(userMessage, { duration: 6000 })
    } else if (error.details?.includes('404')) {
      userMessage = 'The requested data could not be found. This may be expected for new installations.'
      toast.info(userMessage, { duration: 5000 })
    } else if (error.details?.includes('500')) {
      userMessage = 'Server error occurred. Please try again in a moment.'
      toast.error(userMessage, { duration: 5000 })
    } else if (error.details?.includes('401') || error.details?.includes('403')) {
      userMessage = 'Authentication failed. Please refresh the page and try again.'
      toast.error(userMessage, { duration: 6000 })
    } else {
      toast.error(userMessage, { duration: 4000 })
    }

    return {
      handled: true,
      message: userMessage,
      error
    }
  }

  static async safeApiCall<T>(
    apiCall: () => Promise<Response>,
    context = 'API operation'
  ): Promise<ApiResponse<T>> {
    try {
      const response = await apiCall()
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error: ApiError = {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: errorData.error || errorData.message || `Request failed with status ${response.status}`,
          message: errorData.message || `Failed to ${context}`,
          code: response.status,
          timestamp: new Date().toISOString()
        }
        return error
      }

      const data = await response.json()
      
      // Ensure consistent response format
      if (data.success !== undefined) {
        return data
      } else {
        // Wrap non-standard responses
        return {
          success: true,
          data,
          timestamp: new Date().toISOString()
        }
      }
    } catch (networkError) {
      console.error(`❌ Network error in ${context}:`, networkError)
      
      const error: ApiError = {
        success: false,
        error: 'Network Error',
        details: networkError.message || 'Failed to connect to server',
        message: `Network error during ${context}`,
        timestamp: new Date().toISOString()
      }
      
      return error
    }
  }

  static logApiCall(method: string, url: string, data?: any) {
    console.log(`🌐 API ${method.toUpperCase()}: ${url}`, data ? { data } : '')
  }

  static createNotFoundResponse<T>(resource: string): ApiSuccess<T[]> {
    return {
      success: true,
      data: [] as T[],
      count: 0,
      message: `No ${resource} found. This is expected for new installations.`,
      timestamp: new Date().toISOString()
    }
  }

  static createEmptyResponse<T>(resource: string): ApiSuccess<T[]> {
    return {
      success: true,
      data: [] as T[],
      count: 0,
      message: `${resource} list is empty`,
      timestamp: new Date().toISOString()
    }
  }
}

// Convenience functions for common API patterns
export async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit = {},
  context = 'fetch data'
): Promise<ApiResponse<T>> {
  ApiErrorHandler.logApiCall(options.method || 'GET', url, options.body)
  
  return ApiErrorHandler.safeApiCall<T>(
    () => fetch(url, options),
    context
  )
}

export async function postWithErrorHandling<T>(
  url: string,
  data: any,
  options: Omit<RequestInit, 'method' | 'body'> = {},
  context = 'save data'
): Promise<ApiResponse<T>> {
  return fetchWithErrorHandling<T>(
    url,
    {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    },
    context
  )
}

export async function putWithErrorHandling<T>(
  url: string,
  data: any,
  options: Omit<RequestInit, 'method' | 'body'> = {},
  context = 'update data'
): Promise<ApiResponse<T>> {
  return fetchWithErrorHandling<T>(
    url,
    {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    },
    context
  )
}

export async function deleteWithErrorHandling<T>(
  url: string,
  options: Omit<RequestInit, 'method'> = {},
  context = 'delete data'
): Promise<ApiResponse<T>> {
  return fetchWithErrorHandling<T>(
    url,
    {
      ...options,
      method: 'DELETE'
    },
    context
  )
}

// Type-safe error handling for admin operations
export function handleAdminApiError(error: any, operation: string) {
  console.error(`❌ Admin ${operation} error:`, error)
  
  if (ApiErrorHandler.isApiError(error)) {
    return ApiErrorHandler.handleApiError(error, `admin ${operation}`)
  } else {
    const fallbackError: ApiError = {
      success: false,
      error: 'Unknown Error',
      details: error.message || 'An unexpected error occurred',
      message: `Failed to ${operation}`,
      timestamp: new Date().toISOString()
    }
    return ApiErrorHandler.handleApiError(fallbackError, `admin ${operation}`)
  }
}

// Server health checker utility
export async function checkServerHealth(): Promise<{
  healthy: boolean
  latency?: number
  error?: string
  details?: any
}> {
  const start = Date.now()
  try {
    // Try to get project ID from utils/supabase/info
    const projectId = await import('../utils/supabase/info').then(m => m.projectId).catch(() => 'unknown')
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/health`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      }
    )
    
    const latency = Date.now() - start
    
    if (response.ok) {
      const data = await response.json()
      console.log('🏥 Server health check passed:', data)
      return { healthy: true, latency, details: data }
    } else {
      return { 
        healthy: false, 
        latency,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    const latency = Date.now() - start
    console.error('🏥 Server health check failed:', error)
    return { 
      healthy: false, 
      latency,
      error: error.message || 'Network error'
    }
  }
}