// @ts-nocheck
// NOTE: Local reference copy only — deployed file is supabase/functions/make-server-ed0fe4c2/index.tsx
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'
import { convertKitService } from './convertkit-service.tsx'
import { googleSheetsService } from './google-sheets-service.tsx'
import { handleWaitlistSignup, getWaitlistStats } from './waitlist-endpoints.tsx'
import { handleEmailConfirmation, handleUserStatus } from './email-confirmation-endpoint.tsx'
import { zapierApp } from './zapier-endpoints.tsx'
import { createEmailService } from './email-service.tsx'
import { adminApp } from './admin-endpoints-fixed.tsx'
import { referralApp } from './referral-endpoints.tsx'
import blogRssApp from './blog-rss-endpoints.tsx'

// Slack notification helper - sends to configured webhook (non-blocking)
async function notifySlack(message: { text: string; blocks?: any[] }): Promise<void> {
  const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
  if (!webhookUrl) {
    console.log('ℹ️ Slack notification skipped (SLACK_WEBHOOK_URL not set)')
    return
  }
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
    if (!res.ok) console.warn('⚠️ Slack notification failed:', res.status)
    else console.log('✅ Slack notification sent')
  } catch (err) {
    console.warn('⚠️ Slack notification error (non-critical):', err)
  }
}

// IP geolocation via free ip-api.com (non-blocking, best-effort)
async function getGeoFromIP(ip: string): Promise<{ country: string; city: string; region: string } | null> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) return null
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    const data = await res.json()
    return { country: data.country || '', city: data.city || '', region: data.regionName || '' }
  } catch { return null }
}

async function buildWaitlistSlackMessage(data: {
  email: string; name: string; firstName?: string; lastName?: string;
  position: number; source: string; referralCode: string;
  referredBy?: string | null; totalWaitlist: number;
  signupDate: string; ipAddress?: string; userAgent?: string;
  utm_source?: string; utm_medium?: string; utm_campaign?: string;
  emailSent?: boolean; optedInUpdates?: boolean;
  referralCount?: number;
  tallySubmissionId?: string;
}) {
  const sourceLabel = data.source === 'tally' ? 'Tally Form' : 'Website'
  const timestamp = new Date(data.signupDate).toLocaleString('en-IE', { timeZone: 'Europe/Dublin', dateStyle: 'medium', timeStyle: 'short' })

  // Build UTM line
  const utmParts = [data.utm_source, data.utm_medium, data.utm_campaign].filter(Boolean)
  const utmLine = utmParts.length > 0 ? utmParts.join(' / ') : 'None'

  // Referral link (clickable URL)
  const referralUrl = `https://healthscan.live?ref=${data.referralCode}`

  // Supabase KV link
  const supabaseLink = `https://supabase.com/dashboard/project/mofhvoudjxinvpplsytd/database/tables`
  const adminLink = `https://healthscan.live/admin`

  // IP geolocation
  let locationStr = ''
  if (data.ipAddress && data.ipAddress !== 'unknown') {
    const geo = await getGeoFromIP(data.ipAddress)
    if (geo && geo.city) {
      locationStr = [geo.city, geo.region, geo.country].filter(Boolean).join(', ')
    }
  }

  const blocks: any[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `New Waitlist Signup — #${data.position}`, emoji: false }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Email:*\n${data.email}` },
        { type: 'mrkdwn', text: `*Name:*\n${data.name || 'Not provided'}` },
        { type: 'mrkdwn', text: `*Position:*\n#${data.position} of ${data.totalWaitlist}` },
        { type: 'mrkdwn', text: `*Source:*\n${sourceLabel}` },
        { type: 'mrkdwn', text: `*Signed Up:*\n${timestamp}` },
        { type: 'mrkdwn', text: `*Referral Link:*\n<${referralUrl}|${data.referralCode}>` }
      ]
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Referred By:*\n${data.referredBy ? `\`${data.referredBy}\`` : 'Direct signup'}` },
        { type: 'mrkdwn', text: `*Referrals:*\n${data.referralCount ?? 0}` },
        { type: 'mrkdwn', text: `*Email Sent:*\n${data.emailSent ? 'Yes' : 'No'}` },
        { type: 'mrkdwn', text: `*UTM:*\n${utmLine}` }
      ]
    }
  ]

  // Location + Device context line
  const contextParts: string[] = []
  if (locationStr) contextParts.push(`Location: ${locationStr}`)
  if (data.ipAddress && data.ipAddress !== 'unknown') contextParts.push(`IP: \`${data.ipAddress}\``)
  if (data.userAgent) {
    const ua = data.userAgent
    let device = 'Unknown'
    if (ua.includes('iPhone') || ua.includes('iPad')) device = 'iOS'
    else if (ua.includes('Android')) device = 'Android'
    else if (ua.includes('Mac')) device = 'macOS'
    else if (ua.includes('Windows')) device = 'Windows'
    else if (ua.includes('Linux')) device = 'Linux'
    let browser = ''
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Edg')) browser = 'Edge'
    contextParts.push(`${device}${browser ? ' / ' + browser : ''}`)
  }
  if (contextParts.length > 0) {
    blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: contextParts.join('  |  ') }] })
  }

  // Action links
  blocks.push({
    type: 'actions',
    elements: [
      { type: 'button', text: { type: 'plain_text', text: 'View in Supabase', emoji: false }, url: supabaseLink, action_id: 'view_supabase' },
      { type: 'button', text: { type: 'plain_text', text: 'Admin Panel', emoji: false }, url: adminLink, action_id: 'view_admin' }
    ]
  })
  blocks.push({ type: 'divider' })

  return {
    text: `New waitlist signup: ${data.name || data.email} (#${data.position}) via ${data.source}`,
    blocks
  }
}

