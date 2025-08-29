"use client";

import { toast } from "sonner@2.0.3";

// Type definitions for validation
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface UserData {
  email: string;
  referralCode: string;
  position?: number;
  referrals?: number;
  joinedAt?: string;
}

interface LeaderboardEntry {
  name: string;
  referrals: number;
  reward: string;
}

interface WaitlistData {
  count: number;
  lastUpdated?: string;
}

// Enhanced KV Store documentation and utilities
export const KVStoreDocumentation = {
  tableName: "kv_store_557a7646",
  purpose: "Flexible key-value storage for HealthScan waitlist and referral data",
  
  // Expected table structure
  schema: {
    key: "VARCHAR(255) PRIMARY KEY",
    value: "JSONB", 
    created_at: "TIMESTAMP DEFAULT NOW()",
    updated_at: "TIMESTAMP DEFAULT NOW()"
  },
  
  // Key patterns used in the application
  keyPatterns: {
    waitlist: "waitlist:{email} - Stores user waitlist data",
    referral: "referral:{code} - Stores referral tracking data", 
    leaderboard: "leaderboard:global - Cached leaderboard data",
    stats: "stats:global - Global app statistics",
    invitations: "invitation:{id} - Pending invitation data"
  },
  
  // Example data structures
  examples: {
    waitlistEntry: {
      key: "waitlist:john@example.com",
      value: {
        email: "john@example.com",
        referralCode: "hs_abc123",
        referredBy: "hs_def456", // Optional
        joinedAt: "2024-01-15T10:30:00Z",
        position: 1247
      }
    },
    referralEntry: {
      key: "referral:hs_abc123", 
      value: {
        email: "john@example.com",
        referralCode: "hs_abc123",
        referralCount: 5,
        createdAt: "2024-01-15T10:30:00Z"
      }
    },
    leaderboardEntry: {
      key: "leaderboard:global",
      value: {
        entries: [
          { name: "John D.", referrals: 47, reward: "Free Premium (1 Year)" }
        ],
        lastUpdated: "2024-01-15T15:00:00Z"
      }
    }
  }
};

// Validation utilities
export class DataValidator {
  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate referral code format
  static validateReferralCode(code: string): boolean {
    const codeRegex = /^hs_[a-z0-9]{6}$/;
    return codeRegex.test(code);
  }

  // Validate KV store key format
  static validateKVKey(key: string): boolean {
    // Key should be non-empty and follow our patterns
    if (!key || key.length < 3) return false;
    
    const validPrefixes = ['waitlist:', 'referral:', 'leaderboard:', 'stats:', 'invitation:'];
    return validPrefixes.some(prefix => key.startsWith(prefix));
  }

  // Validate user data structure
  static validateUserData(userData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!userData) {
      errors.push("User data is null or undefined");
      return { isValid: false, errors, warnings };
    }

    // Required fields
    if (!userData.email) {
      errors.push("Email is required");
    } else if (!this.validateEmail(userData.email)) {
      errors.push("Email format is invalid");
    }

    if (!userData.referralCode) {
      errors.push("Referral code is required");
    } else if (!this.validateReferralCode(userData.referralCode)) {
      warnings.push("Referral code format may be invalid");
    }

    // Optional fields validation
    if (userData.position !== undefined) {
      if (typeof userData.position !== 'number' || userData.position < 1) {
        warnings.push("Position should be a positive number");
      }
    }

    if (userData.referrals !== undefined) {
      if (typeof userData.referrals !== 'number' || userData.referrals < 0) {
        warnings.push("Referrals count should be a non-negative number");
      }
    }

