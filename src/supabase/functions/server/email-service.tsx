import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildWaitlistAlertEmail, WaitlistAlertPayload } from './email-templates.ts'

// Email service configuration
interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'postmark'
  apiKey: string
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text: string
  from?: string
}

// HealthScan logo component for emails with 100% rounded edges
const HealthScanLogo = `<img src="https://1debfa3241af40447f297e52b30a6022740a996d.png" alt="HealthScan" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255, 255, 255, 0.3); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);" />`

// Enhanced email templates for HealthScan with improved vertical spacing and branding
export const EMAIL_TEMPLATES = {
  // Clean, modern waitlist confirmation email with Poppins font and vibrant gradient
  waitlistConfirmationBitlyStyle: (email: string, position: number, confirmationLink: string, referralCode?: string, referralLink?: string): EmailTemplate => ({
    subject: 'Welcome to HealthScan! You\'re #' + position + ' in queue',
    html: `
      <div style="font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with vibrant gradient and logo -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%); padding: 48px 20px; text-align: center;">
          <div style="margin-bottom: 16px;">
            <img src="https://healthscan.live/logo.png" alt="HealthScan" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; display: inline-block;">
          </div>
          <h1 style="color: #ffffff; font-size: 32px; font-weight: 600; margin: 0; letter-spacing: -0.8px; font-family: 'Poppins', sans-serif;">
            HealthScan
          </h1>
          <p style="color: rgba(255, 255, 255, 0.9); font-size: 13px; margin: 8px 0 0 0; font-weight: 300; letter-spacing: 0.5px;">
            AI-Powered Health Scanning
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 48px 32px;">
          <!-- Welcome Message -->
          <h2 style="color: #1f2937; font-size: 26px; font-weight: 600; margin: 0 0 12px 0; font-family: 'Poppins', sans-serif;">
            Welcome to HealthScan!
          </h2>
          <p style="color: #6b7280; font-size: 15px; margin: 0 0 36px 0; line-height: 1.7; font-weight: 300; font-family: 'Poppins', sans-serif;">
            You're on your way to early access to our revolutionary AI-powered health scanner.
          </p>

          <!-- Queue Position Card -->
          <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%); border-left: 4px solid #10b981; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <p style="color: #059669; font-size: 12px; margin: 0 0 10px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-family: 'Poppins', sans-serif;">
              Queue Position
            </p>
            <p style="color: #10b981; font-size: 36px; font-weight: 600; margin: 0; font-family: 'Poppins', sans-serif;">
              #${position}
            </p>
          </div>

          <!-- Key Info -->
          <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 182, 212, 0.04) 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid rgba(16, 185, 129, 0.1);">
            <p style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; font-weight: 300; font-family: 'Poppins', sans-serif;">
              <span style="font-weight: 600; color: #1f2937;">Launch Date:</span> February 27th, 2026<br>
              <span style="font-weight: 600; color: #1f2937;">Status:</span> Early Access Confirmed
            </p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${confirmationLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: 'Poppins', sans-serif; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: transform 0.2s;">
              Confirm your email opt-in status here 💚
            </a>
          </div>
          
          <!-- Confirmation Note -->
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 32px 0; text-align: center; font-weight: 300; font-family: 'Poppins', sans-serif;">
            (You can unsubscribe at any time)
          </p>

          <!-- Referral Section -->
          ${referralLink ? `
          <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 28px; margin-bottom: 32px;">
            <h3 style="color: #b45309; font-size: 16px; font-weight: 600; margin: 0 0 12px 0; font-family: 'Poppins', sans-serif;">
              Earn Early Access Faster
            </h3>
            <p style="color: #92400e; font-size: 14px; line-height: 1.7; margin: 0 0 18px 0; font-weight: 300; font-family: 'Poppins', sans-serif;">
              Share your referral code with friends. Each person who signs up moves you up in the queue!
            </p>
            <div style="background: white; border-radius: 8px; padding: 14px; margin-bottom: 14px; border: 1px solid #fcd34d;">
              <p style="color: #92400e; font-size: 11px; margin: 0 0 6px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Poppins', sans-serif;">Your Referral Code</p>
              <p style="color: #b45309; font-size: 20px; font-weight: 600; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                ${referralCode}
              </p>
            </div>
            <a href="${referralLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; font-family: 'Poppins', sans-serif;">
              Share Link
            </a>
          </div>
          ` : ''}

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 28px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0; font-weight: 300; font-family: 'Poppins', sans-serif;">
              Questions? Reply to this email or visit our website.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0; font-weight: 300; font-family: 'Poppins', sans-serif;">
              © 2026 HealthScan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Welcome to HealthScan! 🎉

You're #${position} in the queue 📍

You're so close to getting early access to HealthScan - our revolutionary AI-powered health scanner launching February 27th, 2026.

Confirm your email: ${confirmationLink}

${referralLink ? `
🚀 Move Up Faster!
Share your referral link with friends. For each person who joins using your code, you'll move up in the queue!

Your referral code: ${referralCode}
Share your link: ${referralLink}
` : ''}

(You can unsubscribe at any time)

If you didn't sign up for HealthScan, or you're not sure why you received this email, you can delete it.

HealthScan Team • Building the future of health scanning
Launching February 27th, 2026 🚀
    `
  }),

  // Enhanced original template with HealthScan logo and improved spacing
  waitlistConfirmation: (email: string, position: number, confirmationLink: string): EmailTemplate => ({
    subject: '🎉 Welcome to HealthScan - Confirm Your Spot!',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fdf9;">
        <!-- Enhanced Header with Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="display: inline-flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            ${HealthScanLogo}
            <h1 style="color: #16a34a; font-size: 32px; margin: 0; font-weight: 600;">HealthScan</h1>
          </div>
          <p style="color: #6b7280; font-size: 17px; margin: 0;">Your AI-Powered Health Scanner</p>
        </div>
        
        <!-- Welcome Section with Enhanced Spacing -->
        <div style="background: linear-gradient(135deg, #f8fdf9 0%, #ecfdf5 100%); padding: 32px; border-radius: 16px; margin-bottom: 32px; border: 1px solid #d1fae5;">
          <h2 style="color: #065f46; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">🎉 You're on the waitlist!</h2>
          <p style="color: #374151; font-size: 17px; line-height: 1.6; margin: 0;">
            Thank you for joining HealthScan! You're <strong>#${position}</strong> in line for early access to our revolutionary AI health scanning technology.
          </p>
        </div>
        
        <!-- Enhanced CTA Section -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${confirmationLink}" 
             style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 17px; box-shadow: 0 4px 16px rgba(22, 163, 74, 0.3);">
            ✅ Confirm Your Email
          </a>
        </div>
        
        <!-- What's Next Section with Better Spacing -->
        <div style="background: #f9fafb; padding: 28px; border-radius: 12px; margin: 32px 0; border: 1px solid #e5e7eb;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">🚀 What's Next?</h3>
          <ul style="color: #6b7280; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">We'll notify you as soon as HealthScan launches on <strong>February 27th, 2026</strong></li>
            <li style="margin-bottom: 8px;">You'll get exclusive early access before the general public</li>
            <li style="margin-bottom: 8px;">Share your referral link to move up in the queue</li>
            <li style="margin-bottom: 0;">Follow our progress and health tips on our blog</li>
          </ul>
        </div>
        
        <!-- Enhanced Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 40px; text-align: center;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0 0 16px 0;">
            This email was sent to ${email}. If you didn't sign up for HealthScan, you can safely ignore this email.
          </p>
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            ${HealthScanLogo.replace('36px', '18px').replace('36px', '18px')}
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              HealthScan Team • Building the future of health scanning
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
🌱 HealthScan - Welcome to the Waitlist!

Thank you for joining HealthScan! You're #${position} in line for early access.

Please confirm your email by clicking this link: ${confirmationLink}

What's Next:
- We'll notify you when HealthScan launches on February 27th, 2026
- You'll get exclusive early access
- Share your referral link to move up in the queue

This email was sent to ${email}. If you didn't sign up, you can ignore this email.
    `
  }),

  // Enhanced email confirmed template
  emailConfirmed: (email: string, position: number, referralLink: string): EmailTemplate => ({
    subject: 'Welcome to HealthScan! You\'re #' + position + ' in queue',
    html: `
      <div style="font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with vibrant gradient -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%); padding: 48px 20px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 32px; font-weight: 600; margin: 0; letter-spacing: -0.8px; font-family: 'Poppins', sans-serif;">
            HealthScan
          </h1>
          <p style="color: rgba(255, 255, 255, 0.9); font-size: 13px; margin: 8px 0 0 0; font-weight: 300; letter-spacing: 0.5px;">
            AI-Powered Health Scanning
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 48px 32px;">
          <!-- Welcome Message -->
          <h2 style="color: #1f2937; font-size: 26px; font-weight: 600; margin: 0 0 12px 0; font-family: 'Poppins', sans-serif;">
            Welcome to HealthScan!
          </h2>
          <p style="color: #6b7280; font-size: 15px; margin: 0 0 36px 0; line-height: 1.7; font-weight: 300; font-family: 'Poppins', sans-serif;">
            You're on your way to early access to our revolutionary AI-powered health scanner.
          </p>

          <!-- Queue Position Card -->
          <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%); border-left: 4px solid #10b981; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <p style="color: #059669; font-size: 12px; margin: 0 0 10px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-family: 'Poppins', sans-serif;">
              Queue Position
            </p>
            <p style="color: #10b981; font-size: 36px; font-weight: 600; margin: 0; font-family: 'Poppins', sans-serif;">
              #${position}
            </p>
          </div>

          <!-- Key Info -->
          <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 182, 212, 0.04) 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid rgba(16, 185, 129, 0.1);">
            <p style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; font-weight: 300; font-family: 'Poppins', sans-serif;">
              <span style="font-weight: 600; color: #1f2937;">Launch Date:</span> February 27th, 2026<br>
              <span style="font-weight: 600; color: #1f2937;">Status:</span> Early Access Confirmed
            </p>
          </div>

          <!-- Referral Section -->
          <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 28px; margin-bottom: 32px;">
            <h3 style="color: #b45309; font-size: 16px; font-weight: 600; margin: 0 0 12px 0; font-family: 'Poppins', sans-serif;">
              Earn Early Access Faster
            </h3>
            <p style="color: #92400e; font-size: 14px; line-height: 1.7; margin: 0 0 18px 0; font-weight: 300; font-family: 'Poppins', sans-serif;">
              Share your referral link with friends. Each person who signs up moves you up in the queue!
            </p>
            <a href="${referralLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; font-family: 'Poppins', sans-serif;">
              Share Link
            </a>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 28px; text-align: center;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0; font-weight: 300; font-family: 'Poppins', sans-serif;">
              Questions? Reply to this email or visit our website.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0; font-weight: 300; font-family: 'Poppins', sans-serif;">
              © 2026 HealthScan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
🌱 HealthScan - Email Confirmed!

✅ You're officially #${position} on the HealthScan waitlist!
🗓️ Launch Date: February 27th, 2026

🚀 Move Up Faster!
Share HealthScan with friends: ${referralLink}

Questions? Reply to this email!

HealthScan Team
    `
  })
}

// Email service class
export class EmailService {
  private config: EmailConfig
  private supabase: any

  constructor(config: EmailConfig) {
    this.config = config
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
    const fromEmail = options.from || 'noreply@healthscan.live'
    
    try {
      switch (this.config.provider) {
        case 'resend':
          return await this.sendWithResend(options, fromEmail)
        case 'sendgrid':
          return await this.sendWithSendGrid(options, fromEmail)
        case 'postmark':
          return await this.sendWithPostmark(options, fromEmail)
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`)
      }
    } catch (error) {
      console.error('❌ Email service error:', error)
      return { success: false, error: error.message }
    }
  }

  private async sendWithResend(options: SendEmailOptions, fromEmail: string) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        
        // Check if it's an authentication error
        if (response.status === 401) {
          throw new Error(`Invalid Resend API key - please check your RESEND_API_KEY environment variable`)
        }
        
        throw new Error(`Resend API error (${response.status}): ${error}`)
      }

      const result = await response.json()
      console.log('📧 Email sent successfully via Resend:', result.id)
      return { success: true }
      
    } catch (fetchError) {
      // Handle network errors
      if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
        throw new Error('Unable to connect to Resend API - please check your internet connection')
      }
      throw fetchError
    }
  }

  private async sendWithSendGrid(options: SendEmailOptions, fromEmail: string) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: fromEmail },
        subject: options.subject,
        content: [
          { type: 'text/html', value: options.html },
          { type: 'text/plain', value: options.text },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SendGrid API error: ${error}`)
    }

    return { success: true }
  }

  private async sendWithPostmark(options: SendEmailOptions, fromEmail: string) {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: fromEmail,
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.html,
        TextBody: options.text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Postmark API error: ${error}`)
    }

    return { success: true }
  }

  // Generate email confirmation token
  generateConfirmationToken(email: string): string {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2)
    return btoa(`${email}:${timestamp}:${randomStr}`).replace(/[+/=]/g, (match) => {
      switch (match) {
        case '+': return '-'
        case '/': return '_'
        case '=': return ''
        default: return match
      }
    })
  }

  // Validate confirmation token
  validateConfirmationToken(token: string): { valid: boolean; email?: string; error?: string } {
    try {
      // Reverse the URL-safe encoding
      const base64Token = token.replace(/-/g, '+').replace(/_/g, '/')
      const decoded = atob(base64Token)
      const [email, timestampStr] = decoded.split(':')
      
      const timestamp = parseInt(timestampStr)
      const now = Date.now()
      const twentyFourHours = 24 * 60 * 60 * 1000
      
      if (now - timestamp > twentyFourHours) {
        return { valid: false, error: 'Confirmation token expired' }
      }
      
      if (!email || !email.includes('@')) {
        return { valid: false, error: 'Invalid email in token' }
      }
      
      return { valid: true, email }
    } catch (error) {
      return { valid: false, error: 'Invalid token format' }
    }
  }

  // Send waitlist confirmation email using enhanced Bitly style template
  async sendWaitlistConfirmation(email: string, position: number, useBitlyStyle: boolean = true): Promise<{ success: boolean; error?: string }> {
    const confirmationToken = this.generateConfirmationToken(email)
    const baseUrl = Deno.env.get('HEALTHSCAN_BASE_URL') || 'https://healthscan.live'
    const confirmationLink = `${baseUrl}/confirm-email?token=${confirmationToken}`
    
    // Use the enhanced Bitly-style template by default
    const template = useBitlyStyle 
      ? EMAIL_TEMPLATES.waitlistConfirmationBitlyStyle(email, position, confirmationLink)
      : EMAIL_TEMPLATES.waitlistConfirmation(email, position, confirmationLink)
    
    const result = await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    if (result.success) {
      // Store confirmation token in KV store with expiration
      const tokenData = {
        email,
        position,
        createdAt: new Date().toISOString(),
        confirmed: false
      }
      
      try {
        await this.storeConfirmationToken(confirmationToken, tokenData)
      } catch (kvError) {
        console.warn('⚠️ Could not store confirmation token:', kvError)
        // Don't fail the email send if KV storage fails
      }
    }

    return result
  }

  // Send email confirmed notification
  async sendEmailConfirmed(email: string, position: number, referralCode: string): Promise<{ success: boolean; error?: string }> {
    const baseUrl = Deno.env.get('HEALTHSCAN_BASE_URL') || 'https://healthscan.live'
    const referralLink = `${baseUrl}?ref=${referralCode}`
    
    const template = EMAIL_TEMPLATES.emailConfirmed(email, position, referralLink)
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  // Send email verification/confirmation for auth users with enhanced design
  async sendEmailConfirmation(email: string, confirmationLink: string): Promise<{ success: boolean; error?: string }> {
    const emailTemplate = {
      subject: '🔐 Verify Your HealthScan Email',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fdf9;">
          <!-- Enhanced Logo Section -->
          <div style="text-align: center; margin-bottom: 48px;">
            <div style="display: inline-flex; align-items: center; gap: 14px; padding: 14px 24px; background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); border-radius: 100px; box-shadow: 0 4px 16px rgba(22, 163, 74, 0.25);">
              ${HealthScanLogo}
              <span style="color: white; font-weight: 600; font-size: 19px; letter-spacing: -0.5px;">HealthScan</span>
            </div>
          </div>
          
          <!-- Main Content with Enhanced Spacing -->
          <div style="background-color: #ffffff; border-radius: 16px; padding: 56px 48px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); margin-bottom: 32px;">
            <!-- Headline -->
            <h1 style="font-size: 32px; font-weight: 600; color: #1a1a1a; margin: 0 0 32px 0; line-height: 1.25;">
              Verify Your Email Address 🔐
            </h1>
            
            <!-- Description with Better Spacing -->
            <p style="font-size: 17px; color: #4a4a4a; line-height: 1.6; margin: 0 0 28px 0;">
              Please verify your email address to continue using HealthScan and access all features.
            </p>
            
            <p style="font-size: 17px; color: #4a4a4a; line-height: 1.6; margin: 0 0 40px 0;">
              Click the button below to verify your email:
            </p>
            
            <!-- Enhanced CTA Button -->
            <div style="text-align: center; margin: 48px 0;">
              <a href="${confirmationLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 18px 36px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 17px; box-shadow: 0 4px 16px rgba(22, 163, 74, 0.3);">
                Verify Email Address ✅
              </a>
            </div>
            
            <!-- Link Fallback with Better Spacing -->
            <p style="font-size: 15px; color: #8a8a8a; text-align: center; margin: 40px 0 0 0; line-height: 1.6;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all; color: #16a34a; font-weight: 500; margin-top: 8px; display: inline-block;">${confirmationLink}</span>
            </p>
          </div>
          
          <!-- Enhanced Footer -->
          <div style="margin-top: 40px; padding: 0 24px;">
            <p style="font-size: 14px; color: #8a8a8a; line-height: 1.6; margin: 0 0 32px 0;">
              If you didn't request this verification, you can safely ignore this email.
            </p>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; text-align: center;">
              <div style="display: inline-flex; align-items: center; gap: 10px;">
                ${HealthScanLogo.replace('36px', '20px').replace('36px', '20px')}
                <p style="font-size: 13px; color: #b0b0b0; margin: 0; font-weight: 500;">
                  HealthScan • Building the future of health scanning
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
      text: `
Verify Your Email Address 🔐

Please verify your email address to continue using HealthScan and access all features.

Click this link to verify your email: ${confirmationLink}

If you didn't request this verification, you can safely ignore this email.

HealthScan • Building the future of health scanning
      `
    }
    
    return await this.sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    })
  }

  // Send admin waitlist alert
  async sendAdminWaitlistAlert(payload: WaitlistAlertPayload): Promise<{ success: boolean; error?: string }> {
    const adminEmail = Deno.env.get('WAITLIST_ALERT_EMAIL') || 'waitlist@healthscan.live'

    if (!adminEmail) {
      console.log('📧 Waitlist alert skipped - WAITLIST_ALERT_EMAIL not configured')
      return { success: false, error: 'WAITLIST_ALERT_EMAIL not configured' }
    }

    const template = buildWaitlistAlertEmail(payload)

    return await this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  private async storeConfirmationToken(token: string, data: any) {
    // Import KV functions
    const kv = await import('./kv_store.tsx')
    await kv.set(`email_confirmation_${token}`, data)
  }
}

