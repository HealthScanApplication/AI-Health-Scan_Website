// @ts-nocheck
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { handleEmailConfirmation, handleUserStatus } from './email-confirmation-endpoint.tsx'
import { createEmailService } from './email-service.tsx'
import { googleSheetsService } from './google-sheets-service.tsx'
import * as kv from './kv_store.tsx'
import { getWaitlistStats, handleWaitlistSignup } from './waitlist-endpoints.tsx'
import { zapierApp } from './zapier-endpoints.tsx'
// admin-endpoints-fixed.tsx is no longer used as a sub-app - all admin routes are inline below
import blogRssApp from './blog-rss-endpoints.tsx'
import { referralApp } from './referral-endpoints.tsx'

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
    version: '2.0.0-inline-admin'
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

// ============ ADMIN CRUD ROUTES (inline to avoid sub-app routing issues) ============

// Admin: Resend welcome email
app.post('/make-server-ed0fe4c2/admin/resend-welcome-email', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const { email } = await c.req.json()
    if (!email || typeof email !== 'string') return c.json({ success: false, error: 'Valid email is required' }, 400)
    const normalizedEmail = email.trim().toLowerCase()
    const emailService = createEmailService()
    if (!emailService) return c.json({ success: false, error: 'Email service not configured.' }, 500)
    let position = 0, referralCode = 'unknown'
    try { const u = await kv.get(`waitlist_user_${normalizedEmail}`); if (u) { position = u.position || 0; referralCode = u.referralCode || 'unknown' } } catch (_e) {}
    const result = await emailService.sendEmailConfirmed(normalizedEmail, position, referralCode)
    if (result.success) {
      try { const u = await kv.get(`waitlist_user_${normalizedEmail}`); if (u) { u.emailsSent = (u.emailsSent || 0) + 1; u.lastEmailSent = new Date().toISOString(); await kv.set(`waitlist_user_${normalizedEmail}`, u) } } catch (_e) {}
      return c.json({ success: true, message: 'Welcome email sent successfully', email: normalizedEmail })
    }
    return c.json({ success: false, error: result.error || 'Failed to send email' }, 500)
  } catch (error: any) { return c.json({ success: false, error: error?.message || 'Internal server error' }, 500) }
})

// Admin: Get waitlist data from KV store
app.get('/make-server-ed0fe4c2/admin/waitlist', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const allKeys = await kv.getByPrefix('waitlist_user_')
    if (!allKeys || allKeys.length === 0) return c.json([])
    const waitlistUsers = allKeys
      .sort((a: any, b: any) => (a.position || 999) - (b.position || 999))
      .map((user: any, index: number) => ({
        id: user.email || `waitlist_${index}`, email: user.email, name: user.name || null,
        position: user.position || index + 1, referralCode: user.referralCode, referrals: user.referrals || 0,
        emailsSent: user.emailsSent || 0, email_sent: (user.emailsSent || 0) > 0,
        created_at: user.signupDate || user.createdAt, confirmed: user.confirmed || false,
        lastEmailSent: user.lastEmailSent, ipAddress: user.ipAddress || null,
        userAgent: user.userAgent || null, source: user.source || null, referredBy: user.referredBy || null
      }))
    return c.json(waitlistUsers)
  } catch (error: any) { return c.json({ success: false, error: error?.message || 'Internal server error' }, 500) }
})

// Admin: Delete waitlist user
app.post('/make-server-ed0fe4c2/admin/waitlist/delete', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const { email } = await c.req.json()
    const normalizedEmail = (email || '').trim().toLowerCase()
    if (!normalizedEmail) return c.json({ success: false, error: 'Email is required' }, 400)
    const existing = await kv.get(`waitlist_user_${normalizedEmail}`)
    if (!existing) return c.json({ success: false, error: 'User not found' }, 404)
    await kv.del(`waitlist_user_${normalizedEmail}`)
    const remaining = await kv.getByPrefix('waitlist_user_')
    const sorted = remaining.sort((a: any, b: any) => (a.position || 999) - (b.position || 999))
    for (let i = 0; i < sorted.length; i++) { if (sorted[i].position !== i + 1) { sorted[i].position = i + 1; await kv.set(`waitlist_user_${sorted[i].email}`, sorted[i]) } }
    await kv.set('waitlist_count', { count: sorted.length, lastUpdated: new Date().toISOString() })
    return c.json({ success: true, message: `Deleted ${normalizedEmail}`, newCount: sorted.length })
  } catch (error: any) { return c.json({ success: false, error: error?.message || 'Internal server error' }, 500) }
})

// Admin: Update waitlist user
app.post('/make-server-ed0fe4c2/admin/waitlist/update', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const { email, updates } = await c.req.json()
    const normalizedEmail = (email || '').trim().toLowerCase()
    if (!normalizedEmail) return c.json({ success: false, error: 'Email is required' }, 400)
    const existing = await kv.get(`waitlist_user_${normalizedEmail}`)
    if (!existing) return c.json({ success: false, error: 'User not found' }, 404)
    const updatedUser = { ...existing, ...updates, email: existing.email }
    await kv.set(`waitlist_user_${normalizedEmail}`, updatedUser)
    return c.json({ success: true, message: `Updated ${normalizedEmail}`, user: updatedUser })
  } catch (error: any) { return c.json({ success: false, error: error?.message || 'Internal server error' }, 500) }
})

// Admin: Bulk update waitlist
app.post('/make-server-ed0fe4c2/admin/waitlist/bulk-update', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const { emails, updates } = await c.req.json()
    if (!Array.isArray(emails) || emails.length === 0) return c.json({ success: false, error: 'emails array is required' }, 400)
    let updated = 0, failed = 0
    for (const em of emails) { try { const n = em.trim().toLowerCase(); const ex = await kv.get(`waitlist_user_${n}`); if (ex) { await kv.set(`waitlist_user_${n}`, { ...ex, ...updates, email: ex.email }); updated++ } else { failed++ } } catch { failed++ } }
    return c.json({ success: true, updated, failed })
  } catch (error: any) { return c.json({ success: false, error: error?.message || 'Internal server error' }, 500) }
})

// Admin: Bulk delete waitlist
app.post('/make-server-ed0fe4c2/admin/waitlist/bulk-delete', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const { emails } = await c.req.json()
    if (!Array.isArray(emails) || emails.length === 0) return c.json({ success: false, error: 'emails array is required' }, 400)
    let deleted = 0, failed = 0
    for (const em of emails) { try { await kv.del(`waitlist_user_${em.trim().toLowerCase()}`); deleted++ } catch { failed++ } }
    return c.json({ success: true, deleted, failed })
  } catch (error: any) { return c.json({ success: false, error: error?.message || 'Internal server error' }, 500) }
})

// Admin: Get products from KV
app.get('/make-server-ed0fe4c2/admin/products', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const allProducts = await kv.getByPrefix('product_')
    if (!allProducts || allProducts.length === 0) return c.json([])
    const products = allProducts.map((p: any, i: number) => ({
      id: p.id || `product_${i}`, name: p.name, brand: p.brand || null, category: p.category || null,
      type: p.type || null, barcode: p.barcode || null, description: p.description || null,
      image_url: p.image_url || null, serving_size: p.serving_size || null,
      ingredients: p.ingredients || [], nutrition_facts: p.nutrition_facts || {},
      allergens: p.allergens || [], warnings: p.warnings || [], certifications: p.certifications || [],
      source: p.source || null, created_at: p.imported_at || null
    }))
    return c.json(products)
  } catch (error: any) { return c.json({ success: false, error: 'Internal server error' }, 500) }
})

