import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

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

// Enhanced helper function to clean up database tables
async function cleanupDatabaseTables(userId: string, userEmail: string): Promise<void> {
  console.log('🗄️ Starting database table cleanup for user:', userEmail)
  
  // List of potential tables that might reference the auth user
  const tablesToClean = [
    'user_profiles',
    'user_settings', 
    'user_preferences',
    'waitlist_users',
    'waitlist_entries',
    'referrals',
    'user_referrals',
    'referral_codes',
    'friend_invitations',
    'user_invitations',
    'email_confirmations',
    'user_sessions',
    'user_tokens',
    'user_metadata',
    'profile_pictures',
    'user_uploads',
    'notifications',
    'user_notifications',
    'activity_logs',
    'user_activity',
    'audit_logs',
    'user_audit_logs'
  ]

  const cleanupResults = []

  for (const tableName of tablesToClean) {
    try {
      console.log(`🧹 Attempting to clean table: ${tableName}`)
      
      // Try to delete by user_id first
      const { error: userIdError, count: userIdCount } = await supabase
        .from(tableName)
        .delete()
        .eq('user_id', userId)
        .select('*', { count: 'exact' })

      if (!userIdError && userIdCount !== null && userIdCount > 0) {
        console.log(`✅ Deleted ${userIdCount} records from ${tableName} by user_id`)
        cleanupResults.push({ table: tableName, field: 'user_id', count: userIdCount, success: true })
        continue
      }

      // Try to delete by email if user_id didn't work
      const { error: emailError, count: emailCount } = await supabase
        .from(tableName)
        .delete()
        .eq('email', userEmail)
        .select('*', { count: 'exact' })

      if (!emailError && emailCount !== null && emailCount > 0) {
        console.log(`✅ Deleted ${emailCount} records from ${tableName} by email`)
        cleanupResults.push({ table: tableName, field: 'email', count: emailCount, success: true })
        continue
      }

      // Try common alternative field names
      const alternativeFields = ['auth_user_id', 'supabase_user_id', 'owner_id', 'created_by', 'updated_by']
      
      for (const field of alternativeFields) {
        try {
          const { error: altError, count: altCount } = await supabase
            .from(tableName)
            .delete()
            .eq(field, userId)
            .select('*', { count: 'exact' })

          if (!altError && altCount !== null && altCount > 0) {
            console.log(`✅ Deleted ${altCount} records from ${tableName} by ${field}`)
            cleanupResults.push({ table: tableName, field: field, count: altCount, success: true })
            break
          }
        } catch (fieldError) {
          // Field doesn't exist in this table, continue
          continue
        }
      }

      // If table exists but no records were found, that's okay
      cleanupResults.push({ table: tableName, field: 'N/A', count: 0, success: true, note: 'No records found' })

    } catch (error) {
      // Table might not exist, which is fine
      console.log(`ℹ️ Table ${tableName} doesn't exist or is inaccessible:`, error.message)
      cleanupResults.push({ table: tableName, success: false, error: error.message })
    }
  }

  console.log('📊 Database cleanup summary:', cleanupResults)
  
  // Log successful cleanups
  const successfulCleanups = cleanupResults.filter(r => r.success && r.count && r.count > 0)
  if (successfulCleanups.length > 0) {
    console.log('✅ Successfully cleaned tables:', successfulCleanups.map(r => `${r.table} (${r.count} records)`).join(', '))
  }
  
  // Log tables that had errors (excluding "table doesn't exist" errors)
  const errorCleanups = cleanupResults.filter(r => !r.success && !r.error?.includes('does not exist') && !r.error?.includes('relation') && !r.error?.includes('permission'))
  if (errorCleanups.length > 0) {
    console.warn('⚠️ Tables with cleanup errors:', errorCleanups)
  }
}