// Initialize Hono app
const app = new Hono()

// Simple in-memory rate limiter for waitlist signup
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5 // 5 signups per IP per hour

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  // Clean up expired entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetAt < now) rateLimitMap.delete(key)
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, retryAfterSeconds: 0 }
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, retryAfterSeconds: 0 }
}

// Configure CORS - Allow all origins for development, configure for production
app.use('*', cors({
  origin: '*', // In production, replace with your domain
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Add logging
app.use('*', logger(console.log))

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Helper function to validate admin access
async function validateAdminAccess(accessToken: string) {
  if (!accessToken) {
    return { error: 'No access token provided', status: 401 }
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user) {
    return { error: 'Invalid access token', status: 401 }
  }

  // Check if user is admin using the same logic as frontend
  const userEmail = user.email?.toLowerCase()
  
  // Check specific admin emails first (for external admins)
  const specificAdminEmails = [
    'johnferreira@gmail.com',
    // Add other external admin emails here
  ]
  
  const isSpecificAdmin = userEmail && specificAdminEmails.includes(userEmail)
  
  // Check admin domains
  const adminDomains = ['healthscan.live', 'healthscan.com']
  const emailDomain = user.email?.split('@')[1]?.toLowerCase()
  const isDomainAdmin = emailDomain && adminDomains.includes(emailDomain)
  
  const isAdmin = isSpecificAdmin || isDomainAdmin
  
  if (!isAdmin) {
    console.warn(`❌ Admin access denied for user: ${user.email}`)
    return { error: 'Admin access required', status: 403 }
  }

  console.log(`✅ Admin access granted for user: ${user.email}`)
  return { user, isAdmin: true }
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Health check endpoints - Multiple formats for compatibility
app.get('/make-server-ed0fe4c2/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'HealthScan Production Server',
    version: '1.0.0'
  })
})

app.get('/make-server-ed0fe4c2/status', (c) => {
  return c.json({ 
    status: 'online', 
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    timestamp: new Date().toISOString(),
    server: 'HealthScan Production Server'
  })
})

app.get('/make-server-ed0fe4c2/ping', (c) => {
  return c.json({ 
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  })
})

app.get('/make-server-ed0fe4c2/', (c) => {
  return c.json({ 
    success: true,
    message: 'HealthScan API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health',
      '/status', 
      '/ping',
      '/stats',
      '/email-waitlist',
      '/webhooks/tally',
      '/admin/*',
      '/blog/articles',
      '/blog/health',
      '/blog/test'
    ]
  })
})

app.get('/make-server-ed0fe4c2/stats', (c) => {
  return c.json({
    success: true,
    data: {
      server: 'HealthScan Production Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints_available: [
        'health', 'status', 'ping', 'stats', 'email-waitlist', 'admin', 'blog'
      ]
    }
  })
})

