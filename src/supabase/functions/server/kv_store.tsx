/**
 * Key-Value Store utility for Supabase Edge Functions
 * Provides a simple interface for storing and retrieving data using Supabase database
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Initialize Supabase client for server operations
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Store a key-value pair
 */
export async function set(key: string, value: any): Promise<void> {
  try {
    const serializedValue = JSON.stringify(value);
    
    const { error } = await supabase
      .from('kv_store_ed0fe4c2')
      .upsert({ 
        key, 
        value: serializedValue
      });
    
    if (error) {
      // Handle table access errors gracefully
      if (error.message?.includes('permission denied') || 
          error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          error.code === '42P01') { // PostgreSQL "relation does not exist" error
        console.warn(`⚠️ KV Store table issue for key ${key}: ${error.message}`);
        console.warn('💡 The kv_store_ed0fe4c2 table may not exist in your database.');
        console.warn('💡 Creating table automatically...');
        
        // Try to create the table automatically
        try {
          await createKVTable();
          console.log('✅ KV table created, retrying operation...');
          
          // Retry the original operation
          const { error: retryError } = await supabase
            .from('kv_store_ed0fe4c2')
            .upsert({ key, value: serializedValue });
            
          if (retryError) {
            throw new Error(`Retry failed: ${retryError.message}`);
          }
          
          console.log(`✅ Successfully stored key after table creation: ${key}`);
          return;
        } catch (tableCreationError) {
          console.error('❌ Failed to create KV table:', tableCreationError);
          throw new Error(`KV table creation failed: ${tableCreationError.message}`);
        }
      }
      throw new Error(`Failed to set key ${key}: ${error.message}`);
    }
    
    console.log(`✅ Successfully stored key: ${key}`);
  } catch (error) {
    console.error(`❌ Error storing key ${key}:`, error);
    
    // If it's a table access error, return silently to prevent app crash
    if (error.message?.includes('permission denied') || error.message?.includes('does not exist')) {
      console.warn(`⚠️ Silently failing to store key ${key} due to database access issues`);
      return;
    }
    
    throw error;
  }
}

/**
 * Retrieve a value by key
 */
export async function get(key: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('kv_store_ed0fe4c2')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      
      // Handle table access errors gracefully
      if (error.message?.includes('permission denied') || error.message?.includes('does not exist')) {
        console.warn(`⚠️ Cannot get key ${key}: Table kv_store_ed0fe4c2 not accessible (${error.message}). Please create the table in Supabase.`);
        return null; // Return null instead of throwing
      }
      
      throw new Error(`Failed to get key ${key}: ${error.message}`);
    }
    
    if (!data) {
      return null;
    }
    
    try {
      return JSON.parse(data.value);
    } catch (parseError) {
      console.warn(`Warning: Failed to parse JSON for key ${key}, returning raw value`);
      return data.value;
    }
  } catch (error) {
    console.error(`❌ Error retrieving key ${key}:`, error);
    
    // If it's a table access error, return null to prevent app crash
    if (error.message?.includes('permission denied') || error.message?.includes('does not exist')) {
      console.warn(`⚠️ Returning null for key ${key} due to database access issues`);
      return null;
    }
    
    throw error;
  }
}

/**
 * Delete a key-value pair
 */
export async function del(key: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('kv_store_ed0fe4c2')
      .delete()
      .eq('key', key);
    
    if (error) {
      throw new Error(`Failed to delete key ${key}: ${error.message}`);
    }
    
    console.log(`✅ Successfully deleted key: ${key}`);
  } catch (error) {
    console.error(`❌ Error deleting key ${key}:`, error);
    throw error;
  }
}

/**
 * Get multiple values by keys
 */
export async function mget(keys: string[]): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('kv_store_ed0fe4c2')
      .select('key, value')
      .in('key', keys);
    
    if (error) {
      throw new Error(`Failed to get multiple keys: ${error.message}`);
    }
    
    // Create a map for quick lookup
    const dataMap = new Map();
    data?.forEach(row => {
      try {
        dataMap.set(row.key, JSON.parse(row.value));
      } catch {
        dataMap.set(row.key, row.value);
      }
    });
    
    // Return values in the same order as requested keys
    return keys.map(key => dataMap.get(key) || null);
  } catch (error) {
    console.error(`❌ Error retrieving multiple keys:`, error);
    throw error;
  }
}

/**
 * Set multiple key-value pairs
 */
export async function mset(pairs: { key: string; value: any }[]): Promise<void> {
  try {
    const records = pairs.map(({ key, value }) => ({
      key,
      value: JSON.stringify(value)
    }));
    
    const { error } = await supabase
      .from('kv_store_ed0fe4c2')
      .upsert(records);
    
    if (error) {
      throw new Error(`Failed to set multiple keys: ${error.message}`);
    }
    
    console.log(`✅ Successfully stored ${pairs.length} key-value pairs`);
  } catch (error) {
    console.error(`❌ Error storing multiple keys:`, error);
    throw error;
  }
}

/**
 * Delete multiple keys
 */
export async function mdel(keys: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('kv_store_ed0fe4c2')
      .delete()
      .in('key', keys);
    
    if (error) {
      throw new Error(`Failed to delete multiple keys: ${error.message}`);
    }
    
    console.log(`✅ Successfully deleted ${keys.length} keys`);
  } catch (error) {
    console.error(`❌ Error deleting multiple keys:`, error);
    throw error;
  }
}

