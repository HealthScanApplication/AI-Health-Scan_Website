/**
 * HealthScan Admin API Service
 * 
 * Centralized API service for admin operations using Supabase Edge Functions
 * Replaces direct Supabase calls with standardized API endpoints
 */

import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2`

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

interface ApiOptions extends RequestInit {
  timeout?: number
}

class HealthScanAdminApiService {
  private accessToken: string | null = null

  constructor() {
    // Token will be set when service is used
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  private async apiCall<T>(
    endpoint: string, 
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = 30000, ...fetchOptions } = options
    
    const url = `${API_BASE}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        'User-Agent': 'HealthScan-Admin/1.0',
        'Authorization': `Bearer ${this.accessToken || publicAnonKey}`,
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...defaultHeaders,
          ...fetchOptions.headers
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      let data;
      try {
        data = await response.json()
      } catch (jsonError) {
        if (response.ok) {
          return {
            success: true,
            data: undefined,
            message: 'Empty response'
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return {
        success: true,
        data: data?.data || data,
        message: data?.message
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again')
      }
      
      throw new Error(error.message || 'Network error occurred')
    }
  }

  // USER MANAGEMENT API METHODS

  async getUsers(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
    tier?: string
    sortBy?: string
    sortOrder?: string
    includeReferralData?: boolean
    includeWaitlistData?: boolean
  }) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })

    return this.apiCall(`/admin/users?${searchParams}`)
  }

  async getUser(userId: string, includeDetails: boolean = true) {
    return this.apiCall(`/admin/users/${userId}?includeDetails=${includeDetails}`)
  }

  async createUser(userData: {
    email: string
    password: string
    name?: string
    phone?: string
    tier?: string
    autoGenerateReferralCode?: boolean
    sendWelcomeEmail?: boolean
  }) {
    return this.apiCall('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async updateUser(userId: string, updateData: {
    email?: string
    name?: string
    phone?: string
    tier?: string
    password?: string
    metadata?: any
  }) {
    return this.apiCall(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
  }

  async deleteUser(userId: string, options: {
    cascadeReferrals?: boolean
    notifyConnections?: boolean
    reason?: string
  } = {}) {
    return this.apiCall(`/admin/users/${userId}`, {
      method: 'DELETE',
      body: JSON.stringify(options)
    })
  }

  async sendVerificationEmail(userId: string, email: string, template: string = 'admin_verification') {
    return this.apiCall(`/admin/users/${userId}/send-verification`, {
      method: 'POST',
      body: JSON.stringify({ email, template })
    })
  }

  async batchSendVerification(userIds: string[]) {
    return this.apiCall('/admin/users/batch-send-verification', {
      method: 'POST',
      body: JSON.stringify({ userIds })
    })
  }

  async exportUsers(options: {
    userIds?: string[]
    includeReferralData?: boolean
    includeWaitlistData?: boolean
    format?: 'csv' | 'json' | 'xlsx'
  }) {
    return this.apiCall('/admin/users/export', {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  // USER STATISTICS

  async getUserStats() {
    return this.apiCall('/admin/users/stats')
  }

  async getComprehensiveStats() {
    return this.apiCall('/admin/stats/comprehensive')
  }

  async getGrowthAnalytics(timeframe: string = '30d') {
    return this.apiCall(`/admin/analytics/growth?timeframe=${timeframe}`)
  }

  // REFERRAL MANAGEMENT API METHODS

  async getReferralInvites(params: {
    page?: number
    limit?: number
    status?: string
    referrerId?: string
    includeUserData?: boolean
    sortBy?: string
    sortOrder?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })

    return this.apiCall(`/admin/referral-invites?${searchParams}`)
  }

  async createReferralInvite(inviteData: {
    referrer_id: string
    invitee_email: string
    invitee_name?: string
    custom_message?: string
    auto_send?: boolean
  }) {
    return this.apiCall('/admin/referral-invites', {
      method: 'POST',
      body: JSON.stringify(inviteData)
    })
  }

  async confirmReferralInvite(inviteId: string, options: {
    manualConfirmation?: boolean
    adminNotes?: string
    bonusReward?: number
  } = {}) {
    return this.apiCall(`/admin/referral-invites/${inviteId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  async cancelReferralInvite(inviteId: string, options: {
    reason?: string
    refundRewards?: boolean
    notifyUsers?: boolean
  } = {}) {
    return this.apiCall(`/admin/referral-invites/${inviteId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  async getReferralStats(userId?: string) {
    const endpoint = userId ? `/admin/referrals/stats/${userId}` : '/admin/referrals/stats'
    return this.apiCall(endpoint)
  }

  async getLeaderboard(params: {
    timeframe?: string
    limit?: number
    tier?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })

    return this.apiCall(`/admin/referrals/leaderboard?${searchParams}`)
  }

  // WAITLIST MANAGEMENT

  async getWaitlistData(email: string) {
    return this.apiCall('/admin/waitlist/user-data', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  async updateQueuePosition(userId: string, newPosition: number, reason?: string) {
    return this.apiCall(`/admin/waitlist/${userId}/position`, {
      method: 'PUT',
      body: JSON.stringify({ position: newPosition, reason })
    })
  }

  async batchUpdatePositions(updates: Array<{
    userId: string
    position: number
  }>) {
    return this.apiCall('/admin/waitlist/batch-update-positions', {
      method: 'POST',
      body: JSON.stringify({ updates })
    })
  }

  async getQueueStats() {
    return this.apiCall('/admin/waitlist/stats')
  }

  // REWARD AND TIER MANAGEMENT

  async updateUserTier(userId: string, newTier: string, reason?: string) {
    return this.apiCall(`/admin/users/${userId}/tier`, {
      method: 'PUT',
      body: JSON.stringify({ tier: newTier, reason })
    })
  }

  async awardBonusReward(userId: string, rewardData: {
    amount: number
    type: string
    reason: string
    expires_at?: string
  }) {
    return this.apiCall(`/admin/users/${userId}/bonus-reward`, {
      method: 'POST',
      body: JSON.stringify(rewardData)
    })
  }

  async getRewardHistory(userId?: string, limit: number = 50) {
    const endpoint = userId 
      ? `/admin/rewards/history/${userId}?limit=${limit}`
      : `/admin/rewards/history?limit=${limit}`
    return this.apiCall(endpoint)
  }

  // EMAIL AND COMMUNICATION

  async getEmailServiceStatus() {
    return this.apiCall('/admin/email-service/status')
  }

  async sendCustomEmail(recipients: string[], templateData: {
    subject: string
    template: string
    variables?: Record<string, any>
  }) {
    return this.apiCall('/admin/email-service/send-custom', {
      method: 'POST',
      body: JSON.stringify({
        recipients,
        ...templateData
      })
    })
  }

  async getEmailTemplates() {
    return this.apiCall('/admin/email-service/templates')
  }

  // ANALYTICS AND REPORTING

  async getConversionMetrics(timeframe: string = '30d') {
    return this.apiCall(`/admin/analytics/conversions?timeframe=${timeframe}`)
  }

  async getReferralPerformance(timeframe: string = '30d') {
    return this.apiCall(`/admin/analytics/referral-performance?timeframe=${timeframe}`)
  }

  async getEngagementStats(timeframe: string = '30d') {
    return this.apiCall(`/admin/analytics/engagement?timeframe=${timeframe}`)
  }

  async exportAnalytics(reportType: string, params: Record<string, any> = {}) {
    return this.apiCall('/admin/analytics/export', {
      method: 'POST',
      body: JSON.stringify({ reportType, params })
    })
  }

  // SYSTEM HEALTH AND MONITORING

  async getSystemHealth() {
    return this.apiCall('/admin/system/health')
  }

  async getApiMetrics() {
    return this.apiCall('/admin/system/metrics')
  }

  async getErrorLogs(params: {
    limit?: number
    severity?: string
    startDate?: string
    endDate?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })

    return this.apiCall(`/admin/system/error-logs?${searchParams}`)
  }

  // INTEGRATION MANAGEMENT

  async testApiIntegration(service: string) {
    return this.apiCall(`/admin/integrations/${service}/test`, {
      method: 'POST'
    })
  }

  async getIntegrationStatus() {
    return this.apiCall('/admin/integrations/status')
  }

  async updateIntegrationConfig(service: string, config: Record<string, any>) {
    return this.apiCall(`/admin/integrations/${service}/config`, {
      method: 'PUT',
      body: JSON.stringify(config)
    })
  }

  // DATA IMPORT/EXPORT

  async importData(dataType: string, data: any, options: {
    skipDuplicates?: boolean
    validateOnly?: boolean
    batchSize?: number
  } = {}) {
    return this.apiCall(`/admin/import/${dataType}`, {
      method: 'POST',
      body: JSON.stringify({ data, options })
    })
  }

  async getImportStatus(jobId: string) {
    return this.apiCall(`/admin/import/status/${jobId}`)
  }

  async cancelImportJob(jobId: string) {
    return this.apiCall(`/admin/import/cancel/${jobId}`, {
      method: 'POST'
    })
  }
}

// Export singleton instance
export const healthscanAdminApi = new HealthScanAdminApiService()

// Export types for use in components
export type { ApiResponse, PaginationMeta }

// Helper functions for common operations
export const formatApiError = (error: any): string => {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error) return error.error
  return 'An unexpected error occurred'
}

export const isApiError = (error: any): boolean => {
  return error && (error.message || error.error || typeof error === 'string')
}

export const createApiErrorHandler = (context: string) => {
  return (error: any) => {
    console.error(`❌ ${context}:`, error)
    const message = formatApiError(error)
    return `${context}: ${message}`
  }
}

// Retry helper for failed requests
export const withRetry = async function <T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxAttempts) {
        throw error
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }

  throw lastError
}

// Default export
export default healthscanAdminApi