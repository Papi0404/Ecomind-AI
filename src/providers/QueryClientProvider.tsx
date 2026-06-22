'use client';

import { QueryClient, QueryClientProvider as Provider } from '@tanstack/react-query';
import React, { useState } from 'react';

export default function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <Provider client={queryClient}>{children}</Provider>;
}
