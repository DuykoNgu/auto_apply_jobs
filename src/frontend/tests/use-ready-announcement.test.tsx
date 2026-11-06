import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useReadyAnnouncement } from '@/features/cv/hooks/use-ready-announcement';
import type { Cv } from '@/features/cv/types';

const toast = vi.hoisted(() => vi.fn());
vi.mock('@/components/dialogs', () => ({ useDialogs: () => ({ toast }) }));

const cv = (status: Cv['status'], id = 'cv-1'): Cv => ({
  id,
  status,
  isPrimary: true,
  createdAt: '2026-11-06T08:00:00Z',
  originalFileType: 'pdf',
  facts: [],
});

describe('useReadyAnnouncement', () => {
  beforeEach(() => toast.mockClear());

  it('announces once when a pending CV finishes', () => {
    const { rerender } = renderHook(({ value }) => useReadyAnnouncement(value), {
      initialProps: { value: cv('PENDING') as Cv | undefined },
    });
    expect(toast).not.toHaveBeenCalled();
    rerender({ value: cv('NEEDS_REVIEW') });
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith('AI đã đọc xong CV. Kiểm tra các chỗ còn nghi ngờ.');
  });

  it('stays quiet when the page opens on a CV that is already finished', () => {
    renderHook(() => useReadyAnnouncement(cv('READY')));
    expect(toast).not.toHaveBeenCalled();
  });

  it('reports a failed extraction', () => {
    const { rerender } = renderHook(({ value }) => useReadyAnnouncement(value), {
      initialProps: { value: cv('PENDING') as Cv | undefined },
    });
    rerender({ value: cv('FAILED') });
    expect(toast).toHaveBeenCalledWith('AI chưa đọc được CV này.');
  });

  it('does not announce when a different CV replaces the pending one', () => {
    const { rerender } = renderHook(({ value }) => useReadyAnnouncement(value), {
      initialProps: { value: cv('PENDING', 'a') as Cv | undefined },
    });
    rerender({ value: cv('READY', 'b') });
    expect(toast).not.toHaveBeenCalled();
  });
});
