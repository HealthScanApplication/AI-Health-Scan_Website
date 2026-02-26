import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration
 * Provides caching, deduplication, and automatic refetching for all data queries
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache is kept for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't refetch on window focus (admin panel doesn't need this)
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});
