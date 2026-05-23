import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 2 * 60 * 1000,     // 2 min — data considered fresh
      gcTime: 30 * 60 * 1000,        // 30 min — keep unused in cache
    },
    mutations: {
      retry: 0,
    },
  },
});