// Debug endpoint for email capture issues
app.post('/make-server-ed0fe4c2/debug-email-capture', async (c) => {
  try {
    console.log('🔍 Debug email capture request received');
    
    // Get raw request body first
    const rawBody = await c.req.text();
    console.log('📋 Raw request body:', {
      body: rawBody,
      length: rawBody?.length,
      preview: rawBody?.substring(0, 200)
    });
    
    // Try to parse JSON
    let parsedBody = null;
    try {
      parsedBody = JSON.parse(rawBody);
      console.log('📋 Parsed body:', parsedBody);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
    }
    
    // Test the same email validation logic as waitlist endpoint
    if (parsedBody && parsedBody.email) {
      console.log('🧪 Testing email validation logic...');
      const { email } = parsedBody;
      
      console.log('📧 Email validation test:', {
        email: email,
        emailType: typeof email,
        emailLength: email?.length,
        emailValue: JSON.stringify(email),
        isString: typeof email === 'string',
        isNull: email === null,
        isUndefined: email === undefined,
        isEmpty: email === '',
        emailTrimmed: email?.trim?.(),
        trimmedLength: email?.trim?.()?.length
      });
      
      // Test normalization
      try {
        let normalizedEmail;
        if (!email || typeof email !== 'string') {
          throw new Error('Email must be a valid string');
        }
        normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
          throw new Error('Email cannot be empty after normalization');
        }
        
        console.log('✅ Email validation successful:', normalizedEmail);
        
        // Test email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidFormat = emailRegex.test(normalizedEmail);
        console.log('📧 Email format validation:', {
          normalizedEmail,
          isValidFormat,
          regexTest: emailRegex.test(normalizedEmail)
        });
        
      } catch (validationError) {
        console.error('❌ Email validation failed:', validationError);
        return c.json({
          success: false,
          error: 'Email validation failed in debug test',
          details: validationError.message,
          emailDebug: {
            receivedEmail: email,
            emailType: typeof email,
            isString: typeof email === 'string',
            isEmpty: email === '',
            isNullish: email == null
          },
          timestamp: new Date().toISOString()
        }, 400);
      }
    }
    
    const headers = {};
    for (const [key, value] of c.req.raw.headers.entries()) {
      headers[key] = value;
    }
    console.log('📋 Request headers:', headers);
    
    // Test KV store functionality
    console.log('🧪 Testing KV store...');
    const testKey = `debug_test_${Date.now()}`;
    const testValue = { test: true, timestamp: new Date().toISOString() };
    
    try {
      await kv.set(testKey, testValue);
      const retrieved = await kv.get(testKey);
      await kv.del(testKey);
      console.log('✅ KV store test successful');
    } catch (kvError) {
      console.error('❌ KV store test failed:', kvError);
      return c.json({
        success: false,
        error: 'KV store test failed',
        details: kvError.message,
        timestamp: new Date().toISOString()
      }, 500);
    }
    
    // Test Google Sheets service
    console.log('🧪 Testing Google Sheets service...');
    const googleSheetsStatus = googleSheetsService.getConfigurationStatus();
    console.log('📊 Google Sheets status:', googleSheetsStatus);
    
    return c.json({
      success: true,
      message: 'Debug endpoint working',
      debugInfo: {
        rawBodyReceived: !!rawBody,
        rawBodyLength: rawBody?.length,
        jsonParsed: !!parsedBody,
        kvStoreWorking: true,
        googleSheetsConfigured: googleSheetsStatus.configured,
        timestamp: new Date().toISOString(),
        requestMethod: c.req.method,
        requestUrl: c.req.url,
        contentType: c.req.header('Content-Type'),
        userAgent: c.req.header('User-Agent')
      },
      receivedData: {
        rawBody: rawBody?.substring(0, 500), // Limit to first 500 chars
        parsedBody: parsedBody,
        headers: headers
      }
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return c.json({
      success: false,
      error: 'Debug endpoint failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
})

// Email waitlist endpoint (with rate limiting)
app.post('/make-server-ed0fe4c2/email-waitlist', async (c) => {
  const ip = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || c.req.header('CF-Connecting-IP') || 'unknown'
  const { allowed, remaining, retryAfterSeconds } = checkRateLimit(ip)

  if (!allowed) {
    console.warn(`🚫 Rate limit exceeded for IP: ${ip}`)
    return c.json({
      success: false,
      error: 'Too many signup attempts. Please try again later.',
      retryAfterSeconds
    }, 429)
  }

  // Set rate limit headers
  c.header('X-RateLimit-Remaining', String(remaining))
  return handleWaitlistSignup(c)
})

// Email confirmation endpoint
app.get('/make-server-ed0fe4c2/confirm-email', handleEmailConfirmation)

// Waitlist stats endpoint
app.get('/make-server-ed0fe4c2/waitlist/stats', getWaitlistStats)

// User status endpoint  
app.get('/make-server-ed0fe4c2/user-status', handleUserStatus)

// Send verification email endpoint for authenticated users
app.post('/make-server-ed0fe4c2/users/:id/send-verification', async (c) => {
  try {
    const userId = c.req.param('id')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    console.log('📧 Send verification email request for user:', userId)
    
    // Validate UUID format
    if (!isValidUUID(userId)) {
      console.error('❌ Invalid UUID format for send verification:', userId)
      return c.json({ 
        success: false, 
        error: 'Invalid user ID format' 
      }, 400)
    }
    
    // Validate user access token
    if (!accessToken) {
      return c.json({ 
        success: false, 
        error: 'No access token provided' 
      }, 401)
    }
    
    // Get user from access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user) {
      console.error('❌ Invalid access token for send verification:', authError)
      return c.json({ 
        success: false, 
        error: 'Invalid access token' 
      }, 401)
    }
    
    // Verify user is requesting verification for their own account
    if (user.id !== userId) {
      console.error('❌ User ID mismatch for send verification:', { userId, actualUserId: user.id })
      return c.json({ 
        success: false, 
        error: 'Cannot send verification for another user' 
      }, 403)
    }
    
    // Get request body
    const body = await c.req.json()
    const { email } = body
    
    if (!email) {
      return c.json({ 
        success: false, 
        error: 'Email is required' 
      }, 400)
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const normalizedEmail = email.trim().toLowerCase()
    
    if (!emailRegex.test(normalizedEmail)) {
      return c.json({ 
        success: false, 
        error: 'Invalid email format' 
      }, 400)
    }
    
    // Verify the email matches the user's account
    if (user.email?.toLowerCase() !== normalizedEmail) {
      console.error('❌ Email mismatch for send verification:', { 
        userEmail: user.email, 
        requestedEmail: normalizedEmail 
      })
      return c.json({ 
        success: false, 
        error: 'Email does not match user account' 
      }, 400)
    }
    
    console.log('📧 Sending verification email to:', normalizedEmail)
    
    try {
      // First try using Supabase's built-in resend verification
      const { error: resendError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: normalizedEmail,
        options: {
          redirectTo: `${c.req.header('Origin') || 'https://healthscan.live'}/`
        }
      })
      
      if (resendError) {
        console.warn('⚠️ Supabase auth resend failed, trying custom email service:', resendError.message)
        
        // Fallback to custom email service if available
        const emailService = createEmailService()
        if (emailService) {
          console.log('📧 Using custom email service for verification email...')
          
          // Generate a simple confirmation link
          const confirmationToken = btoa(`${normalizedEmail}:${Date.now()}:${Math.random()}`)
          const confirmationLink = `${c.req.header('Origin') || 'https://healthscan.live'}/confirm-email?token=${confirmationToken}`
          
          // Store token temporarily
          await kv.set(`email_verification_${confirmationToken}`, {
            email: normalizedEmail,
            userId: user.id,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          })
          
          // Send email via custom service
          const emailResult = await emailService.sendEmailConfirmation(normalizedEmail, confirmationLink)
          
          if (!emailResult.success) {
            throw new Error(`Custom email service failed: ${emailResult.error}`)
          }
          
          console.log('✅ Verification email sent via custom service')
          
          return c.json({
            success: true,
            message: 'Verification email sent successfully',
            method: 'custom_email_service',
            timestamp: new Date().toISOString()
          })
        } else {
          throw new Error('No email service available')
        }
      } else {
        console.log('✅ Verification email sent via Supabase auth')
        
        return c.json({
          success: true,
          message: 'Verification email sent successfully',
          method: 'supabase_auth',
          timestamp: new Date().toISOString()
        })
      }
      
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError)
      
      // Final fallback - just return success to prevent user frustration
      // but log the actual error for debugging
      console.error('❌ All email methods failed, returning graceful error:', emailError.message)
      
      return c.json({
        success: false,
        error: 'Failed to send verification email',
        details: 'Please try again later or contact support if the problem persists',
        timestamp: new Date().toISOString()
      }, 500)
    }
    
  } catch (error) {
    console.error('❌ Send verification endpoint error:', error)
    return c.json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Tally.so webhook endpoint - syncs Tally form submissions to waitlist
app.post('/make-server-ed0fe4c2/webhooks/tally', async (c) => {
  try {
    console.log('📋 Tally.so webhook received')

    // Read body once (stream can only be consumed once)
    const rawBody = await c.req.text()
    console.log('📋 Tally raw body length:', rawBody?.length)

    // Optional: Verify Tally signature if signing secret is configured
    const tallySecret = Deno.env.get('TALLY_SIGNING_SECRET')
    if (tallySecret) {
      const receivedSignature = c.req.header('Tally-Signature')
      if (receivedSignature) {
        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(tallySecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        )
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
        const calculatedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))

        if (receivedSignature !== calculatedSignature) {
          console.warn('🚫 Tally webhook signature mismatch')
          return c.json({ success: false, error: 'Invalid signature' }, 401)
        }
        console.log('✅ Tally webhook signature verified')
      }
    }

    // Parse the already-read body as JSON
    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch (parseErr) {
      console.error('❌ Tally webhook: Failed to parse JSON body:', parseErr)
      return c.json({ success: false, error: 'Invalid JSON payload' }, 400)
    }

    console.log('📋 Tally payload event:', payload?.eventType)

    // Only process form submission events
    if (payload?.eventType !== 'FORM_RESPONSE') {
      return c.json({ success: true, message: 'Event type ignored', eventType: payload?.eventType })
    }

    const fields = payload?.data?.fields || []
    const respondentId = payload?.data?.respondentId || ''
    const submissionId = payload?.data?.submissionId || ''
    const createdAt = payload?.data?.createdAt || new Date().toISOString()

    // Extract fields from Tally payload
    let email = ''
    let firstName = ''
    let lastName = ''
    let referralCode = ''
    let optedInUpdates = false

    for (const field of fields) {
      const label = (field?.label || '').toLowerCase()
      const value = field?.value || ''

      if (field?.type === 'INPUT_EMAIL' || label.includes('email')) {
        email = typeof value === 'string' ? value.trim().toLowerCase() : ''
      } else if (label === 'first' || label === 'first name' || label === 'firstname') {
        firstName = typeof value === 'string' ? value.trim() : ''
      } else if (label === 'last' || label === 'last name' || label === 'lastname') {
        lastName = typeof value === 'string' ? value.trim() : ''
      } else if (label.includes('referral') || label.includes('code')) {
        referralCode = typeof value === 'string' ? value.trim() : ''
      } else if (field?.type === 'CHECKBOXES' && label?.includes('update')) {
        optedInUpdates = value === true || (Array.isArray(value) && value.length > 0)
      }
    }

    // Combine first + last name
    const name = [firstName, lastName].filter(Boolean).join(' ')
    console.log('📋 Tally fields extracted:', { email: email ? 'present' : 'missing', firstName, lastName, name, referralCode, optedInUpdates })

    if (!email) {
      console.warn('⚠️ Tally webhook: No email found in submission fields')
      return c.json({ success: false, error: 'No email field found in submission' }, 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.warn('⚠️ Tally webhook: Invalid email format:', email)
      return c.json({ success: false, error: 'Invalid email format' }, 400)
    }

    console.log('📧 Tally webhook processing signup for:', email)

    // Check for duplicate
    const existingUser = await kv.get(`waitlist_user_${email}`)
    if (existingUser) {
      console.log('✅ Tally webhook: User already on waitlist:', email)
      return c.json({
        success: true,
        message: 'User already on waitlist',
        alreadyExists: true,
        position: existingUser.position,
        referralCode: existingUser.referralCode
      })
    }

    // Get current count for position
    let currentCount = 0
    try {
      currentCount = await kv.countByPrefix('waitlist_user_')
    } catch {
      const countData = await kv.get('waitlist_count')
      currentCount = countData?.count || 0
    }

    const position = currentCount + 1

    // Generate referral code
    let hash = 0
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    const userReferralCode = `hs_${Math.abs(hash).toString(36).substring(0, 6).padEnd(6, '0')}`

    // Store user in KV
    const userData: Record<string, any> = {
      email,
      name: name || email.split('@')[0],
      firstName: firstName || null,
      lastName: lastName || null,
      position,
      referralCode: userReferralCode,
      source: 'tally',
      referredBy: referralCode || null,
      signupDate: createdAt,
      confirmed: false,
      emailsSent: 0,
      lastEmailSent: null,
      optedInUpdates,
      tallySubmissionId: submissionId,
      tallyRespondentId: respondentId
    }

    await kv.set(`waitlist_user_${email}`, userData)

    // Update waitlist count
    await kv.set('waitlist_count', { count: position, lastUpdated: new Date().toISOString() })

    console.log(`🎉 Tally webhook: New waitlist signup #${position}: ${email}`)

    // Slack notification (non-blocking)
    buildWaitlistSlackMessage({
      email, name: name || email.split('@')[0],
      firstName: firstName || undefined, lastName: lastName || undefined,
      position, source: 'tally', referralCode: userReferralCode,
      referredBy: referralCode || null, totalWaitlist: position,
      signupDate: createdAt, optedInUpdates,
      referralCount: 0,
      tallySubmissionId: submissionId
    }).then(msg => notifySlack(msg)).catch(() => {})

    // Send confirmation email (optional, non-blocking)
    try {
      const emailService = createEmailService()
      if (emailService) {
        const emailResult = await emailService.sendWaitlistConfirmation(email, position, true)
        if (emailResult.success) {
          userData.emailsSent = 1
          userData.lastEmailSent = new Date().toISOString()
          await kv.set(`waitlist_user_${email}`, userData)
          console.log('✅ Tally webhook: Confirmation email sent')
        }
      }
    } catch (emailErr) {
      console.warn('⚠️ Tally webhook: Email send failed (non-critical):', emailErr)
    }

    return c.json({
      success: true,
      message: 'Waitlist signup processed from Tally',
      position,
      referralCode: userReferralCode,
      email,
      source: 'tally'
    }, 201)

  } catch (error) {
    console.error('❌ Tally webhook error:', error)
    return c.json({
      success: false,
      error: 'Webhook processing failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Admin: Send test email sequence (all 3 emails)
app.post('/make-server-ed0fe4c2/admin/send-test-emails', async (c) => {
  try {
    const body = await c.req.json()
    const { email, position, referralCode, name } = body

    if (!email) return c.json({ error: 'email required' }, 400)

    const emailService = createEmailService()
    if (!emailService) return c.json({ error: 'Email service not configured' }, 500)

    const baseUrl = 'https://healthscan.live'
    const confirmationToken = btoa(`${email}:${Date.now()}:${Math.random()}`)
    const confirmationLink = `${baseUrl}/confirm-email?token=${confirmationToken}`
    const referralLink = referralCode ? `${baseUrl}?ref=${referralCode}` : ''

    const results: Record<string, any> = {}

    // Email 1: Confirmation
    results.confirmation = await emailService.sendWaitlistConfirmation(
      email, position || 1, true
    )

    // Email 2: Welcome
    if (referralCode) {
      results.welcome = await emailService.sendWelcomeEmail(email, position || 1, referralCode)
    }

    // Email 3: How to Use
    results.howToUse = await emailService.sendHowToUseEmail(email, name || '')

    return c.json({ success: true, results })
  } catch (err) {
    return c.json({ error: 'Failed to send test emails', details: String(err) }, 500)
  }
})

// Mount admin endpoints
app.route('/', adminApp)

// Mount Referral endpoints
app.route('/make-server-ed0fe4c2', referralApp)

// Mount Zapier endpoints
app.route('/make-server-ed0fe4c2/zapier', zapierApp)

// Mount Blog RSS endpoints
app.route('/make-server-ed0fe4c2', blogRssApp)

// Add explicit blog endpoint for debugging
app.get('/make-server-ed0fe4c2/blog/test', (c) => {
  return c.json({
    success: true,
    message: 'Blog endpoint is working',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/make-server-ed0fe4c2/blog/articles',
      '/make-server-ed0fe4c2/blog/health',
      '/make-server-ed0fe4c2/blog/ping'
    ]
  })
})

// Health endpoint specifically for blog service
app.get('/make-server-ed0fe4c2/blog/service-health', (c) => {
  return c.json({
    success: true,
    message: 'Blog service is operational',
    timestamp: new Date().toISOString(),
    service: 'blog-rss-service',
    status: 'healthy'
  })
})

// Admin endpoint to resend welcome email
app.post('/make-server-ed0fe4c2/admin/resend-welcome-email', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    
    // Validate admin access
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    const { email, recordId } = await c.req.json()

    if (!email || typeof email !== 'string') {
      return c.json({ success: false, error: 'Valid email is required' }, 400)
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Create email service
    const emailService = createEmailService()
    
    if (!emailService) {
      console.error('❌ Email service not initialized - no API key configured')
      return c.json({ 
        success: false, 
        error: 'Email service not configured. Please set RESEND_API_KEY, SENDGRID_API_KEY, or POSTMARK_API_KEY environment variable.'
      }, 500)
    }

    // Get waitlist user info to send with email
    let position = 0
    let referralCode = 'unknown'
    
    try {
      const waitlistUser = await kv.get(`waitlist_user_${normalizedEmail}`)
      if (waitlistUser) {
        position = waitlistUser.position || 0
        referralCode = waitlistUser.referralCode || 'unknown'
      }
    } catch (error) {
      console.warn('⚠️ Could not retrieve waitlist user info:', error)
    }

    console.log(`📧 Attempting to send welcome email to ${normalizedEmail} (position: ${position})`)

    // Send welcome email
    const result = await emailService.sendEmailConfirmed(normalizedEmail, position, referralCode)

    if (result.success) {
      // Update email tracking in KV store
      try {
        const waitlistUser = await kv.get(`waitlist_user_${normalizedEmail}`)
        if (waitlistUser) {
          waitlistUser.emailsSent = (waitlistUser.emailsSent || 0) + 1
          waitlistUser.lastEmailSent = new Date().toISOString()
          await kv.set(`waitlist_user_${normalizedEmail}`, waitlistUser)
        }
      } catch (error) {
        console.warn('⚠️ Could not update email tracking:', error)
      }

      console.log(`✅ Welcome email resent to ${normalizedEmail}`)
      return c.json({ 
        success: true, 
        message: 'Welcome email sent successfully',
        email: normalizedEmail
      })
    } else {
      console.error(`❌ Failed to send email to ${normalizedEmail}:`, result.error)
      return c.json({ 
        success: false, 
        error: result.error || 'Failed to send email'
      }, 500)
    }
  } catch (error) {
    console.error('❌ Error in resend-welcome-email endpoint:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'Internal server error'
    }, 500)
  }
})

// Get waitlist data from KV store for admin panel
app.get('/make-server-ed0fe4c2/admin/waitlist', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    
    // Validate admin access
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    console.log('📊 Fetching waitlist data from KV store...')
    
    // Get all waitlist users from KV store
    const allKeys = await kv.getByPrefix('waitlist_user_')
    
    if (!allKeys || allKeys.length === 0) {
      console.log('📭 No waitlist users found')
      return c.json([])
    }

    // Transform KV data to admin panel format, sorted by position
    const waitlistUsers = allKeys
      .sort((a: any, b: any) => (a.position || 999) - (b.position || 999))
      .map((user: any, index: number) => ({
        id: user.email || `waitlist_${index}`,
        email: user.email,
        name: user.name || null,
        position: user.position || index + 1,
        referralCode: user.referralCode,
        referrals: user.referrals || 0,
        emailsSent: user.emailsSent || 0,
        email_sent: (user.emailsSent || 0) > 0,
        created_at: user.signupDate || user.createdAt,
        confirmed: user.confirmed || false,
        lastEmailSent: user.lastEmailSent,
        ipAddress: user.ipAddress || null,
        userAgent: user.userAgent || null,
        source: user.source || null,
        referredBy: user.referredBy || null
      }))

    console.log(`✅ Retrieved ${waitlistUsers.length} waitlist users from KV store`)
    
    return c.json(waitlistUsers)
  } catch (error) {
    console.error('❌ Error fetching waitlist data:', error)
    return c.json({ 
      success: false, 
      error: error.message || 'Internal server error'
    }, 500)
  }
})

// Get products data from KV store for admin panel
app.get('/make-server-ed0fe4c2/admin/products', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    console.log('[Admin] Fetching products from KV store...')
    const allProducts = await kv.getByPrefix('product_')
    
    if (!allProducts || allProducts.length === 0) {
      console.log('[Admin] No products found in KV store')
      return c.json([])
    }

    const products = allProducts.map((product: any, index: number) => ({
      id: product.id || `product_${index}`,
      name: product.name,
      brand: product.brand || null,
      category: product.category || null,
      type: product.type || null,
      barcode: product.barcode || null,
      description: product.description || null,
      image_url: product.image_url || null,
      serving_size: product.serving_size || null,
      ingredients: product.ingredients || [],
      nutrition_facts: product.nutrition_facts || {},
      allergens: product.allergens || [],
      warnings: product.warnings || [],
      certifications: product.certifications || [],
      source: product.source || null,
      created_at: product.imported_at || null
    }))

    console.log(`[Admin] Retrieved ${products.length} products from KV store`)
    return c.json(products)
  } catch (error) {
    console.error('[Admin] Error fetching products:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

// Delete a waitlist user from KV store (POST body to avoid @ in URL)
app.post('/make-server-ed0fe4c2/admin/waitlist/delete', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    const { email } = await c.req.json()
    const normalizedEmail = (email || '').trim().toLowerCase()
    if (!normalizedEmail) {
      return c.json({ success: false, error: 'Email is required' }, 400)
    }

    const existing = await kv.get(`waitlist_user_${normalizedEmail}`)
    if (!existing) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    await kv.del(`waitlist_user_${normalizedEmail}`)
    console.log(`🗑️ Deleted waitlist user: ${normalizedEmail}`)

    // Recalculate positions for remaining users
    const remaining = await kv.getByPrefix('waitlist_user_')
    const sorted = remaining.sort((a: any, b: any) => (a.position || 999) - (b.position || 999))
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].position !== i + 1) {
        sorted[i].position = i + 1
        await kv.set(`waitlist_user_${sorted[i].email}`, sorted[i])
      }
    }
    // Update count
    await kv.set('waitlist_count', { count: sorted.length, lastUpdated: new Date().toISOString() })

    return c.json({ success: true, message: `Deleted ${normalizedEmail}`, newCount: sorted.length })
  } catch (error) {
    console.error('❌ Error deleting waitlist user:', error)
    return c.json({ success: false, error: error.message || 'Internal server error' }, 500)
  }
})

// Update a waitlist user in KV store (POST body to avoid @ in URL)
app.post('/make-server-ed0fe4c2/admin/waitlist/update', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    const { email, updates } = await c.req.json()
    const normalizedEmail = (email || '').trim().toLowerCase()
    if (!normalizedEmail) {
      return c.json({ success: false, error: 'Email is required' }, 400)
    }

    const existing = await kv.get(`waitlist_user_${normalizedEmail}`)
    if (!existing) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    const updatedUser = { ...existing, ...updates, email: existing.email }
    await kv.set(`waitlist_user_${normalizedEmail}`, updatedUser)
    console.log(`✏️ Updated waitlist user: ${normalizedEmail}`)

    return c.json({ success: true, message: `Updated ${normalizedEmail}`, user: updatedUser })
  } catch (error) {
    console.error('❌ Error updating waitlist user:', error)
    return c.json({ success: false, error: error.message || 'Internal server error' }, 500)
  }
})