// Admin: Update catalog record (elements, ingredients, recipes, products)
app.post('/make-server-ed0fe4c2/admin/catalog/update', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const { table, id, updates } = await c.req.json()
    const allowedTables = ['catalog_elements', 'catalog_ingredients', 'catalog_recipes', 'catalog_products']
    if (!allowedTables.includes(table)) return c.json({ success: false, error: `Invalid table: ${table}` }, 400)
    if (!id) return c.json({ success: false, error: 'Record ID is required' }, 400)
    if (table === 'catalog_products') {
      // First try KV store (legacy products stored as 'product_<id>')
      let kvKey = id
      let existing = await kv.get(id)
      if (!existing) {
        kvKey = `product_${id}`
        existing = await kv.get(kvKey)
      }
      if (!existing) {
        // Scan all KV products and find by id field
        const allProducts = await kv.getByPrefix('product_')
        const match = allProducts?.find((p: any) => p.id === id)
        if (match) { existing = match; kvKey = `product_${match.id}` }
      }
      if (existing) {
        // Found in KV — update there
        const kvClean = { ...existing, ...updates }
        ;['_displayIndex', 'created_at'].forEach((f: string) => delete kvClean[f])
        kvClean.updated_at = new Date().toISOString()
        await kv.set(kvKey, kvClean)
        return c.json({ success: true })
      }
      // Not in KV — fall through to Supabase DB update below (catalog_products table)
    }
    // Per-table column allowlists — strip any unknown columns before update to prevent schema errors
    const TABLE_COLUMNS: Record<string, Set<string>> = {
      catalog_elements: new Set([
        'name_common','name_other','category','type_label','subcategory','health_role','essential_90',
        'chemical_symbol','molecular_formula','cas_number','slug',
        'description','description_simple','description_technical','description_full',
        'functions','health_benefits','risk_tags','thresholds','deficiency_ranges','excess_ranges','drv_by_population',
        'found_in','food_sources_detailed','food_strategy','reason',
        'deficiency','interactions','detox_strategy',
        'health_score','scientific_references','info_sections',
        'image_url','image_url_raw','image_url_powdered','image_url_cut','video_url','images','videos',
        'scientific_papers','social_content',
        'ai_enriched_at','ai_enrichment_version','updated_at',
      ]),
      catalog_recipes: new Set([
        'name_common','name_other','name_scientific','category','category_sub','meal_slot',
        'cuisine','language','type',
        'prep_time','cook_time','servings','difficulty','equipment','instructions','cooking_instructions',
        'linked_ingredients','ingredients',
        'description','description_simple','description_technical',
        'health_benefits','taste_profile','flavor_profile','texture_profile',
        'elements_beneficial','elements_hazardous','nutrition_per_100g','nutrition_per_serving',
        'health_score','scientific_references',
        'storage_tips','selection_tips','preparation_methods','culinary_uses',
        'season','origin','varieties','processing_type',
        'serving_size','subcategory','tags','allergens','dietary_info',
        'image_url','image_url_raw','image_url_plated','image_url_closeup','video_url','images','videos',
        'scientific_papers','social_content',
        'updated_at',
      ]),
      catalog_ingredients: new Set([
        'name_common','name_other','name_scientific','category','category_sub',
        'processing_type','processing_methods','raw_ingredients','description_processing',
        'description_simple','description_technical','health_benefits','taste_profile',
        'elements_beneficial','elements_hazardous','health_score','scientific_references',
        'nutrition_per_100g','nutrition_per_serving',
        'origin_country','origin_region','origin_city','culinary_history',
        'image_url','image_url_raw','image_url_powdered','image_url_cut','image_url_cubed','image_url_cooked','video_url','images','videos',
        'scientific_papers','social_content',
        'updated_at',
      ]),
      catalog_products: new Set([
        'name_common','name','name_brand','brand','manufacturer','category','category_sub','subcategory','barcode','quantity',
        'ingredients_text','allergen_info','serving_size','serving_unit',
        'description','description_simple','description_technical',
        'health_benefits','taste_profile',
        'elements_beneficial','elements_hazardous','health_score',
        'nutri_score','nova_group','eco_score',
        'nutrition_per_100g','nutrition_per_serving','nutrition_facts',
        'scientific_references','scientific_papers','social_content',
        'image_url','image_url_raw','image_url_back','image_url_detail','video_url','images','videos',
        'origin_country','region','country',
        'updated_at',
      ]),
    }
    const allowedCols = TABLE_COLUMNS[table]
    const cleanUpdates: Record<string, any> = {}
    for (const [k, v] of Object.entries(updates)) {
      if (!allowedCols || allowedCols.has(k)) {
        if (v !== undefined && !['_displayIndex','id','created_at','imported_at','api_source','external_id'].includes(k)) {
          cleanUpdates[k] = v
        }
      } else {
        console.warn(`[Admin] Stripping unknown column "${k}" from ${table} update`)
      }
    }
    // For catalog_elements: sync category from health_role so both columns stay consistent
    if (table === 'catalog_elements' && cleanUpdates.health_role) {
      const hr = String(cleanUpdates.health_role).toLowerCase()
      cleanUpdates.category = hr === 'conditional' ? 'both' : hr
    }
    cleanUpdates.updated_at = new Date().toISOString()
    const { error } = await supabase.from(table).update(cleanUpdates).eq('id', id)
    if (error) return c.json({ success: false, error: error.message }, 500)
    return c.json({ success: true })
  } catch (error: any) {
    console.error('[Admin] Error updating catalog record:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// Admin: Ensure storage bucket exists
app.post('/make-server-ed0fe4c2/admin/storage/ensure-bucket', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const { bucket } = await c.req.json()
    if (!bucket || typeof bucket !== 'string') return c.json({ success: false, error: 'Bucket name required' }, 400)
    // Try to get the bucket first
    const { data: existing } = await supabase.storage.getBucket(bucket)
    if (existing) return c.json({ success: true, message: 'Bucket already exists' })
    // Create it
    const { error } = await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 52428800 })
    if (error) return c.json({ success: false, error: error.message }, 500)
    console.log(`[Admin] Created storage bucket "${bucket}" by ${adminValidation.user.email}`)
    return c.json({ success: true, message: 'Bucket created' })
  } catch (error: any) {
    console.error('[Admin] Error ensuring bucket:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// Admin: Upload file to storage (uses service role — bypasses RLS)
app.post('/make-server-ed0fe4c2/admin/storage/upload', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)

    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'catalog-media'
    if (!file) return c.json({ success: false, error: 'No file provided' }, 400)

    const ext = file.name.split('.').pop() || 'bin'
    const path = `admin-uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // Ensure bucket exists
    const { data: existing } = await supabase.storage.getBucket(bucket)
    if (!existing) {
      const { error: createErr } = await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 52428800 })
      if (createErr) {
        console.error('[Admin] Failed to create bucket:', createErr)
        return c.json({ success: false, error: `Failed to create bucket: ${createErr.message}` }, 500)
      }
      console.log(`[Admin] Auto-created bucket "${bucket}"`)
    }

    // Upload using service role (bypasses RLS)
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })
    if (uploadErr) {
      console.error('[Admin] Upload error:', uploadErr)
      return c.json({ success: false, error: uploadErr.message }, 500)
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
    console.log(`[Admin] File uploaded: ${path} by ${adminValidation.user.email}`)
    return c.json({ success: true, publicUrl: urlData.publicUrl })
  } catch (error: any) {
    console.error('[Admin] Upload error:', error)
    return c.json({ success: false, error: error?.message || 'Upload failed' }, 500)
  }
})

// Admin: Delete catalog record
app.post('/make-server-ed0fe4c2/admin/catalog/delete', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const { table, id } = await c.req.json()
    const allowedTables = ['catalog_elements', 'catalog_ingredients', 'catalog_recipes', 'catalog_products']
    if (!allowedTables.includes(table)) return c.json({ success: false, error: `Invalid table: ${table}` }, 400)
    if (!id) return c.json({ success: false, error: 'Record ID is required' }, 400)
    if (table === 'catalog_products') { await kv.del(id); return c.json({ success: true }) }
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return c.json({ success: false, error: error.message }, 500)
    return c.json({ success: true })
  } catch (error: any) { return c.json({ success: false, error: 'Internal server error' }, 500) }
})

// Admin: AI Fill Fields — uses OpenAI to populate empty fields based on record name and existing data
app.post('/make-server-ed0fe4c2/admin/ai-fill-fields', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)

    const { tabType, recordData, fields, sampleRecords, context } = await c.req.json()
    if (!tabType || !recordData || !fields) return c.json({ success: false, error: 'tabType, recordData, and fields are required' }, 400)

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) return c.json({ success: false, error: 'OPENAI_API_KEY not configured. Set it with: supabase secrets set OPENAI_API_KEY=sk-...' }, 500)

    // Build the prompt
    const recordName = recordData.name || recordData.name_common || recordData.email || 'Unknown'
    const existingData: Record<string, any> = {}
    const emptyFields: { key: string; label: string; type: string; options?: string[]; placeholder?: string }[] = []

    // Helper: check if a nutrition/hazard JSON object is effectively empty
    const isEffectivelyEmpty = (key: string, val: any): boolean => {
      if (val === null || val === undefined || val === '') return true
      if (Array.isArray(val) && val.length === 0) return true
      if (typeof val === 'object' && !Array.isArray(val)) {
        if (Object.keys(val).length === 0) return true
        // elements_beneficial: treat as empty if no actual nutrient values exist
        if (key === 'elements_beneficial') {
          const p100 = val.per_100g || val.nutrition_per_100g || {}
          const hasAnyValue = JSON.stringify(p100).match(/[1-9]/)
          return !hasAnyValue
        }
        // elements_hazardous: treat as empty if no flagged elements
        if (key === 'elements_hazardous') {
          const entries = Object.entries(val)
          const hasFlagged = entries.some(([_, v]: [string, any]) => {
            if (typeof v === 'string') return v !== 'none' && v !== ''
            if (typeof v === 'object' && v) return v.level && v.level !== 'none'
            return false
          })
          return !hasFlagged
        }
        // taste_profile: treat as empty if all values are 0
        if (key === 'taste_profile') {
          return !JSON.stringify(val).match(/[1-9]/)
        }
        // nutrition_per_100g / nutrition_per_serving: treat as empty if no calorie value
        if (key === 'nutrition_per_100g' || key === 'nutrition_per_serving') {
          return !JSON.stringify(val).match(/[1-9]/)
        }
      }
      return false
    }

    // Field types that cannot be meaningfully AI-filled
    const SKIP_TYPES = new Set(['image', 'video', 'readonly', 'date', 'linked_elements', 'linked_ingredients', 'content_links', 'grouped_ingredients'])

    for (const f of fields) {
      const val = recordData[f.key]
      if (!isEffectivelyEmpty(f.key, val)) {
        existingData[f.key] = val
      } else if (!SKIP_TYPES.has(f.type)) {
        emptyFields.push({ key: f.key, label: f.label, type: f.type, options: f.options, placeholder: f.placeholder })
      }
    }

    if (emptyFields.length === 0) return c.json({ success: true, filledFields: {}, message: 'All fields already have data' })

    // Build sample context from existing records
    let sampleContext = ''
    if (sampleRecords && sampleRecords.length > 0) {
      const samples = sampleRecords.slice(0, 2).map((s: any) => {
        const relevant: Record<string, any> = {}
        for (const f of emptyFields) {
          if (s[f.key] !== null && s[f.key] !== undefined && s[f.key] !== '') relevant[f.key] = s[f.key]
        }
        return { name: s.name || s.name_common || s.email, ...relevant }
      }).filter((s: any) => Object.keys(s).length > 1)
      if (samples.length > 0) {
        sampleContext = `\n\nHere are example records from the same table for format reference:\n${JSON.stringify(samples, null, 2)}`
      }
    }

    // Build structured format hints for special field types
    const isRecipeTab = (tabType || '').toLowerCase().includes('recipe') || (tabType || '').toLowerCase().includes('meal')
    const structuredFormats: Record<string, string> = {
      'taste_profile': isRecipeTab
        ? `JSON object with exact structure: {"taste":{"sweet":0-10,"sour":0-10,"salty":0-10,"bitter":0-10,"umami":0-10,"spicy":0-10},"texture":{"crispy":0-10,"crunchy":0-10,"chewy":0-10,"smooth":0-10,"creamy":0-10,"juicy":0-10}}. IMPORTANT: Read the cooking steps and full ingredient list provided in the context above. Analyse HOW the ingredients are cooked (e.g. roasting adds sweetness/bitterness, frying adds crunch, braising adds umami/richness, spices add heat) and derive the OVERALL finished-dish flavour and texture profile — not just the raw ingredients in isolation. Use realistic 0-10 values that reflect the final eating experience of this specific recipe.`
        : `JSON object with exact structure: {"taste":{"sweet":0-10,"sour":0-10,"salty":0-10,"bitter":0-10,"umami":0-10,"spicy":0-10},"texture":{"crispy":0-10,"crunchy":0-10,"chewy":0-10,"smooth":0-10,"creamy":0-10,"juicy":0-10}}. Use realistic values based on the sensory profile of this ingredient.`,
      'nutrition_per_100g': `JSON object with macro values per 100g: {"calories":number,"protein_g":number,"carbohydrates_g":number,"fats_g":number,"fiber_g":number,"sugar_g":number,"sodium_mg":number}. Use real USDA/nutritional database values.`,
      'nutrition_per_serving': `JSON object with macro values per typical serving: {"calories":number,"protein_g":number,"carbohydrates_g":number,"fats_g":number,"fiber_g":number,"sugar_g":number,"sodium_mg":number,"serving_size_g":number}. Base serving size on typical portion for this ${isRecipeTab ? 'recipe/dish' : 'product/ingredient'}.`,
      'prep_time': `String with time and unit, e.g. "15 min" or "1 hour". Realistic prep time for this recipe.`,
      'cook_time': `String with time and unit, e.g. "30 min" or "1 hour 15 min". Realistic cooking time for this recipe.`,
      'servings': `Integer number of servings this recipe yields, e.g. 4`,
      'difficulty': `One of: "easy", "medium", "hard". Based on technique complexity and time required.`,
      'meal_slot': `JSON array of applicable meal times from: ["breakfast","lunch","dinner","snack","dessert","appetizer","side dish"]. Include all that apply.`,
      'cuisine': `String name of the cuisine origin, e.g. "Italian", "Japanese", "Mexican", "Mediterranean".`,
      'processing_methods': `JSON array of applicable processing methods. Common values: ["raw","cooked","fermented","dried","smoked","pickled","roasted","steamed","fried","baked","freeze-dried","cold-pressed","pasteurized","homogenized","refined","extracted"]. Only include methods that actually apply.`,
      'category_sub': isRecipeTab
        ? `JSON array of subcategory strings relevant to this recipe's main category. E.g. for "meal": ["One-Pot","High-Protein","Gluten-Free"]. For "beverage": ["Smoothie","Cold-Pressed"].`
        : `JSON array of subcategory strings relevant to this ingredient's main category.`,
      'elements_beneficial': `JSON object: {"serving":{"name":"e.g. 1 cup","size_g":number},"per_100g":{"calories":number,"macronutrients":{"protein_g":g,"fat_g":g,"carbohydrates_g":g,"fiber_g":g,"sugars_g":g,"water_content_g":g},"vitamins":{"vitamin_a_mcg":mcg,"vitamin_d3_mcg":mcg,"vitamin_e_mg":mg,"vitamin_k2_mcg":mcg,"vitamin_c_mg":mg,"thiamine_mg":mg,"riboflavin_mg":mg,"niacin_mg":mg,"pantothenic_acid_mg":mg,"pyridoxine_mg":mg,"biotin_mcg":mcg,"folate_mcg":mcg,"vitamin_b12_mcg":mcg},"minerals":{"calcium_mg":mg,"phosphorus_mg":mg,"magnesium_mg":mg,"sodium_mg":mg,"potassium_mg":mg,"iron_mg":mg,"zinc_mg":mg,"copper_mg":mg,"manganese_mg":mg,"selenium_mcg":mcg,"iodine_mcg":mcg,"chromium_mcg":mcg,"molybdenum_mcg":mcg},"amino_acids":{"leucine_g":g,"isoleucine_g":g,"valine_g":g,"lysine_g":g,"methionine_g":g,"phenylalanine_g":g,"threonine_g":g,"tryptophan_g":g,"histidine_g":g},"fatty_acids":{"omega_3_mg":mg,"omega_6_g":g,"saturated_g":g,"monounsaturated_g":g,"polyunsaturated_g":g},"antioxidants":{"beta_carotene_mg":mg,"lutein_mg":mg,"lycopene_mg":mg},"functional":{"choline_mg":mg,"coq10_mg":mg},"digestive":{"soluble_fiber_g":g,"insoluble_fiber_g":g}},"per_serving":{...same structure...}}. Use real USDA-level data. Only include nutrients meaningfully present (>0). ALWAYS populate macronutrients, vitamins, and minerals for any real food ingredient.`,
      'elements_hazardous': `JSON object mapping element IDs to risk objects: {"element_id": {"level": "trace|low|moderate|high", "per_100g": number_in_mg_or_mcg, "per_serving": number_in_mg_or_mcg, "likelihood": 0-100, "reason": "brief explanation"}, ...}. Only include elements with level OTHER than "none". "per_100g" is the estimated quantity of this contaminant per 100g (in mg or mcg as appropriate). "per_serving" is per typical serving. "likelihood" is the % chance this risk is present (0-100). "reason" is a brief scientific explanation of WHY this risk exists for this ingredient. You MUST use ONLY these exact element IDs:
NATURAL FOOD COMPOUNDS (check these first for whole foods): oxalates, phytates, lectins, solanine, tannins, goitrogens, saponins, ciguatoxin, grayanotoxins, hypoglycin_a, pyrrolizidine_alkaloids, sambunigrin, saxitoxin, tetrodotoxin.
STORAGE & SPOILAGE (mycotoxins): aflatoxin_b1, ochratoxin_a, deoxynivalenol, fumonisin_b1, zearalenone, patulin, citrinin, ergot_alkaloids, nivalenol, t_2_toxin.
ENVIRONMENTAL CONTAMINATION (heavy metals etc): lead, mercury, cadmium, arsenic, chromium_vi, antimony, thallium, uranium, bisphenol_a, bisphenol_f, bisphenol_s, microplastics, pfas, pfoa, pfos, pcbs, dioxins_tcdd, furans.
FARMING CHEMICALS: glyphosate, chlorpyrifos, atrazine, ddt, permethrin, imidacloprid, malathion, cypermethrin, endosulfan, fipronil, clothianidin, thiamethoxam, neonicotinoids, 2_4_d, carbaryl, carbofuran, diazinon, dicamba, lindane, paraquat, aldrin, dieldrin, heptachlor, chlordane.
PROCESSING BYPRODUCTS: acrylamide, benzo_a_pyrene, nitrosamines, anthracene, fluoranthene, pyrene, naphthalene, phenanthrene.
ADDITIVES (only for processed foods): aspartame, sodium_nitrite, sodium_nitrate, bha_butylated_hydroxyanisole, bht_butylated_hydroxytoluene, carrageenan, sodium_benzoate, potassium_bromate, tbhq_tertiary_butylhydroquinone, titanium_dioxide, high_fructose_corn_syrup, maltodextrin, sucralose, saccharin, tartrazine, allura_red_ac, caramel_color, polysorbate_80, caffeine, ethanol.
VETERINARY DRUGS & HORMONES (check for animal products): rbgh_rbst, estradiol, zeranol, trenbolone_acetate, melengestrol_acetate, progesterone, testosterone, igf_1, ractopamine, clenbuterol.
ANTIBIOTICS (farmed animals): tetracycline, oxytetracycline, amoxicillin, sulfamethazine, enrofloxacin, chloramphenicol, florfenicol, erythromycin.
AQUACULTURE CHEMICALS (farmed fish/seafood): emamectin_benzoate, malachite_green, ethoxyquin, synthetic_astaxanthin, diflubenzuron, ivermectin, fenbendazole.
MICROORGANISMS: salmonella, e_coli_o157_h7, listeria_monocytogenes, campylobacter_jejuni, staphylococcus_aureus, bacillus_cereus, clostridium_botulinum, clostridium_perfringens, vibrio_parahaemolyticus, norovirus, hepatitis_a_virus, toxoplasma_gondii, cyclospora_cayetanensis, cryptosporidium_parvum, anisakis_simplex, diphyllobothrium_latum.
IMPORTANT RULES:
- For nuts, seeds, grains, vegetables: ALWAYS check oxalates, phytates, lectins, tannins, goitrogens, saponins, aflatoxin_b1.
- For fish/seafood: ALWAYS check mercury, lead, pcbs, dioxins_tcdd, microplastics, pfas, anisakis_simplex (parasites), vibrio_parahaemolyticus, and for FARMED fish also check ethoxyquin, emamectin_benzoate, synthetic_astaxanthin, antibiotics (oxytetracycline, florfenicol, erythromycin).
- For meat/poultry/dairy: ALWAYS check for hormones (rbgh_rbst, estradiol, ractopamine), antibiotics (tetracycline, amoxicillin), salmonella, campylobacter_jejuni, e_coli_o157_h7.
Be thorough — flag ALL real, evidence-based concerns with accurate quantities.`,
      'reason': `Text explaining where this element comes from. For beneficial elements (vitamins, minerals, etc.): list the top 3-5 food ingredients that naturally contain it (e.g. "Found naturally in spinach, kale, broccoli, and liver"). For hazardous elements: explain the industrial process or environmental pathway that produces it (e.g. "Byproduct of high-temperature frying and baking of starchy foods" or "Leaches from plastic packaging into food"). Always be specific about source ingredients or processes.`,
      'food_sources': `Comma-separated list of specific food ingredients rich in this element. Be specific (e.g. "beef liver, spinach, lentils, chickpeas" not just "meat, vegetables").`,
      'raw_ingredients': `JSON array of ingredient UUIDs that are the raw source ingredients for this processed ingredient. For example, garlic powder's raw ingredients would be [garlic_uuid]. Tomato sauce's raw ingredients would be [tomato_uuid, olive_oil_uuid, garlic_uuid, onion_uuid, salt_uuid]. If the ingredient is raw/unprocessed, return an empty array []. IMPORTANT: You must return actual UUIDs from the catalog_ingredients table. If you don't know the exact UUIDs, return a JSON array of ingredient name strings like ["Tomato", "Olive Oil", "Garlic"] and the system will match them.`,
      'linked_ingredients': `JSON array of ingredient UUIDs or name strings that make up this recipe/product. List ALL key ingredients. For example, a Mediterranean Salad would be ["Tomato", "Cucumber", "Red Onion", "Olive Oil", "Feta Cheese", "Kalamata Olives", "Lemon"]. Return ingredient names if UUIDs are unknown.`,
      'ingredients': `JSON array of ingredient entries. Each entry is EITHER a plain item OR a group. Plain item: {"name":"Tomatoes","ingredient_id":null}. Group (use when multiple items belong to the same category): {"group":"Fresh Herbs","items":[{"name":"Basil","ingredient_id":null},{"name":"Parsley","ingredient_id":null}]}. Rules: (1) Use groups when ingredients naturally cluster (e.g. "Fresh Herbs", "Spices", "For the Dressing", "Vegetables"). (2) Single ingredients that don't belong to a group should be plain items. (3) Always use "ingredient_id": null — the system will auto-resolve IDs. (4) Be specific with ingredient names (e.g. "Cherry Tomatoes" not "Tomatoes"). Example for Gazpacho: [{"name":"Cherry Tomatoes","ingredient_id":null},{"name":"Cucumber","ingredient_id":null},{"name":"Red Bell Pepper","ingredient_id":null},{"name":"Red Onion","ingredient_id":null},{"name":"Garlic","ingredient_id":null},{"group":"Dressing","items":[{"name":"Olive Oil","ingredient_id":null},{"name":"Red Wine Vinegar","ingredient_id":null},{"name":"Lemon Juice","ingredient_id":null}]},{"group":"Fresh Herbs","items":[{"name":"Basil","ingredient_id":null},{"name":"Parsley","ingredient_id":null}]},{"group":"Seasoning","items":[{"name":"Salt","ingredient_id":null},{"name":"Black Pepper","ingredient_id":null}]}]`,
      'origin_country': `The primary country of origin for this ingredient. Use the most historically significant or commonly associated country (e.g. "Japan" for miso, "Mexico" for avocado, "Ethiopia" for coffee). Return a single country name string.`,
      'origin_region': `The specific region, province, or state within the country of origin most associated with this ingredient (e.g. "Oaxaca" for mole, "Hokkaido" for king crab, "Champagne" for champagne grapes). Return a single region name string, or empty string if not region-specific.`,
      'origin_city': `A specific city, town, or locality historically associated with this ingredient if applicable (e.g. "Parma" for Parmigiano-Reggiano, "Darjeeling" for Darjeeling tea). Return a single city name string, or empty string if not city-specific.`,
      'culinary_history': `A 3-5 sentence history of this ingredient's culinary use. Cover: when and where it was first cultivated or used, how it spread to other cultures, its traditional culinary roles, any significant historical events tied to it, and its modern global use. Be specific with dates and cultures where known.`,
      'description_processing': `Text describing how this processed ingredient is manufactured from its raw source ingredients. Include the key steps, temperatures, and techniques used. If the ingredient is raw/unprocessed, return an empty string.`,
      'description_simple': `A 1-2 sentence consumer-friendly description. For elements: plain-language summary of what it is and why it matters (shown in top card). For ingredients: what it is, where it comes from, and what it's commonly used for.`,
      'description_technical': `A detailed 2-4 sentence scientific description. For elements: biochemical mechanism, metabolic pathway, and clinical significance. For ingredients: botanical/zoological classification, key bioactive compounds, and nutritional significance.`,
      'health_benefits': `For ingredients/recipes: a concise paragraph of evidence-based health benefits. For elements: JSON object with structure: {"optimal_health":["🎯 Benefit 1","🎯 Benefit 2"],"beneficial_aspects":["🟢 Aspect 1","🟢 Aspect 2"],"safety_considerations":["⚠️ Caution 1","⚠️ Caution 2"]}. Use emoji prefixes as shown.`,
      'description_full': `JSON object with ALL of these keys filled with user-facing copy (2-4 sentences each):
{
  "simple": "Plain-language summary — what it is and why it matters",
  "technical": "Scientific/biochemical description for advanced users",
  "harmful_effects": "For beneficial: too-high effects. For hazardous: damage mechanisms",
  "what_depletes": "Common causes of low levels (beneficial) or common exposure sources (hazardous)",
  "how_builds": "How it accumulates — storage mechanism, repeated intake, fat-soluble etc.",
  "how_lasts": "Timeline — how long it stays in the body, clearance rate",
  "when_to_supplement": "Conditional advice on supplementation (beneficial) or N/A for hazardous",
  "needed_for_absorption": "Co-factors needed — e.g. fat, zinc, vitamin C",
  "pregnancy_considerations": "Clear pregnancy/fetal safety guidance",
  "summary_bullets": "Comma-separated key facts (4-6 items)",
  "risk_benefit_analysis": "Balanced risk vs benefit assessment",
  "therapeutic_window": "Safe dosage range with units",
  "primary_functions": "Core biological functions (2-3 sentences)",
  "regulation": "How the body regulates levels — homeostasis mechanisms",
  "age_variations": "How needs/risks change with age",
  "gender_differences": "Sex-specific differences in metabolism or requirements",
  "stress_response": "How physical/mental stress affects levels",
  "circadian_rhythm": "Time-of-day considerations for intake/absorption",
  "monitoring_requirements": "What tests to monitor and how often",
  "population_considerations": "High-risk populations and special groups"
}
IMPORTANT: Every key must have real, factual content — no placeholders. Write as if the user will read it directly.`,
      'deficiency': `JSON object for beneficial elements: {
  "name": "Deficiency name (e.g. Scurvy, Iron Deficiency Anemia)",
  "causes": ["cause1", "cause2", "cause3"],
  "symptoms": {"early": ["symptom1","symptom2"], "moderate": ["symptom1","symptom2"], "severe": ["symptom1","symptom2"]},
  "diagnosis": {"laboratory_tests": ["test1"], "clinical_signs": ["sign1"], "differential_diagnosis": ["condition1"]},
  "treatment": {"dietary_changes": "advice", "supplementation": "dose guidance", "monitoring": "follow-up plan"},
  "complications": ["complication1", "complication2"],
  "at_risk_populations": ["group1", "group2"]
}. Use real clinical data.`,
      'interactions': `JSON object: {
  "nutrients": [{"nutrient":"Name","interaction_type":"synergistic|competitive|antagonistic","mechanism":"how","clinical_significance":"impact"}],
  "medications": [{"drug":"Name","interaction_type":"enhances_effect|decreases_absorption","severity":"minor|moderate|major","mechanism":"how","management":"advice"}],
  "conditions": [{"condition":"Name","interaction":"effect","management":"advice"}],
  "herbs": [{"herb":"Name","interaction":"effect","recommendation":"advice"}]
}. Include real, evidence-based interactions only.`,
      'thresholds': `JSON object with measurement ranges: {
  "unit": "mg|mcg|IU",
  "rdi": {"adult_male": number, "adult_female": number, "children": number, "pregnant": number},
  "deficient": {"below": number, "label": "Below your body's needs. Symptoms may appear over time."},
  "optimal": {"min": number, "max": number, "label": "Best range for daily function and long-term health."},
  "excess": {"above": number, "label": "Higher-than-needed intake. Risk increases if repeated."},
  "ul": number
}. For hazardous elements use: {"unit":"mg/kg bw/day|ppb|ppm","optimal":{"below":number,"label":"Below guidance threshold — risk is lower."},"excess":{"above":number,"label":"Above threshold — repeated exposure increases risk."},"regulatory_limits":{"fda":number,"who":number,"eu":number}}. Use real WHO/FDA/EFSA reference values.`,
      'food_sources_detailed': `JSON array of top food sources: [{"name":"Beef liver","amount":"9442 mcg / 100g","category":"animal"},{"name":"Sweet potato","amount":"961 mcg / 100g","category":"plant"},...]. Include 8-12 sources with real USDA values. Include both animal and plant sources where applicable.`,
      'food_strategy': `JSON object with strategy cards: {"cards":[{"title":"Card Title","subtitle":"brief qualifier","body":"2-3 sentence explanation of this source strategy"}]}. For beneficial elements with both animal and plant sources, include 2 cards (e.g. "Animal Retinol (fast-acting)" and "Plant Carotenoids (safer, self-limited)"). For hazardous elements, include 1-2 cards about exposure reduction strategies.`,
      'risk_tags': `JSON array of risk/hazard tag strings. For hazardous elements: ["endocrine_disruptor","reproductive_harm","developmental_toxicity","liver_damage","kidney_damage","cancer_suspect","neurotoxin","immunotoxin"]. For beneficial elements with excess risks: ["hypervitaminosis","liver_toxicity","teratogenic"]. Only include tags supported by evidence.`,
      'functions': `JSON array of function strings. For beneficial: ["vision_support","immune_defence","cell_growth","antioxidant_protection","bone_health","energy_metabolism"]. For hazardous: ["endocrine_disruption","oxidative_stress","dna_damage"]. Use snake_case.`,
      'detox_strategy': `For hazardous elements: practical 3-5 sentence guidance on how to reduce exposure. Include specific actionable swaps (e.g. "Avoid heating food in plastic", "Choose fragrance-free products", "Use glass/steel storage"). For beneficial elements: leave as empty string "".`,
      'found_in': `JSON array of where this element is commonly found: ["food","supplements","water","soil","packaging","cosmetics","household_products","industrial"]. Only include relevant sources.`,
    }

    const fieldDescriptions = emptyFields.map(f => {
      let desc = `- "${f.key}" (${f.label}): type=${f.type}`
      if (f.options) desc += `, allowed values: [${f.options.join(', ')}]`
      if (f.placeholder) desc += `, example: ${f.placeholder}`
      if (structuredFormats[f.key]) desc += `\n  FORMAT: ${structuredFormats[f.key]}`
      return desc
    }).join('\n')

    const systemPrompt = `You are a health & nutrition data assistant for the HealthScan app. You populate database fields with accurate, well-formatted data based on real nutritional science and USDA/WHO data. Always return valid JSON. Be factual and use real data — do not make up nutritional values. For select/tags fields, only use the allowed values. For number fields, return numbers. For array fields, return arrays. For JSON fields, return properly structured objects matching the FORMAT specified. For text/textarea, return well-written strings. For boolean fields, return true or false.
CRITICAL FIELD KEY RULES — you MUST use these exact keys in your JSON output:
- For recipe records: use "name_common" (NOT "name") for the recipe name field
- For recipe records: use "meal_slot" (NOT "type") for the meal timing/slot field (e.g. breakfast, lunch, dinner)
- Never invent field keys — only return keys that were explicitly listed in the fields to fill`

    const userPrompt = `I have a ${tabType} record named "${recordName}" with this existing data:
${JSON.stringify(existingData, null, 2)}
${context ? `\nAdditional context provided by the admin: ${context}\n` : ''}
Please fill in these empty fields with accurate, real-world data:
${fieldDescriptions}
${sampleContext}

IMPORTANT: 
- For nutrition data (elements_beneficial), use real USDA-level values per 100g. Only include nutrients meaningfully present.
- For hazardous elements (elements_hazardous), be realistic — most whole foods have minimal hazards. Only flag real concerns.
- For taste_profile, use 0-10 scale based on the actual sensory profile of this ingredient.
- For processing_methods, only include methods that actually apply.
- For category_sub, pick subcategories that match the ingredient's main category.
- For description_processing, describe how the ingredient is made if it's processed. Leave empty string if raw.
- For Element records: description_full is the MOST IMPORTANT field — fill ALL keys with real, user-facing copy (no placeholders). Write as if users read it directly.
- For Element records: deficiency, interactions, thresholds, food_sources_detailed, food_strategy must use real clinical/USDA/WHO data.
- For hazardous elements: always fill detox_strategy with practical exposure reduction advice. Fill risk_tags with evidence-based hazard categories.
- For beneficial elements: always fill functions with specific biological roles. Fill thresholds with real RDI/UL values.

Return ONLY a JSON object with the field keys and their values. No markdown, no explanation, just the JSON object.`

    console.log(`[AI Fill] Generating content for ${tabType} "${recordName}" — ${emptyFields.length} empty fields`)

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: emptyFields.some((f: any) => f.key === 'description_full') ? 12000 : 8000,
        response_format: { type: 'json_object' }
      })
    })

    if (!openaiRes.ok) {
      const errText = await openaiRes.text()
      console.error('[AI Fill] OpenAI error:', errText)
      return c.json({ success: false, error: `OpenAI API error: ${openaiRes.status}` }, 500)
    }

    const openaiData = await openaiRes.json()
    const content = openaiData.choices?.[0]?.message?.content
    if (!content) return c.json({ success: false, error: 'No content returned from AI' }, 500)

    let filledFields: Record<string, any>
    try {
      filledFields = JSON.parse(content)
    } catch {
      console.error('[AI Fill] Failed to parse AI response:', content)
      return c.json({ success: false, error: 'AI returned invalid JSON' }, 500)
    }

    // Validate: only return fields that were in emptyFields list
    const validKeys = new Set(emptyFields.map(f => f.key))
    const validated: Record<string, any> = {}
    for (const [key, val] of Object.entries(filledFields)) {
      if (validKeys.has(key)) validated[key] = val
    }

    // Post-process: ensure taste_profile is a proper object (not a string)
    if (validated['taste_profile'] !== undefined) {
      let tp = validated['taste_profile']
      if (typeof tp === 'string') {
        try { tp = JSON.parse(tp) } catch { tp = null }
      }
      if (tp && typeof tp === 'object' && !Array.isArray(tp)) {
        const tasteKeys = ['sweet', 'sour', 'salty', 'bitter', 'umami', 'spicy']
        const textureKeys = ['crispy', 'crunchy', 'chewy', 'smooth', 'creamy', 'juicy']
        const ensureNumeric = (obj: any, keys: string[]) => {
          const result: Record<string, number> = {}
          for (const k of keys) result[k] = typeof obj?.[k] === 'number' ? obj[k] : 0
          return result
        }
        // Handle flat format: { sweet: 5, crispy: 3 } instead of { taste: { sweet: 5 }, texture: { crispy: 3 } }
        const isFlat = !tp.taste && !tp.texture
        const tasteSource = isFlat ? tp : tp.taste
        const textureSource = isFlat ? tp : tp.texture
        const normalized = {
          taste: ensureNumeric(tasteSource, tasteKeys),
          texture: ensureNumeric(textureSource, textureKeys),
        }
        // Skip if AI returned all zeros — no useful data
        const hasNonZero = JSON.stringify(normalized).match(/[1-9]/)
        if (!hasNonZero) {
          delete validated['taste_profile']
          console.warn('[AI Fill] taste_profile all zeros, skipping save')
        } else {
          validated['taste_profile'] = normalized
          console.log(`[AI Fill] taste_profile normalized:`, JSON.stringify(validated['taste_profile']))
        }
      } else {
        delete validated['taste_profile']
        console.warn('[AI Fill] taste_profile returned invalid value, skipping')
      }
    }

    // Post-process: match ingredient name strings to UUIDs for linked_ingredients / raw_ingredients
    const ingredientLinkFields = ['raw_ingredients', 'linked_ingredients']
    for (const linkField of ingredientLinkFields) {
      if (validated[linkField] && Array.isArray(validated[linkField])) {
        const arr = validated[linkField] as any[]
        // Check if any items are name strings (not UUIDs)
        const hasNames = arr.some((item: any) => typeof item === 'string' && !item.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/))
        if (hasNames) {
          try {
            const nameStrings = arr.filter((item: any) => typeof item === 'string' && !item.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/))
            // Fetch matching ingredients from DB
            const sbUrl = Deno.env.get('SUPABASE_URL')!
            const sbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            const searchUrl = `${sbUrl}/rest/v1/catalog_ingredients?select=id,name,name_common&limit=500`
            const searchRes = await fetch(searchUrl, {
              headers: { 'Authorization': `Bearer ${sbKey}`, 'apikey': sbKey }
            })
            if (searchRes.ok) {
              const allIngredients = await searchRes.json()
              const matchedIds: string[] = []
              for (const name of nameStrings) {
                const lower = (name as string).toLowerCase()
                const match = allIngredients.find((ing: any) =>
                  (ing.name_common || '').toLowerCase() === lower ||
                  (ing.name || '').toLowerCase() === lower ||
                  (ing.name_common || '').toLowerCase().includes(lower) ||
                  (ing.name || '').toLowerCase().includes(lower)
                )
                if (match) matchedIds.push(match.id)
              }
              // Keep any existing UUIDs + add matched ones
              const existingUuids = arr.filter((item: any) => typeof item === 'string' && item.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/))
              validated[linkField] = [...new Set([...existingUuids, ...matchedIds])]
              console.log(`[AI Fill] Matched ${matchedIds.length}/${nameStrings.length} ingredient names to UUIDs for ${linkField}`)
            }
          } catch (err) {
            console.error(`[AI Fill] Error matching ingredient names for ${linkField}:`, err)
          }
        }
      }
    }

    console.log(`[AI Fill] Successfully generated ${Object.keys(validated).length} fields for "${recordName}"`)
    return c.json({ success: true, filledFields: validated })
  } catch (error: any) {
    console.error('[AI Fill] Error:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// Admin: Insert new catalog record
app.post('/make-server-ed0fe4c2/admin/catalog/insert', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const { table, record } = await c.req.json()
    const allowedTables = ['catalog_elements', 'catalog_ingredients', 'catalog_recipes', 'catalog_products']
    if (!allowedTables.includes(table)) return c.json({ success: false, error: `Invalid table: ${table}` }, 400)
    if (!record || typeof record !== 'object') return c.json({ success: false, error: 'Record data is required' }, 400)

    // Per-table column allowlists — strip unknown columns to prevent schema errors on insert
    const INSERT_COLUMNS: Record<string, Set<string>> = {
      catalog_elements: new Set([
        'id','name_common','name_other','category','type_label','subcategory','health_role','essential_90',
        'chemical_symbol','molecular_formula','cas_number','slug',
        'description','description_simple','description_technical','description_full',
        'functions','health_benefits','risk_tags','thresholds','deficiency_ranges','excess_ranges','drv_by_population',
        'found_in','food_sources_detailed','food_strategy','reason',
        'deficiency','interactions','detox_strategy',
        'health_score','scientific_references','info_sections',
        'image_url','image_url_raw','image_url_powdered','image_url_cut','video_url','images','videos',
        'scientific_papers','social_content',
        'ai_enriched_at','ai_enrichment_version','created_at','updated_at',
      ]),
      catalog_recipes: new Set([
        'id','name_common','name_other','name_scientific','category','category_sub','meal_slot','equipment',
        'cuisine','language','type',
        'prep_time','cook_time','servings','difficulty','instructions','cooking_instructions',
        'linked_ingredients','ingredients',
        'description','description_simple','description_technical',
        'health_benefits','taste_profile','flavor_profile','texture_profile',
        'elements_beneficial','elements_hazardous','nutrition_per_100g','nutrition_per_serving',
        'health_score','scientific_references',
        'storage_tips','selection_tips','preparation_methods','culinary_uses',
        'season','origin','varieties','processing_type',
        'serving_size','subcategory','tags','allergens','dietary_info',
        'image_url','image_url_raw','image_url_plated','image_url_closeup','video_url','images','videos',
        'scientific_papers','social_content',
        'created_at','updated_at',
      ]),
      catalog_ingredients: new Set([
        'id','name_common','name_other','name_scientific','category','category_sub',
        'processing_type','processing_methods','raw_ingredients','description_processing',
        'description_simple','description_technical','health_benefits','taste_profile',
        'elements_beneficial','elements_hazardous','health_score','scientific_references',
        'nutrition_per_100g','nutrition_per_serving','linked_ingredients',
        'origin_country','origin_region','origin_city','culinary_history',
        'image_url','image_url_raw','image_url_powdered','image_url_cut','image_url_cubed','image_url_cooked','video_url','images','videos',
        'scientific_papers','social_content',
        'created_at','updated_at',
      ]),
      catalog_products: new Set([
        'id','name_common','name','name_brand','brand','manufacturer','category','category_sub','subcategory','barcode','quantity',
        'ingredients_text','allergen_info','serving_size','serving_unit',
        'description','description_simple','description_technical',
        'health_benefits','taste_profile',
        'elements_beneficial','elements_hazardous','health_score',
        'nutri_score','nova_group','eco_score',
        'nutrition_per_100g','nutrition_per_serving','nutrition_facts',
        'image_url','image_url_back','image_url_detail','video_url',
        'scientific_papers','social_content',
        'created_at','updated_at',
      ]),
    }

    // Clean out system fields
    const rawClean = { ...record }
    ;['_displayIndex', 'id', 'created_at', 'imported_at', 'api_source', 'external_id'].forEach((f: string) => delete rawClean[f])

    // Strip unknown columns using per-table allowlist
    const allowedCols = INSERT_COLUMNS[table]
    const clean: Record<string, any> = {}
    if (allowedCols) {
      for (const [k, v] of Object.entries(rawClean)) {
        if (allowedCols.has(k)) clean[k] = v
        else console.warn(`[Admin Insert] Stripping unknown column "${k}" from ${table}`)
      }
    } else {
      Object.assign(clean, rawClean)
    }

    // For catalog_elements: sync category from health_role so both columns are consistent
    if (table === 'catalog_elements' && clean.health_role && !clean.category) {
      const hr = String(clean.health_role).toLowerCase()
      clean.category = hr === 'conditional' ? 'both' : hr
    }

    clean.id = crypto.randomUUID()
    clean.created_at = new Date().toISOString()
    clean.updated_at = new Date().toISOString()

    // Auto-generate slug from name_common if not provided — only for tables that have a slug column
    if (table === 'catalog_elements' && !clean.slug && clean.name_common) {
      const base = String(clean.name_common).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      clean.slug = `${base}-${clean.id.slice(0, 8)}`
    }

    console.log(`[Admin Insert] Table: ${table}, keys: ${Object.keys(clean).join(', ')}`)
    const { data, error } = await supabase.from(table).insert(clean).select().single()
    if (error) {
      console.error(`[Admin Insert] Supabase error for ${table}:`, error.message, error.details, error.hint, error.code)
      return c.json({ success: false, error: error.message, details: error.details, hint: error.hint, code: error.code }, 500)
    }
    console.log(`[Admin] Inserted ${table} record ${data.id} by ${adminValidation.user.email}`)
    return c.json({ success: true, id: data.id, record: data })
  } catch (error: any) {
    console.error('[Admin] Error inserting catalog record:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// Admin: AI Generate Steps — generates professional cooking steps with quantities for a recipe
app.post('/make-server-ed0fe4c2/admin/ai-generate-steps', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)

    const { recipeName, servings, prepTime, cookTime, difficulty, cuisine, ingredientList } = await c.req.json()
    if (!recipeName) return c.json({ success: false, error: 'recipeName is required' }, 400)

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) return c.json({ success: false, error: 'OPENAI_API_KEY not configured' }, 500)

    const srv = servings || 4
    const systemPrompt = `You are a professional recipe writer for a health & nutrition app. You write clear, user-friendly cooking instructions following this exact format:

RULES:
- One step = one action block (never cram multiple actions into one step)
- Always include: heat level + time + what "done" looks like
- Embed exact quantities IN the step where the ingredient is used (e.g. "Heat 15 ml (1 tbsp) olive oil...")
- Use both metric and imperial where helpful (e.g. "200 g (≈2 cups)")
- All quantities must be scaled for ${srv} serving${srv !== 1 ? 's' : ''}
- Steps must flow logically: prep → heat/fat → aromatics → main items → seasoning → finish → serve
- Keep steps concise but complete — 1-2 sentences max per step
- Return ONLY a JSON array of step strings, no markdown, no numbering (numbers are added by the UI)`

    const userPrompt = `Write professional cooking instructions for: "${recipeName}"
Servings: ${srv}${prepTime ? `\nPrep time: ${prepTime}` : ''}${cookTime ? `\nCook time: ${cookTime}` : ''}${difficulty ? `\nDifficulty: ${difficulty}` : ''}${cuisine ? `\nCuisine: ${cuisine}` : ''}${ingredientList ? `\nIngredients: ${ingredientList}` : ''}

Return a JSON array of step strings. Each step should be a single action with quantities embedded. Example format:
["Heat 15 ml (1 tbsp) olive oil in a large wok over medium-high heat for 30–60 seconds.", "Add 75 g (½ medium) thinly sliced onion and sauté for 2–3 minutes until translucent."]`

    console.log(`[AI Steps] Generating steps for "${recipeName}" (${srv} servings)`)

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    })

    if (!openaiRes.ok) {
      const errText = await openaiRes.text()
      console.error('[AI Steps] OpenAI error:', errText)
      return c.json({ success: false, error: `OpenAI API error: ${openaiRes.status}` }, 500)
    }

    const openaiData = await openaiRes.json()
    const content = openaiData.choices?.[0]?.message?.content
    if (!content) return c.json({ success: false, error: 'No content from AI' }, 500)

    let parsed: any
    try { parsed = JSON.parse(content) } catch {
      return c.json({ success: false, error: 'AI returned invalid JSON' }, 500)
    }

    // Accept either { steps: [...] } or a bare array wrapped in any key
    const steps: string[] = Array.isArray(parsed) ? parsed
      : Array.isArray(parsed.steps) ? parsed.steps
      : Array.isArray(Object.values(parsed)[0]) ? Object.values(parsed)[0] as string[]
      : []

    if (steps.length === 0) return c.json({ success: false, error: 'AI returned no steps' }, 500)

    console.log(`[AI Steps] Generated ${steps.length} steps for "${recipeName}"`)
    return c.json({ success: true, steps, recipeName, servings: srv })
  } catch (error: any) {
    console.error('[AI Steps] Error:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// Admin: AI Create Record — generates a complete new record using OpenAI and inserts it
app.post('/make-server-ed0fe4c2/admin/ai-create-record', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)

    const { table, tabType, fields, sampleRecords, prompt } = await c.req.json()
    const allowedTables = ['catalog_elements', 'catalog_ingredients', 'catalog_recipes', 'catalog_products']
    if (!allowedTables.includes(table)) return c.json({ success: false, error: `Invalid table: ${table}` }, 400)
    if (!fields || !Array.isArray(fields)) return c.json({ success: false, error: 'fields array is required' }, 400)

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) return c.json({ success: false, error: 'OPENAI_API_KEY not configured' }, 500)

    // Build sample context
    let sampleContext = ''
    if (sampleRecords && sampleRecords.length > 0) {
      const samples = sampleRecords.slice(0, 2)
      sampleContext = `\n\nHere are example records from the same table for format/style reference:\n${JSON.stringify(samples, null, 2)}`
    }

    // Structured format hints for special field types
    const structuredFormats: Record<string, string> = {
      'taste_profile': `{"taste":{"sweet":0-10,"sour":0-10,"salty":0-10,"bitter":0-10,"umami":0-10,"spicy":0-10},"texture":{"crispy":0-10,"crunchy":0-10,"chewy":0-10,"smooth":0-10,"creamy":0-10,"juicy":0-10}}`,
      'elements_beneficial': `{"serving":{"name":"1 cup","size_g":number},"per_100g":{"calories":number,"macronutrients":{"protein_g":g,"fat_g":g,"carbohydrates_g":g,"fiber_g":g,"sugars_g":g},"vitamins":{"vitamin_c_mg":mg,...},"minerals":{"calcium_mg":mg,...},"amino_acids":{"leucine_g":g,...},"fatty_acids":{"omega_3_mg":mg,...}},"per_serving":{...same...}}. Use real USDA data. ALWAYS fill macros, vitamins, minerals.`,
      'elements_hazardous': `JSON: {"element_id":{"level":"trace|low|moderate|high","per_100g":mg_or_mcg,"per_serving":mg_or_mcg,"likelihood":0-100,"reason":"why"},...}. Only non-"none" risks. Valid IDs by category — NATURAL COMPOUNDS: oxalates, phytates, lectins, solanine, tannins, goitrogens, saponins, ciguatoxin. MYCOTOXINS: aflatoxin_b1, ochratoxin_a, deoxynivalenol, fumonisin_b1. HEAVY METALS: lead, mercury, cadmium, arsenic, pcbs, dioxins_tcdd, microplastics, pfas. FARMING: glyphosate, chlorpyrifos, atrazine, ddt, permethrin. PROCESSING: acrylamide, benzo_a_pyrene, nitrosamines. HORMONES: rbgh_rbst, estradiol, ractopamine, igf_1, trenbolone_acetate. ANTIBIOTICS: tetracycline, oxytetracycline, amoxicillin, chloramphenicol, florfenicol, erythromycin. AQUACULTURE: emamectin_benzoate, ethoxyquin, synthetic_astaxanthin, malachite_green, diflubenzuron. MICROBES: salmonella, e_coli_o157_h7, listeria_monocytogenes, campylobacter_jejuni, anisakis_simplex, vibrio_parahaemolyticus. ADDITIVES: aspartame, sodium_nitrite, carrageenan. RULES: For nuts/seeds/grains/vegetables check oxalates, phytates, lectins, tannins, aflatoxin_b1. For fish/seafood check mercury, lead, pcbs, dioxins_tcdd, microplastics, anisakis_simplex, and for farmed fish also ethoxyquin, emamectin_benzoate, synthetic_astaxanthin, antibiotics. For meat/poultry/dairy check hormones, antibiotics, salmonella, campylobacter_jejuni. Be thorough.`,
      'processing_methods': `Array of applicable methods from the allowed values.`,
      'category_sub': `Array of subcategory strings.`,
      'description_processing': `How this processed ingredient is made. Empty string if raw.`,
      'ingredients': `JSON array of ingredient entries. Each entry is EITHER a plain item OR a group. Plain item: {"name":"Tomatoes","ingredient_id":null}. Group: {"group":"Fresh Herbs","items":[{"name":"Basil","ingredient_id":null},{"name":"Parsley","ingredient_id":null}]}. Use groups when ingredients naturally cluster (e.g. "Fresh Herbs", "Spices", "Dressing", "Vegetables"). Always set ingredient_id to null.`,
    }

    const fieldDescriptions = fields
      .filter((f: any) => f.type !== 'image' && f.type !== 'video' && f.type !== 'readonly' && f.type !== 'date' && f.type !== 'linked_elements' && f.type !== 'linked_ingredients')
      .map((f: any) => {
        let desc = `- "${f.key}" (${f.label}): type=${f.type}`
        if (f.options) desc += `, allowed values: [${f.options.join(', ')}]`
        if (f.placeholder) desc += `, example: ${f.placeholder}`
        if (structuredFormats[f.key]) desc += `\n  FORMAT: ${structuredFormats[f.key]}`
        return desc
      }).join('\n')

    const userTopic = prompt ? `The record should be about: ${prompt}` : 'Generate a realistic, unique record with accurate health/nutrition data.'

    const systemPrompt = `You are a health & nutrition data assistant for the HealthScan app. You create complete, realistic database records with accurate nutritional and health data based on real USDA/WHO data. Always return valid JSON. Match the FORMAT specified for structured fields. Be factual — do not invent nutritional values. For select/tags fields, only use the allowed values. For number fields, return numbers. For array fields, return arrays. For JSON fields, return properly structured objects. For text/textarea, return well-written strings. For boolean fields, return true or false. Make the record unique.
CRITICAL FIELD KEY RULES — use these exact keys:
- For recipe records: use "name_common" (NOT "name") for the recipe name
- For recipe records: use "meal_slot" (NOT "type") for meal timing (e.g. breakfast, lunch, dinner)
- Only return keys that were explicitly listed in the fields to fill`

    const userPrompt = `Create a brand new ${tabType || 'catalog'} record with ALL of the following fields populated:
${fieldDescriptions}

${userTopic}
${sampleContext}

IMPORTANT: Use real USDA-level nutritional data. For taste_profile use 0-10 scale. For hazards be realistic. For processing description, describe how it's made if processed.

Return ONLY a JSON object with the field keys and their values. No markdown, no explanation, just the JSON object. Every field must have a value — do not leave any empty.`

    console.log(`[AI Create] Generating new ${tabType} record${prompt ? ` about "${prompt}"` : ''}`)

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: 'json_object' }
      })
    })

    if (!openaiRes.ok) {
      const errText = await openaiRes.text()
      console.error('[AI Create] OpenAI error:', errText)
      return c.json({ success: false, error: `OpenAI API error: ${openaiRes.status}` }, 500)
    }

    const openaiData = await openaiRes.json()
    const content = openaiData.choices?.[0]?.message?.content
    if (!content) return c.json({ success: false, error: 'No content returned from AI' }, 500)

    let generatedRecord: Record<string, any>
    try {
      generatedRecord = JSON.parse(content)
    } catch {
      console.error('[AI Create] Failed to parse AI response:', content)
      return c.json({ success: false, error: 'AI returned invalid JSON' }, 500)
    }

    // Only keep fields that are in the config
    const validKeys = new Set(fields.map((f: any) => f.key))
    const validated: Record<string, any> = {}
    for (const [key, val] of Object.entries(generatedRecord)) {
      if (validKeys.has(key) && key !== 'id' && key !== 'created_at' && key !== 'image_url' && key !== 'video_url') {
        validated[key] = val
      }
    }

    // Insert the record
    validated.created_at = new Date().toISOString()
    validated.source = 'ai-generated'

    if (table === 'catalog_products') {
      const id = crypto.randomUUID()
      await kv.set(id, { id, ...validated })
      console.log(`[AI Create] Inserted AI-generated product ${id} by ${adminValidation.user.email}`)
      return c.json({ success: true, id, record: { id, ...validated }, fieldsGenerated: Object.keys(validated).length })
    }

    const { data, error } = await supabase.from(table).insert(validated).select().single()
    if (error) {
      console.error('[AI Create] Insert error:', error)
      return c.json({ success: false, error: error.message }, 500)
    }

    console.log(`[AI Create] Inserted AI-generated ${table} record ${data.id} by ${adminValidation.user.email}`)
    return c.json({ success: true, id: data.id, record: data, fieldsGenerated: Object.keys(validated).length })
  } catch (error: any) {
    console.error('[AI Create] Error:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// ============ REFERRAL INVITE EMAIL ============

// Send a referral invite email on behalf of a user
app.post('/make-server-ed0fe4c2/send-referral-invite', async (c: any) => {
  try {
    const body = await c.req.json()
    const { toEmail, message, senderName, senderEmail, referralCode } = body

    if (!toEmail || !message) {
      return c.json({ success: false, error: 'toEmail and message are required' }, 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(toEmail.trim().toLowerCase())) {
      return c.json({ success: false, error: 'Invalid recipient email' }, 400)
    }

    const emailService = createEmailService()
    if (!emailService) {
      return c.json({ success: false, error: 'Email service not configured' }, 500)
    }

    const fromName = senderName || 'A HealthScan member'
    const referralLink = referralCode ? `https://healthscan.live?ref=${referralCode}` : 'https://healthscan.live'

    // Build a clean HTML email
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <tr><td style="background-color:#111827;padding:24px 40px;text-align:center;">
    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:20px;font-weight:600;color:#ffffff;">HealthScan</p>
  </td></tr>
  <tr><td style="padding:32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Invited by <strong style="color:#111827;">${fromName}</strong>${senderEmail ? ` (${senderEmail})` : ''}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
    <div style="font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr><td align="center" style="background-color:#111827;border-radius:6px;">
      <a href="${referralLink}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Join HealthScan</a>
    </td></tr>
    </table>
    <p style="margin:0;font-size:12px;color:#9ca3af;">This email was sent on behalf of ${fromName} via HealthScan. If you didn't expect this, you can safely ignore it.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

    const textContent = `${fromName} invited you to HealthScan!\n\n${message}\n\nJoin here: ${referralLink}`

    const result = await emailService.sendEmail({
      to: toEmail.trim().toLowerCase(),
      subject: `${fromName} invited you to try HealthScan 🌱`,
      html: htmlContent,
      text: textContent,
      from: 'invites@healthscan.live'
    })

    if (result.success) {
      console.log(`✅ Referral invite sent from ${senderEmail || 'unknown'} to ${toEmail}`)
      return c.json({ success: true, message: 'Invite sent!' })
    }

    return c.json({ success: false, error: result.error || 'Failed to send' }, 500)
  } catch (error: any) {
    console.error('❌ Referral invite error:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// ============ FUNNEL EVENT TRACKING ============

// Public: Receive funnel events (batched)
app.post('/make-server-ed0fe4c2/events', async (c: any) => {
  try {
    const { events } = await c.req.json()
    if (!Array.isArray(events) || events.length === 0) {
      return c.json({ success: true, stored: 0 })
    }
    // Store each event with a time-based key for efficient prefix queries
    let stored = 0
    for (const evt of events.slice(0, 100)) { // cap at 100 per batch
      const ts = evt.timestamp || new Date().toISOString()
      const key = `funnel_evt_${ts.replace(/[^0-9]/g, '')}_${Math.random().toString(36).substring(2, 8)}`
      await kv.set(key, {
        event: evt.event,
        anonymous_id: evt.anonymous_id,
        user_id: evt.user_id || null,
        timestamp: ts,
        referral_code: evt.referral_code || null,
        utm_source: evt.utm_source || null,
        utm_medium: evt.utm_medium || null,
        utm_campaign: evt.utm_campaign || null,
        metadata: evt.metadata || null
      })
      stored++
    }
    return c.json({ success: true, stored })
  } catch (error: any) {
    console.error('❌ Event tracking error:', error)
    return c.json({ success: true, stored: 0 }) // fail silently for tracking
  }
})

// Admin: Fetch URL metadata (OG title, description, image, type detection)
app.post('/make-server-ed0fe4c2/admin/url-metadata', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)

    const { url } = await c.req.json()
    if (!url || typeof url !== 'string') return c.json({ success: false, error: 'URL is required' }, 400)

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HealthScanBot/1.0)' },
      redirect: 'follow',
    })
    if (!res.ok) return c.json({ success: false, error: `Failed to fetch URL: ${res.status}` }, 400)

    const html = await res.text()
    const isPdf = url.toLowerCase().endsWith('.pdf') || res.headers.get('content-type')?.includes('pdf')

    const getMeta = (prop: string): string => {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'),
        new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${prop}["']`, 'i'),
      ]
      for (const p of patterns) {
        const m = html.match(p)
        if (m?.[1]) return m[1].trim()
      }
      return ''
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = getMeta('og:title') || getMeta('twitter:title') || titleMatch?.[1]?.trim() || ''
    const description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description') || ''
    const image = getMeta('og:image') || getMeta('twitter:image') || ''
    const siteName = getMeta('og:site_name') || ''

    return c.json({ success: true, title, description, image, siteName, isPdf, url })
  } catch (error: any) {
    console.error('[Admin] URL metadata error:', error)
    return c.json({ success: false, error: error?.message || 'Failed to fetch metadata' }, 500)
  }
})

// Admin: Parse bulk text into content links using AI
app.post('/make-server-ed0fe4c2/admin/parse-content-links', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)

    const { text, context } = await c.req.json()
    if (!text || typeof text !== 'string') return c.json({ success: false, error: 'text is required' }, 400)

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) return c.json({ success: false, error: 'OPENAI_API_KEY not configured' }, 500)

    const systemPrompt = `You are a content extraction assistant. Extract all references (papers, books, URLs, social media posts) from the provided text and return them as a JSON array.

For each item extract:
- url: the primary URL (PubMed, PMC, publisher, DOI, etc.) — pick the most authoritative one
- title: full paper/book title
- description: 1-2 sentence health-focused summary of what this is about and why it matters
- image: screenshot/thumbnail URL if provided (e.g. thum.io URLs, image suggestions)
- siteName: journal name, publisher, or site name
- contentType: one of "paper", "book", "social", "article" — infer from context
- isPdf: true if the URL ends in .pdf or is explicitly a PDF link

Return ONLY valid JSON array, no markdown, no explanation. Example:
[{"url":"https://pubmed.ncbi.nlm.nih.gov/12345/","title":"Study title","description":"Health summary.","image":"","siteName":"PubMed","contentType":"paper","isPdf":false}]`

    const userPrompt = `${context ? `Context: ${context}\n\n` : ''}Extract all content references from this text:\n\n${text}`

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    })

    const aiData = await aiRes.json()
    const raw = aiData.choices?.[0]?.message?.content?.trim() || '[]'

    let parsed: any[] = []
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      return c.json({ success: false, error: 'AI returned invalid JSON' }, 500)
    }

    const links = parsed.map((item: any) => ({
      id: crypto.randomUUID(),
      url: item.url || '',
      title: item.title || item.url || '',
      description: item.description || '',
      image: item.image || '',
      siteName: item.siteName || '',
      isPdf: item.isPdf || false,
      contentType: item.contentType || 'paper',
      votes: 0,
      addedAt: new Date().toISOString(),
    })).filter((l: any) => l.url)

    return c.json({ success: true, links })
  } catch (error: any) {
    console.error('[Admin] Parse content links error:', error)
    return c.json({ success: false, error: error?.message || 'Failed to parse content' }, 500)
  }
})

