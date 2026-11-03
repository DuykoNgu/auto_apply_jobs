'use client';

import { DialogsProvider } from '@/components/dialogs';
import { DemoStoreProvider } from '@/lib/demo/store';

export function Providers({ children }: { children: React.ReactNode }) {
  return <DialogsProvider><DemoStoreProvider>{children}</DemoStoreProvider></DialogsProvider>;
}