// Bulk update waitlist users
app.post('/make-server-ed0fe4c2/admin/waitlist/bulk-update', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    const { emails, updates } = await c.req.json()
    if (!Array.isArray(emails) || emails.length === 0) {
      return c.json({ success: false, error: 'emails array is required' }, 400)
    }

    let updated = 0
    let failed = 0
    for (const email of emails) {
      try {
        const normalizedEmail = email.trim().toLowerCase()
        const existing = await kv.get(`waitlist_user_${normalizedEmail}`)
        if (existing) {
          const updatedUser = { ...existing, ...updates, email: existing.email }
          await kv.set(`waitlist_user_${normalizedEmail}`, updatedUser)
          updated++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    console.log(`✏️ Bulk updated ${updated} waitlist users (${failed} failed)`)
    return c.json({ success: true, updated, failed })
  } catch (error) {
    console.error('❌ Error in bulk update:', error)
    return c.json({ success: false, error: error.message || 'Internal server error' }, 500)
  }
})

// Bulk delete waitlist users
app.post('/make-server-ed0fe4c2/admin/waitlist/bulk-delete', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    const { emails } = await c.req.json()
    if (!Array.isArray(emails) || emails.length === 0) {
      return c.json({ success: false, error: 'emails array is required' }, 400)
    }

    let deleted = 0
    let failed = 0
    for (const email of emails) {
      try {
        const normalizedEmail = email.trim().toLowerCase()
        await kv.del(`waitlist_user_${normalizedEmail}`)
        deleted++
      } catch {
        failed++
      }
    }

    console.log(`🗑️ Bulk deleted ${deleted} waitlist users (${failed} failed)`)
    return c.json({ success: true, deleted, failed })
  } catch (error) {
    console.error('❌ Error in bulk delete:', error)
    return c.json({ success: false, error: error.message || 'Internal server error' }, 500)
  }
})

