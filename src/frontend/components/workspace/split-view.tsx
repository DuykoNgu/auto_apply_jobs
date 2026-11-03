'use client';

// List + detail layout shared by /jobs and /applications: resizable list, J/K to move, Esc back on mobile.
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { buttonClass } from '@/components/ui/button';
import { useDemo } from '@/lib/demo/store';
import { cx } from '@/lib/cn';
import { isNarrow } from '@/lib/format';

type Props = { list: ReactNode; children: ReactNode; showDetail: boolean; listLabel: string; basePath: string };

export function SplitView({ list, children, showDetail, listLabel, basePath }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { s, update } = useDemo();
  const listRef = useRef<HTMLElement>(null);
  const drag = useRef<number | null>(null);
  const setW = (w: number) => update(d => { d.listW = Math.round(Math.max(280, Math.min(560, w))); });

  useEffect(() => { const p = document.getElementById('detailPane'); if (p) p.scrollTop = 0; }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (document.querySelector('dialog[open]') || t.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onRow = t.hasAttribute('data-row');
      if (e.key === 'j' || e.key === 'k' || (onRow && (e.key === 'ArrowDown' || e.key === 'ArrowUp'))) {
        e.preventDefault();
        const rows = Array.from(document.querySelectorAll<HTMLAnchorElement>('#rows [data-row]'));
        if (!rows.length) return;
        const cur = rows.findIndex(r => r.getAttribute('aria-current') === 'true');
        const dir = e.key === 'j' || e.key === 'ArrowDown' ? 1 : -1;
        const next = rows[Math.max(0, Math.min(rows.length - 1, cur < 0 ? 0 : cur + dir))];
        router.push(next.getAttribute('href')!);
        next.focus(); next.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Escape' && showDetail && isNarrow()) {
        router.push(basePath);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router, showDetail, basePath]);

  return (
    <div id="split" data-show={showDetail ? 'detail' : 'list'} style={{ '--list-w': `${s.listW}px` } as React.CSSProperties}
      className="grid min-h-0 grid-cols-[var(--list-w)_6px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] max-tab:grid-cols-[minmax(0,1fr)]">
      <section id="listPane" ref={listRef} aria-label={listLabel}
        className={cx('grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] border-r border-rule bg-pane', showDetail && 'max-tab:hidden')}>{list}</section>
      <div role="separator" aria-orientation="vertical" aria-label="Độ rộng danh sách" aria-valuemin={280} aria-valuemax={560} aria-valuenow={s.listW} tabIndex={0}
        className="relative z-[2] -mx-[3px] cursor-col-resize after:absolute after:inset-y-0 after:left-0.5 after:w-0.5 after:transition-colors after:content-[''] hover:after:bg-gold-ink focus-visible:outline-none focus-visible:after:bg-gold-ink data-drag:after:bg-gold-ink max-tab:hidden"
        onPointerDown={e => { drag.current = listRef.current!.getBoundingClientRect().left; e.currentTarget.dataset.drag = ''; e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault(); }}
        onPointerMove={e => { if (drag.current !== null) setW(e.clientX - drag.current); }}
        onPointerUp={e => { drag.current = null; delete e.currentTarget.dataset.drag; }}
        onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setW(s.listW + (e.key === 'ArrowRight' ? 16 : -16)); } }} />
      <section id="detailPane" tabIndex={-1} aria-label="Chi tiết"
        className={cx('relative min-w-0 overflow-y-auto bg-bg focus:outline-none', !showDetail && 'max-tab:hidden')}>{children}</section>
    </div>
  );
}

/** Centered column inside the detail pane. */
export function Doc({ children, animate }: { children: ReactNode; animate?: boolean }) {
  return <div className={cx('mx-auto max-w-[1200px] px-12 pt-8 pb-16 max-lap:px-6 max-lap:pt-6 max-lap:pb-12 max-phone:px-4', animate && 'animate-fade-in')}>{children}</div>;
}

/** "← back to list" link, only visible on narrow screens. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return <div className="mb-4 hidden max-tab:block"><Link className={buttonClass('quiet', 'sm')} href={href}><Icon name="left" />{children}</Link></div>;
}

/** Header block of a list pane: title + optional control, then extra rows. */
export function ListHead({ title, count, control, children }: { title: string; count: number; control?: ReactNode; children?: ReactNode }) {
  return (
    <header className="grid gap-2.5 border-b border-rule px-4 pt-3 pb-2">
      <div className="flex items-center gap-2">
        <h1 data-lp-title className="min-w-0 flex-1 text-24 font-extralight tracking-[-.02em] focus:outline-none">{title} <span className="text-15 text-ink-3 tabular-nums">{count}</span></h1>
        {control}
      </div>
      {children}
    </header>
  );
}
