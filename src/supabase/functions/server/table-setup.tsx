/**
 * Table setup and initialization for HealthScan KV store
 * Automatically creates the required table if it doesn't exist
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Check if the KV store table exists
 */
export async function checkTableExists(): Promise<boolean> {
  try {
    console.log('Checking if table kv_store_ed0fe4c2 exists...');
    
    // Try to query the table directly to see if it exists
    const { error: queryError } = await supabase
      .from('kv_store_ed0fe4c2')
      .select('key')
      .limit(1);
    
    if (!queryError) {
      console.log('✅ Table kv_store_ed0fe4c2 exists and is accessible');
      return true;
    }
    
    // Check if it's a "does not exist" error vs permission error
    if (queryError.message?.includes('does not exist') || 
        queryError.message?.includes('relation') && queryError.message?.includes('does not exist')) {
      console.log('❌ Table kv_store_ed0fe4c2 does not exist');
      return false;
    }
    
    if (queryError.message?.includes('permission denied')) {
      console.log('⚠️ Table kv_store_ed0fe4c2 exists but permission denied');
      return true; // Table exists but we don't have permission
    }
    
    console.warn('⚠️ Unexpected error checking table:', queryError.message);
    return false;
    
  } catch (error) {
    console.error('Error checking table existence:', error);
    return false;
  }
}

/**
 * Create the KV store table with proper permissions
 */
export async function createKVTable(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔧 Attempting to create KV store table...');
    
    // Since we can't execute arbitrary SQL from Edge Functions, 
    // we'll return instructions for manual setup
    const error = 'Automatic table creation requires manual SQL execution in Supabase Dashboard';
    
    console.log('❌ Cannot create table automatically from Edge Function');
    console.log('📋 User must run SQL manually in Supabase Dashboard');
    
    return { 
      success: false, 
      error: error
    };

  } catch (error: any) {
    console.error('❌ Failed to create KV store table:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error creating table'
    };
  }
}

/**
 * Initialize the KV store - check if table exists and create if needed
 */
export async function initializeKVStore(): Promise<{ 
  success: boolean; 
  tableExists: boolean; 
  created?: boolean; 
  error?: string;
}> {
  try {
    console.log('🔍 Checking KV store table status...');
    
    const tableExists = await checkTableExists();
    
    if (tableExists) {
      console.log('✅ KV store table already exists');
      return { success: true, tableExists: true };
    }

    console.log('⚠️ KV store table does not exist, attempting to create...');
    
    const createResult = await createKVTable();
    
    if (createResult.success) {
      console.log('✅ KV store table created successfully');
      return { 
        success: true, 
        tableExists: false, 
        created: true 
      };
    } else {
      console.error('❌ Failed to create KV store table');
      return { 
        success: false, 
        tableExists: false, 
        error: createResult.error 
      };
    }

  } catch (error: any) {
    console.error('❌ Error initializing KV store:', error);
    return { 
      success: false, 
      tableExists: false, 
      error: error.message 
    };
  }
}

/**
 * Get comprehensive database status
 */
export async function getDatabaseStatus(): Promise<any> {
  const status = {
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: !!supabaseUrl,
      serviceKey: !!supabaseServiceKey,
      hasCredentials: !!supabaseUrl && !!supabaseServiceKey
    },
    table: {
      exists: false,
      accessible: false,
      error: null as string | null
    },
    permissions: {
      canRead: false,
      canWrite: false
    }
  };

  try {
    console.log('🔍 Checking database status...');
    
    // Check table existence and accessibility
    const { error: queryError } = await supabase
      .from('kv_store_ed0fe4c2')
      .select('key')
      .limit(1);

    if (!queryError) {
      // Table exists and is accessible
      status.table.exists = true;
      status.table.accessible = true;
      status.permissions.canRead = true;
      
      // Test write access
      try {
        const testKey = `test_${Date.now()}`;
        const { error: writeError } = await supabase
          .from('kv_store_ed0fe4c2')
          .upsert({ key: testKey, value: 'test' });
        
        if (!writeError) {
          status.permissions.canWrite = true;
          
          // Clean up test record
          await supabase
            .from('kv_store_ed0fe4c2')
            .delete()
            .eq('key', testKey);
        } else {
          status.table.error = `Write access failed: ${writeError.message}`;
        }
      } catch (writeError: any) {
        status.table.error = `Write test failed: ${writeError.message}`;
      }
      
    } else {
      // Handle different types of errors
      if (queryError.message?.includes('does not exist') || 
          (queryError.message?.includes('relation') && queryError.message?.includes('does not exist'))) {
        status.table.exists = false;
        status.table.error = 'Table kv_store_ed0fe4c2 does not exist';
      } else if (queryError.message?.includes('permission denied')) {
        status.table.exists = true;
        status.table.accessible = false;
        status.table.error = `Permission denied: ${queryError.message}`;
      } else {
        status.table.error = `Database error: ${queryError.message}`;
      }
    }

  } catch (error: any) {
    status.table.error = `Database check failed: ${error.message}`;
  }

  console.log('📊 Database status:', status);
  return status;
}