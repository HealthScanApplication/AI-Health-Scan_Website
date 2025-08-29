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
import blogRssApp from './blog-rss-endpoints.tsx'

// Initialize Hono app
const app = new Hono()

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

// Email waitlist endpoint  
app.post('/make-server-ed0fe4c2/email-waitlist', handleWaitlistSignup)

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

// Mount admin endpoints
app.route('/', adminApp)

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

// Start server
Deno.serve(app.fetch)