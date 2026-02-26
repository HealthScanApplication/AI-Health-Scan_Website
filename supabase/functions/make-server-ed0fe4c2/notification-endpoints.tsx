// @ts-nocheck
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Send push notification via Expo
async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: { type: 'test_notification' },
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const data = await response.json()
    
    if (data.data?.[0]?.status === 'error') {
      return { success: false, error: data.data[0].message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Send email notification
async function sendEmailNotification(
  email: string,
  title: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Health Scan <notifications@healthscan.live>',
        to: [email],
        subject: title,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">${title}</h2>
            <p style="color: #374151; line-height: 1.6;">${message}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">This is a test notification from Health Scan Admin Panel</p>
          </div>
        `,
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.message || 'Failed to send email' }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Register notification endpoints
export function registerNotificationRoutes(app: any) {
  app.post('/make-server-ed0fe4c2/admin/send-test-notification', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
      
      if (!accessToken) {
        return c.json({ success: false, error: 'No access token provided' }, 401)
      }

      // Create supabase client for admin validation
      const authUrl = Deno.env.get('SUPABASE_URL')!
      const authKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const authClient = createClient(authUrl, authKey)

      const { data: { user }, error } = await authClient.auth.getUser(accessToken)
      if (error || !user) {
        return c.json({ success: false, error: 'Invalid access token' }, 401)
      }

      // Check if user is admin using email-based validation
      const adminEmail = user.email?.toLowerCase()
      const specificAdminEmails = ['johnferreira@gmail.com']
      const isSpecificAdmin = adminEmail && specificAdminEmails.includes(adminEmail)
      const adminDomains = ['healthscan.live', 'healthscan.com']
      const emailDomain = user.email?.split('@')[1]?.toLowerCase()
      const isDomainAdmin = emailDomain && adminDomains.includes(emailDomain)
      const isAdmin = isSpecificAdmin || isDomainAdmin

      if (!isAdmin) {
        return c.json({ success: false, error: 'User is not an admin' }, 403)
      }

      const { environment, userEmail, notificationType, title, message } = await c.req.json()

      if (!userEmail || !title || !message) {
        return c.json({ success: false, error: 'Missing required fields' }, 400)
      }

      console.log(`📱 Sending test notification to ${userEmail} in ${environment}`)

      // Get the appropriate Supabase client based on environment
      let targetClient
      if (environment === 'production') {
        const prodUrl = Deno.env.get('PROD_SUPABASE_URL')
        const prodKey = Deno.env.get('PROD_SUPABASE_SERVICE_ROLE_KEY')
        
        if (!prodUrl || !prodKey) {
          return c.json({ 
            success: false, 
            error: 'Production environment not configured. Set PROD_SUPABASE_URL and PROD_SUPABASE_SERVICE_ROLE_KEY.' 
          }, 500)
        }
        
        targetClient = createClient(prodUrl, prodKey)
      } else {
        // Staging - reuse auth client
        targetClient = authClient
      }

      // Find user by email - first check auth.users, then profiles for push token
      let foundUserId = null
      let foundEmail = userEmail
      let pushToken = null

      // Try auth.admin to find user in auth.users
      const { data: authUserList } = await targetClient.auth.admin.listUsers({ 
        page: 1, 
        perPage: 50 
      })
      const authUser = authUserList?.users?.find(
        (u: any) => u.email?.toLowerCase() === userEmail.toLowerCase()
      )
      
      if (authUser) {
        foundUserId = authUser.id
        foundEmail = authUser.email
        console.log(`✅ Found user in auth.users: ${foundUserId}`)
      }

      // Also check profiles table for push token
      const { data: profileRows } = await targetClient
        .from('profiles')
        .select('id, email, expo_push_token')
        .ilike('email', userEmail)
        .limit(1)

      if (profileRows && profileRows.length > 0) {
        foundUserId = foundUserId || profileRows[0].id
        foundEmail = profileRows[0].email || foundEmail
        pushToken = profileRows[0].expo_push_token
        console.log(`✅ Found user in profiles, push token: ${pushToken ? 'yes' : 'no'}`)
      }

      if (!foundUserId) {
        return c.json({ 
          success: false, 
          error: `User not found in ${environment}: ${userEmail}. Checked auth.users and profiles table.` 
        }, 404)
      }

      const results: any = {}

      // Send push notification
      if ((notificationType === 'push' || notificationType === 'both') && pushToken) {
        const pushResult = await sendPushNotification(pushToken, title, message)
        results.push = pushResult
        
        if (!pushResult.success) {
          console.error('❌ Push notification failed:', pushResult.error)
        } else {
          console.log('✅ Push notification sent')
        }
      } else if (notificationType === 'push' || notificationType === 'both') {
        results.push = { success: false, error: 'User has no push token registered (checked profiles table)' }
      }

      // Send email notification
      if (notificationType === 'email' || notificationType === 'both') {
        const emailResult = await sendEmailNotification(userEmail, title, message)
        results.email = emailResult
        
        if (!emailResult.success) {
          console.error('❌ Email notification failed:', emailResult.error)
        } else {
          console.log('✅ Email notification sent')
        }
      }

      // Check if at least one succeeded
      const anySuccess = Object.values(results).some((r: any) => r.success)
      
      if (!anySuccess) {
        const errors = Object.entries(results)
          .map(([type, r]: [string, any]) => `${type}: ${r.error}`)
          .join(', ')
        
        return c.json({ 
          success: false, 
          error: `All notifications failed: ${errors}`,
          results 
        }, 500)
      }

      return c.json({ 
        success: true, 
        message: `Notification sent to ${userEmail} in ${environment}`,
        results 
      })

    } catch (error: any) {
      console.error('❌ Error sending test notification:', error)
      return c.json({ success: false, error: error.message }, 500)
    }
  })
}
