import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'
import { generateReliableImageUrl } from './admin-helpers.tsx'

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

  const userEmail = user.email?.toLowerCase()
  const specificAdminEmails = ['johnferreira@gmail.com']
  const isSpecificAdmin = userEmail && specificAdminEmails.includes(userEmail)
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

// JSON Import endpoint
app.post('/make-server-ed0fe4c2/admin/import-json/:dataType', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const dataType = c.req.param('dataType')
    const body = await c.req.json()
    const { data, options = {} } = body

    if (!Array.isArray(data)) {
      return c.json({ error: 'Data must be an array' }, 400)
    }

    console.log(`📥 Importing ${data.length} ${dataType} records from JSON...`)

    let imported = 0
    let updated = 0
    let duplicates = 0
    const errors: string[] = []
    const warnings: string[] = []

    // Process each record
    for (let i = 0; i < data.length; i++) {
      try {
        const record = data[i]
        
        // Validate required fields based on data type
        const validationResult = validateRecord(record, dataType)
        if (!validationResult.valid) {
          errors.push(`Record ${i + 1}: ${validationResult.error}`)
          continue
        }

        // Generate unique ID
        const recordId = `${dataType.slice(0, -1)}_${Date.now()}_${i}`
        
        // Check for existing record by name
        if (options.updateExisting && record.name) {
          const existingRecords = await kv.getByPrefix(`${dataType.slice(0, -1)}_`)
          const existing = existingRecords.find(r => 
            (r.value?.name || r.name) === record.name ||
            (r.value?.scientific_name || r.scientific_name) === record.scientific_name
          )
          
          if (existing) {
            // Update existing record
            const existingKey = existing.key || existing.id
            const updatedRecord = {
              ...existing,
              ...record,
              id: existingKey,
              updated_at: new Date().toISOString(),
              imported_at: new Date().toISOString(),
              source: record.source || `JSON Import - ${new Date().toISOString()}`,
              api_source: record.api_source || 'JSON Data Import'
            }
            
            await kv.set(existingKey, updatedRecord)
            updated++
            continue
          }
        }

        // Create new record
        const newRecord = {
          id: recordId,
          ...record,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          imported_at: new Date().toISOString(),
          source: record.source || `JSON Import - ${new Date().toISOString()}`,
          api_source: record.api_source || 'JSON Data Import',
          // Generate image URL if not provided and generateImages is enabled
          image_url: record.image_url || (options.generateImages ? generateReliableImageUrl(dataType.slice(0, -1), record.name) : null)
        }

        await kv.set(recordId, newRecord)
        imported++

        // Small delay to prevent overwhelming the system
        if (imported % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }

      } catch (error) {
        console.error(`Error processing record ${i + 1}:`, error)
        errors.push(`Record ${i + 1}: ${error.message}`)
      }
    }

    const result = {
      success: true,
      imported,
      updated,
      duplicates,
      errors,
      warnings,
      total: data.length,
      message: `Successfully processed ${imported + updated} out of ${data.length} records`
    }

    console.log(`✅ JSON import completed:`, result)
    return c.json(result)

  } catch (error) {
    console.error('❌ JSON import error:', error)
    return c.json({ 
      success: false, 
      error: 'Import failed', 
      details: error.message,
      imported: 0,
      errors: [error.message]
    }, 500)
  }
})

// JSON Export endpoint
app.get('/make-server-ed0fe4c2/admin/export-json/:dataType', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const dataType = c.req.param('dataType')
    console.log(`📤 Exporting ${dataType} data as JSON...`)

    // Get all records for this data type
    const records = await kv.getByPrefix(`${dataType.slice(0, -1)}_`)
    const cleanedRecords = records.map(record => {
      // Return the value if it exists (nested structure) or the record itself
      const data = record.value || record
      
      // Remove KV store metadata
      const { key, ...cleanData } = data
      return cleanData
    })

    const result = {
      success: true,
      data: cleanedRecords,
      count: cleanedRecords.length,
      exported_at: new Date().toISOString(),
      data_type: dataType
    }

    console.log(`✅ JSON export completed: ${cleanedRecords.length} records`)
    return c.json(result)

  } catch (error) {
    console.error('❌ JSON export error:', error)
    return c.json({ 
      success: false, 
      error: 'Export failed', 
      details: error.message 
    }, 500)
  }
})

// Record validation function
function validateRecord(record: any, dataType: string): { valid: boolean; error?: string } {
  if (!record || typeof record !== 'object') {
    return { valid: false, error: 'Record must be an object' }
  }

  if (!record.name || typeof record.name !== 'string') {
    return { valid: false, error: 'Record must have a valid name field' }
  }

  // Data type specific validations
  switch (dataType) {
    case 'pollutants':
      if (!record.category) {
        return { valid: false, error: 'Pollutant must have a category' }
      }
      if (!record.type) {
        return { valid: false, error: 'Pollutant must have a type' }
      }
      break

    case 'nutrients':
      if (!record.category) {
        return { valid: false, error: 'Nutrient must have a category' }
      }
      if (!record.unit) {
        return { valid: false, error: 'Nutrient must have a unit' }
      }
      break

    case 'ingredients':
      if (!record.category) {
        return { valid: false, error: 'Ingredient must have a category' }
      }
      break

    case 'products':
      if (!record.brand) {
        return { valid: false, error: 'Product must have a brand' }
      }
      if (!record.category) {
        return { valid: false, error: 'Product must have a category' }
      }
      break

    case 'parasites':
      if (!record.scientific_name) {
        return { valid: false, error: 'Parasite must have a scientific_name' }
      }
      if (!record.category) {
        return { valid: false, error: 'Parasite must have a category' }
      }
      break

    default:
      return { valid: false, error: `Unknown data type: ${dataType}` }
  }

  return { valid: true }
}

export default app