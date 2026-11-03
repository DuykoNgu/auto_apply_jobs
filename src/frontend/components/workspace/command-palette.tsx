'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/icon';
import { dialogClass, useModal } from '@/components/dialogs';
import { JOBS, STATUS, jobById } from '@/lib/demo/data';
import { matchFor, useDemo } from '@/lib/demo/store';
import { fold } from '@/lib/format';
import { NAV } from './shell';

type Item = { g: string; icon: IconName; label: string; hint?: string; run: () => void };

export function CommandPalette() {
  const router = useRouter();
  const { s, update } = useDemo();
  const { ref, open, closeKeepFocus } = useModal();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (ref.current?.open) return;
        setQ(''); setIdx(0); open(); requestAnimationFrame(() => inputRef.current?.focus());
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, ref]);

  const all: Item[] = [
    ...[...NAV, { href: '/account', label: 'Tài khoản', icon: 'user' as IconName }].map(n => ({ g: 'Đi tới', icon: n.icon, label: n.label, run: () => router.push(n.href) })),
    ...JOBS.map(j => ({ g: 'Việc làm', icon: 'briefcase' as const, label: `${j.title} · ${j.company}`, hint: `${matchFor(s, j).score} điểm`,
      run: () => router.push(`/jobs/${j.id}`) })),
    ...s.apps.map(a => { const j = jobById(a.jobId)!; return { g: 'Hồ sơ', icon: 'inbox' as const, label: `${j.company} · ${j.title}`, hint: STATUS[a.status], run: () => router.push(`/applications/${a.id}`) }; }),
    { g: 'Lệnh', icon: 'upload', label: 'Tải CV mới', run: () => router.push('/cv?upload=1') },
    { g: 'Lệnh', icon: 'logout', label: 'Đăng xuất', run: () => { window.location.href = '/'; } },
    ...(s.onboarded ? [{ g: 'Lệnh', icon: 'refresh' as const, label: 'Xem lại hướng dẫn thiết lập', run: () => { update(d => { d.onboarded = false; }); router.push('/cv'); } }] : []),
  ];
  const fq = fold(q.trim());
  const items = all.filter(i => !fq || fold(`${i.label} ${i.g}`).includes(fq)).slice(0, 30);
  const cur = Math.min(idx, Math.max(0, items.length - 1));
  const run = (i: number) => { const it = items[i]; if (!it) return; closeKeepFocus(); it.run(); };

  useEffect(() => { document.getElementById(`pal-${cur}`)?.scrollIntoView({ block: 'nearest' }); }, [cur]);

  return (
    <dialog className={dialogClass('mt-[12vh] w-[min(600px,calc(100vw-24px))]')} ref={ref} aria-label="Tìm hoặc ra lệnh">
      <div className="flex items-center gap-3 border-b border-rule px-4 text-ink-3 [--icon:18px]">
        <Icon name="search" />
        <input ref={inputRef} role="combobox" aria-expanded="true" aria-controls="palList" aria-autocomplete="list"
          aria-activedescendant={items.length ? `pal-${cur}` : ''} placeholder="Tìm job, hồ sơ hoặc gõ lệnh…" autoComplete="off"
          className="min-h-14 flex-1 bg-transparent text-17 text-ink outline-0"
          value={q} onChange={e => { setQ(e.target.value); setIdx(0); }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(Math.min(items.length - 1, cur + 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(Math.max(0, cur - 1)); }
            else if (e.key === 'Enter') { e.preventDefault(); run(cur); }
          }} />
        <kbd>Esc</kbd>
      </div>
      <ul className="max-h-[min(420px,60vh)] overflow-y-auto p-2" id="palList" role="listbox" aria-label="Kết quả">
        {items.length ? items.map((it, i) => (
          <PalRow key={it.label} it={it} i={i} sel={i === cur} head={i === 0 || items[i - 1].g !== it.g} onRun={run} />
        )) : <li className="px-4 py-12 text-center text-ink-2" role="presentation">Không tìm thấy “{q}”.</li>}
      </ul>
      <div className="flex flex-wrap gap-4 border-t border-rule px-4 py-2 text-12 text-ink-3">
        <span><kbd>↑</kbd> <kbd>↓</kbd> chọn</span><span><kbd>Enter</kbd> mở</span><span><kbd>J</kbd> <kbd>K</kbd> lướt danh sách</span>
      </div>
    </dialog>
  );
}

function PalRow({ it, i, sel, head, onRun }: { it: Item; i: number; sel: boolean; head: boolean; onRun: (i: number) => void }) {
  return (
    <>
      {head && <li className="px-3 pt-3 pb-1 text-13 font-medium text-ink-3" role="presentation">{it.g}</li>}
      <li role="option" id={`pal-${i}`} aria-selected={sel} onClick={() => onRun(i)}
        className="flex cursor-pointer items-center gap-3 rounded-ctl px-3 py-2.5 text-15 [--icon:17px] aria-selected:bg-sel">
        <Icon name={it.icon} className="text-ink-3" /><span className="block min-w-0 truncate">{it.label}</span>
        {it.hint && <span className="ml-auto text-13 whitespace-nowrap text-ink-3">{it.hint}</span>}
      </li>
    </>
  );
}