    if (userData.joinedAt) {
      const joinDate = new Date(userData.joinedAt);
      if (isNaN(joinDate.getTime())) {
        warnings.push("Join date format is invalid");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate leaderboard data
  static validateLeaderboard(leaderboard: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(leaderboard)) {
      errors.push("Leaderboard should be an array");
      return { isValid: false, errors, warnings };
    }

    leaderboard.forEach((entry, index) => {
      if (!entry.name) {
        errors.push(`Entry ${index}: Name is required`);
      }

      if (typeof entry.referrals !== 'number' || entry.referrals < 0) {
        errors.push(`Entry ${index}: Referrals should be a non-negative number`);
      }

      if (!entry.reward) {
        warnings.push(`Entry ${index}: Reward is missing`);
      }
    });

    // Check if sorted correctly
    for (let i = 1; i < leaderboard.length; i++) {
      if (leaderboard[i-1].referrals < leaderboard[i].referrals) {
        warnings.push("Leaderboard may not be sorted correctly by referrals");
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate localStorage data consistency
  static validateLocalStorage(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check critical localStorage keys
      const userData = localStorage.getItem('healthscan_user_email');
      const referralCode = localStorage.getItem('healthscan_referral_code');
      const localUsers = localStorage.getItem('healthscan_local_users');

      if (userData && !this.validateEmail(userData.replace(/"/g, ''))) {
        errors.push("Stored user email format is invalid");
      }

      if (referralCode && !this.validateReferralCode(referralCode.replace(/"/g, ''))) {
        warnings.push("Stored referral code format may be invalid");
      }

      if (localUsers) {
        try {
          const users = JSON.parse(localUsers);
          if (!Array.isArray(users)) {
            errors.push("Local users data should be an array");
          }
        } catch {
          errors.push("Local users data is corrupted");
        }
      }

      // Check for orphaned data
      const allKeys = Object.keys(localStorage);
      const healthscanKeys = allKeys.filter(key => key.startsWith('healthscan_'));
      
      if (healthscanKeys.length > 10) {
        warnings.push("Large number of HealthScan localStorage keys detected");
      }

    } catch (error) {
      errors.push("Failed to access localStorage");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Clean up corrupted localStorage data
  static cleanupLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      const healthscanKeys = keys.filter(key => key.startsWith('healthscan_'));
      
      healthscanKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            // Try to parse JSON values to check validity
            if (value.startsWith('{') || value.startsWith('[')) {
              JSON.parse(value);
            }
          }
        } catch {
          console.warn(`Removing corrupted localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      });

      toast.success("🧹 Cleaned up corrupted data");
    } catch (error) {
      console.error("Failed to cleanup localStorage:", error);
    }
  }

  // Comprehensive data integrity check
  static runIntegrityCheck(showResults: boolean = false): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    console.log("🔍 Running data integrity check...");

    // Check localStorage
    const localStorageResult = this.validateLocalStorage();
    allErrors.push(...localStorageResult.errors);
    allWarnings.push(...localStorageResult.warnings);

    // Check user data if exists
    try {
      const userEmail = localStorage.getItem('healthscan_user_email');
      const referralCode = localStorage.getItem('healthscan_referral_code');
      
      if (userEmail && referralCode) {
        const userData = {
          email: userEmail.replace(/"/g, ''),
          referralCode: referralCode.replace(/"/g, '')
        };
        
        const userResult = this.validateUserData(userData);
        allErrors.push(...userResult.errors);
        allWarnings.push(...userResult.warnings);
      }
    } catch (error) {
      allErrors.push("Failed to validate user data from localStorage");
    }

    const result = {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };

    if (showResults) {
      if (result.isValid) {
        toast.success("✅ Data integrity check passed");
      } else {
        toast.error(`❌ Data integrity issues found: ${result.errors.length} errors, ${result.warnings.length} warnings`);
      }

      console.log("Data Integrity Report:", result);
    }

    return result;
  }
}

// Utility functions for data consistency
export const DataUtils = {
  // Safe localStorage operations with validation
  safeGetItem: (key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      // Try to parse JSON
      if (item.startsWith('{') || item.startsWith('[')) {
        return JSON.parse(item);
      }
      
      // Return string value without quotes
      return item.replace(/^"(.*)"$/, '$1');
    } catch (error) {
      console.warn(`Failed to get localStorage item: ${key}`, error);
      return defaultValue;
    }
  },

  safeSetItem: (key: string, value: any) => {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.warn(`Failed to set localStorage item: ${key}`, error);
      return false;
    }
  },

  // Generate consistent referral codes based on email
  generateConsistentReferralCode: (email: string): string => {
    // Create a deterministic code based on email hash
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive number and create 6-character code
    const positiveHash = Math.abs(hash);
    const code = positiveHash.toString(36).substring(0, 6).padEnd(6, '0');
    
    return `hs_${code}`;
  },

  // Get or create consistent referral code for user
  getOrCreateReferralCode: (email: string): string => {
    const existingCode = DataUtils.safeGetItem('healthscan_referral_code');
    
    if (existingCode && DataValidator.validateReferralCode(existingCode)) {
      return existingCode;
    }
    
    // Generate consistent code based on email
    const newCode = DataUtils.generateConsistentReferralCode(email);
    DataUtils.safeSetItem('healthscan_referral_code', newCode);
    
    return newCode;
  },

  // Validate and fix referral code format
  normalizeReferralCode: (code: string): string => {
    if (!code) return DataUtils.generateReferralCode();
    
    // Remove quotes and whitespace
    const cleaned = code.replace(/['"]/g, '').trim();
    
    // Check if it matches expected format
    if (DataValidator.validateReferralCode(cleaned)) {
      return cleaned;
    }
    
    // If it doesn't match, try to fix common issues
    if (cleaned.startsWith('hs') && !cleaned.startsWith('hs_')) {
      return cleaned.replace('hs', 'hs_');
    }
    
    // If unfixable, generate new one
    console.warn(`Invalid referral code format: ${code}, generating new one`);
    return DataUtils.generateReferralCode();
  },

  // Generate random referral code (fallback)
  generateReferralCode: (): string => {
    return `hs_${Math.random().toString(36).substring(2, 8)}`;
  },

  // Debounce function for API calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Format display names consistently
  formatDisplayName: (email: string): string => {
    if (!email || !DataValidator.validateEmail(email)) {
      return "Unknown User";
    }
    
    const localPart = email.split('@')[0];
    return localPart.charAt(0).toUpperCase() + 
           localPart.slice(1, 6).toLowerCase() + 
           (localPart.length > 6 ? '.' : '');
  },

  // Enhanced server error detection and categorization
  categorizeServerError: (error: any): {
    category: 'network' | 'permission' | 'server' | 'timeout' | 'unknown';
    severity: 'low' | 'medium' | 'high';
    retryable: boolean;
    message: string;
  } => {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code;
    const httpStatus = error?.status;

    // Network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
      return {
        category: 'network',
        severity: 'medium',
        retryable: true,
        message: 'Network connection issue. Please check your internet connection.'
      };
    }

    // Permission errors
    if (errorCode === '42501' || errorMessage.includes('permission denied')) {
      return {
        category: 'permission',
        severity: 'high',
        retryable: false,
        message: 'Database permission error. The server cannot access the database.'
      };
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      return {
        category: 'timeout',
        severity: 'medium',
        retryable: true,
        message: 'Request timed out. The server is taking too long to respond.'
      };
    }

    // Server errors
    if (httpStatus >= 500) {
      return {
        category: 'server',
        severity: 'high',
        retryable: true,
        message: 'Server error. Please try again in a few minutes.'
      };
    }

    // Client errors
    if (httpStatus >= 400 && httpStatus < 500) {
      return {
        category: 'server',
        severity: 'medium',
        retryable: false,
        message: `Request error (${httpStatus}). Please check your data and try again.`
      };
    }

    return {
      category: 'unknown',
      severity: 'medium',
      retryable: true,
      message: 'An unexpected error occurred. Please try again.'
    };
  }
};

// Error boundary utility for component error handling
export class ErrorHandler {
  static logError(context: string, error: any, additionalData?: any): void {
    const errorCategory = DataUtils.categorizeServerError(error);
    
    console.error(`[${context}] ${errorCategory.category.toUpperCase()} Error:`, error);
    
    if (additionalData) {
      console.error(`[${context}] Additional data:`, additionalData);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorReporting(context, error, additionalData);
    }
  }

  static handleApiError(context: string, error: any, fallbackAction?: () => void): void {
    const errorCategory = DataUtils.categorizeServerError(error);
    
    this.logError(context, error, { category: errorCategory.category, severity: errorCategory.severity });
    
    // Show user-friendly message
    if (errorCategory.severity === 'high') {
      toast.error(errorCategory.message);
    } else {
      toast.warning(errorCategory.message);
    }

    if (fallbackAction && errorCategory.retryable) {
      fallbackAction();
    }
  }

  // Smart retry logic with exponential backoff
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context: string = 'operation'
  ): Promise<T> {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting ${context} (${attempt}/${maxRetries})`);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`${context} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        const errorCategory = DataUtils.categorizeServerError(error);
        
        console.warn(`${context} failed on attempt ${attempt}:`, error);
        
        // Don't retry non-retryable errors
        if (!errorCategory.retryable) {
          break;
        }
        
        if (attempt < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
          console.log(`Retrying ${context} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

// KV Store troubleshooting utilities
export const KVStoreTroubleshooting = {
  // Generate SQL to create the table if it doesn't exist
  generateCreateTableSQL: () => {
    return `
-- Create kv_store_557a7646 table if it doesn't exist
CREATE TABLE IF NOT EXISTS kv_store_557a7646 (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS kv_store_557a7646_created_at_idx ON kv_store_557a7646(created_at);
CREATE INDEX IF NOT EXISTS kv_store_557a7646_value_idx ON kv_store_557a7646 USING GIN(value);

-- Enable Row Level Security (if needed)
ALTER TABLE kv_store_557a7646 ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role access
CREATE POLICY IF NOT EXISTS "Service role can access kv_store_557a7646" ON kv_store_557a7646
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policy to allow anon access (if needed)
CREATE POLICY IF NOT EXISTS "Anon can read kv_store_557a7646" ON kv_store_557a7646
    FOR SELECT USING (true);
`;
  },

  // Check what permissions are needed
  checkPermissions: () => {
    return {
      requiredPermissions: [
        "SELECT on kv_store_557a7646",
        "INSERT on kv_store_557a7646", 
        "UPDATE on kv_store_557a7646",
        "DELETE on kv_store_557a7646"
      ],
      serviceRoleNeeded: true,
      rlsPoliciesRequired: true,
      commonIssues: [
        "Service role key is missing or incorrect",
        "Row Level Security policies block access",
        "Table doesn't exist in the database",
        "Database connection issues"
      ]
    };
  },

  // Generate test data for the table
  generateTestData: () => {
    return {
      waitlistEntries: [
        {
          key: "waitlist:test@example.com",
          value: {
            email: "test@example.com",
            referralCode: "hs_abc123",
            joinedAt: new Date().toISOString(),
            position: 1
          }
        }
      ],
      referralEntries: [
        {
          key: "referral:hs_abc123",
          value: {
            email: "test@example.com", 
            referralCode: "hs_abc123",
            referralCount: 0,
            createdAt: new Date().toISOString()
          }
        }
      ]
    };
  },

  // Status check for the KV store
  diagnose: (errors: any[]) => {
    const permissionErrors = errors.filter(e => 
      e.message?.includes('permission denied') || e.code === '42501'
    );
    
    const connectionErrors = errors.filter(e =>
      e.message?.includes('connection') || e.message?.includes('timeout')
    );
    
    const diagnosis = {
      hasPermissionIssues: permissionErrors.length > 0,
      hasConnectionIssues: connectionErrors.length > 0,
      totalErrors: errors.length,
      recommendations: []
    };

    if (diagnosis.hasPermissionIssues) {
      diagnosis.recommendations.push(
        "Check service role key configuration",
        "Verify RLS policies allow access", 
        "Ensure table exists with correct permissions"
      );
    }

    if (diagnosis.hasConnectionIssues) {
      diagnosis.recommendations.push(
        "Check network connectivity",
        "Verify Supabase URL is correct",
        "Check for service outages"
      );
    }

    return diagnosis;
  }
};