// Admin: Summarise a content link (paper/book/article) in plain language using AI
app.post('/make-server-ed0fe4c2/admin/summarise-content-link', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    const { title, description, abstract, url, contentType, recordContext } = await c.req.json()
    if (!title && !description && !abstract) return c.json({ success: false, error: 'At least one of title, description, or abstract is required' }, 400)

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) return c.json({ success: false, error: 'OpenAI API key not configured' }, 500)

    const contentParts = [
      title ? `Title: ${title}` : '',
      description ? `Description: ${description}` : '',
      abstract ? `Abstract: ${abstract}` : '',
      url ? `URL: ${url}` : '',
    ].filter(Boolean).join('\n\n')

    const contextPart = recordContext ? `\nThis content is related to: ${recordContext}` : ''

    const systemPrompt = `You are a health science communicator who specialises in making complex research accessible to everyday people. Your job is to summarise scientific papers, books, and articles in clear, friendly, plain English — no jargon, no technical terms unless briefly explained. Write as if explaining to a curious, intelligent person with no science background. Be concise (3-5 sentences), focus on: what was studied, what was found, and why it matters for health.`

    const userPrompt = `Please summarise this content in plain, everyday language:

${contentParts}${contextPart}

Write a clear 3-5 sentence summary that explains:
1. What this paper/book/article is about
2. What the key finding or message is
3. Why this matters for someone's health

Keep it simple, engaging, and jargon-free.`

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.6,
        max_tokens: 300,
      }),
    })
    const aiData = await aiRes.json()
    const summary = aiData.choices?.[0]?.message?.content?.trim()
    if (!summary) return c.json({ success: false, error: 'AI did not return a summary' }, 500)
    return c.json({ success: true, summary })
  } catch (error: any) {
    console.error('[Admin] Summarise content link error:', error)
    return c.json({ success: false, error: error?.message || 'Failed to summarise content' }, 500)
  }
})

