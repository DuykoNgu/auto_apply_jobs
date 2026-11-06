import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { profile, readyCv, renderPage, respondWith } from './cv-test-utils';

const viewer = vi.hoisted(() => ({ fail: false }));
vi.mock('@/features/cv/components/original-pdf', async () => {
  const { useEffect } = await import('react');
  return {
    OriginalPdf: ({ url, onFail }: { url: string; onFail: () => void }) => {
      useEffect(() => {
        if (viewer.fail) onFail();
      }, [onFail]);
      return <div data-testid="original-pdf" data-url={url} />;
    },
  };
});

describe('CvPage original file', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:original');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    viewer.fail = false;
  });

  it('shows the original PDF in a viewer instead of a rebuilt paper', async () => {
    const cv = readyCv('pdf');
    respondWith({
      '/cvs': { body: [cv] },
      '/cvs/cv-1': { body: { ...cv, facts: [profile] } },
      '/cvs/cv-1/file': { body: '%PDF' },
    });
    const { container } = renderPage();
    await waitFor(() => expect(screen.getByTestId('original-pdf')).toHaveAttribute('data-url', 'blob:original'));
  });

  it('falls back to the rebuilt paper when the original PDF cannot be loaded', async () => {
    const cv = readyCv('pdf');
    respondWith({
      '/cvs': { body: [cv] },
      '/cvs/cv-1': { body: { ...cv, facts: [profile] } },
      '/cvs/cv-1/file': { status: 404, body: { title: 'Original file not found.' } },
    });
    const { container } = renderPage();
    expect(await screen.findByText('Backend Developer')).toBeInTheDocument();
    expect(screen.queryByTestId('original-pdf')).toBeNull();
  });

  it('falls back to the rebuilt paper when the PDF viewer cannot open the file', async () => {
    viewer.fail = true;
    const cv = readyCv('pdf');
    respondWith({
      '/cvs': { body: [cv] },
      '/cvs/cv-1': { body: { ...cv, facts: [profile] } },
      '/cvs/cv-1/file': { body: '%PDF' },
    });
    renderPage();
    expect(await screen.findByText('Backend Developer')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('original-pdf')).toBeNull());
  });
});
