import { createEmailService } from './email-service.tsx'
import * as kv from './kv_store.tsx'

// Enhanced email confirmation endpoint with better duplicate detection and email validation
export async function handleEmailConfirmation(c: any): Promise<Response> {
  try {
    const url = new URL(c.req.url) // Use Hono's request URL
    const token = url.searchParams.get('token')
    
    console.log('📧 Processing email confirmation request:', {
      token: token ? 'provided' : 'missing',
      tokenLength: token?.length,
      url: url.toString()
    })
    
    if (!token) {
      return c.json({
        success: false,
        error: 'Confirmation token is required',
        details: 'No token provided in the request URL'
      }, 400)
    }
    
    // Initialize email service to validate token
    const emailService = createEmailService()
    if (!emailService) {
      console.warn('📧 Email service not available for token validation')
      return c.json({
        success: false,
        error: 'Email confirmation service not available',
        details: 'Email service is not configured on this server'
      }, 503)
    }
    
    // Validate confirmation token
    const tokenValidation = emailService.validateConfirmationToken(token)
    
    if (!tokenValidation.valid) {
      console.error('❌ Invalid confirmation token:', {
        token: token.substring(0, 20) + '...',
        error: tokenValidation.error,
        timestamp: new Date().toISOString()
      })
      
      return c.json({
        success: false,
        error: 'Invalid or expired confirmation token',
        details: tokenValidation.error || 'Token validation failed',
        errorType: 'TOKEN_VALIDATION_ERROR'
      }, 400)
    }
    
    const email = tokenValidation.email
    if (!email) {
      console.error('❌ No email found in valid token:', token.substring(0, 20) + '...')
      return c.json({
        success: false,
        error: 'Invalid token - no email found',
        details: 'Token does not contain valid email information'
      }, 400)
    }
    
    console.log('✅ Token validated successfully for email:', email)
    
    // Normalize email for consistent lookup
    const normalizedEmail = email.trim().toLowerCase()
    
    // Find user in waitlist with enhanced duplicate detection
    let waitlistUser = null
    
    try {
      // Primary lookup by normalized email
      waitlistUser = await kv.get(`waitlist_user_${normalizedEmail}`)
      console.log('🔍 Primary waitlist user lookup result:', waitlistUser ? 'found' : 'not found')
      
      // Fallback: Search all waitlist users if primary lookup fails
      if (!waitlistUser) {
        console.log('🔍 Performing fallback search for user:', normalizedEmail)
        const allWaitlistUsers = await kv.getByPrefix('waitlist_user_')
        waitlistUser = allWaitlistUsers.find(user => 
          user && user.email && user.email.toLowerCase().trim() === normalizedEmail
        )
        
        if (waitlistUser) {
          console.log('✅ Found user via fallback search:', waitlistUser.email)
          // Re-save with correct key format
          await kv.set(`waitlist_user_${normalizedEmail}`, waitlistUser)
        }
      }
      
    } catch (error) {
      console.error('❌ Error looking up waitlist user:', error)
      return c.json({
        success: false,
        error: 'Database error while confirming email',
        details: 'Could not access user data',
        errorType: 'DATABASE_ERROR'
      }, 500)
    }
    
    if (!waitlistUser) {
      console.warn('⚠️ User not found in waitlist for email confirmation:', normalizedEmail)
      return c.json({
        success: false,
        error: 'Email not found in waitlist',
        details: 'This email address is not registered in our waitlist',
        errorType: 'USER_NOT_FOUND'
      }, 404)
    }
    
    // Check if already confirmed
    if (waitlistUser.confirmed || waitlistUser.emailConfirmedAt) {
      console.log('ℹ️ Email already confirmed for user:', normalizedEmail)
      
      return c.json({
        success: true,
        message: 'Email already confirmed',
        alreadyConfirmed: true,
        position: waitlistUser.position,
        referralCode: waitlistUser.referralCode,
        data: {
          email: normalizedEmail,
          name: waitlistUser.name,
          position: waitlistUser.position,
          signupDate: waitlistUser.signupDate,
          confirmedAt: waitlistUser.emailConfirmedAt || waitlistUser.signupDate
        }
      }, 200)
    }
    
    // Confirm the email
    const confirmedAt = new Date().toISOString()
    const updatedUser = {
      ...waitlistUser,
      confirmed: true,
      emailConfirmedAt: confirmedAt,
      confirmationDate: confirmedAt,
      lastUpdated: confirmedAt
    }
    
    // Save confirmed user data
    try {
      await kv.set(`waitlist_user_${normalizedEmail}`, updatedUser)
      console.log('✅ Email confirmed and user data updated for:', normalizedEmail)
      
      // Verify the save worked
      const verification = await kv.get(`waitlist_user_${normalizedEmail}`)
      if (!verification || !verification.confirmed) {
        throw new Error('Email confirmation update verification failed')
      }
      
    } catch (error) {
      console.error('❌ Failed to save email confirmation:', error)
      return c.json({
        success: false,
        error: 'Failed to confirm email',
        details: 'Could not save confirmation status',
        errorType: 'SAVE_ERROR'
      }, 500)
    }
    
    // Send welcome email with referral information
    try {
      const welcomeEmailResult = await emailService.sendEmailConfirmed(
        normalizedEmail, 
        waitlistUser.position, 
        waitlistUser.referralCode
      )
      
      if (welcomeEmailResult.success) {
        console.log('✅ Welcome email sent successfully to:', normalizedEmail)
        
        // Update email count
        updatedUser.emailsSent = (updatedUser.emailsSent || 0) + 1
        updatedUser.lastEmailSent = new Date().toISOString()
        await kv.set(`waitlist_user_${normalizedEmail}`, updatedUser)
      } else {
        console.warn('⚠️ Failed to send welcome email:', welcomeEmailResult.error)
      }
    } catch (error) {
      console.warn('⚠️ Welcome email error (non-critical):', error)
    }
    
    // Clean up confirmation token
    try {
      await kv.del(`email_confirmation_${token}`)
    } catch (error) {
      console.warn('⚠️ Could not clean up confirmation token:', error)
    }
    
    console.log('🎉 Email confirmation completed successfully for:', normalizedEmail)
    
    return c.json({
      success: true,
      message: 'Email confirmed successfully!',
      confirmed: true,
      position: waitlistUser.position,
      referralCode: waitlistUser.referralCode,
      confirmedAt: confirmedAt,
      data: {
        email: normalizedEmail,
        name: waitlistUser.name,
        position: waitlistUser.position,
        signupDate: waitlistUser.signupDate,
        confirmedAt: confirmedAt,
        referralCode: waitlistUser.referralCode
      }
    }, 200)
    
  } catch (error) {
    console.error('❌ Email confirmation error:', {
      error: error,
      message: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    })
    
    return c.json({
      success: false,
      error: 'Email confirmation failed',
      details: error?.message || 'Unknown error occurred',
      errorType: 'CONFIRMATION_ERROR'
    }, 500)
  }
}

