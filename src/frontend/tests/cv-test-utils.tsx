import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { CvPage } from '@/features/cv/components/cv-page';

export const summary = { id: 'cv-1', isPrimary: true, createdAt: '2026-11-06T08:00:00Z', originalFileType: 'docx' };
export const profile = {
  id: 'f1',
  position: 0,
  kind: 'PROFILE',
  title: 'An Nguyen',
  organization: null,
  body: 'Backend Developer',
  confidence: 0.95,
  needsReview: false,
};
export const experience = {
  ...profile,
  id: 'f2',
  position: 1,
  kind: 'EXPERIENCE',
  title: 'Intern - ABC',
  body: 'Intern - ABC\nBuilt APIs',
  confidence: 0.6,
  needsReview: true,
};

export const readyCv = (originalFileType: 'pdf' | 'docx') => ({ ...summary, originalFileType, status: 'READY' });

export function respondWith(routes: Record<string, { status?: number; body: unknown }>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const route = routes[new URL(url).pathname.replace('/api/v1', '')];
      if (!route) throw new Error(`unrouted ${url}`);
      return new Response(JSON.stringify(route.body), { status: route.status ?? 200 });
    }),
  );
}

export function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CvPage />
    </QueryClientProvider>,
  );
}