// Admin: Get funnel metrics (aggregated counts + raw events for time calcs)
app.get('/make-server-ed0fe4c2/admin/funnel-metrics', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)

    // Get all funnel events
    const allEvents = await kv.getByPrefix('funnel_evt_')

    // Aggregate counts by event type
    const counts: Record<string, number> = {}
    const eventsByType: Record<string, any[]> = {}
    const eventsByDay: Record<string, Record<string, number>> = {}

    for (const evt of allEvents) {
      const type = evt.event || 'unknown'
      counts[type] = (counts[type] || 0) + 1
      if (!eventsByType[type]) eventsByType[type] = []
      eventsByType[type].push(evt)

      // Group by day for trend
      const day = (evt.timestamp || '').substring(0, 10)
      if (day) {
        if (!eventsByDay[day]) eventsByDay[day] = {}
        eventsByDay[day][type] = (eventsByDay[day][type] || 0) + 1
      }
    }

    // Compute median times between funnel steps per anonymous_id
    const sessionEvents: Record<string, any[]> = {}
    for (const evt of allEvents) {
      const sid = evt.user_id || evt.anonymous_id || 'unknown'
      if (!sessionEvents[sid]) sessionEvents[sid] = []
      sessionEvents[sid].push(evt)
    }

    function medianDiffMinutes(fromType: string, toType: string): number | null {
      const diffs: number[] = []
      for (const evts of Object.values(sessionEvents)) {
        const from = evts.filter(e => e.event === fromType).sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp))[0]
        const to = evts.filter(e => e.event === toType).sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp))[0]
        if (from && to) {
          const diff = (new Date(to.timestamp).getTime() - new Date(from.timestamp).getTime()) / 60000
          if (diff > 0 && diff < 10080) diffs.push(diff) // cap at 7 days
        }
      }
      if (diffs.length === 0) return null
      diffs.sort((a, b) => a - b)
      return diffs[Math.floor(diffs.length / 2)]
    }

    const medianTimes = {
      view_to_submit: medianDiffMinutes('lp_view', 'signup_submit'),
      cta_to_submit: medianDiffMinutes('cta_click', 'signup_submit'),
      submit_to_confirm: medianDiffMinutes('signup_submit', 'email_confirm'),
      confirm_to_referral: medianDiffMinutes('email_confirm', 'referral_email_confirm')
    }

    return c.json({
      success: true,
      counts,
      medianTimes,
      dailyTrend: eventsByDay,
      totalEvents: allEvents.length
    })
  } catch (error: any) {
    console.error('❌ Funnel metrics error:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// ============ END ADMIN CRUD ROUTES ============

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

// ─── Staging ↔ Production Sync Endpoints ────────────────────────────────────
// Production Supabase project: ermbkttsyvpenjjxaxcf
const PROD_URL = 'https://ermbkttsyvpenjjxaxcf.supabase.co'
const PROD_SERVICE_KEY = Deno.env.get('PROD_SUPABASE_SERVICE_ROLE_KEY') || ''

const SYNC_TABLES = ['catalog_elements', 'catalog_ingredients', 'catalog_recipes'] as const
type SyncTable = typeof SYNC_TABLES[number]

async function fetchAllFromSupabase(baseUrl: string, serviceKey: string, table: string): Promise<any[]> {
  const all: any[] = []
  let offset = 0
  const limit = 1000
  while (true) {
    const res = await fetch(`${baseUrl}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
    })
    if (!res.ok) throw new Error(`Failed to fetch ${table} from ${baseUrl}: ${res.status}`)
    const batch = await res.json()
    all.push(...batch)
    if (batch.length < limit) break
    offset += limit
  }
  return all
}

async function upsertToSupabase(baseUrl: string, serviceKey: string, table: string, records: any[]): Promise<void> {
  const batchSize = 100
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const res = await fetch(`${baseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batch),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Upsert failed for ${table} batch ${i}: ${err}`)
    }
  }
}

// GET /admin/sync/diff — compare staging vs production record counts + newest updated_at per table
app.get('/make-server-ed0fe4c2/admin/sync/diff', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    if (!PROD_SERVICE_KEY) return c.json({ success: false, error: 'PROD_SUPABASE_SERVICE_ROLE_KEY not configured' }, 500)

    const stagingKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stagingUrl = Deno.env.get('SUPABASE_URL')!

    const results: Record<string, any> = {}
    for (const table of SYNC_TABLES) {
      const [stagingRes, prodRes] = await Promise.all([
        fetch(`${stagingUrl}/rest/v1/${table}?select=id,updated_at&limit=5000`, {
          headers: { 'apikey': stagingKey, 'Authorization': `Bearer ${stagingKey}`, 'Prefer': 'count=exact' }
        }),
        fetch(`${PROD_URL}/rest/v1/${table}?select=id,updated_at&limit=5000`, {
          headers: { 'apikey': PROD_SERVICE_KEY, 'Authorization': `Bearer ${PROD_SERVICE_KEY}`, 'Prefer': 'count=exact' }
        })
      ])
      const stagingData: any[] = await stagingRes.json()
      const prodData: any[] = await prodRes.json()

      const stagingIds = new Set(stagingData.map((r: any) => r.id))
      const prodIds = new Set(prodData.map((r: any) => r.id))
      const onlyInStaging = stagingData.filter((r: any) => !prodIds.has(r.id)).length
      const onlyInProd = prodData.filter((r: any) => !stagingIds.has(r.id)).length

      // Find records newer in staging than prod
      const prodMap = new Map(prodData.map((r: any) => [r.id, r.updated_at]))
      const newerInStaging = stagingData.filter((r: any) => {
        const prodUpdated = prodMap.get(r.id)
        return prodUpdated && r.updated_at > prodUpdated
      }).length

      results[table] = {
        staging: stagingData.length,
        production: prodData.length,
        onlyInStaging,
        onlyInProd,
        newerInStaging,
        inSync: onlyInStaging === 0 && onlyInProd === 0 && newerInStaging === 0,
      }
    }
    return c.json({ success: true, diff: results })
  } catch (error: any) {
    console.error('[Sync] Diff error:', error)
    return c.json({ success: false, error: error?.message || 'Diff failed' }, 500)
  }
})

// POST /admin/sync/push-to-prod — copy selected table(s) from staging → production
app.post('/make-server-ed0fe4c2/admin/sync/push-to-prod', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    if (!PROD_SERVICE_KEY) return c.json({ success: false, error: 'PROD_SUPABASE_SERVICE_ROLE_KEY not configured' }, 500)

    const { tables, ids } = await c.req.json() as { tables?: string[], ids?: Record<string, string[]> }
    const targetTables = (tables || [...SYNC_TABLES]).filter(t => SYNC_TABLES.includes(t as SyncTable))
    if (!targetTables.length) return c.json({ success: false, error: 'No valid tables specified' }, 400)

    const stagingKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stagingUrl = Deno.env.get('SUPABASE_URL')!

    const results: Record<string, any> = {}
    for (const table of targetTables) {
      try {
        let records: any[]
        if (ids?.[table]?.length) {
          // Push specific records by id
          const res = await fetch(`${stagingUrl}/rest/v1/${table}?id=in.(${ids[table].join(',')})&select=*`, {
            headers: { 'apikey': stagingKey, 'Authorization': `Bearer ${stagingKey}` }
          })
          records = await res.json()
        } else {
          records = await fetchAllFromSupabase(stagingUrl, stagingKey, table)
        }
        // Strip fields that may not exist in prod schema
        const clean = records.map((r: any) => {
          const c2 = { ...r }
          delete c2._displayIndex
          return c2
        })
        await upsertToSupabase(PROD_URL, PROD_SERVICE_KEY, table, clean)
        results[table] = { pushed: clean.length, status: 'ok' }
        console.log(`[Sync] Pushed ${clean.length} ${table} records to production by ${adminValidation.user?.email}`)
      } catch (err: any) {
        results[table] = { status: 'error', error: err.message }
      }
    }
    return c.json({ success: true, results })
  } catch (error: any) {
    console.error('[Sync] Push-to-prod error:', error)
    return c.json({ success: false, error: error?.message || 'Push failed' }, 500)
  }
})

// POST /admin/sync/pull-from-prod — copy selected table(s) from production → staging
app.post('/make-server-ed0fe4c2/admin/sync/pull-from-prod', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    if (!PROD_SERVICE_KEY) return c.json({ success: false, error: 'PROD_SUPABASE_SERVICE_ROLE_KEY not configured' }, 500)

    const { tables } = await c.req.json() as { tables?: string[] }
    const targetTables = (tables || [...SYNC_TABLES]).filter(t => SYNC_TABLES.includes(t as SyncTable))
    if (!targetTables.length) return c.json({ success: false, error: 'No valid tables specified' }, 400)

    const stagingKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stagingUrl = Deno.env.get('SUPABASE_URL')!

    const results: Record<string, any> = {}
    for (const table of targetTables) {
      try {
        const records = await fetchAllFromSupabase(PROD_URL, PROD_SERVICE_KEY, table)
        const clean = records.map((r: any) => { const c2 = { ...r }; delete c2._displayIndex; return c2 })
        await upsertToSupabase(stagingUrl, stagingKey, table, clean)
        results[table] = { pulled: clean.length, status: 'ok' }
        console.log(`[Sync] Pulled ${clean.length} ${table} records from production by ${adminValidation.user?.email}`)
      } catch (err: any) {
        results[table] = { status: 'error', error: err.message }
      }
    }
    return c.json({ success: true, results })
  } catch (error: any) {
    console.error('[Sync] Pull-from-prod error:', error)
    return c.json({ success: false, error: error?.message || 'Pull failed' }, 500)
  }
})
// ─────────────────────────────────────────────────────────────────────────────

// All admin CRUD routes are now in admin-endpoints-fixed.tsx to avoid Hono sub-app routing conflicts

// Start server
Deno.serve(app.fetch)