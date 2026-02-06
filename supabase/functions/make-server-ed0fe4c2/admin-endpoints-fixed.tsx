// This file will be regenerated with the export statement at the end
// Import existing admin-endpoints content and add export
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'
import { TARGET_COUNTS, NUTRIENTS_DATA, POLLUTANTS_DATA, INGREDIENTS_DATA, PRODUCTS_DATA, PARASITES_DATA } from './admin-constants.tsx'
import { getCSVHeaders, generateReliableImageUrl } from './admin-helpers.tsx'

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

// Get admin statistics
app.get('/make-server-ed0fe4c2/admin/stats', async (c) => {
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
app.get('/make-server-ed0fe4c2/admin/health', async (c) => {
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

// Export the admin app
export { app as adminApp }