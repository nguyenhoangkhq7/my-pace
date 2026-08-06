'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { getSessionAction } from '@/features/auth/actions/auth.action';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
      queryCache: new QueryCache({
        onError: async (error: unknown, query) => {
          const err = error as { status?: number; message?: string } | null;
          if (err?.status === 401 || err?.message?.includes('status 401')) {
            try {
              const res = await getSessionAction();
              if (res.success) {
                client.refetchQueries({ queryKey: query.queryKey });
              }
            } catch {
              // ignore
            }
          }
        }
      }),
      mutationCache: new MutationCache({
        onError: async (error: unknown) => {
          const err = error as { status?: number; message?: string } | null;
          if (err?.status === 401 || err?.message?.includes('status 401')) {
            try {
              await getSessionAction();
            } catch {
              // ignore
            }
          }
        }
      }),
      defaultOptions: {
        queries: {
          staleTime: Infinity,
          retry: (failureCount, error: unknown) => {
            const err = error as { status?: number; message?: string } | null;
            if (err?.status === 401 || err?.message?.includes('status 401')) {
              // If it's a 401, only retry once because the query cache onError will trigger a refresh
              return failureCount < 1;
            }
            return failureCount < 3;
          },
        },
      },
    });
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