// Validate API key format
function validateAPIKey(provider: string, apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return false
  }

  switch (provider) {
    case 'resend':
      // Resend API keys typically start with 're_' and are at least 20 characters
      return apiKey.startsWith('re_') && apiKey.length >= 20
    case 'sendgrid':
      // SendGrid API keys typically start with 'SG.' and are about 69 characters
      return apiKey.startsWith('SG.') && apiKey.length >= 60
    case 'postmark':
      // Postmark API keys are typically UUIDs (36 characters) or longer strings
      return apiKey.length >= 30
    default:
      return true
  }
}

// Initialize email service
export function createEmailService(): EmailService | null {
  // Check for email service configuration
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY')
  const postmarkKey = Deno.env.get('POSTMARK_API_KEY')

  if (resendKey) {
    if (validateAPIKey('resend', resendKey)) {
      console.log('📧 Email service initialized with Resend')
      return new EmailService({ provider: 'resend', apiKey: resendKey })
    } else {
      console.log('📧 Invalid Resend API key format - email confirmation disabled')
      return null
    }
  } else if (sendgridKey) {
    if (validateAPIKey('sendgrid', sendgridKey)) {
      console.log('📧 Email service initialized with SendGrid')
      return new EmailService({ provider: 'sendgrid', apiKey: sendgridKey })
    } else {
      console.log('📧 Invalid SendGrid API key format - email confirmation disabled')
      return null
    }
  } else if (postmarkKey) {
    if (validateAPIKey('postmark', postmarkKey)) {
      console.log('📧 Email service initialized with Postmark')
      return new EmailService({ provider: 'postmark', apiKey: postmarkKey })
    } else {
      console.log('📧 Invalid Postmark API key format - email confirmation disabled')
      return null
    }
  }

  // No API key provided - this is expected when email service isn't configured
  return null
}