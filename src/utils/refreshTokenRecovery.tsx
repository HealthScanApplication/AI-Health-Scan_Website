/**
 * Refresh Token Recovery Utility
 * 
 * Provides utilities to detect and recover from "Invalid Refresh Token" errors
 * that can occur when Supabase tokens become corrupted or expired.
 */

import { getSupabaseClient } from './supabase/client';

export interface RefreshTokenError extends Error {
  isRefreshTokenError: boolean;
  recoveryAction: 'clearTokens' | 'reload' | 'redirect';
}

/**
 * Check if an error is a refresh token error
 */
export function isRefreshTokenError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message || error.error_description || error.error || String(error);
  
  return (
    message.includes('Invalid Refresh Token') ||
    message.includes('Refresh Token Not Found') ||
    message.includes('refresh_token_not_found') ||
    message.includes('invalid_refresh_token') ||
    message.includes('JWT expired') ||
    message.includes('refresh token is invalid') ||
    (error.status === 401 && message.includes('token'))
  );
}

/**
 * Clear all authentication-related tokens from storage
 */
export function clearAllAuthTokens(): void {
  try {
    console.log('🧹 Clearing all authentication tokens...');
    
    // Clear Supabase tokens
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
    
    // Clear custom HealthScan tokens
    localStorage.removeItem('healthscan-supabase-auth-token');
    localStorage.removeItem('healthscan_auth_token');
    localStorage.removeItem('healthscan_refresh_token');
    localStorage.removeItem('healthscan_session');
    localStorage.removeItem('healthscan_user_data');
    
    // Clear any email confirmation flags that might be stale
    localStorage.removeItem('healthscan_needs_confirmation');
    localStorage.removeItem('healthscan_email_confirmed');
    
    // Clear any other potential auth-related storage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('auth') || key.includes('token') || key.includes('session')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Authentication tokens cleared');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
}

/**
 * Handle refresh token error with appropriate recovery action
 */
export async function handleRefreshTokenError(
  error: any,
  context: string = 'unknown',
  forceReload: boolean = false
): Promise<void> {
  console.warn(`🔄 Handling refresh token error in ${context}:`, error.message);
  
  try {
    // Clear all tokens first
    clearAllAuthTokens();
    
    // Try to sign out cleanly from Supabase
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      console.log('✅ Clean sign out completed');
    } catch (signOutError) {
      console.log('ℹ️ Sign out failed (expected with invalid tokens):', signOutError);
    }
    
    // Notify the app about auth state change
    window.dispatchEvent(new CustomEvent('authNavigateToHome'));
    window.dispatchEvent(new CustomEvent('refreshTokenError', { 
      detail: { 
        context, 
        error: error.message,
        timestamp: new Date().toISOString()
      } 
    }));
    
    // Reload if necessary (for severe token corruption)
    if (forceReload || context === 'initialization') {
      console.log('🔄 Reloading page to complete token cleanup...');
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Small delay to allow events to fire
    }
    
  } catch (recoveryError) {
    console.error('Error during refresh token recovery:', recoveryError);
    
    // If recovery fails, force reload as last resort
    console.log('🚨 Recovery failed, forcing page reload...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
}

/**
 * Wrap an async function to automatically handle refresh token errors
 */
export function withRefreshTokenRecovery<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string = 'operation',
  forceReload: boolean = false
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      if (isRefreshTokenError(error)) {
        await handleRefreshTokenError(error, context, forceReload);
        throw error; // Re-throw after handling
      }
      throw error;
    }
  }) as T;
}

/**
 * Check if current session has valid tokens
 */
export async function validateCurrentSession(): Promise<{
  isValid: boolean;
  error?: string;
  needsRecovery: boolean;
}> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      if (isRefreshTokenError(error)) {
        return {
          isValid: false,
          error: error.message,
          needsRecovery: true
        };
      }
      return {
        isValid: false,
        error: error.message,
        needsRecovery: false
      };
    }
    
    if (!session || !session.access_token) {
      return {
        isValid: false,
        error: 'No active session',
        needsRecovery: false
      };
    }
    
    // Check if tokens are close to expiry
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const timeToExpiry = expiresAt - now;
    
    if (timeToExpiry < 300) { // Less than 5 minutes
      console.warn('⚠️ Session expires soon:', timeToExpiry, 'seconds');
    }
    
    return {
      isValid: true,
      needsRecovery: false
    };
    
  } catch (error: any) {
    if (isRefreshTokenError(error)) {
      return {
        isValid: false,
        error: error.message,
        needsRecovery: true
      };
    }
    
    return {
      isValid: false,
      error: error.message,
      needsRecovery: false
    };
  }
}

/**
 * Initialize refresh token error monitoring
 */
export function initializeRefreshTokenMonitoring(): () => void {
  console.log('🔍 Initializing refresh token error monitoring...');
  
  // Monitor unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (isRefreshTokenError(event.reason)) {
      console.warn('🔄 Unhandled promise rejection with refresh token error');
      handleRefreshTokenError(event.reason, 'unhandled-promise');
      event.preventDefault(); // Prevent default error logging
    }
  };
  
  // Monitor general errors
  const handleError = (event: ErrorEvent) => {
    if (isRefreshTokenError(event.error)) {
      console.warn('🔄 Global error with refresh token issue');
      handleRefreshTokenError(event.error, 'global-error');
    }
  };
  
  // Set up listeners
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  window.addEventListener('error', handleError);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleError);
    console.log('🔍 Refresh token monitoring cleaned up');
  };
}

/**
 * Development helper to simulate refresh token error
 */
export function simulateRefreshTokenError(): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('🧪 Simulating refresh token error for testing...');
    
    // Corrupt the stored tokens
    localStorage.setItem('supabase.auth.token', 'invalid-token');
    localStorage.setItem('healthscan-supabase-auth-token', 'corrupted-token');
    
    // Trigger an error
    const simulatedError = new Error('Invalid Refresh Token: Refresh Token Not Found');
    handleRefreshTokenError(simulatedError, 'simulation', false);
  } else {
    console.warn('🚫 Token simulation only available in development mode');
  }
}

// Export for development debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).HealthScanRefreshTokenRecovery = {
    isRefreshTokenError,
    clearAllAuthTokens,
    handleRefreshTokenError,
    validateCurrentSession,
    simulateRefreshTokenError,
    help: () => {
      console.group('🔧 Refresh Token Recovery Debug Tools');
      console.log('isRefreshTokenError(error) - Check if error is refresh token related');
      console.log('clearAllAuthTokens() - Clear all stored authentication tokens');
      console.log('validateCurrentSession() - Check if current session is valid');
      console.log('simulateRefreshTokenError() - Simulate refresh token error for testing');
      console.log('handleRefreshTokenError(error, context) - Handle refresh token error');
      console.groupEnd();
    }
  };
}

console.log('🔄 Refresh token recovery utility loaded');