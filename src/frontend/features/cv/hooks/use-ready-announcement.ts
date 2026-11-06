import { useEffect, useRef } from 'react';
import { useDialogs } from '@/components/dialogs';
import type { Cv } from '../types';

const MESSAGE = {
  FAILED: 'AI chưa đọc được CV này.',
  NEEDS_REVIEW: 'AI đã đọc xong CV. Kiểm tra các chỗ còn nghi ngờ.',
  READY: 'AI đã đọc xong CV.',
} as const;

export function useReadyAnnouncement(cv: Cv | undefined) {
  const { toast } = useDialogs();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const previous = useRef<{ id?: string; status?: string }>({});

  useEffect(() => {
    const before = previous.current;
    previous.current = { id: cv?.id, status: cv?.status };
    if (!cv || cv.status === 'PENDING' || before.id !== cv.id || before.status !== 'PENDING') return;
    toastRef.current(MESSAGE[cv.status]);
    requestAnimationFrame(() => {
      const heading = document.getElementById('xH');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    });
  }, [cv?.id, cv?.status]);
}
