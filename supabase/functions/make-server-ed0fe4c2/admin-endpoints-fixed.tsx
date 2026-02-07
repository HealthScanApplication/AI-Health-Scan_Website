// Admin endpoints - registers routes directly on the main Hono app (no sub-app)
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'
import { TARGET_COUNTS } from './admin-constants.tsx'
import { createEmailService } from './email-service.tsx'

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
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

// Enhanced detailed statistics with quality metrics
async function getDetailedStats(): Promise<any> {
  try {
    console.log('📊 Fetching detailed statistics with quality metrics...')
    
    const dataTypes = ['nutrient', 'pollutant', 'ingredient', 'product', 'parasite', 'scan', 'meal']
    const detailedStats: any = {}
    
    for (const dataType of dataTypes) {
      const records = await kv.getByPrefix(`${dataType}_`)
      const total = records.length
      
      // Analyze data quality
      let withImages = 0
      let withMetadata = 0
      let fromSupabase = 0
      let fromAPI = 0
      let lastImport: string | null = null
      
      records.forEach((record: any) => {
        // Count records with images (exclude broken placeholder URLs)
        if (record.image_url && 
            record.image_url !== 'null' && 
            record.image_url.length > 0 &&
            !record.image_url.includes('api.placeholder.com')) {
          withImages++
        }
        
        // Count records with comprehensive metadata
        const hasMetadata = record.description && 
                           record.description.length > 50 && 
                           record.source && 
                           record.imported_at
        if (hasMetadata) {
          withMetadata++
        }
        
        // Determine data source
        if (record.source && record.source.includes('Supabase')) {
          fromSupabase++
        } else if (record.api_source || record.external_id) {
          fromAPI++
        }
        
        // Track last import
        if (record.imported_at) {
          if (!lastImport || new Date(record.imported_at) > new Date(lastImport)) {
            lastImport = record.imported_at
          }
        }
      })
      
      const target = TARGET_COUNTS[dataType as keyof typeof TARGET_COUNTS] || 50
      const coverage = Math.min((total / target) * 100, 100)
      
      // Calculate quality score
      let qualityScore = 0
      if (total > 0) {
        const imageQuality = (withImages / total) * 30 // 30% weight
        const metadataQuality = (withMetadata / total) * 40 // 40% weight
        const sourceQuality = (fromAPI / total) * 30 // 30% weight (API data generally higher quality)
        qualityScore = Math.round(imageQuality + metadataQuality + sourceQuality + 50) // Base 50%
      }
      
      detailedStats[dataType === 'nutrient' ? 'nutrients' : 
                   dataType === 'pollutant' ? 'pollutants' : 
                   dataType === 'ingredient' ? 'ingredients' :
                   dataType === 'product' ? 'products' :
                   dataType === 'parasite' ? 'parasites' :
                   dataType === 'scan' ? 'scans' : 'meals'] = {
        current: total,
        target,
        withImages,
        withMetadata,
        fromSupabase,
        fromAPI,
        lastImport,
        coverage,
        quality: qualityScore
      }
    }
    
    return { success: true, detailedStats }
  } catch (error) {
    console.error('❌ Failed to get detailed stats:', error)
    return { success: false, error: error.message }
  }
}

