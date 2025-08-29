// ConvertKit API Service for HealthScan
// Handles email subscription integration with ConvertKit

interface ConvertKitSubscriber {
  email: string
  first_name?: string
  tags?: string[]
  fields?: Record<string, any>
}

interface ConvertKitResponse {
  subscription?: {
    id: number
    subscriber: {
      id: number
      email: string
    }
  }
  error?: string
  message?: string
}

export class ConvertKitService {
  private readonly apiKey: string
  private readonly apiSecret: string
  private readonly formId: string = '293a519eba' // From your script
  private readonly baseUrl: string = 'https://api.convertkit.com/v3'

  constructor() {
    this.apiKey = Deno.env.get('CONVERTER_KIT_API_KEY') || ''
    this.apiSecret = Deno.env.get('CONVERTKIT_API_SECRET') || ''
    
    if (!this.apiKey) {
      console.warn('⚠️ CONVERTER_KIT_API_KEY not found in environment variables')
    }
  }

  /**
   * Subscribe a user to ConvertKit form
   */
  async subscribeToForm(email: string, firstName?: string, tags?: string[]): Promise<ConvertKitResponse> {
    try {
      console.log('📧 ConvertKit: Subscribing email to form:', email)
      
      if (!this.apiKey) {
        throw new Error('ConvertKit API key not configured')
      }

      const payload: ConvertKitSubscriber = {
        email,
        ...(firstName && { first_name: firstName }),
        ...(tags && tags.length > 0 && { tags })
      }

      const response = await fetch(`${this.baseUrl}/forms/${this.formId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          ...payload
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ ConvertKit API error:', response.status, errorText)
        throw new Error(`ConvertKit API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json() as ConvertKitResponse
      console.log('✅ ConvertKit: Successfully subscribed user:', email)
      
      return result
    } catch (error) {
      console.error('❌ ConvertKit subscription error:', error)
      throw error
    }
  }

  /**
   * Add subscriber to a specific sequence
   */
  async addToSequence(email: string, sequenceId: string): Promise<ConvertKitResponse> {
    try {
      console.log('📧 ConvertKit: Adding email to sequence:', email, sequenceId)
      
      if (!this.apiKey) {
        throw new Error('ConvertKit API key not configured')
      }

      const response = await fetch(`${this.baseUrl}/sequences/${sequenceId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          email
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ ConvertKit sequence API error:', response.status, errorText)
        throw new Error(`ConvertKit sequence API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json() as ConvertKitResponse
      console.log('✅ ConvertKit: Successfully added to sequence:', email)
      
      return result
    } catch (error) {
      console.error('❌ ConvertKit sequence error:', error)
      throw error
    }
  }

  /**
   * Tag a subscriber
   */
  async tagSubscriber(email: string, tagId: string): Promise<ConvertKitResponse> {
    try {
      console.log('🏷️ ConvertKit: Tagging subscriber:', email, tagId)
      
      if (!this.apiKey) {
        throw new Error('ConvertKit API key not configured')
      }

      const response = await fetch(`${this.baseUrl}/tags/${tagId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          email
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ ConvertKit tag API error:', response.status, errorText)
        throw new Error(`ConvertKit tag API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json() as ConvertKitResponse
      console.log('✅ ConvertKit: Successfully tagged subscriber:', email)
      
      return result
    } catch (error) {
      console.error('❌ ConvertKit tag error:', error)
      throw error
    }
  }

  /**
   * Update subscriber custom fields
   */
  async updateSubscriberFields(email: string, fields: Record<string, any>): Promise<ConvertKitResponse> {
    try {
      console.log('🔄 ConvertKit: Updating subscriber fields:', email)
      
      if (!this.apiKey) {
        throw new Error('ConvertKit API key not configured')
      }

      const response = await fetch(`${this.baseUrl}/subscribers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_secret: this.apiSecret,
          email,
          fields
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ ConvertKit update API error:', response.status, errorText)
        throw new Error(`ConvertKit update API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json() as ConvertKitResponse
      console.log('✅ ConvertKit: Successfully updated subscriber fields:', email)
      
      return result
    } catch (error) {
      console.error('❌ ConvertKit update error:', error)
      throw error
    }
  }

  /**
   * Check if ConvertKit is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Get ConvertKit configuration status
   */
  getStatus(): { configured: boolean; hasApiKey: boolean; hasSecret: boolean; formId: string } {
    return {
      configured: this.isConfigured(),
      hasApiKey: !!this.apiKey,
      hasSecret: !!this.apiSecret,
      formId: this.formId
    }
  }
}

// Export singleton instance
export const convertKitService = new ConvertKitService()