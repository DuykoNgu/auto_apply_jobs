import type { Metadata } from 'next';
import { fontVars } from '@/lib/fonts';
import { Providers } from './providers';
import { Shell } from '@/components/workspace/shell';
import './workspace.css';

export const metadata: Metadata = { title: 'ACAJ — ứng dụng' };

// ponytail: no auth guard yet; add proxy.ts login redirect when (public)/login and the API exist.
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={fontVars} suppressHydrationWarning>
      <body>
        <Providers><Shell>{children}</Shell></Providers>
      </body>
    </html>
  );
}
