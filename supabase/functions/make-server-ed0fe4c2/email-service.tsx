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

// Shared email layout wrapper — clean, minimal, professional
function emailLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
${preheader ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background-color:#111827;padding:32px 40px;text-align:center;">
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.3px;">HealthScan</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    ${content}
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#9ca3af;">HealthScan — AI-Powered Health Scanning</p>
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#9ca3af;">You received this because you signed up at healthscan.live</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// Reusable button component
function emailButton(text: string, href: string, color: string = '#111827'): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
<tr><td align="center" style="background-color:${color};border-radius:6px;">
  <a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${text}</a>
</td></tr>
</table>`
}

// Reusable info row
function infoRow(label: string, value: string): string {
  return `<tr>
<td style="padding:8px 0;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;width:120px;vertical-align:top;">${label}</td>
<td style="padding:8px 0;font-size:13px;color:#111827;font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${value}</td>
</tr>`
}

// ─── EMAIL TEMPLATES ────────────────────────────────────────────────────────

export const EMAIL_TEMPLATES = {

  // ── Email 1: Confirmation (sent immediately on signup) ──────────────────
  waitlistConfirmation: (email: string, position: number, confirmationLink: string, referralCode?: string, referralLink?: string): EmailTemplate => ({
    subject: `Confirm your spot — you're #${position} on the HealthScan waitlist`,
    html: emailLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Confirm your email</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
        Thanks for signing up for HealthScan. Please confirm your email address to secure your spot on the waitlist.
      </p>

      ${emailButton('Confirm Email Address', confirmationLink, '#10b981')}

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;border:1px solid #e5e7eb;border-radius:6px;">
        <tr><td style="padding:20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${infoRow('Position', `#${position}`)}
            ${infoRow('Launch', 'February 27, 2026')}
            ${infoRow('Status', 'Awaiting confirmation')}
            ${referralCode ? infoRow('Your code', `<code style="background:#f4f4f5;padding:2px 6px;border-radius:3px;font-size:13px;">${referralCode}</code>`) : ''}
          </table>
        </td></tr>
      </table>

      ${referralLink ? `
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111827;">Move up the queue</p>
      <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6;">
        Share your referral link with friends. Each signup using your link moves you closer to the front.
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280;word-break:break-all;">
        <a href="${referralLink}" style="color:#10b981;text-decoration:underline;">${referralLink}</a>
      </p>
      ` : ''}

      <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
        If you didn't sign up for HealthScan, you can ignore this email. You can unsubscribe at any time.
      </p>
    `, `You're #${position} on the HealthScan waitlist. Confirm your email to secure your spot.`),
    text: `Confirm your spot on the HealthScan waitlist

You're #${position} in the queue.

Confirm your email: ${confirmationLink}

Launch date: February 27, 2026
Status: Awaiting confirmation
${referralCode ? `Your referral code: ${referralCode}` : ''}
${referralLink ? `Share your referral link: ${referralLink}` : ''}

If you didn't sign up, you can ignore this email.

HealthScan — AI-Powered Health Scanning`
  }),

  // ── Email 1 (Bitly-style alias — same as above for backward compat) ─────
  waitlistConfirmationBitlyStyle: (email: string, position: number, confirmationLink: string, referralCode?: string, referralLink?: string): EmailTemplate => {
    return EMAIL_TEMPLATES.waitlistConfirmation(email, position, confirmationLink, referralCode, referralLink)
  },

  // ── Email 2: Welcome (sent after email confirmation or 3 days later) ────
  welcomeEmail: (email: string, position: number, referralCode: string, referralLink: string): EmailTemplate => ({
    subject: `Welcome to HealthScan — here's what happens next`,
    html: emailLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Welcome to HealthScan</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
        Your email is confirmed and your spot is secured. Here's what to expect before launch.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
        <tr><td style="padding:20px;background-color:#f9fafb;border-radius:6px;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Your queue position</p>
          <p style="margin:0;font-size:32px;font-weight:600;color:#111827;">#${position}</p>
        </td></tr>
      </table>

      <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#111827;">What happens next</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
        <tr><td style="padding:10px 0;font-size:14px;color:#4b5563;line-height:1.6;border-bottom:1px solid #f4f4f5;">
          <strong style="color:#111827;">1.</strong> We're building the final features before launch on February 27, 2026.
        </td></tr>
        <tr><td style="padding:10px 0;font-size:14px;color:#4b5563;line-height:1.6;border-bottom:1px solid #f4f4f5;">
          <strong style="color:#111827;">2.</strong> You'll receive an email with early access instructions before the public launch.
        </td></tr>
        <tr><td style="padding:10px 0;font-size:14px;color:#4b5563;line-height:1.6;border-bottom:1px solid #f4f4f5;">
          <strong style="color:#111827;">3.</strong> Early access users get free premium features for the first 30 days.
        </td></tr>
        <tr><td style="padding:10px 0;font-size:14px;color:#4b5563;line-height:1.6;">
          <strong style="color:#111827;">4.</strong> Share your referral link to move up in the queue and unlock bonus features.
        </td></tr>
      </table>

      <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#111827;">Your referral link</p>
      <p style="margin:0 0 8px;font-size:14px;color:#4b5563;line-height:1.6;">
        Each friend who signs up using your link moves you closer to the front of the queue.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
        <tr><td style="padding:12px 16px;background-color:#f4f4f5;border-radius:6px;">
          <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Referral code</p>
          <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;font-family:'Courier New',monospace;letter-spacing:1px;">${referralCode}</p>
          <a href="${referralLink}" style="font-size:13px;color:#10b981;text-decoration:underline;word-break:break-all;">${referralLink}</a>
        </td></tr>
      </table>

      ${emailButton('Visit HealthScan', 'https://healthscan.live')}

      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Questions? Just reply to this email.
      </p>
    `, `Your spot is confirmed. Here's what happens before HealthScan launches.`),
    text: `Welcome to HealthScan

Your email is confirmed and your spot is secured.

Queue position: #${position}
Launch date: February 27, 2026

What happens next:
1. We're building the final features before launch.
2. You'll receive early access instructions before the public launch.
3. Early access users get free premium features for 30 days.
4. Share your referral link to move up in the queue.

Your referral code: ${referralCode}
Your referral link: ${referralLink}

Questions? Reply to this email.

HealthScan — AI-Powered Health Scanning`
  }),

  // ── Email 3: How to Use / Getting Started (sent 3 days after signup) ────
  howToUseEmail: (email: string, name: string): EmailTemplate => ({
    subject: 'Getting ready for HealthScan — what you can do now',
    html: emailLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Get ready for launch day</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
        Hi${name ? ` ${name}` : ''}, HealthScan launches on February 27, 2026. Here's how to get the most out of it from day one.
      </p>

      <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#111827;">How HealthScan works</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
        <tr><td style="padding:12px 0;font-size:14px;color:#4b5563;line-height:1.6;border-bottom:1px solid #f4f4f5;">
          <strong style="color:#111827;">Scan any food product</strong><br>
          Point your camera at a food label, barcode, or ingredient list. HealthScan's AI reads and analyses it instantly.
        </td></tr>
        <tr><td style="padding:12px 0;font-size:14px;color:#4b5563;line-height:1.6;border-bottom:1px solid #f4f4f5;">
          <strong style="color:#111827;">Get a health score</strong><br>
          Every product receives a clear health score based on ingredients, nutritional content, and additives.
        </td></tr>
        <tr><td style="padding:12px 0;font-size:14px;color:#4b5563;line-height:1.6;border-bottom:1px solid #f4f4f5;">
          <strong style="color:#111827;">Understand what's inside</strong><br>
          See a plain-language breakdown of every ingredient — what it is, why it's there, and whether to watch out for it.
        </td></tr>
        <tr><td style="padding:12px 0;font-size:14px;color:#4b5563;line-height:1.6;">
          <strong style="color:#111827;">Track your choices</strong><br>
          Build a history of scanned products and track how your food choices improve over time.
        </td></tr>
      </table>

      <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#111827;">What you can do right now</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
        <tr><td style="padding:10px 0;font-size:14px;color:#4b5563;line-height:1.6;border-bottom:1px solid #f4f4f5;">
          Share your referral link to move up the queue and get access sooner.
        </td></tr>
        <tr><td style="padding:10px 0;font-size:14px;color:#4b5563;line-height:1.6;border-bottom:1px solid #f4f4f5;">
          Follow us on social media for launch updates and health tips.
        </td></tr>
        <tr><td style="padding:10px 0;font-size:14px;color:#4b5563;line-height:1.6;">
          Start thinking about the products you want to scan first — we'll be ready.
        </td></tr>
      </table>

      ${emailButton('Visit HealthScan', 'https://healthscan.live')}

      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Questions about how it works? Just reply to this email.
      </p>
    `, `Here's how to get the most out of HealthScan from day one.`),
    text: `Getting ready for HealthScan

Hi${name ? ` ${name}` : ''}, HealthScan launches on February 27, 2026. Here's how to get the most out of it.

How HealthScan works:
- Scan any food product: Point your camera at a food label or barcode.
- Get a health score: Every product receives a clear health score.
- Understand what's inside: Plain-language breakdown of every ingredient.
- Track your choices: Build a history and track improvements.

What you can do now:
- Share your referral link to move up the queue.
- Follow us on social media for updates.
- Start thinking about products you want to scan first.

Visit: https://healthscan.live

Questions? Reply to this email.

HealthScan — AI-Powered Health Scanning`
  }),

  // ── Email Confirmed (sent when user clicks confirm link) ────────────────
  emailConfirmed: (email: string, position: number, referralLink: string): EmailTemplate => ({
    subject: `You're confirmed — #${position} on the HealthScan waitlist`,
    html: emailLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Email confirmed</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
        Your email is verified and your spot on the waitlist is locked in. We'll be in touch before launch.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
        <tr><td style="padding:20px;background-color:#f9fafb;border-radius:6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${infoRow('Position', `#${position}`)}
            ${infoRow('Launch', 'February 27, 2026')}
            ${infoRow('Status', 'Confirmed')}
          </table>
        </td></tr>
      </table>

      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111827;">Move up the queue</p>
      <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6;">
        Share your referral link. Each friend who joins moves you closer to the front.
      </p>
      <p style="margin:0 0 28px;">
        <a href="${referralLink}" style="font-size:13px;color:#10b981;text-decoration:underline;word-break:break-all;">${referralLink}</a>
      </p>

      ${emailButton('Visit HealthScan', 'https://healthscan.live')}

      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Questions? Just reply to this email.
      </p>
    `, `Your email is confirmed. You're #${position} on the HealthScan waitlist.`),
    text: `Email confirmed

Your spot on the HealthScan waitlist is locked in.

Position: #${position}
Launch: February 27, 2026
Status: Confirmed

Share your referral link to move up: ${referralLink}

Visit: https://healthscan.live

HealthScan — AI-Powered Health Scanning`
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

  // Send welcome email (Email 2 — sent after confirmation or 3 days later)
  async sendWelcomeEmail(email: string, position: number, referralCode: string): Promise<{ success: boolean; error?: string }> {
    const baseUrl = Deno.env.get('HEALTHSCAN_BASE_URL') || 'https://healthscan.live'
    const referralLink = `${baseUrl}?ref=${referralCode}`
    
    const template = EMAIL_TEMPLATES.welcomeEmail(email, position, referralCode, referralLink)
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  // Send how-to-use email (Email 3 — sent 3 days after signup)
  async sendHowToUseEmail(email: string, name: string): Promise<{ success: boolean; error?: string }> {
    const template = EMAIL_TEMPLATES.howToUseEmail(email, name)
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }

  // Send email verification/confirmation for auth users
  async sendEmailConfirmation(email: string, confirmationLink: string): Promise<{ success: boolean; error?: string }> {
    const emailTemplate = {
      subject: 'Verify your HealthScan email address',
      html: emailLayout(`
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;">Verify your email</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
          Please verify your email address to continue using HealthScan and access all features.
        </p>

        ${emailButton('Verify Email Address', confirmationLink, '#10b981')}

        <p style="margin:28px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${confirmationLink}" style="color:#10b981;word-break:break-all;text-decoration:underline;">${confirmationLink}</a>
        </p>

        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
          If you didn't request this verification, you can safely ignore this email.
        </p>
      `, 'Verify your email to access HealthScan.'),
      text: `Verify your HealthScan email address

Please verify your email address to continue using HealthScan.

Click this link to verify: ${confirmationLink}

If you didn't request this, you can ignore this email.

HealthScan — AI-Powered Health Scanning`
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