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
    
    const detailedStats: any = {}
    
    // Query from new Supabase tables with correct structure
    const tableQueries = [
      { key: 'nutrients', table: 'catalog_elements', category: 'beneficial' },
      { key: 'pollutants', table: 'catalog_elements', category: 'hazardous' },
      { key: 'ingredients', table: 'catalog_ingredients', category: null },
      { key: 'products', table: 'catalog_recipes', category: null },
      { key: 'parasites', table: 'catalog_elements', category: 'hazardous' },
      { key: 'scans', table: 'scans', category: null },
      { key: 'meals', table: 'catalog_recipes', category: 'meal' }
    ]
    
    for (const query of tableQueries) {
      let records: any[] = []
      
      try {
        let queryBuilder = supabase.from(query.table).select('*')
        
        // Add category filter if needed
        if (query.category) {
          queryBuilder = queryBuilder.eq('category', query.category)
        }
        
        const { data, error } = await queryBuilder
        
        if (error) {
          console.warn(`⚠️ Error fetching ${query.key} from ${query.table}:`, error)
          records = []
        } else {
          records = data || []
        }
      } catch (err) {
        console.warn(`⚠️ Failed to query ${query.table}:`, err)
        records = []
      }
      
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
      
      const target = TARGET_COUNTS[query.key as keyof typeof TARGET_COUNTS] || 50
      const coverage = Math.min((total / target) * 100, 100)
      
      // Calculate quality score
      let qualityScore = 0
      if (total > 0) {
        const imageQuality = (withImages / total) * 30 // 30% weight
        const metadataQuality = (withMetadata / total) * 40 // 40% weight
        const sourceQuality = (fromAPI / total) * 30 // 30% weight (API data generally higher quality)
        qualityScore = Math.round(imageQuality + metadataQuality + sourceQuality + 50) // Base 50%
      }
      
      detailedStats[query.key] = {
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

// PRODUCT MANAGEMENT ENDPOINTS

// Get all products
app.get('/make-server-ed0fe4c2/admin/products', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    console.log('📋 Fetching all products from KV store...')
    
    const products = await kv.getByPrefix('product_')
    console.log(`✅ Retrieved ${products.length} products`)
    
    return c.json({
      success: true,
      records: products.map(p => p.value || p),
      serverMode: 'kv-storage',
      total: products.length
    })

  } catch (error) {
    console.error('❌ Error fetching products:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Get single product by ID
app.get('/make-server-ed0fe4c2/admin/products/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const productId = c.req.param('id')
    console.log('🔍 Fetching product:', productId)
    
    const product = await kv.get(productId)
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404)
    }
    
    return c.json({
      success: true,
      product: product
    })

  } catch (error) {
    console.error('❌ Error fetching product:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Create new product
app.post('/make-server-ed0fe4c2/admin/products', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const productData = await c.req.json()
    
    if (!productData.name) {
      return c.json({ error: 'Product name is required' }, 400)
    }

    // Generate unique ID
    const productId = `product_${Date.now()}_${Math.random().toString(36).substring(2)}`
    
    // Prepare product data with system fields
    const newProduct = {
      id: productId,
      ...productData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: productData.source || 'Manual Admin Entry',
      api_source: productData.api_source || 'Admin Panel'
    }

    console.log('💾 Creating new product:', newProduct.name)
    
    await kv.set(productId, newProduct)
    
    console.log('✅ Product created successfully:', productId)
    
    return c.json({
      success: true,
      message: 'Product created successfully',
      product: newProduct
    })

  } catch (error) {
    console.error('❌ Error creating product:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Update existing product
app.put('/make-server-ed0fe4c2/admin/products/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const productId = c.req.param('id')
    const updateData = await c.req.json()
    
    console.log('📝 Updating product:', productId)
    
    // Get existing product
    const existingProduct = await kv.get(productId)
    if (!existingProduct) {
      return c.json({ error: 'Product not found' }, 404)
    }
    
    // Merge update data with existing product
    const updatedProduct = {
      ...existingProduct,
      ...updateData,
      id: productId, // Ensure ID doesn't change
      updated_at: new Date().toISOString(),
      created_at: existingProduct.created_at // Preserve original creation date
    }
    
    await kv.set(productId, updatedProduct)
    
    console.log('✅ Product updated successfully:', productId)
    
    return c.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    })

  } catch (error) {
    console.error('❌ Error updating product:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Delete product
app.delete('/make-server-ed0fe4c2/admin/products/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const productId = c.req.param('id')
    
    console.log('🗑️ Deleting product:', productId)
    
    // Check if product exists
    const existingProduct = await kv.get(productId)
    if (!existingProduct) {
      return c.json({ error: 'Product not found' }, 404)
    }
    
    // Delete the product
    await kv.del(productId)
    
    console.log('✅ Product deleted successfully:', productId)
    
    return c.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting product:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// PARASITE MANAGEMENT ENDPOINTS

// Get all parasites
app.get('/make-server-ed0fe4c2/admin/parasites', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    console.log('🦠 Fetching all parasites from KV store...')
    
    const parasites = await kv.getByPrefix('parasite_')
    console.log(`✅ Retrieved ${parasites.length} parasites`)
    
    return c.json({
      success: true,
      records: parasites.map(p => p.value || p),
      serverMode: 'kv-storage',
      total: parasites.length
    })

  } catch (error) {
    console.error('❌ Error fetching parasites:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Get single parasite by ID
app.get('/make-server-ed0fe4c2/admin/parasites/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const parasiteId = c.req.param('id')
    console.log('🔍 Fetching parasite:', parasiteId)
    
    const parasite = await kv.get(parasiteId)
    
    if (!parasite) {
      return c.json({ error: 'Parasite not found' }, 404)
    }
    
    return c.json({
      success: true,
      parasite: parasite
    })

  } catch (error) {
    console.error('❌ Error fetching parasite:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Create new parasite
app.post('/make-server-ed0fe4c2/admin/parasites', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const parasiteData = await c.req.json()
    
    if (!parasiteData.name) {
      return c.json({ error: 'Parasite name is required' }, 400)
    }

    // Generate unique ID
    const parasiteId = `parasite_${Date.now()}_${Math.random().toString(36).substring(2)}`
    
    // Prepare parasite data with system fields
    const newParasite = {
      id: parasiteId,
      ...parasiteData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: parasiteData.source || 'Manual Admin Entry',
      api_source: parasiteData.api_source || 'Admin Panel'
    }

    console.log('💾 Creating new parasite:', newParasite.name)
    
    await kv.set(parasiteId, newParasite)
    
    console.log('✅ Parasite created successfully:', parasiteId)
    
    return c.json({
      success: true,
      message: 'Parasite created successfully',
      parasite: newParasite
    })

  } catch (error) {
    console.error('❌ Error creating parasite:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Update existing parasite
app.put('/make-server-ed0fe4c2/admin/parasites/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const parasiteId = c.req.param('id')
    const updateData = await c.req.json()
    
    console.log('📝 Updating parasite:', parasiteId)
    
    // Get existing parasite
    const existingParasite = await kv.get(parasiteId)
    if (!existingParasite) {
      return c.json({ error: 'Parasite not found' }, 404)
    }
    
    // Merge update data with existing parasite
    const updatedParasite = {
      ...existingParasite,
      ...updateData,
      id: parasiteId, // Ensure ID doesn't change
      updated_at: new Date().toISOString(),
      created_at: existingParasite.created_at // Preserve original creation date
    }
    
    await kv.set(parasiteId, updatedParasite)
    
    console.log('✅ Parasite updated successfully:', parasiteId)
    
    return c.json({
      success: true,
      message: 'Parasite updated successfully',
      parasite: updatedParasite
    })

  } catch (error) {
    console.error('❌ Error updating parasite:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Delete parasite
app.delete('/make-server-ed0fe4c2/admin/parasites/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const parasiteId = c.req.param('id')
    
    console.log('🗑️ Deleting parasite:', parasiteId)
    
    // Check if parasite exists
    const existingParasite = await kv.get(parasiteId)
    if (!existingParasite) {
      return c.json({ error: 'Parasite not found' }, 404)
    }
    
    // Delete the parasite
    await kv.del(parasiteId)
    
    console.log('✅ Parasite deleted successfully:', parasiteId)
    
    return c.json({
      success: true,
      message: 'Parasite deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting parasite:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Populate data type endpoint
app.post('/make-server-ed0fe4c2/admin/populate/:dataType', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const dataType = c.req.param('dataType')
    const body = await c.req.json()
    const { targetCount = 100, includeImages = true, includeMetadata = true, includeRegionalRDI = false } = body

    const result = await populateDataType(dataType, targetCount, includeImages, includeMetadata, includeRegionalRDI)
    return c.json(result)

  } catch (error) {
    console.error('❌ Error in populate endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Export data type endpoint
app.get('/make-server-ed0fe4c2/admin/export/:dataType', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const validation = await validateAdminAccess(accessToken)
    if (validation.error) {
      return c.json({ error: validation.error }, validation.status)
    }

    const dataType = c.req.param('dataType')
    const result = await exportDataType(dataType)
    return c.json(result)

  } catch (error) {
    console.error('❌ Error in export endpoint:', error)
    return c.json({ error: 'Internal server error', details: error.message }, 500)
  }
})

// Populate data type with comprehensive records
async function populateDataType(dataType: string, targetCount: number = 100, includeImages: boolean = true, includeMetadata: boolean = true, includeRegionalRDI: boolean = false): Promise<any> {
  console.log(`🚀 Populating ${dataType} with ${targetCount} records...`)
  
  try {
    const existingRecords = await kv.getByPrefix(`${dataType.slice(0, -1)}_`)
    const currentCount = existingRecords.length
    
    if (currentCount >= targetCount) {
      return {
        success: true,
        message: `${dataType} already has ${currentCount} records (target: ${targetCount})`,
        imported: 0,
        total: currentCount
      }
    }
    
    const needed = targetCount - currentCount
    let imported = 0
    
    // Populate based on data type using local functions
    switch (dataType) {
      case 'nutrients':
        imported = await populateNutrients(needed, includeImages, includeMetadata, includeRegionalRDI)
        break
      case 'pollutants':
        imported = await populatePollutants(needed, includeImages, includeMetadata)
        break
      case 'ingredients':
        imported = await populateIngredients(needed, includeImages, includeMetadata)
        break
      case 'products':
        imported = await populateProducts(needed, includeImages, includeMetadata)
        break
      case 'parasites':
        imported = await populateParasites(needed, includeImages, includeMetadata)
        break
      case 'scans':
        imported = await populateScans(needed, includeImages, includeMetadata)
        break
      case 'meals':
        imported = await populateMeals(needed, includeImages, includeMetadata)
        break
      default:
        throw new Error(`Unknown data type: ${dataType}`)
    }
    
    return {
      success: true,
      message: `Successfully populated ${imported} ${dataType} records`,
      imported,
      total: currentCount + imported
    }
    
  } catch (error) {
    console.error(`❌ Failed to populate ${dataType}:`, error)
    return { success: false, error: error.message, imported: 0 }
  }
}

// Export data type to CSV
async function exportDataType(dataType: string): Promise<any> {
  console.log(`📥 Exporting ${dataType} data to CSV...`)
  
  try {
    const records = await kv.getByPrefix(`${dataType.slice(0, -1)}_`)
    
    if (records.length === 0) {
      throw new Error(`No ${dataType} records found to export`)
    }
    
    // Generate CSV content
    const headers = getCSVHeaders(dataType)
    const csvRows = [headers.join(',')]
    
    records.forEach((record: any) => {
      const row = headers.map(header => {
        const value = record[header.toLowerCase().replace(/\s+/g, '_')] || ''
        // Escape commas and quotes in CSV
        const escaped = String(value).replace(/"/g, '""')
        return `"${escaped}"`
      })
      csvRows.push(row.join(','))
    })
    
    const csvContent = csvRows.join('\n')
    
    return {
      success: true,
      filename: `healthscan_${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`,
      content: csvContent,
      recordCount: records.length
    }
    
  } catch (error) {
    console.error(`❌ Failed to export ${dataType}:`, error)
    return { success: false, error: error.message }
  }
}

// Local population functions that work within the edge function environment

async function populateNutrients(count: number, includeImages: boolean, includeMetadata: boolean, includeRegionalRDI: boolean): Promise<number> {
  const nutrients = [...NUTRIENTS_DATA]
  
  // Add more nutrients to reach target count if needed
  while (nutrients.length < count) {
    const baseNutrients = nutrients.slice(0, 15) // Use more base nutrients
    const index = (nutrients.length - nutrients.length) % baseNutrients.length
    const extraNutrient = baseNutrients[index]
    nutrients.push({
      ...extraNutrient,
      name: `${extraNutrient.name} (Extended ${nutrients.length - NUTRIENTS_DATA.length + 1})`,
      vitamin_name: `${extraNutrient.vitamin_name} (Extended ${nutrients.length - NUTRIENTS_DATA.length + 1})`
    })
  }
  
  let imported = 0
  for (let i = 0; i < Math.min(count, nutrients.length); i++) {
    const nutrient = nutrients[i]
    const nutrientId = `nutrient_${Date.now()}_${imported}`
    
    // Create comprehensive nutrient data matching mobile app requirements
    const nutrientData = {
      id: nutrientId,
      name: nutrient.name,
      vitamin_name: nutrient.vitamin_name || nutrient.name,
      category: nutrient.category,
      unit: nutrient.unit,
      rdi: nutrient.rdi,
      type: nutrient.type,
      
      // Regional and age-based RDI data
      regional_rdi: includeRegionalRDI ? (nutrient.regional_rdi || {}) : {},
      
      // Mobile app required fields
      description_text_simple: nutrient.description_text_simple || `${nutrient.name} is a ${nutrient.type.toLowerCase()} essential for human health and optimal body function.`,
      description_text_technical: nutrient.description_text_technical || `${nutrient.name} functions as a cofactor in various enzymatic reactions and metabolic pathways essential for cellular function.`,
      
      // Daily intake ranges for mobile app (default adult values)
      deficient_range: nutrient.deficient_range || { min: 0, max: nutrient.rdi * 0.5, unit: nutrient.unit },
      optimal_range: nutrient.optimal_range || { min: nutrient.rdi, max: nutrient.rdi * 2, unit: nutrient.unit },
      excess_range: nutrient.excess_range || { min: nutrient.rdi * 10, max: null, unit: nutrient.unit },
      
      // Health benefits as array for mobile app
      health_benefits: nutrient.health_benefits || [
        'Supports immune function',
        'Promotes energy metabolism',
        'Maintains cellular health',
        'Supports growth and development',
        'Antioxidant properties'
      ],
      
      // Food strategy for mobile app
      food_strategy_animal: nutrient.food_strategy_animal || `Animal sources of ${nutrient.name} include meat, fish, poultry, dairy products, and eggs, which generally provide highly bioavailable forms.`,
      food_strategy_plant: nutrient.food_strategy_plant || `Plant sources include fruits, vegetables, whole grains, legumes, nuts, and seeds. May require larger quantities to meet daily needs.`,
      
      // Pregnancy considerations for mobile app
      pregnancy_considerations: nutrient.pregnancy_considerations || `${nutrient.name} needs may be increased during pregnancy. Consult healthcare provider for appropriate dosing during pregnancy and lactation.`,
      
      // Where to get supplements for mobile app
      where_to_get_supplements: nutrient.where_to_get_supplements || [
        {
          name: `High-Quality ${nutrient.name} Supplement`,
          description: `Premium ${nutrient.name} supplement from trusted manufacturers`,
          image_url: includeImages ? generateReliableImageUrl('supplement', nutrient.name) : null
        }
      ],
      
      // Legacy fields for compatibility
      description: nutrient.description_text_simple || `${nutrient.name} is a ${nutrient.type.toLowerCase()} essential for human health.`,
      health_benefits_text: Array.isArray(nutrient.health_benefits) ? nutrient.health_benefits.join(', ') : 'Supports various aspects of health and wellness',
      deficiency_symptoms: `Deficiency in ${nutrient.name} may lead to various health issues. Consult healthcare provider for specific information.`,
      food_sources: JSON.stringify(['Variety of whole foods', 'Fortified foods', 'Supplements when needed']),
      
      // System fields
      source: 'HealthScan Comprehensive Nutrient Database',
      api_source: 'Internal Mobile App Database',
      imported_at: new Date().toISOString(),
      external_id: `hs_nutrient_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('nutrient', nutrient.name) : null
    }
    
    await kv.set(nutrientId, nutrientData)
    imported++
    
    if (imported % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return imported
}

async function populatePollutants(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  const pollutants = [...POLLUTANTS_DATA]
  
  // Extend list if needed
  while (pollutants.length < count) {
    const basePollutants = pollutants.slice(0, 10)
    const index = (pollutants.length - 20) % basePollutants.length
    const extraPollutant = basePollutants[index]
    pollutants.push({
      ...extraPollutant,
      name: `${extraPollutant.name} (Extended ${pollutants.length - 20 + 1})`
    })
  }
  
  let imported = 0
  for (let i = 0; i < Math.min(count, pollutants.length); i++) {
    const pollutant = pollutants[i]
    const pollutantId = `pollutant_${Date.now()}_${imported}`
    
    const pollutantData = {
      id: pollutantId,
      name: pollutant.name,
      category: pollutant.category,
      type: pollutant.type,
      toxicity_level: pollutant.toxicity_level,
      regulatory_limit: pollutant.regulatory_limit,
      unit: pollutant.unit,
      description: includeMetadata ? (pollutant.description || `${pollutant.name} is a ${pollutant.type.toLowerCase()} pollutant that may affect human health.`) : `${pollutant.name} environmental contaminant`,
      health_effects: pollutant.health_effects || ['May cause health concerns with exposure'],
      sources: pollutant.sources || ['Various environmental sources'],
      detection_methods: pollutant.detection_methods || ['Laboratory analysis'],
      mitigation: pollutant.mitigation || ['Limit exposure when possible'],
      source: 'HealthScan Pollutant Database',
      api_source: 'EPA/Environmental Database',
      imported_at: new Date().toISOString(),
      external_id: `hs_pollutant_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('pollutant', pollutant.name) : null
    }
    
    await kv.set(pollutantId, pollutantData)
    imported++
    
    if (imported % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return imported
}

async function populateIngredients(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  const ingredients = [...INGREDIENTS_DATA]
  
  // Extend list if needed
  while (ingredients.length < count) {
    const baseIngredients = ingredients.slice(0, 15)
    const index = (ingredients.length - 25) % baseIngredients.length
    const extraIngredient = baseIngredients[index]
    ingredients.push({
      ...extraIngredient,
      name: `${extraIngredient.name} (Extended ${ingredients.length - 25 + 1})`
    })
  }
  
  let imported = 0
  for (let i = 0; i < Math.min(count, ingredients.length); i++) {
    const ingredient = ingredients[i]
    const ingredientId = `ingredient_${Date.now()}_${imported}`
    
    const ingredientData = {
      id: ingredientId,
      name: ingredient.name,
      category: ingredient.category,
      type: ingredient.type,
      nutritional_value: ingredient.nutritional_value || {},
      allergens: ingredient.allergens || [],
      description: includeMetadata ? (ingredient.description || `${ingredient.name} is a ${ingredient.type.toLowerCase()} ingredient commonly used in food products.`) : `${ingredient.name} food ingredient`,
      uses: ingredient.uses || ['Food production', 'Culinary applications'],
      benefits: ingredient.benefits || ['Nutritional value', 'Flavor enhancement'],
      concerns: ingredient.concerns || [],
      source: 'HealthScan Ingredient Database',
      api_source: 'USDA/Food Database',
      imported_at: new Date().toISOString(),
      external_id: `hs_ingredient_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('ingredient', ingredient.name) : null
    }
    
    await kv.set(ingredientId, ingredientData)
    imported++
    
    if (imported % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return imported
}

async function populateProducts(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  const products = [...PRODUCTS_DATA]
  
  // Extend list if needed
  while (products.length < count) {
    const baseProducts = products.slice(0, 12)
    const index = (products.length - 20) % baseProducts.length
    const extraProduct = baseProducts[index]
    products.push({
      ...extraProduct,
      name: `${extraProduct.name} (Extended ${products.length - 20 + 1})`
    })
  }
  
  let imported = 0
  for (let i = 0; i < Math.min(count, products.length); i++) {
    const product = products[i]
    const productId = `product_${Date.now()}_${imported}`
    
    const productData = {
      id: productId,
      name: product.name,
      brand: product.brand,
      category: product.category,
      type: product.type,
      barcode: product.barcode || null,
      ingredients: product.ingredients || [],
      nutrition_facts: product.nutrition_facts || {},
      allergens: product.allergens || [],
      description: includeMetadata ? (product.description || `${product.name} is a ${product.type.toLowerCase()} product from ${product.brand}.`) : `${product.name} by ${product.brand}`,
      serving_size: product.serving_size || '1 serving',
      warnings: product.warnings || [],
      certifications: product.certifications || [],
      source: 'HealthScan Product Database',
      api_source: 'OpenFood Facts/Product Database',
      imported_at: new Date().toISOString(),
      external_id: `hs_product_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('product', product.name) : null
    }
    
    await kv.set(productId, productData)
    imported++
    
    if (imported % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return imported
}

// Single populateParasites function - remove any duplicate
async function populateParasites(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  const parasites = [...PARASITES_DATA]
  
  // Extend list if needed
  while (parasites.length < count) {
    const baseParasites = parasites.slice(0, 10)
    const index = (parasites.length - 15) % baseParasites.length
    const extraParasite = baseParasites[index]
    parasites.push({
      ...extraParasite,
      name: `${extraParasite.name} (Extended ${parasites.length - 15 + 1})`
    })
  }
  
  let imported = 0
  for (let i = 0; i < Math.min(count, parasites.length); i++) {
    const parasite = parasites[i]
    const parasiteId = `parasite_${Date.now()}_${imported}`
    
    const parasiteData = {
      id: parasiteId,
      name: parasite.name,
      scientific_name: parasite.scientific_name,
      category: parasite.category,
      type: parasite.type,
      host: parasite.host || 'Humans',
      transmission: parasite.transmission || [],
      symptoms: parasite.symptoms || [],
      description: includeMetadata ? (parasite.description || `${parasite.name} (${parasite.scientific_name}) is a ${parasite.type.toLowerCase()} parasite that may affect human health.`) : `${parasite.name} parasite`,
      prevention: parasite.prevention || ['Good hygiene', 'Food safety'],
      treatment: parasite.treatment || ['Consult healthcare provider'],
      geographic_distribution: parasite.geographic_distribution || ['Worldwide'],
      lifecycle: parasite.lifecycle || [],
      source: 'HealthScan Parasite Database',
      api_source: 'CDC/Medical Database',
      imported_at: new Date().toISOString(),
      external_id: `hs_parasite_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('parasite', parasite.name) : null
    }
    
    await kv.set(parasiteId, parasiteData)
    imported++
    
    if (imported % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return imported
}

async function populateScans(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  let imported = 0
  
  for (let i = 0; i < count; i++) {
    const scanId = `scan_${Date.now()}_${imported}`
    
    const scanData = {
      id: scanId,
      name: `Sample Scan ${imported + 1}`,
      type: 'health_scan',
      status: 'completed',
      results: {
        overall_score: Math.floor(Math.random() * 100) + 1,
        nutrients_detected: Math.floor(Math.random() * 25) + 1,
        pollutants_detected: Math.floor(Math.random() * 5),
        recommendations: ['Maintain healthy diet', 'Regular exercise', 'Stay hydrated']
      },
      user_id: `user_${Math.floor(Math.random() * 1000)}`,
      scanned_at: new Date().toISOString(),
      description: includeMetadata ? `Comprehensive health scan analysis including nutrient and pollutant detection` : `Health scan ${imported + 1}`,
      source: 'HealthScan Mobile App',
      api_source: 'Internal Scan Engine',
      imported_at: new Date().toISOString(),
      external_id: `hs_scan_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('scan', `scan-${imported + 1}`) : null
    }
    
    await kv.set(scanId, scanData)
    imported++
    
    if (imported % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return imported
}

async function populateMeals(count: number, includeImages: boolean, includeMetadata: boolean): Promise<number> {
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
  const cuisines = ['Italian', 'Asian', 'Mediterranean', 'American', 'Mexican', 'Indian']
  
  let imported = 0
  
  for (let i = 0; i < count; i++) {
    const mealId = `meal_${Date.now()}_${imported}`
    const mealType = mealTypes[i % mealTypes.length]
    const cuisine = cuisines[i % cuisines.length]
    
    const mealData = {
      id: mealId,
      name: `${cuisine} ${mealType} ${imported + 1}`,
      meal_type: mealType.toLowerCase(),
      cuisine: cuisine,
      ingredients: [
        'Fresh vegetables',
        'Lean protein',
        'Whole grains',
        'Healthy fats'
      ],
      nutrition_facts: {
        calories: Math.floor(Math.random() * 600) + 200,
        protein: Math.floor(Math.random() * 30) + 10,
        carbs: Math.floor(Math.random() * 50) + 20,
        fat: Math.floor(Math.random() * 25) + 5
      },
      allergens: [],
      description: includeMetadata ? `Nutritious ${cuisine.toLowerCase()} ${mealType.toLowerCase()} with balanced macronutrients` : `${cuisine} ${mealType}`,
      preparation_time: Math.floor(Math.random() * 45) + 15,
      difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
      health_score: Math.floor(Math.random() * 100) + 1,
      source: 'HealthScan Meal Database',
      api_source: 'Nutrition Analysis API',
      imported_at: new Date().toISOString(),
      external_id: `hs_meal_${i + 1}`,
      image_url: includeImages ? generateReliableImageUrl('meal', `${cuisine.toLowerCase()}-${mealType.toLowerCase()}`) : null
    }
    
    await kv.set(mealId, mealData)
    imported++
    
    if (imported % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return imported
}

export { app as adminApp }