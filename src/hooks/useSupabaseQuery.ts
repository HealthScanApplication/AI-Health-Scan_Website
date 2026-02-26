import { useQuery, UseQueryOptions } from '@tanstack/react-query';

const projectId = 'mofhvoudjxinvpplsytd';

interface SupabaseQueryOptions {
  select?: string;
  filter?: Record<string, any>;
  order?: string;
  limit?: number;
}

/**
 * Custom hook for querying Supabase tables with automatic caching
 * @param table - The Supabase table name
 * @param options - Query options (select, filter, order, limit)
 * @param queryOptions - React Query options (enabled, staleTime, etc.)
 */
export function useSupabaseQuery<T = any>(
  table: string,
  options?: SupabaseQueryOptions,
  queryOptions?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>
) {
  const metaEnv = (import.meta as any).env || {};
  const baseUrl = metaEnv.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;
  const anonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  const queryKey = ['supabase', table, options];

  const queryFn = async (): Promise<T[]> => {
    // Build URL with query parameters
    let url = `${baseUrl}/rest/v1/${table}`;
    const params = new URLSearchParams();

    if (options?.select) {
      params.append('select', options.select);
    }

    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        params.append(key, `eq.${value}`);
      });
    }

    if (options?.order) {
      params.append('order', options.order);
    }

    if (options?.limit) {
      params.append('limit', String(options.limit));
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase query failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  return useQuery<T[], Error>({
    queryKey,
    queryFn,
    ...queryOptions,
  });
}