/**
 * Get all keys with a specific prefix
 */
export async function getByPrefix(prefix: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('kv_store_ed0fe4c2')
      .select('key, value')
      .like('key', `${prefix}%`)
      .order('key', { ascending: true });
    
    if (error) {
      // Handle specific table permission/existence errors
      if (error.message?.includes('permission denied') || error.message?.includes('does not exist')) {
        console.warn(`⚠️ Table kv_store_ed0fe4c2 not accessible (${error.message}). Please create the table in Supabase.`);
        return []; // Return empty array instead of throwing
      }
      throw new Error(`Failed to get keys by prefix ${prefix}: ${error.message}`);
    }
    
    return data?.map(row => {
      try {
        const parsedValue = JSON.parse(row.value);
        return {
          ...parsedValue,
          id: row.key
        };
      } catch {
        return {
          id: row.key,
          value: row.value
        };
      }
    }) || [];
  } catch (error) {
    console.error(`❌ Error getting keys by prefix ${prefix}:`, error);
    
    // If it's a table access error, return empty array to prevent app crash
    if (error.message?.includes('permission denied') || error.message?.includes('does not exist')) {
      console.warn(`⚠️ Returning empty array for prefix ${prefix} due to database access issues`);
      return [];
    }
    
    throw error;
  }
}

/**
 * Count keys with a specific prefix
 */
export async function countByPrefix(prefix: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('kv_store_ed0fe4c2')
      .select('*', { count: 'exact', head: true })
      .like('key', `${prefix}%`);
    
    if (error) {
      throw new Error(`Failed to count keys by prefix ${prefix}: ${error.message}`);
    }
    
    return count || 0;
  } catch (error) {
    console.error(`❌ Error counting keys by prefix ${prefix}:`, error);
    throw error;
  }
}

/**
 * Clear all keys with a specific prefix (use with caution)
 */
export async function clearByPrefix(prefix: string): Promise<number> {
  try {
    const { data: keysToDelete, error: selectError } = await supabase
      .from('kv_store_ed0fe4c2')
      .select('key')
      .like('key', `${prefix}%`);
    
    if (selectError) {
      throw new Error(`Failed to select keys for deletion: ${selectError.message}`);
    }
    
    if (!keysToDelete || keysToDelete.length === 0) {
      return 0;
    }
    
    const { error: deleteError } = await supabase
      .from('kv_store_ed0fe4c2')
      .delete()
      .like('key', `${prefix}%`);
    
    if (deleteError) {
      throw new Error(`Failed to delete keys by prefix: ${deleteError.message}`);
    }
    
    const deletedCount = keysToDelete.length;
    console.log(`✅ Successfully deleted ${deletedCount} keys with prefix ${prefix}`);
    return deletedCount;
  } catch (error) {
    console.error(`❌ Error clearing keys by prefix ${prefix}:`, error);
    throw error;
  }
}

/**
 * Check if a key exists
 */
export async function exists(key: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('kv_store_ed0fe4c2')
      .select('key')
      .eq('key', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return false; // No rows returned
      }
      throw new Error(`Failed to check key existence: ${error.message}`);
    }
    
    return !!data;
  } catch (error) {
    console.error(`❌ Error checking key existence ${key}:`, error);
    throw error;
  }
}

/**
 * Get all keys (use with caution for large datasets)
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('kv_store_ed0fe4c2')
      .select('key')
      .order('key');
    
    if (error) {
      throw new Error(`Failed to get all keys: ${error.message}`);
    }
    
    return data?.map(row => row.key) || [];
  } catch (error) {
    console.error(`❌ Error getting all keys:`, error);
    throw error;
  }
}

/**
 * Get total count of all records
 */
/**
 * Create the KV store table if it doesn't exist
 */
async function createKVTable(): Promise<void> {
  try {
    console.log('🔧 Creating kv_store_ed0fe4c2 table...');
    
    // Use Supabase's RPC to create table (if you have a stored procedure)
    // Or use direct SQL query
    const { error } = await supabase.rpc('create_kv_table', {
      table_name: 'kv_store_ed0fe4c2'
    });
    
    if (error && !error.message?.includes('already exists')) {
      throw error;
    }
    
    console.log('✅ KV table created or already exists');
  } catch (error) {
    // If RPC doesn't exist, we can't create the table automatically
    console.warn('⚠️ Cannot create KV table automatically:', error.message);
    throw new Error('KV table creation requires manual setup in Supabase');
  }
}

export async function getTotalCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('kv_store_ed0fe4c2')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      // Handle table not existing
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn('⚠️ KV table does not exist, returning count of 0');
        return 0;
      }
      throw new Error(`Failed to get total count: ${error.message}`);
    }
    
    return count || 0;
  } catch (error) {
    console.error(`❌ Error getting total count:`, error);
    
    // Return 0 for missing table instead of throwing
    if (error.message?.includes('does not exist') || error.message?.includes('permission denied')) {
      console.warn('⚠️ Returning count 0 due to table access issues');
      return 0;
    }
    
    throw error;
  }
}