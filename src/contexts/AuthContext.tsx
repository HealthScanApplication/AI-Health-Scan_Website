import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../utils/supabase/client';
import { handleError, withErrorHandling } from '../utils/errorHandling';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  accessToken: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: any }>;
  refreshUser: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  handleInvalidRefreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        // Handle specific refresh token errors
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found') ||
            error.message?.includes('refresh_token_not_found') ||
            error.message?.includes('invalid_refresh_token')) {
          console.warn('🔄 Invalid refresh token detected - clearing authentication state');
          
          // Clear invalid tokens and force sign out
          await handleInvalidRefreshToken();
          return;
        }
        
        console.warn('Session refresh error:', error);
        return;
      }
      
      if (currentSession?.user) {
        console.log('🔄 Session refreshed:', {
          hasSession: !!currentSession,
          hasUser: !!currentSession?.user,
          hasAccessToken: !!currentSession?.access_token,
          userEmail: currentSession?.user?.email
        });
      }
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setAccessToken(currentSession?.access_token ?? null);
    } catch (error) {
      console.error('Error refreshing session:', error);
      
      // Check if this is a refresh token error
      const errorMessage = (error as any)?.message || '';
      if (errorMessage.includes('Invalid Refresh Token') || 
          errorMessage.includes('Refresh Token Not Found') ||
          errorMessage.includes('refresh_token_not_found') ||
          errorMessage.includes('invalid_refresh_token')) {
        console.warn('🔄 Invalid refresh token in catch block - clearing authentication state');
        await handleInvalidRefreshToken();
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient();
      
      // First, validate inputs
      if (!email || !email.trim()) {
        return { 
          error: {
            type: 'validation_error',
            message: 'Email is required',
            helpMessage: 'Please enter your email address.'
          }
        };
      }
      
      if (!password || !password.trim()) {
        return { 
          error: {
            type: 'validation_error',
            message: 'Password is required',
            helpMessage: 'Please enter your password.'
          }
        };
      }
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        
        if (error) {
          // Enhanced error handling with reduced console noise
          let enhancedError: any = { 
            ...error,
            message: error.message,
            type: 'auth_error',
            originalError: {
              message: error.message,
              status: error.status,
              name: error.name
            },
            debugInfo: {
              timestamp: new Date().toISOString(),
              email: email.trim().toLowerCase(),
              supabaseUrl: supabase.supabaseUrl,
              userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server'
            }
          };
          
          // Handle specific authentication errors with better classification
          const errorMessage = error.message || '';
          const errorStatus = error.status || 0;
          
          if (errorMessage.includes('Invalid login credentials') || errorStatus === 400) {
            // This is an expected error - provide helpful user guidance
            enhancedError = {
              ...enhancedError,
              type: 'invalid_credentials',
              message: 'Login failed',
              helpMessage: 'Your account exists, but the password is incorrect. Please check your password or reset it.',
              actionType: 'wrong_password',
              userExists: true, // Assume user exists for better UX
              suggestions: [
                'Double-check your password',
                'Try typing it again carefully',
                'Use "Forgot Password" to reset your password',
                'Make sure Caps Lock is off'
              ]
            };
            
          } else if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email_confirmed_at')) {
            enhancedError = {
              ...enhancedError,
              type: 'email_not_confirmed',
              message: 'Email confirmation required',
              helpMessage: 'Please check your email and click the confirmation link before signing in.',
              actionType: 'email_confirmation_required',
              suggestions: [
                'Check your email inbox for a confirmation message',
                'Look in your spam/junk folder if you don\'t see it',
                'Click the confirmation link in the email',
                'Contact support if you need help'
              ]
            };
          } else if (errorMessage.includes('Too many requests') || errorStatus === 429) {
            enhancedError = {
              ...enhancedError,
              type: 'rate_limited',
              message: 'Too many login attempts',
              helpMessage: 'You\'ve made too many login attempts. Please wait a few minutes before trying again.',
              actionType: 'rate_limit_exceeded',
              suggestions: [
                'Wait 5-10 minutes before trying again',
                'Make sure you\'re using the correct credentials',
                'Clear your browser cache if the problem persists'
              ]
            };
          } else if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorStatus === 0) {
            enhancedError = {
              ...enhancedError,
              type: 'network_error',
              message: 'Connection failed',
              helpMessage: 'Unable to connect to the authentication service. Please check your internet connection.',
              actionType: 'network_issue',
              suggestions: [
                'Check your internet connection',
                'Try refreshing the page',
                'Disable any VPN or proxy if you\'re using one',
                'Try again in a few moments'
              ]
            };
          } else if (errorStatus >= 500) {
            enhancedError = {
              ...enhancedError,
              type: 'server_error',
              message: 'Server temporarily unavailable',
              helpMessage: 'The authentication service is experiencing issues. Please try again in a few minutes.',
              actionType: 'server_issue',
              suggestions: [
                'Wait a few minutes and try again',
                'The issue should resolve automatically',
                'Contact support if the problem persists'
              ]
            };
          } else {
            // Generic error handling for unknown issues
            enhancedError = {
              ...enhancedError,
              type: 'unknown_error',
              message: 'Authentication failed',
              helpMessage: 'An unexpected error occurred during login. Please try again.',
              actionType: 'generic_error',
              suggestions: [
                'Try logging in again',
                'Refresh the page and try again',
                'Contact support if the problem continues'
              ]
            };
          }
          
          return { error: enhancedError };
        }
        
        // Success case
        console.log('✅ Login successful for:', email);
        
        setUser(data.user);
        setSession(data.session);
        setAccessToken(data.session?.access_token || null);
        
        return { error: null };
        
      } catch (networkError: any) {
        console.error('❌ Network error during login:', networkError);
        
        return {
          error: {
            type: 'network_error',
            message: 'Connection failed',
            helpMessage: 'Unable to connect to the authentication service. Please check your internet connection and try again.',
            actionType: 'network_issue',
            debugInfo: {
              originalError: networkError.message,
              timestamp: new Date().toISOString(),
              email: email.trim().toLowerCase()
            },
            suggestions: [
              'Check your internet connection',
              'Try refreshing the page',
              'Try again in a few moments',
              'Contact support if the issue persists'
            ]
          }
        };
      }
    } catch (error: any) {
      console.error('❌ Unexpected error in signIn function:', error);
      return {
        error: {
          type: 'unexpected_error',
          message: 'An unexpected error occurred',
          helpMessage: 'Please try again. If the problem persists, contact support.',
          debugInfo: {
            originalError: error?.message || String(error),
            timestamp: new Date().toISOString(),
            context: 'signIn function wrapper'
          }
        }
      };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      console.log('📝 Attempting signup for:', email);
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || ''
          }
        }
      });
      
      if (error) {
        // Check if this is a "user already registered" error - this is expected behavior
        const errorMessage = error.message || error.error_description || error.error || String(error);
        const isUserAlreadyExistsError = (
          errorMessage.includes('User already registered') ||
          errorMessage.includes('already registered') ||
          errorMessage.includes('AuthApiError: User already registered') ||
          errorMessage.includes('already exists') ||
          error.code === 'user_already_exists' ||
          error.status === 422
        );
        
        if (isUserAlreadyExistsError) {
          console.log('💡 User already registered - directing to login flow');
        } else {
          console.error('❌ Account creation failed:', error.message);
        }
        
        return { error };
      }
      
      console.log('✅ Account created successfully for:', email);
      
      // If user is immediately confirmed, update state
      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        setAccessToken(data.session?.access_token || null);
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('❌ Unexpected error in signUp function:', error);
      return {
        error: {
          type: 'unexpected_error',
          message: 'An unexpected error occurred during signup',
          helpMessage: 'Please try again. If the problem persists, contact support.',
          debugInfo: {
            originalError: error?.message || String(error),
            timestamp: new Date().toISOString(),
            context: 'signUp function wrapper'
          }
        }
      };
    }
  };

  // Helper function to handle invalid refresh tokens
  const handleInvalidRefreshToken = async () => {
    console.log('🧹 Cleaning up invalid refresh tokens...');
    
    try {
      const supabase = getSupabaseClient();
      
      // Clear all stored auth data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      // Clear any custom auth storage
      localStorage.removeItem('healthscan_auth_token');
      localStorage.removeItem('healthscan_refresh_token');
      localStorage.removeItem('healthscan_session');
      
      // Try to sign out cleanly (will fail but clears server state)
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        // Ignore sign out errors when tokens are invalid
        console.log('Ignoring sign out error during token cleanup:', signOutError);
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setAccessToken(null);
      
      // Navigate to home page
      window.dispatchEvent(new CustomEvent('authNavigateToHome'));
      
      console.log('✅ Invalid tokens cleaned up successfully');
    } catch (cleanupError) {
      console.error('Error during token cleanup:', cleanupError);
      // Still clear local state even if cleanup fails
      setUser(null);
      setSession(null);
      setAccessToken(null);
    }
  };

  const signOut = async () => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Check if this is a refresh token error during sign out
        if (error.message?.includes('Invalid Refresh Token') || 
            error.message?.includes('Refresh Token Not Found')) {
          console.log('Invalid refresh token during sign out - proceeding with cleanup');
          await handleInvalidRefreshToken();
          return;
        }
        
        console.error('Sign out error:', error);
        throw new Error(`Sign out failed: ${error.message}`);
      }
      
      setUser(null);
      setSession(null);
      setAccessToken(null);
      
      // Clear any stored tokens as extra safety
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('authNavigateToHome'));
    } catch (error) {
      console.error('Error during sign out:', error);
      
      // Check if this is a refresh token error
      const errorMessage = (error as any)?.message || '';
      if (errorMessage.includes('Invalid Refresh Token') || 
          errorMessage.includes('Refresh Token Not Found')) {
        console.log('Invalid refresh token during sign out error - using cleanup');
        await handleInvalidRefreshToken();
        return;
      }
      
      // Even if sign out fails, clear local state
      setUser(null);
      setSession(null);
      setAccessToken(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          // Handle refresh token errors during initialization
          if (sessionError.message?.includes('Invalid Refresh Token') || 
              sessionError.message?.includes('Refresh Token Not Found') ||
              sessionError.message?.includes('refresh_token_not_found') ||
              sessionError.message?.includes('invalid_refresh_token')) {
            console.warn('🔄 Invalid refresh token detected during init - cleaning up');
            await handleInvalidRefreshToken();
            setLoading(false);
            return;
          }
          
          console.warn('Session error:', sessionError);
        }
        
        // Debug session information only if session exists
        if (session?.user) {
          console.log('🔐 Initial session loaded:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            hasAccessToken: !!session?.access_token,
            userEmail: session?.user?.email,
            isAdminUser: session?.user?.email?.endsWith('@healthscan.live')
          });
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setAccessToken(session?.access_token ?? null);
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email || 'no user');
            
            setSession(session);
            setUser(session?.user ?? null);
            setAccessToken(session?.access_token ?? null);
            
            // Handle specific auth events
            if (event === 'SIGNED_IN') {
              console.log('✅ User signed in successfully');
            } else if (event === 'SIGNED_OUT') {
              console.log('👋 User signed out');
              setSession(null);
              setUser(null);
              setAccessToken(null);
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('🔄 Token refreshed');
            } else if (event === 'USER_UPDATED') {
              console.log('👤 User data updated');
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing AuthProvider:', error);
        
        // Check if initialization error is due to invalid tokens
        const errorMessage = (error as any)?.message || '';
        if (errorMessage.includes('Invalid Refresh Token') || 
            errorMessage.includes('Refresh Token Not Found') ||
            errorMessage.includes('refresh_token_not_found') ||
            errorMessage.includes('invalid_refresh_token')) {
          console.warn('🔄 Invalid refresh token in init catch block - cleaning up');
          await handleInvalidRefreshToken();
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const contextValue: AuthContextType = {
    user,
    session,
    accessToken,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    refreshSession,
    isAuthenticated: !!user,
    handleInvalidRefreshToken // Export the handler for use elsewhere
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Additional hook for checking authentication status
export function useAuthStatus() {
  const { user, loading, accessToken } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
    accessToken,
    hasVerifiedEmail: user?.email_confirmed_at != null,
    isAdmin: user?.email?.endsWith('@healthscan.live') || false
  };
}

// Helper function to get access token directly from Supabase
export async function getAccessTokenDirect(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      // Handle refresh token errors
      if (error.message?.includes('Invalid Refresh Token') || 
          error.message?.includes('Refresh Token Not Found') ||
          error.message?.includes('refresh_token_not_found') ||
          error.message?.includes('invalid_refresh_token')) {
        console.warn('🔄 Invalid refresh token detected in getAccessTokenDirect - clearing storage');
        
        // Clear stored tokens
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('healthscan_auth_token');
        localStorage.removeItem('healthscan_refresh_token');
        localStorage.removeItem('healthscan_session');
        
        // Notify app of auth change
        window.dispatchEvent(new CustomEvent('authNavigateToHome'));
        
        return null;
      }
      
      console.error('Error getting session for access token:', error);
      return null;
    }
    
    return session?.access_token ?? null;
  } catch (error) {
    console.error('Failed to get access token directly:', error);
    
    // Check if this is a refresh token error
    const errorMessage = (error as any)?.message || '';
    if (errorMessage.includes('Invalid Refresh Token') || 
        errorMessage.includes('Refresh Token Not Found')) {
      console.warn('🔄 Invalid refresh token in getAccessTokenDirect catch - clearing storage');
      
      // Clear stored tokens
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('healthscan_auth_token');
      localStorage.removeItem('healthscan_refresh_token');
      localStorage.removeItem('healthscan_session');
      
      // Notify app of auth change
      window.dispatchEvent(new CustomEvent('authNavigateToHome'));
    }
    
    return null;
  }
}

// Hook specifically for admin access with access token
export function useAdminAuth() {
  const { user, accessToken, loading, refreshSession } = useAuth();
  const isAdmin = user?.email?.endsWith('@healthscan.live') || false;
  
  return {
    user,
    accessToken,
    isAdmin,
    loading,
    refreshSession,
    hasAdminAccess: isAdmin && !!accessToken,
    isAdminAuthenticated: isAdmin && !!user && !!accessToken
  };
}