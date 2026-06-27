import { useQuery } from '@tanstack/react-query';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface AdminRecord {
  id: string;
  name?: string;
  name_common?: string;
  email?: string;
  title?: string;
  category?: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface UseAdminRecordsOptions {
  activeTab: string;
  table: string;
  accessToken?: string;
  enabled?: boolean;
}

/**
 * Custom hook to fetch admin records with React Query caching
 * Eliminates duplicate network requests and provides automatic refetching
 */
export function useAdminRecords({ activeTab, table, accessToken, enabled = true }: UseAdminRecordsOptions) {
  return useQuery<AdminRecord[], Error>({
    queryKey: ['admin-records', activeTab, table],
    queryFn: async ({ signal }) => {
      console.log(`[Admin] Fetching ${activeTab} from ${table}...`);

      let url: string;

      // Use custom KV-store endpoint for waitlist only. NOTE: products used to be
      // KV-backed too, but they now live in the `catalog_products` table — routing
      // 'products' here returned the (empty) legacy KV store, so the Products tab
      // showed "No records found" despite 1.7k+ rows. Products now fall through to
      // the REST path below like every other catalog table.
      if (activeTab === 'waitlist') {
        url = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/admin/waitlist`;
        console.log(`[Admin] Fetching ${activeTab} from KV store: ${url}`);

        const response = await fetch(url, {
          signal,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[Admin] Failed to fetch ${activeTab}:`, response.status, response.statusText);
          console.warn(`[Admin] Error response:`, errorText);
          throw new Error(`Failed to fetch ${activeTab}: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[Admin] Loaded ${data?.length || 0} ${activeTab} from KV store`);
        return Array.isArray(data) ? data : [];
      }

      // REST API for regular tables
      url = `https://${projectId}.supabase.co/rest/v1/${table}?limit=1000`;

      // Add ordering
      if (activeTab === 'elements') {
        url += '&order=category.asc,name_common.asc';
      } else {
        url += '&order=created_at.desc';
      }

      console.log(`[Admin] Fetching URL: ${url}`);

      const response = await fetch(url, {
        signal,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': publicAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      console.log(`[Admin] Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Admin] ❌ Failed to fetch ${activeTab} from ${table}:`, response.status, response.statusText);
        console.error(`[Admin] Error response:`, errorText);
        
        // Provide helpful error messages
        if (response.status === 404) {
          console.error(`[Admin] ⚠️ Table "${table}" not found. Did you apply the migration? Run: supabase db push`);
        } else if (response.status === 401 || response.status === 403) {
          console.error(`[Admin] ⚠️ Authentication failed. Check your access token and RLS policies.`);
        }
        
        throw new Error(`Failed to fetch ${activeTab}: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Admin] ✅ Loaded ${data?.length || 0} ${activeTab} from ${table}`);
      
      if (!Array.isArray(data)) {
        console.warn(`[Admin] ⚠️ Expected array but got:`, typeof data, data);
        return [];
      }
      
      return data;
    },
    enabled: enabled && !!accessToken && !!table,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
