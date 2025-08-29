import { projectId, publicAnonKey } from './info';

// Sync parasites from memory to database
export async function syncParasitesToDatabase() {
  try {
    console.log('🦠 Starting parasite data sync to database...');
    
    // First, get the current memory data from the server
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/parasites`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch parasites: ${response.status}`);
    }

    const data = await response.json();
    const memoryParasites = data.records || [];
    
    console.log(`🔍 Found ${memoryParasites.length} parasites in memory`);

    if (memoryParasites.length === 0) {
      console.warn('⚠️ No parasites found in memory to sync');
      return { success: false, message: 'No parasites found in memory to sync' };
    }

    // Now sync each parasite to the database
    let syncedCount = 0;
    let skippedCount = 0;
    
    for (const parasite of memoryParasites) {
      try {
        // Try to create the parasite in the database
        const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/parasites`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: parasite.name,
            scientific_name: parasite.scientific_name,
            common_name: parasite.common_name,
            category: parasite.category,
            description: parasite.description,
            transmission: parasite.transmission,
            symptoms: parasite.symptoms,
            treatment: parasite.treatment,
            prevention: parasite.prevention,
            geographic_distribution: parasite.geographic_distribution,
            host_range: parasite.host_range,
            life_cycle: parasite.life_cycle,
            health_risk: parasite.health_risk,
            food_association: parasite.food_association,
            incubation_period: parasite.incubation_period,
            source: parasite.source,
            image_url: parasite.image_url
          })
        });

        if (createResponse.ok) {
          syncedCount++;
          console.log(`✅ Synced parasite: ${parasite.name}`);
        } else {
          skippedCount++;
          console.log(`⚠️ Skipped parasite: ${parasite.name} (may already exist)`);
        }
      } catch (error) {
        console.error(`❌ Error syncing parasite ${parasite.name}:`, error);
        skippedCount++;
      }
    }

    console.log(`🦠 Parasite sync completed: ${syncedCount} synced, ${skippedCount} skipped`);
    
    return {
      success: true,
      message: `Parasite sync completed: ${syncedCount} synced, ${skippedCount} skipped`,
      syncedCount,
      skippedCount,
      totalCount: memoryParasites.length
    };

  } catch (error) {
    console.error('❌ Error syncing parasites to database:', error);
    return {
      success: false,
      message: `Failed to sync parasites: ${error.message}`,
      error: error.message
    };
  }
}

// Check if parasites exist in database
export async function checkParasitesInDatabase() {
  try {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-557a7646/admin/parasites`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to check parasites: ${response.status}`);
    }

    const data = await response.json();
    const parasites = data.records || [];
    
    return {
      exists: parasites.length > 0,
      count: parasites.length,
      usingDatabase: data.databaseAvailable || false
    };
  } catch (error) {
    console.error('❌ Error checking parasites in database:', error);
    return {
      exists: false,
      count: 0,
      usingDatabase: false,
      error: error.message
    };
  }
}

// Force database mode and sync parasites
export async function forceParasiteDatabaseSync() {
  try {
    console.log('🔄 Forcing parasite database sync...');
    
    // First check current state
    const currentState = await checkParasitesInDatabase();
    console.log('📊 Current parasite state:', currentState);
    
    // If already using database and has data, return
    if (currentState.usingDatabase && currentState.count > 0) {
      return {
        success: true,
        message: `Database already has ${currentState.count} parasites`,
        alreadySynced: true
      };
    }
    
    // Otherwise, sync from memory
    const syncResult = await syncParasitesToDatabase();
    
    if (syncResult.success) {
      // Verify the sync worked
      const verifyState = await checkParasitesInDatabase();
      console.log('✅ Post-sync verification:', verifyState);
      
      return {
        success: true,
        message: `Successfully synced ${syncResult.syncedCount} parasites to database`,
        syncedCount: syncResult.syncedCount,
        finalCount: verifyState.count
      };
    } else {
      return syncResult;
    }
    
  } catch (error) {
    console.error('❌ Error in force parasite database sync:', error);
    return {
      success: false,
      message: `Force sync failed: ${error.message}`,
      error: error.message
    };
  }
}