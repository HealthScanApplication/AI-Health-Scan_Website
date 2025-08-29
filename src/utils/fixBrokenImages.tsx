import { projectId, publicAnonKey } from './supabase/info';

// Function to fix all broken placeholder.com image URLs in the database
export async function fixBrokenImageUrls(): Promise<{ success: boolean; fixed: number; error?: string }> {
  try {
    console.log('🔧 Starting image URL cleanup process...');
    
    const dataTypes = ['pollutants', 'nutrients', 'ingredients', 'products', 'parasites', 'scans', 'meals'];
    let totalFixed = 0;

    for (const dataType of dataTypes) {
      try {
        console.log(`🔍 Fixing broken images for ${dataType}...`);
        
        // Get all records for this data type
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/get-records`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            dataType: dataType.slice(0, -1), // Remove 's' from plural
            limit: 200,
            includeImages: true 
          })
        });

        if (!response.ok) {
          console.warn(`⚠️ Failed to fetch ${dataType}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        if (!data.success || !data.records) {
          console.warn(`⚠️ No records found for ${dataType}`);
          continue;
        }

        // Filter records with broken image URLs
        const brokenRecords = data.records.filter((record: any) => 
          record.image_url && record.image_url.includes('api.placeholder.com')
        );

        console.log(`📊 Found ${brokenRecords.length} records with broken images in ${dataType}`);

        // Fix each broken record
        for (const record of brokenRecords) {
          try {
            const fixedImageUrl = getReliableImageUrl(dataType.slice(0, -1), record.name);
            
            // Update the record with the fixed image URL
            const updateResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/kv-save`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                key: record.id,
                value: {
                  ...record,
                  image_url: fixedImageUrl,
                  image_fixed_at: new Date().toISOString()
                }
              })
            });

            if (updateResponse.ok) {
              totalFixed++;
              console.log(`✅ Fixed image for ${record.name}: ${record.image_url} → ${fixedImageUrl}`);
            } else {
              console.warn(`⚠️ Failed to update ${record.name}`);
            }
          } catch (updateError) {
            console.warn(`⚠️ Error updating ${record.name}:`, updateError);
          }
        }

        // Add delay between data types to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (dataTypeError) {
        console.error(`❌ Error processing ${dataType}:`, dataTypeError);
      }
    }

    console.log(`✅ Image cleanup completed! Fixed ${totalFixed} broken image URLs`);
    return { success: true, fixed: totalFixed };

  } catch (error: any) {
    console.error('❌ Image cleanup failed:', error);
    return { success: false, fixed: 0, error: error.message };
  }
}

// Get reliable image URL based on record type
function getReliableImageUrl(recordType: string, itemName?: string): string {
  const reliableImageUrls: Record<string, string> = {
    'nutrient': 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'pollutant': 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'ingredient': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'product': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'parasite': 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'scan': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&crop=center&auto=format&q=80',
    'meal': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&crop=center&auto=format&q=80'
  };
  
  return reliableImageUrls[recordType] || reliableImageUrls['product'];
}

// Function to check and report broken image statistics
export async function checkBrokenImageStats(): Promise<{ success: boolean; stats: any; error?: string }> {
  try {
    console.log('📊 Checking broken image statistics...');
    
    const dataTypes = ['pollutants', 'nutrients', 'ingredients', 'products', 'parasites', 'scans', 'meals'];
    const stats: any = {};

    for (const dataType of dataTypes) {
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/get-records`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            dataType: dataType.slice(0, -1),
            limit: 200,
            includeImages: true 
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.records) {
            const total = data.records.length;
            const withImages = data.records.filter((r: any) => r.image_url && r.image_url.trim()).length;
            const brokenImages = data.records.filter((r: any) => 
              r.image_url && r.image_url.includes('api.placeholder.com')
            ).length;
            const reliableImages = withImages - brokenImages;

            stats[dataType] = {
              total,
              withImages,
              brokenImages,
              reliableImages,
              percentReliable: withImages > 0 ? Math.round((reliableImages / withImages) * 100) : 0
            };
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error checking ${dataType}:`, error);
        stats[dataType] = { error: 'Failed to check' };
      }
    }

    return { success: true, stats };
  } catch (error: any) {
    return { success: false, stats: {}, error: error.message };
  }
}

// Auto-fix function that can be called from admin dashboard
export async function autoFixBrokenImages(): Promise<void> {
  try {
    console.log('🚀 Starting automatic image fix process...');
    
    const stats = await checkBrokenImageStats();
    if (stats.success) {
      const totalBroken = Object.values(stats.stats).reduce((total: number, dataTypeStats: any) => 
        total + (dataTypeStats.brokenImages || 0), 0
      );
      
      if (totalBroken > 0) {
        console.log(`🔧 Found ${totalBroken} broken images, fixing...`);
        const result = await fixBrokenImageUrls();
        
        if (result.success) {
          console.log(`✅ Successfully fixed ${result.fixed} broken image URLs`);
        } else {
          console.error('❌ Failed to fix broken images:', result.error);
        }
      } else {
        console.log('✅ No broken images found');
      }
    }
  } catch (error) {
    console.error('❌ Auto-fix process failed:', error);
  }
}