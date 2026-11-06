import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderPage, respondWith, summary } from './cv-test-utils';

describe('CvPage states', () => {
  it('shows the upload empty state when the user has no CV', async () => {
    respondWith({ '/cvs': { body: [] } });
    renderPage();
    expect(await screen.findByText('Chưa có CV nào')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chọn file CV/ })).toBeEnabled();
  });

  it('shows a recovery action when extraction failed', async () => {
    respondWith({
      '/cvs': { body: [{ ...summary, status: 'FAILED' }] },
      '/cvs/cv-1': { body: { ...summary, status: 'FAILED', facts: [] } },
    });
    renderPage();
    expect(await screen.findByText(/AI chưa đọc được CV này\. File/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tải file khác/ })).toBeInTheDocument();
  });

  it('shows a retry when the list cannot be loaded', async () => {
    respondWith({ '/cvs': { status: 500, body: { title: 'Internal server error' } } });
    renderPage();
    expect(await screen.findByText(/Không tải được CV/)).toBeInTheDocument();
    const retry = await screen.findByRole('button', { name: 'Thử lại' });
    fireEvent.click(retry);
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(1));
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => url.includes('undefined'))).toBe(false);
  });

  it('stops waiting and offers a manual check when a CV is stuck pending', async () => {
    const stuck = {
      ...summary,
      status: 'PENDING',
      originalFileType: 'docx',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };
    respondWith({ '/cvs': { body: [stuck] }, '/cvs/cv-1': { body: { ...stuck, facts: [] } } });
    renderPage();
    expect(await screen.findByText(/lâu hơn bình thường/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kiểm tra lại' })).toBeInTheDocument();
    const detailCalls = vi.mocked(fetch).mock.calls.filter(([url]) => String(url).endsWith('/cvs/cv-1'));
    expect(detailCalls).toHaveLength(1);
  });
});
