import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - data considered fresh
      gcTime: 2 * 60 * 1000, // 2 minutes - cache garbage collection
      retry: 2,
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch on network reconnect
      refetchOnMount: true, // Always check for fresh data on mount
    },
    mutations: {
      retry: 1,
    },
  },
});

// Helper to invalidate all queries (useful for forcing fresh data)
export const invalidateAllQueries = () => {
  queryClient.invalidateQueries();
};

// Helper to clear all cache
export const clearQueryCache = () => {
  queryClient.clear();
};
