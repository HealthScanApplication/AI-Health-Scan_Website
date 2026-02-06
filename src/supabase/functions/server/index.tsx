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

    // Optional: Verify Tally signature if signing secret is configured
    const tallySecret = Deno.env.get('TALLY_SIGNING_SECRET')
    if (tallySecret) {
      const receivedSignature = c.req.header('Tally-Signature')
      if (receivedSignature) {
        const rawBody = await c.req.text()
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

    // Parse Tally webhook payload
    let payload
    try {
      payload = await c.req.json()
    } catch {
      // If we already consumed the body for signature verification, re-parse
      const rawBody = await c.req.text()
      payload = JSON.parse(rawBody)
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

    // Extract email from Tally fields (look for email-type field or field labeled "email")
    let email = ''
    let name = ''
    let referralCode = ''

    for (const field of fields) {
      const label = (field?.label || '').toLowerCase()
      const value = field?.value || ''

      if (field?.type === 'INPUT_EMAIL' || label.includes('email')) {
        email = typeof value === 'string' ? value.trim().toLowerCase() : ''
      } else if (label.includes('name') || field?.type === 'INPUT_TEXT') {
        if (!name) name = typeof value === 'string' ? value.trim() : ''
      } else if (label.includes('referral') || label.includes('code')) {
        referralCode = typeof value === 'string' ? value.trim() : ''
      }
    }

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
      position,
      referralCode: userReferralCode,
      source: 'tally',
      referredBy: referralCode || null,
      signupDate: createdAt,
      confirmed: false,
      emailsSent: 0,
      lastEmailSent: null,
      tallySubmissionId: submissionId,
      tallyRespondentId: respondentId
    }

    await kv.set(`waitlist_user_${email}`, userData)

    // Update waitlist count
    await kv.set('waitlist_count', { count: position, lastUpdated: new Date().toISOString() })

    console.log(`🎉 Tally webhook: New waitlist signup #${position}: ${email}`)

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

    // Transform KV data to admin panel format
    const waitlistUsers = allKeys.map((user: any, index: number) => ({
      id: user.email || `waitlist_${index}`,
      email: user.email,
      position: user.position || 0,
      referralCode: user.referralCode,
      referrals: user.referrals || 0,
      emailsSent: user.emailsSent || 0,
      email_sent: (user.emailsSent || 0) > 0,
      created_at: user.signupDate || user.createdAt,
      confirmed: user.confirmed || false,
      lastEmailSent: user.lastEmailSent
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

// Start server
Deno.serve(app.fetch)