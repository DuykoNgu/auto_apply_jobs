'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { DialogsProvider } from '@/components/dialogs';
import { DemoStoreProvider } from '@/lib/demo/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return (
    <QueryClientProvider client={queryClient}>
      <DialogsProvider><DemoStoreProvider>{children}</DemoStoreProvider></DialogsProvider>
    </QueryClientProvider>
  );
}
