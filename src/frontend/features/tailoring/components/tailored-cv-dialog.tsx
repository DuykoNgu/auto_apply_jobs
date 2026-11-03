'use client';

// SCR-32 as a modal over the job detail: tailored CV, evidence margin, cover letter.
import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { dialogClass } from '@/components/dialogs';

import { TailoredCv, flashJd } from './tailored-cv';
import type { Application, Job } from '@/lib/types';

/** `top`: rendered above the CV (the job detail passes its live match panel, which recomputes as sentences change). */
type Props = { job: Job; app?: Application; open: boolean; onClose: () => void; focusSid?: string | null; top?: ReactNode; badge?: ReactNode; footer?: ReactNode };

export function TailoredCvDialog({ job: j, app, open, onClose, focusSid, top, badge, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const back = useRef<Element | null>(null);

  // Keep the native <dialog> in sync with `open`; Esc / backdrop click report back through onClose.
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) {
      back.current = document.activeElement; d.showModal();
      requestAnimationFrame(() => {
        const b = focusSid && d.querySelector<HTMLElement>(`[data-sid="${focusSid}"]`);
        if (b) { b.scrollIntoView({ block: 'center' }); b.focus({ preventScroll: true }); }
      });
    }
    if (!open && d.open) d.close();
  }, [open, focusSid]);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    const onCloseEv = () => { onClose(); if (back.current instanceof HTMLElement && back.current.isConnected) back.current.focus(); };
    const onClick = (e: MouseEvent) => { if (e.target === d) d.close(); };
    d.addEventListener('close', onCloseEv); d.addEventListener('click', onClick);
    return () => { d.removeEventListener('close', onCloseEv); d.removeEventListener('click', onClick); };
  }, [onClose]);

  return (
    <dialog ref={ref} aria-labelledby="tH" className={dialogClass('h-[calc(100dvh-48px)] w-[min(1200px,calc(100vw-32px))] max-h-none max-w-none overflow-hidden')}>
      <div className="flex h-full flex-col">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-rule px-6 py-4">
          <h2 id="tH" className="min-w-0 flex-1 text-22 font-light tracking-[-.01em] focus:outline-none">CV gửi cho {j.company}</h2>
          {badge}
          <button type="button" onClick={() => ref.current?.close()} aria-label="Đóng"
            className="grid size-9 place-items-center rounded-ctl text-ink-3 [--icon:18px] hover:bg-hover hover:text-ink"><Icon name="x" /></button>
        </header>
        <div className="relative min-h-0 flex-1 overflow-y-auto bg-bg px-6 py-6">
          {top && <div className="mb-6">{top}</div>}
          {/* "Đoạn JD liên quan": the JD is on the page behind, so close first, then flash it. */}
          <TailoredCv job={j} app={app} onJd={pid => { ref.current?.close(); requestAnimationFrame(() => flashJd(pid)); }} />
        </div>
        {footer && <footer className="border-t border-rule bg-pane px-6 py-3">{footer}</footer>}
      </div>
    </dialog>
  );
}