// Admin: Update a catalog record (elements, ingredients, recipes, products)
app.post('/make-server-ed0fe4c2/admin/catalog/update', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    const { table, id, updates } = await c.req.json()
    
    const allowedTables = ['catalog_elements', 'catalog_ingredients', 'catalog_recipes', 'catalog_products']
    if (!allowedTables.includes(table)) {
      return c.json({ success: false, error: `Invalid table: ${table}` }, 400)
    }
    if (!id) {
      return c.json({ success: false, error: 'Record ID is required' }, 400)
    }

    // Products are stored in KV, not a DB table
    if (table === 'catalog_products') {
      const existing = await kv.get(id)
      if (!existing) {
        return c.json({ success: false, error: 'Product not found' }, 404)
      }
      const stripFields = ['_displayIndex', 'created_at']
      const cleanUpdates = { ...existing, ...updates }
      stripFields.forEach(f => delete cleanUpdates[f])
      cleanUpdates.updated_at = new Date().toISOString()
      await kv.set(id, cleanUpdates)
      console.log(`[Admin] Updated product ${id} in KV by ${adminValidation.user.email}`)
      return c.json({ success: true })
    }

    // Strip non-DB fields from updates
    const cleanUpdates = { ...updates }
    const stripFields = ['_displayIndex', 'id', 'created_at', 'imported_at', 'api_source', 'external_id']
    stripFields.forEach(f => delete cleanUpdates[f])
    Object.keys(cleanUpdates).forEach(k => {
      if (cleanUpdates[k] === undefined) delete cleanUpdates[k]
    })

    cleanUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from(table)
      .update(cleanUpdates)
      .eq('id', id)

    if (error) {
      console.error(`[Admin] Failed to update ${table} record ${id}:`, error)
      return c.json({ success: false, error: error.message }, 500)
    }

    console.log(`[Admin] Updated ${table} record ${id} by ${adminValidation.user.email}`)
    return c.json({ success: true })
  } catch (error) {
    console.error('[Admin] Error updating catalog record:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

// Admin: Delete a catalog record (elements, ingredients, recipes, products)
app.post('/make-server-ed0fe4c2/admin/catalog/delete', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    const { table, id } = await c.req.json()
    
    const allowedTables = ['catalog_elements', 'catalog_ingredients', 'catalog_recipes', 'catalog_products']
    if (!allowedTables.includes(table)) {
      return c.json({ success: false, error: `Invalid table: ${table}` }, 400)
    }
    if (!id) {
      return c.json({ success: false, error: 'Record ID is required' }, 400)
    }

    // Products are stored in KV, not a DB table
    if (table === 'catalog_products') {
      await kv.del(id)
      console.log(`[Admin] Deleted product ${id} from KV by ${adminValidation.user.email}`)
      return c.json({ success: true })
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`[Admin] Failed to delete ${table} record ${id}:`, error)
      return c.json({ success: false, error: error.message }, 500)
    }

    console.log(`[Admin] Deleted ${table} record ${id} by ${adminValidation.user.email}`)
    return c.json({ success: true })
  } catch (error) {
    console.error('[Admin] Error deleting catalog record:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

// Start server
Deno.serve(app.fetch)