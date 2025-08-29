"use client";

import { toast } from 'sonner@2.0.3';

interface NetworkOptions {
  retries?: number;
  timeout?: number;
  showToast?: boolean;
  fallbackMessage?: string;
  suppressErrors?: boolean;
}

interface NetworkResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  fromCache?: boolean;
}

// Simple in-memory cache for network responses
const networkCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * Check network connectivity (only when explicitly called)
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  try {
    // Only perform actual network check when explicitly requested
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    // Return false without logging to avoid noise
    return false;
  }
}

/**
 * Enhanced fetch with retry, timeout, and error handling
 */
export async function enhancedFetch<T = any>(
  url: string,
  options: RequestInit & NetworkOptions = {}
): Promise<NetworkResponse<T>> {
  const {
    retries = 2,
    timeout = 10000,
    showToast = true,
    fallbackMessage = 'Network error occurred',
    suppressErrors = false,
    ...fetchOptions
  } = options;

  const cacheKey = `${url}-${JSON.stringify(fetchOptions)}`;
  
  // Check cache first for GET requests
  if (!fetchOptions.method || fetchOptions.method === 'GET') {
    const cached = networkCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      if (!suppressErrors) {
        console.log(`📦 Using cached response for: ${url}`);
      }
      return { success: true, data: cached.data, fromCache: true };
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      if (!suppressErrors) {
        console.log(`🌐 Network attempt ${attempt}/${retries + 1} for: ${url}`);
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data: T;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, return response text
        data = (await response.text()) as any;
      }

      // Cache successful GET responses
      if (!fetchOptions.method || fetchOptions.method === 'GET') {
        networkCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: 60000 // 1 minute cache
        });
      }

      if (!suppressErrors) {
        console.log(`✅ Network success for: ${url}`);
      }
      return { success: true, data, status: response.status };

    } catch (error: any) {
      lastError = error;
      
      if (!suppressErrors) {
        console.warn(`❌ Network attempt ${attempt} failed:`, error.message);
      }

      // Don't retry on certain errors
      if (error.name === 'AbortError') {
        if (!suppressErrors) {
          console.log('⏱️ Request timed out');
        }
        break;
      }

      if (error.message?.includes('404') || error.message?.includes('403')) {
        if (!suppressErrors) {
          console.log('🚫 Non-retryable error, stopping attempts');
        }
        break;
      }

      // Wait before retry with exponential backoff
      if (attempt <= retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        if (!suppressErrors) {
          console.log(`⏱️ Waiting ${delay}ms before retry...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  const isNetworkError = lastError?.message?.includes('Failed to fetch') || 
                        lastError?.name === 'TypeError' ||
                        lastError?.name === 'AbortError';

  const errorMessage = isNetworkError 
    ? 'Network connection error. Please check your internet connection.'
    : lastError?.message || fallbackMessage;

  if (!suppressErrors) {
    console.error(`💥 All network attempts failed for: ${url}`, errorMessage);

    if (showToast) {
      if (isNetworkError) {
        toast.error('🌐 Network connection issue. Please check your internet and try again.');
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
    }
  }

  return { 
    success: false, 
    error: errorMessage,
    status: lastError?.message?.includes('HTTP') ? 
      parseInt(lastError.message.match(/HTTP (\d+)/)?.[1] || '0') : 
      undefined
  };
}

/**
 * Specific wrapper for Supabase server requests
 */
export async function supabaseServerRequest<T = any>(
  endpoint: string,
  options: RequestInit & NetworkOptions = {}
): Promise<NetworkResponse<T>> {
  const { projectId, publicAnonKey } = await import('./supabase/info');
  
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-557a7646${endpoint}`;
  
  return enhancedFetch<T>(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Accept': 'application/json',
      ...options.headers,
    },
    retries: 2,
    timeout: 15000,
    fallbackMessage: 'Server connection error',
  });
}

/**
 * Handle authentication fetch errors specifically
 */
export function handleAuthError(error: any): { message: string; recoverable: boolean } {
  // Suppress verbose logging for common auth errors
  const isCommonError = error?.message?.includes('Failed to fetch') || 
                       error?.message?.includes('AuthRetryableFetchError');
  
  if (!isCommonError) {
    console.error('🔒 Auth error details:', error);
  }

  if (error?.message?.includes('Failed to fetch')) {
    return {
      message: 'Network connection error. Please check your internet connection and try again.',
      recoverable: true
    };
  }

  if (error?.message?.includes('AuthRetryableFetchError')) {
    return {
      message: 'Authentication service temporarily unavailable. Please try again in a moment.',
      recoverable: true
    };
  }

  if (error?.message?.includes('Invalid login credentials')) {
    return {
      message: 'Invalid email or password. Please check your credentials.',
      recoverable: false
    };
  }

  if (error?.message?.includes('timeout')) {
    return {
      message: 'Request timed out. Please try again.',
      recoverable: true
    };
  }

  return {
    message: error?.message || 'An unexpected error occurred. Please try again.',
    recoverable: true
  };
}

/**
 * Clear network cache
 */
export function clearNetworkCache(): void {
  networkCache.clear();
  console.log('🧹 Network cache cleared');
}

/**
 * Get cache statistics
 */
export function getNetworkCacheStats(): { size: number; entries: string[] } {
  return {
    size: networkCache.size,
    entries: Array.from(networkCache.keys())
  };
}

/**
 * Offline detection and handling with improved UX (no automatic connectivity checks)
 */
export function initializeOfflineHandling(): void {
  let isOnline = navigator.onLine;
  let hasShownOfflineToast = false;

  const handleOnline = () => {
    if (!isOnline) {
      isOnline = true;
      hasShownOfflineToast = false;
      console.log('📶 Connection restored');
      toast.success('🌐 Connection restored!');
      clearNetworkCache(); // Clear cache when coming back online
    }
  };

  const handleOffline = () => {
    if (isOnline && !hasShownOfflineToast) {
      isOnline = false;
      hasShownOfflineToast = true;
      console.log('📶 Connection lost');
      toast.warning('📵 You appear to be offline. Some features may not work.');
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Check initial status without network request
  if (!navigator.onLine) {
    handleOffline();
  }

  console.log('📶 Offline handling initialized (no automatic connectivity checks)');
}

/**
 * Manual connectivity test (only when explicitly called)
 */
export async function testConnectivity(): Promise<{ online: boolean; latency?: number }> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    await Promise.race([
      fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: controller.signal 
      }),
      fetch('https://httpbin.org/status/200', { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: controller.signal 
      })
    ]);
    
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    return { online: true, latency };
  } catch {
    return { online: false };
  }
}