// User status endpoint with enhanced duplicate detection
export async function handleUserStatus(c: any): Promise<Response> {
  try {
    const url = new URL(c.req.url) // Use Hono's request URL
    const email = url.searchParams.get('email')
    
    if (!email) {
      return c.json({
        success: false,
        error: 'Email parameter is required'
      }, 400)
    }
    
    const normalizedEmail = email.trim().toLowerCase()
    
    // Enhanced user lookup with fallback search
    let user = null
    
    try {
      // Primary lookup
      user = await kv.get(`waitlist_user_${normalizedEmail}`)
      
      // Fallback search if primary lookup fails
      if (!user) {
        console.log('🔍 Performing fallback user status search for:', normalizedEmail)
        const allWaitlistUsers = await kv.getByPrefix('waitlist_user_')
        user = allWaitlistUsers.find(u => 
          u && u.email && u.email.toLowerCase().trim() === normalizedEmail
        )
        
        if (user) {
          console.log('✅ Found user via fallback status search:', user.email)
          // Re-save with correct key format for future lookups
          await kv.set(`waitlist_user_${normalizedEmail}`, user)
        }
      }
      
    } catch (error) {
      console.error('❌ Error looking up user status:', error)
      return c.json({
        success: false,
        error: 'Database error while checking user status'
      }, 500)
    }
    
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found',
        exists: false
      }, 404)
    }
    
    // Get current waitlist count
    let totalUsers = 0
    try {
      const countData = await kv.get('waitlist_count')
      totalUsers = countData?.count || 0
    } catch (error) {
      console.warn('⚠️ Could not get waitlist count for user status:', error)
    }
    
    return c.json({
      success: true,
      exists: true,
      user: {
        email: normalizedEmail,
        name: user.name,
        position: user.position,
        referralCode: user.referralCode,
        signupDate: user.signupDate,
        confirmed: user.confirmed || false,
        emailConfirmedAt: user.emailConfirmedAt || null,
        referrals: user.referrals || 0,
        source: user.source || 'website'
      },
      waitlist: {
        position: user.position,
        total: totalUsers,
        confirmed: user.confirmed || false
      }
    }, 200)
    
  } catch (error) {
    console.error('❌ User status error:', error)
    
    return c.json({
      success: false,
      error: 'Failed to get user status',
      details: error?.message || 'Unknown error occurred'
    }, 500)
  }
}