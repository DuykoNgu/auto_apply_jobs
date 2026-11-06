import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, vi } from 'vitest';

vi.mock('@/components/dialogs', () => ({ useDialogs: () => ({ toast: vi.fn(), confirm: vi.fn(), edit: vi.fn() }) }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/components/workspace/shell', () => ({ SheetPane: ({ children }: { children: ReactNode }) => children }));

window.matchMedia ??= vi.fn((query: string) => ({ matches: false, media: query }) as MediaQueryList);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