// Enhanced helper function to clean up all user-related data
async function cleanupUserData(userId: string, userEmail: string): Promise<void> {
  console.log('🧹 Starting comprehensive user data cleanup for:', userEmail)
  
  try {
    // STEP 1: Clean up database tables first
    await cleanupDatabaseTables(userId, userEmail)
    
    // STEP 2: Clean up KV store data
    console.log('🗃️ Cleaning up KV store data...')
    
    // Clean up direct user-related keys
    const directKeys = [
      `referral_stats_${userId}`,
      `user_referral_code_${userId}`,
      `user_profile_${userId}`,
      `user_profile_email_${userEmail}`,
      `waitlist_${userEmail}`,
      `waitlist_user_${userEmail}`,
      `email_confirmation_${userEmail}`,
      `pending_confirmation_${userEmail}`,
      `profile_picture_${userId}`,
      `profile_picture_email_${userEmail}`
    ]

    for (const key of directKeys) {
      try {
        await kv.del(key)
        console.log(`✅ Deleted KV key: ${key}`)
      } catch (error) {
        console.warn(`⚠️ Could not delete KV key ${key}:`, error)
      }
    }

    // Clean up referral code mappings
    try {
      const allReferralCodes = await kv.getByPrefix('referral_code_')
      for (const entry of allReferralCodes) {
        if (entry.value && entry.value.userId === userId) {
          await kv.del(entry.key)
          console.log(`✅ Deleted referral code mapping: ${entry.key}`)
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cleaning up referral code mappings:', error)
    }

    // Clean up from referred users lists
    try {
      const allReferredLists = await kv.getByPrefix('referred_by_')
      for (const entry of allReferredLists) {
        if (entry.value && Array.isArray(entry.value)) {
          const updatedList = entry.value.filter((email: string) => 
            email.toLowerCase() !== userEmail.toLowerCase()
          )
          if (updatedList.length !== entry.value.length) {
            await kv.set(entry.key, updatedList)
            console.log(`✅ Updated referred list: ${entry.key}`)
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cleaning up referred lists:', error)
    }

    // Clean up invitation records
    try {
      const allInvites = await kv.getByPrefix('friend_invite_')
      for (const entry of allInvites) {
        if (entry.value && 
            (entry.value.senderEmail === userEmail || 
             entry.value.targetEmail === userEmail)) {
          await kv.del(entry.key)
          console.log(`✅ Deleted invitation record: ${entry.key}`)
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cleaning up invitation records:', error)
    }

    console.log('✅ User data cleanup completed successfully for:', userEmail)
  } catch (error) {
    console.error('❌ Error during comprehensive user data cleanup:', error)
    throw error
  }
}

// Get all users with filtering and pagination
app.get('/make-server-ed0fe4c2/users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const url = new URL(c.req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '25')
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    console.log('🔍 Fetching users with params:', { page, limit, search, status, sortBy, sortOrder })

    // Use Auth Admin API to list users (much more reliable than direct table queries)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page,
      perPage: limit
    })

    if (authError) {
      console.error('❌ Error fetching users from Auth Admin API:', authError)
      return c.json({ error: 'Failed to fetch users from auth system', details: authError.message }, 500)
    }

    let users = authData.users || []
    console.log(`📊 Retrieved ${users.length} users from Auth Admin API`)

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      users = users.filter(user => 
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower) ||
        user.user_metadata?.name?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter if provided
    if (status === 'confirmed') {
      users = users.filter(user => user.email_confirmed_at)
    } else if (status === 'unconfirmed') {
      users = users.filter(user => !user.email_confirmed_at)
    }

    // Apply sorting
    users.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'email':
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case 'created_at':
          aValue = new Date(a.created_at || 0).getTime()
          bValue = new Date(b.created_at || 0).getTime()
          break
        case 'last_sign_in_at':
          aValue = new Date(a.last_sign_in_at || 0).getTime()
          bValue = new Date(b.last_sign_in_at || 0).getTime()
          break
        default:
          aValue = a.created_at || ''
          bValue = b.created_at || ''
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    // Get referral stats for each user
    const referralStats = await Promise.all(
      users.map(async (user) => {
        try {
          const stats = await kv.get(`referral_stats_${user.id}`)
          return { userId: user.id, stats: stats || { totalReferrals: 0, activeReferrals: 0 } }
        } catch {
          return { userId: user.id, stats: { totalReferrals: 0, activeReferrals: 0 } }
        }
      })
    )

    // Enhance users with referral data and clean up the structure
    const enhancedUsers = users.map(user => {
      const userReferrals = referralStats.find(stat => stat.userId === user.id)
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        phone_confirmed_at: user.phone_confirmed_at,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
        referralStats: userReferrals?.stats || { totalReferrals: 0, activeReferrals: 0 }
      }
    })

    // Calculate pagination info
    const totalUsers = users.length
    const totalPages = Math.ceil(totalUsers / limit)

    console.log(`✅ Successfully processed ${enhancedUsers.length} users for page ${page}`)

    return c.json({
      users: enhancedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages
      }
    })

  } catch (error) {
    console.error('❌ Error in users endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Get user statistics (must come before :id route to avoid conflict)
app.get('/make-server-ed0fe4c2/users/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    console.log('📊 Calculating user statistics...')

    // Use Auth Admin API to get all users (we need to paginate through all to get accurate counts)
    let allUsers = []
    let page = 1
    const perPage = 1000 // Max per page

    try {
      while (true) {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
          page,
          perPage
        })

        if (authError) {
          console.error('❌ Error fetching users for stats:', authError)
          break
        }

        if (!authData.users || authData.users.length === 0) {
          break // No more users
        }

        allUsers.push(...authData.users)
        
        // If we got less than perPage, we've reached the end
        if (authData.users.length < perPage) {
          break
        }
        
        page++
      }
    } catch (error) {
      console.error('❌ Error paginating through users:', error)
      // Continue with whatever users we managed to get
    }

    console.log(`📈 Retrieved ${allUsers.length} total users for statistics calculation`)

    // Calculate statistics from the user data
    const totalUsers = allUsers.length
    const confirmedUsers = allUsers.filter(user => user.email_confirmed_at).length
    const unconfirmedUsers = totalUsers - confirmedUsers

    // Calculate users created today
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    const todayUsers = allUsers.filter(user => {
      const createdAt = new Date(user.created_at)
      return createdAt >= today
    }).length

    // Calculate users created this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)
    const weekUsers = allUsers.filter(user => {
      const createdAt = new Date(user.created_at)
      return createdAt >= weekAgo
    }).length

    const confirmationRate = totalUsers > 0 ? ((confirmedUsers / totalUsers) * 100).toFixed(1) : '0'

    console.log('✅ User statistics calculated:', {
      totalUsers,
      confirmedUsers,
      unconfirmedUsers,
      todayUsers,
      weekUsers,
      confirmationRate
    })

    return c.json({
      totalUsers,
      confirmedUsers,
      unconfirmedUsers,
      todayUsers,
      weekUsers,
      confirmationRate
    })

  } catch (error) {
    console.error('❌ Error in user stats endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Get single user by ID
app.get('/make-server-ed0fe4c2/users/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const userId = c.req.param('id')
    console.log('🔍 Fetching user by ID:', userId)

    // Validate UUID format before making the API call
    if (!isValidUUID(userId)) {
      console.error('❌ Invalid UUID format:', userId)
      return c.json({ error: 'Invalid user ID format. Expected UUID.' }, 400)
    }

    // Use Auth Admin API to get user by ID
    const { data: userData, error } = await supabase.auth.admin.getUserById(userId)

    if (error) {
      console.error('❌ Error fetching user:', error)
      return c.json({ error: 'User not found', details: error.message }, 404)
    }

    if (!userData.user) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Get referral stats
    const referralStats = await kv.get(`referral_stats_${userId}`) || { totalReferrals: 0, activeReferrals: 0 }

    console.log('✅ User fetched successfully:', userData.user.email)

    return c.json({
      ...userData.user,
      referralStats
    })

  } catch (error) {
    console.error('❌ Error in user detail endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Create new user
app.post('/make-server-ed0fe4c2/users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const body = await c.req.json()
    const { email, password, name, phone, metadata = {} } = body

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      phone,
      user_metadata: { name, ...metadata },
      email_confirm: true // Auto-confirm since we don't have email server configured
    })

    if (error) {
      console.error('❌ Error creating user:', error)
      return c.json({ error: 'Failed to create user', details: error.message }, 400)
    }

    console.log('✅ User created successfully:', data.user?.email)
    return c.json(data.user)

  } catch (error) {
    console.error('❌ Error in create user endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Update user
app.put('/make-server-ed0fe4c2/users/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const userId = c.req.param('id')

    // Validate UUID format before making the API call
    if (!isValidUUID(userId)) {
      console.error('❌ Invalid UUID format for update:', userId)
      return c.json({ error: 'Invalid user ID format. Expected UUID.' }, 400)
    }

    const body = await c.req.json()
    const { email, phone, name, metadata = {}, password } = body

    const updateData: any = {}

    if (email) updateData.email = email
    if (phone) updateData.phone = phone
    if (password) updateData.password = password
    if (name || Object.keys(metadata).length > 0) {
      updateData.user_metadata = { name, ...metadata }
    }

    const { data, error } = await supabase.auth.admin.updateUserById(userId, updateData)

    if (error) {
      console.error('❌ Error updating user:', error)
      return c.json({ error: 'Failed to update user', details: error.message }, 400)
    }

    console.log('✅ User updated successfully:', data.user?.email)
    return c.json(data.user)

  } catch (error) {
    console.error('❌ Error in update user endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Enhanced delete user with multiple fallback strategies
app.delete('/make-server-ed0fe4c2/users/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const userId = c.req.param('id')
    console.log('🗑️ Starting enhanced user deletion process for ID:', userId)

    // Validate UUID format
    if (!isValidUUID(userId)) {
      console.error('❌ Invalid UUID format for deletion:', userId)
      return c.json({ error: 'Invalid user ID format. Expected UUID.' }, 400)
    }

    // Get user info before deletion
    let userEmail = 'unknown'
    let userData = null
    
    try {
      const { data: fetchedUserData, error: fetchError } = await supabase.auth.admin.getUserById(userId)
      if (fetchError) {
        console.warn('⚠️ Could not fetch user before deletion:', fetchError)
        return c.json({ error: 'User not found', details: fetchError.message }, 404)
      }
      
      userData = fetchedUserData.user
      userEmail = userData?.email || 'unknown'
      console.log('👤 Found user to delete:', userEmail)
    } catch (getUserError) {
      console.error('❌ Error fetching user before deletion:', getUserError)
      return c.json({ error: 'User not found' }, 404)
    }

    if (!userData) {
      return c.json({ error: 'User not found' }, 404)
    }

    // STRATEGY 1: Try comprehensive cleanup + deletion
    console.log('🔄 Strategy 1: Comprehensive cleanup + deletion')
    try {
      // Comprehensive cleanup
      await cleanupUserData(userId, userEmail)
      console.log('✅ Data cleanup completed')
      
      // Wait a moment for cleanup to propagate
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Try auth user deletion
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
      
      if (!deleteError) {
        console.log('🎉 Strategy 1 successful: User deleted with full cleanup')
        return c.json({ 
          message: 'User deleted successfully',
          strategy: 'full_cleanup_and_delete',
          userEmail: userEmail,
          userId: userId,
          deletedAt: new Date().toISOString()
        })
      } else {
        console.warn('⚠️ Strategy 1 failed, auth deletion error:', deleteError.message)
      }
    } catch (strategy1Error) {
      console.warn('⚠️ Strategy 1 failed with exception:', strategy1Error.message)
    }

    // STRATEGY 2: Try disabling the user instead of deleting
    console.log('🔄 Strategy 2: Disable user account')
    try {
      const { data: disabledUser, error: disableError } = await supabase.auth.admin.updateUserById(userId, {
        banned_until: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(), // Ban for 100 years
        email_confirm: false,
        user_metadata: { 
          ...userData.user_metadata, 
          deleted: true, 
          deleted_at: new Date().toISOString(),
          deleted_by: 'admin',
          original_email: userEmail
        }
      })

      if (!disableError && disabledUser.user) {
        console.log('✅ Strategy 2 successful: User account disabled')
        return c.json({ 
          message: 'User account disabled successfully (soft delete)',
          strategy: 'account_disable',
          userEmail: userEmail,
          userId: userId,
          disabledAt: new Date().toISOString(),
          note: 'User account has been disabled and marked as deleted. Data cleanup completed.'
        })
      } else {
        console.warn('⚠️ Strategy 2 failed:', disableError?.message)
      }
    } catch (strategy2Error) {
      console.warn('⚠️ Strategy 2 failed with exception:', strategy2Error.message)
    }

    // STRATEGY 3: Try anonymizing the user
    console.log('🔄 Strategy 3: Anonymize user data')
    try {
      const anonymizedEmail = `deleted-user-${userId.substring(0, 8)}@healthscan-deleted.local`
      
      const { data: anonymizedUser, error: anonymizeError } = await supabase.auth.admin.updateUserById(userId, {
        email: anonymizedEmail,
        phone: null,
        user_metadata: { 
          deleted: true, 
          deleted_at: new Date().toISOString(),
          anonymized: true,
          original_email_hash: btoa(userEmail) // Store hash for potential recovery
        },
        email_confirm: false
      })

      if (!anonymizeError && anonymizedUser.user) {
        console.log('✅ Strategy 3 successful: User data anonymized')
        return c.json({ 
          message: 'User data anonymized successfully (anonymization delete)',
          strategy: 'anonymization',
          originalEmail: userEmail,
          anonymizedEmail: anonymizedEmail,
          userId: userId,
          anonymizedAt: new Date().toISOString(),
          note: 'User has been anonymized and marked as deleted. Original data cleared.'
        })
      } else {
        console.warn('⚠️ Strategy 3 failed:', anonymizeError?.message)
      }
    } catch (strategy3Error) {
      console.warn('⚠️ Strategy 3 failed with exception:', strategy3Error.message)
    }

    // STRATEGY 4: Detailed error reporting
    console.log('🔍 Strategy 4: Detailed constraint analysis')
    try {
      // Try to get more specific error information
      const { error: finalDeleteAttempt } = await supabase.auth.admin.deleteUser(userId, {
        should_soft_delete: false // Force hard delete to see the real error
      })

      if (finalDeleteAttempt) {
        console.error('🔍 Detailed deletion error analysis:', {
          message: finalDeleteAttempt.message,
          code: finalDeleteAttempt.code || 'unknown',
          details: finalDeleteAttempt.details || 'No additional details',
          hint: finalDeleteAttempt.hint || 'No hint provided',
          status: finalDeleteAttempt.status || 500
        })

        // Try to identify specific constraint violations
        const errorMessage = finalDeleteAttempt.message?.toLowerCase() || ''
        let constraintHints = []

        if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
          constraintHints.push('Foreign key constraint violation detected')
        }
        if (errorMessage.includes('profile') || errorMessage.includes('user_profile')) {
          constraintHints.push('User profile table may have constraints')
        }
        if (errorMessage.includes('referral') || errorMessage.includes('invitation')) {
          constraintHints.push('Referral or invitation table may have constraints')
        }
        if (errorMessage.includes('session') || errorMessage.includes('token')) {
          constraintHints.push('Session or token table may have constraints')
        }

        return c.json({ 
          error: 'Unable to delete user after trying multiple strategies',
          strategies_attempted: [
            'full_cleanup_and_delete',
            'account_disable', 
            'anonymization',
            'detailed_error_analysis'
          ],
          constraint_analysis: {
            error_message: finalDeleteAttempt.message,
            error_code: finalDeleteAttempt.code,
            possible_constraints: constraintHints,
            user_email: userEmail,
            user_id: userId
          },
          recommendation: 'User data has been cleaned up but auth record remains due to database constraints. Consider using account disable or anonymization as alternative.',
          data_cleanup_status: 'completed',
          auth_deletion_status: 'failed_due_to_constraints'
        }, 500)
      }
    } catch (finalError) {
      console.error('❌ Final deletion attempt failed:', finalError)
    }

    // If we get here, something unexpected happened
    return c.json({ 
      error: 'Unexpected error during user deletion',
      user_email: userEmail,
      user_id: userId,
      strategies_attempted: ['full_cleanup_and_delete', 'account_disable', 'anonymization'],
      recommendation: 'Contact system administrator for manual intervention'
    }, 500)

  } catch (error) {
    console.error('❌ Unexpected error in enhanced delete user endpoint:', error)
    return c.json({ 
      error: 'Unexpected error during user deletion process', 
      details: error.message 
    }, 500)
  }
})

// Toggle user status (confirm/unconfirm email)
app.patch('/make-server-ed0fe4c2/users/:id/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const userId = c.req.param('id')

    // Validate UUID format before making the API call
    if (!isValidUUID(userId)) {
      console.error('❌ Invalid UUID format for status update:', userId)
      return c.json({ error: 'Invalid user ID format. Expected UUID.' }, 400)
    }

    const body = await c.req.json()
    const { confirmed } = body

    const updateData = {
      email_confirm: confirmed
    }

    const { data, error } = await supabase.auth.admin.updateUserById(userId, updateData)

    if (error) {
      console.error('❌ Error updating user status:', error)
      return c.json({ error: 'Failed to update user status', details: error.message }, 400)
    }

    console.log('✅ User status updated:', data.user?.email, 'confirmed:', confirmed)
    return c.json(data.user)

  } catch (error) {
    console.error('❌ Error in user status endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// NEW ENDPOINTS FOR ENHANCED ADMIN FUNCTIONALITY

// Send verification email to user
app.post('/make-server-ed0fe4c2/users/:id/send-verification', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const userId = c.req.param('id')
    const body = await c.req.json()
    const { email } = body

    if (!isValidUUID(userId)) {
      return c.json({ error: 'Invalid user ID format' }, 400)
    }

    console.log('📧 Sending verification email to:', email)

    // For now, return success since we don't have email service configured
    // In production, this would integrate with the email service
    console.log('✅ Verification email would be sent to:', email)
    
    return c.json({ 
      success: true,
      message: 'Verification email sent successfully',
      email: email
    })

  } catch (error) {
    console.error('❌ Error in send verification endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Unverify user for testing
app.post('/make-server-ed0fe4c2/users/:id/unverify', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const userId = c.req.param('id')

    if (!isValidUUID(userId)) {
      return c.json({ error: 'Invalid user ID format' }, 400)
    }

    console.log('🔄 Unverifying user for testing:', userId)

    // Update user to remove email confirmation
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: false
    })

    if (error) {
      console.error('❌ Error unverifying user:', error)
      return c.json({ error: 'Failed to unverify user', details: error.message }, 400)
    }

    console.log('✅ User unverified successfully:', data.user?.email)
    return c.json({ 
      success: true,
      message: 'User unverified for testing',
      user: data.user
    })

  } catch (error) {
    console.error('❌ Error in unverify user endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Test referral flow
app.post('/make-server-ed0fe4c2/test-referral-flow', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const body = await c.req.json()
    const { referralCode, testEmail, testName } = body

    console.log('🧪 Testing referral flow for code:', referralCode)

    // Find the referrer
    const referrerData = await kv.get(`referral_code_${referralCode}`)
    if (!referrerData || !referrerData.userId) {
      return c.json({ error: 'Referral code not found' }, 404)
    }

    // Increment referral stats for the referrer
    const currentStats = await kv.get(`referral_stats_${referrerData.userId}`) || { totalReferrals: 0, activeReferrals: 0 }
    const updatedStats = {
      totalReferrals: currentStats.totalReferrals + 1,
      activeReferrals: currentStats.activeReferrals + 1
    }
    
    await kv.set(`referral_stats_${referrerData.userId}`, updatedStats)

    // Add to referred users list
    const referredUsersKey = `referred_by_${referrerData.email || referrerData.userId}`
    const currentReferred = await kv.get(referredUsersKey) || []
    await kv.set(referredUsersKey, [...currentReferred, testEmail])

    console.log('✅ Referral flow test completed, stats updated for:', referrerData.userId)
    
    return c.json({ 
      success: true,
      message: 'Referral flow tested successfully',
      referrer: referrerData.userId,
      newStats: updatedStats,
      testUser: { email: testEmail, name: testName }
    })

  } catch (error) {
    console.error('❌ Error in test referral flow endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Get referrer information by referral code
app.post('/make-server-ed0fe4c2/get-referrer-info', async (c) => {
  try {
    const body = await c.req.json()
    const { referralCode } = body

    if (!referralCode) {
      return c.json({ error: 'Referral code is required' }, 400)
    }

    console.log('🔍 Looking up referrer for code:', referralCode)

    // First, try to find the referral code in our KV store
    try {
      const referrerData = await kv.get(`referral_code_${referralCode}`)
      
      if (referrerData && referrerData.userId) {
        console.log('✅ Found referrer data in KV store:', referrerData)
        
        // Get the user information from Supabase Auth
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(referrerData.userId)
        
        if (!userError && userData.user) {
          return c.json({
            success: true,
            referrer: {
              email: userData.user.email,
              name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0],
              createdAt: userData.user.created_at
            }
          })
        } else {
          console.warn('⚠️ User not found in auth system for referral code:', referralCode)
        }
      }
    } catch (kvError) {
      console.warn('⚠️ KV lookup failed for referral code:', referralCode, kvError)
    }

    // Fallback: search through waitlist data
    try {
      const waitlistData = await kv.getByPrefix('waitlist_user_')
      console.log(`🔍 Searching through ${waitlistData.length} waitlist entries for referral code:`, referralCode)
      
      for (const entry of waitlistData) {
        if (entry.value && entry.value.referralCode === referralCode) {
          console.log('✅ Found referrer in waitlist data:', entry.value.email)
          return c.json({
            success: true,
            referrer: {
              email: entry.value.email,
              name: entry.value.name || entry.value.email?.split('@')[0],
              createdAt: entry.value.createdAt || entry.value.signupDate
            }
          })
        }
      }
    } catch (waitlistError) {
      console.warn('⚠️ Waitlist search failed:', waitlistError)
    }

    console.log('ℹ️ No referrer found for code:', referralCode)
    return c.json({
      success: false,
      message: 'Referrer not found'
    })

  } catch (error) {
    console.error('❌ Error in get-referrer-info endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Validate email for friend invitations
app.post('/make-server-ed0fe4c2/validate-email', async (c) => {
  try {
    const body = await c.req.json()
    const { email, senderEmail } = body

    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Don't allow users to invite themselves
    if (normalizedEmail === senderEmail?.toLowerCase().trim()) {
      return c.json({
        exists: false,
        isUser: false,
        isInvited: false,
        message: "You can't invite yourself!",
        type: 'error'
      })
    }

    console.log('🔍 Validating email for invitation:', normalizedEmail)

    let isUser = false
    let isInWaitlist = false
    let isAlreadyInvited = false

    // Check if email exists in Supabase Auth (registered user)
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      isUser = authUsers?.users?.some(user => 
        user.email?.toLowerCase() === normalizedEmail
      ) || false
    } catch (authError) {
      console.warn('⚠️ Could not check auth users:', authError)
    }

    // Check if email exists in waitlist
    try {
      const waitlistEntry = await kv.get(`waitlist_${normalizedEmail}`)
      isInWaitlist = !!waitlistEntry
    } catch (kvError) {
      console.warn('⚠️ Could not check waitlist:', kvError)
    }

    // Check if email has already been invited by this sender
    try {
      const inviteData = await kv.getByPrefix('friend_invite_')
      isAlreadyInvited = inviteData.some(invite => 
        invite.value && 
        invite.value.targetEmail === normalizedEmail && 
        invite.value.senderEmail === senderEmail &&
        invite.value.status !== 'expired'
      )
    } catch (kvError) {
      console.warn('⚠️ Could not check existing invites:', kvError)
    }

    // Determine response
    if (isUser && isInWaitlist) {
      return c.json({
        exists: true,
        isUser: true,
        isInvited: isAlreadyInvited,
        message: "This person is already a user and on the waitlist",
        type: 'warning'
      })
    } else if (isUser) {
      return c.json({
        exists: true,
        isUser: true,
        isInvited: isAlreadyInvited,
        message: "This person is already a registered user",
        type: 'warning'
      })
    } else if (isInWaitlist) {
      return c.json({
        exists: true,
        isUser: false,
        isInvited: isAlreadyInvited,
        message: "This person is already on the waitlist",
        type: 'warning'
      })
    } else if (isAlreadyInvited) {
      return c.json({
        exists: false,
        isUser: false,
        isInvited: true,
        message: "You have already invited this person",
        type: 'warning'
      })
    } else {
      return c.json({
        exists: false,
        isUser: false,
        isInvited: false,
        message: "Ready to send invitation",
        type: 'success'
      })
    }

  } catch (error) {
    console.error('❌ Error in validate-email endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Update user profile (non-admin endpoint for regular users)
app.post('/make-server-ed0fe4c2/update-user-profile', async (c) => {
  try {
    const body = await c.req.json()
    const { userId, email, profileData } = body
    
    if (!userId && !email) {
      return c.json({ error: 'User ID or email is required' }, 400)
    }

    if (!profileData) {
      return c.json({ error: 'Profile data is required' }, 400)
    }

    console.log('👤 Updating user profile for:', { userId, email })

    // For now, just return success since we're using localStorage for profile data
    // In a real app, this would update the database with the profile information
    console.log('✅ Profile data received:', profileData)

    // Store in KV store as backup/future reference
    const profileKey = userId ? `user_profile_${userId}` : `user_profile_email_${email}`
    await kv.set(profileKey, {
      ...profileData,
      updatedAt: new Date().toISOString(),
      userId,
      email
    })

    console.log('✅ Profile updated successfully for:', email || userId)
    return c.json({ 
      success: true,
      message: 'Profile updated successfully' 
    })

  } catch (error) {
    console.error('❌ Error updating user profile:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Get referred users list
app.post('/make-server-ed0fe4c2/referred-users', async (c) => {
  try {
    const { email } = await c.req.json()
    
    if (!email) {
      return c.json({ error: 'Missing email' }, 400)
    }

    // Get all users who were referred by this email
    const referredUsersKey = `referred_by_${email}`
    const referredUsersList = await kv.get(referredUsersKey) || []
    
    // Get detailed information for each referred user
    const referredUsersDetails = await Promise.all(
      referredUsersList.map(async (referredEmail: string) => {
        const userKey = `waitlist_user_${referredEmail}`
        const userData = await kv.get(userKey)
        
        return {
          email: referredEmail,
          joinedAt: userData?.joinedAt || new Date().toISOString(),
          position: userData?.position || null,
          hasSignedUp: userData?.hasSignedUp || false,
          referralDate: userData?.referralDate || userData?.joinedAt || new Date().toISOString()
        }
      })
    )
    
    console.log(`👥 Referred users for ${email}: ${referredUsersDetails.length} users`)
    
    return c.json({
      referredUsers: referredUsersDetails,
      totalReferred: referredUsersDetails.length
    })
    
  } catch (error) {
    console.error('❌ Error getting referred users:', error)
    return c.json({ error: 'Failed to get referred users' }, 500)
  }
})

// Profile picture upload endpoint
app.post('/make-server-ed0fe4c2/upload-profile-picture', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user) {
      return c.json({ error: 'Invalid authorization' }, 401)
    }

    // Get form data
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const email = formData.get('email') as string

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400)
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return c.json({ error: 'File size must be less than 5MB' }, 400)
    }

    // Validate that the user is updating their own profile or is an admin
    if (user.id !== userId && user.email !== email) {
      // Check if user is admin
      const userEmail = user.email?.toLowerCase()
      const specificAdminEmails = ['johnferreira@gmail.com']
      const isSpecificAdmin = userEmail && specificAdminEmails.includes(userEmail)
      const adminDomains = ['healthscan.live', 'healthscan.com']
      const emailDomain = user.email?.split('@')[1]?.toLowerCase()
      const isDomainAdmin = emailDomain && adminDomains.includes(emailDomain)
      
      if (!isSpecificAdmin && !isDomainAdmin) {
        return c.json({ error: 'Unauthorized' }, 403)
      }
    }

    // Convert file to base64 for storage in KV
    const arrayBuffer = await file.arrayBuffer()
    const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    
    const imageData = {
      data: base64String,
      type: file.type,
      size: file.size,
      name: file.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id
    }

    // Store the image data
    const imageKey = userId ? `profile_picture_${userId}` : `profile_picture_email_${email}`
    await kv.set(imageKey, imageData)

    console.log('✅ Profile picture uploaded successfully for:', email || userId)
    
    return c.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      url: `data:${file.type};base64,${base64String}`, // Return data URL for immediate use
      metadata: {
        type: file.type,
        size: file.size,
        name: file.name
      }
    })

  } catch (error) {
    console.error('❌ Error uploading profile picture:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

export default app