// Register all admin routes on the main Hono app
export function registerAdminRoutes(app: any) {

// Get admin statistics
app.get('/make-server-ed0fe4c2/admin/stats', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const stats = await getDetailedStats()
    return c.json(stats)

  } catch (error) {
    console.error('❌ Error in admin stats endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Basic health check for admin
app.get('/make-server-ed0fe4c2/admin/health', async (c: any) => {
  try {
    return c.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'HealthScan Admin API',
      version: '1.0.0'
    })
  } catch (error) {
    console.error('❌ Error in admin health endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Admin endpoint to resend welcome email
app.post('/make-server-ed0fe4c2/admin/resend-welcome-email', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    const { email, recordId } = await c.req.json()
    if (!email || typeof email !== 'string') {
      return c.json({ success: false, error: 'Valid email is required' }, 400)
    }

    const normalizedEmail = email.trim().toLowerCase()
    const emailService = createEmailService()
    if (!emailService) {
      return c.json({ success: false, error: 'Email service not configured.' }, 500)
    }

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

    const result = await emailService.sendEmailConfirmed(normalizedEmail, position, referralCode)
    if (result.success) {
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
      return c.json({ success: true, message: 'Welcome email sent successfully', email: normalizedEmail })
    } else {
      return c.json({ success: false, error: result.error || 'Failed to send email' }, 500)
    }
  } catch (error: any) {
    console.error('❌ Error in resend-welcome-email endpoint:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// Get waitlist data from KV store for admin panel
app.get('/make-server-ed0fe4c2/admin/waitlist', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    console.log('📊 Fetching waitlist data from KV store...')
    const allKeys = await kv.getByPrefix('waitlist_user_')
    
    if (!allKeys || allKeys.length === 0) {
      return c.json([])
    }

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
  } catch (error: any) {
    console.error('❌ Error fetching waitlist data:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// Delete a waitlist user from KV store
app.post('/make-server-ed0fe4c2/admin/waitlist/delete', async (c: any) => {
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

    const remaining = await kv.getByPrefix('waitlist_user_')
    const sorted = remaining.sort((a: any, b: any) => (a.position || 999) - (b.position || 999))
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].position !== i + 1) {
        sorted[i].position = i + 1
        await kv.set(`waitlist_user_${sorted[i].email}`, sorted[i])
      }
    }
    await kv.set('waitlist_count', { count: sorted.length, lastUpdated: new Date().toISOString() })

    return c.json({ success: true, message: `Deleted ${normalizedEmail}`, newCount: sorted.length })
  } catch (error: any) {
    console.error('❌ Error deleting waitlist user:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// Update a waitlist user in KV store
app.post('/make-server-ed0fe4c2/admin/waitlist/update', async (c: any) => {
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
  } catch (error: any) {
    console.error('❌ Error updating waitlist user:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// Bulk update waitlist users
app.post('/make-server-ed0fe4c2/admin/waitlist/bulk-update', async (c: any) => {
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
  } catch (error: any) {
    console.error('❌ Error in bulk update:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// Bulk delete waitlist users
app.post('/make-server-ed0fe4c2/admin/waitlist/bulk-delete', async (c: any) => {
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
  } catch (error: any) {
    console.error('❌ Error in bulk delete:', error)
    return c.json({ success: false, error: error?.message || 'Internal server error' }, 500)
  }
})

// Get products data from KV store for admin panel
app.get('/make-server-ed0fe4c2/admin/products', async (c: any) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '')
    const adminValidation = await validateAdminAccess(accessToken)
    if (adminValidation.error) {
      return c.json({ success: false, error: adminValidation.error }, adminValidation.status)
    }

    console.log('[Admin] Fetching products from KV store...')
    const allProducts = await kv.getByPrefix('product_')
    
    if (!allProducts || allProducts.length === 0) {
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
  } catch (error: any) {
    console.error('[Admin] Error fetching products:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

// Admin: Update a catalog record (elements, ingredients, recipes, products)
app.post('/make-server-ed0fe4c2/admin/catalog/update', async (c: any) => {
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
      const kvStripFields = ['_displayIndex', 'created_at']
      const kvCleanUpdates = { ...existing, ...updates }
      kvStripFields.forEach((f: string) => delete kvCleanUpdates[f])
      kvCleanUpdates.updated_at = new Date().toISOString()
      await kv.set(id, kvCleanUpdates)
      console.log(`[Admin] Updated product ${id} in KV by ${adminValidation.user.email}`)
      return c.json({ success: true })
    }

    // Strip non-DB fields from updates
    const cleanUpdates = { ...updates }
    const stripFields = ['_displayIndex', 'id', 'created_at', 'imported_at', 'api_source', 'external_id']
    stripFields.forEach((f: string) => delete cleanUpdates[f])
    Object.keys(cleanUpdates).forEach((k: string) => {
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
  } catch (error: any) {
    console.error('[Admin] Error updating catalog record:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

// Admin: Delete a catalog record (elements, ingredients, recipes, products)
app.post('/make-server-ed0fe4c2/admin/catalog/delete', async (c: any) => {
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
  } catch (error: any) {
    console.error('[Admin] Error deleting catalog record:', error)
    return c.json({ success: false, error: 'Internal server error' }, 500)
  }
})

} // end registerAdminRoutes