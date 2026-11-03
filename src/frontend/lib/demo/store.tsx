'use client';

// Client-side demo state shared by every workspace screen (the prototype's global `S`).
// ponytail: in-memory only, resets on reload. Swap each feature hook to TanStack Query + api.ts when the API exists.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useDialogs } from '@/components/dialogs';
import { now } from '@/lib/format';
import { BASE_SENTENCES, INITIAL_APPS, INITIAL_CV_FIELDS, INITIAL_TODAY, INITIAL_USER, JOBS, clone, noReview } from './data';
import { matchOf } from './match';
import type { Job, Sentence } from '@/lib/types';

const initialState = () => ({
  user: { ...INITIAL_USER },
  tailored: { j1: clone(BASE_SENTENCES), j2: noReview(), j4: noReview(), j5: noReview(), j10: noReview() } as Record<string, Sentence[]>,
  tailoring: {} as Record<string, boolean>,
  cover: {} as Record<string, string>,
  auto: { paused: false, step: 6, finished: false, live: false, minScore: 70, daily: 20, excluded: ['Công ty GHI'], mode: 'auto' as 'auto' | 'review' },
  apps: clone(INITIAL_APPS),
  today: clone(INITIAL_TODAY),
  cvFile: { name: 'anh-chup-cv.jpg', size: '2,1 MB', when: '03/11 · 08:00' },
  cvLoading: false,
  cvPop: null as number | null,
  cvFields: clone(INITIAL_CV_FIELDS),
  mailbox: true,
  deleteScheduled: false,
  // UI state the prototype kept across views
  filter: { chance: 'all', skill: null as string | null },
  marketTab: 'you' as 'you' | 'demand' | 'gaps',
  focusPath: null as string | null,
  selSent: 's2',
  feedAll: false,
  decOpen: null as string | null,
  coverOpen: false,
  listW: 380,
  /** Finished the 4-step guided flow → the workspace switches to the management layout. */
  onboarded: false,
});
export type DemoState = ReturnType<typeof initialState>;

type Ctx = { s: DemoState; update: (fn: (d: DemoState) => void) => void };
const StoreCtx = createContext<Ctx | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState(initialState);
  const { toast } = useDialogs();
  const update = useCallback((fn: (d: DemoState) => void) => {
    setS(prev => { const next = structuredClone(prev); fn(next); return next; });
  }, []);

  // `onboarded` is a per-viewer convenience: remember it in this browser (storage can be unavailable, so guard it).
  useEffect(() => {
    try {
      if (localStorage.getItem('acaj.onboarded') === '1') update(d => { d.onboarded = true; });
      // Name + email saved by the register/login form (features/auth); the password is never stored.
      const u = JSON.parse(localStorage.getItem('acaj.user') || 'null');
      if (u?.name && u?.email) update(d => { d.user.name = u.name; d.user.email = u.email; });
    } catch {}
  }, [update]);
  useEffect(() => { try { localStorage.setItem('acaj.onboarded', s.onboarded ? '1' : '0'); } catch {} }, [s.onboarded]);

  // Autopilot simulation: advance one step every 1.1s while a run is live.
  const { live, paused, finished, step } = s.auto;
  useEffect(() => {
    if (!live || paused || finished) return;
    const t = setTimeout(() => {
      const done = step + 1 > 8;
      update(d => {
        d.auto.step++;
        if (done) { d.auto.finished = true; d.auto.live = false; d.today.unshift({ t: now(), x: 'Hoàn tất lượt chạy 8 bước' }); }
      });
      if (done) toast('Autopilot đã chạy xong 8 bước');
    }, 1100);
    return () => clearTimeout(t);
  }, [live, paused, finished, step, update, toast]);

  return <StoreCtx.Provider value={{ s, update }}>{children}</StoreCtx.Provider>;
}

export function useDemo() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useDemo must be used inside DemoStoreProvider');
  return ctx;
}

/* ---------- selectors shared by several features ---------- */
export const appForJob = (st: DemoState, jid: string) => st.apps.find(a => a.jobId === jid);
export const appById = (st: DemoState, id: string | null | undefined) => st.apps.find(a => a.id === id);
export const qualified = (st: DemoState) => JOBS.filter(j => matchFor(st, j).score >= st.auto.minScore).length;
export const tailoredCount = (st: DemoState) => Object.keys(st.tailored).length;
export const logYou = (d: DemoState, x: string) => d.today.unshift({ t: now(), x, you: true });
export const firstReview = (st: DemoState, jid: string) => (st.tailored[jid] || []).find(x => x.origin === 'review')?.id;

/** Live match for a job: uses its tailored CV when there is one, else the base CV. */
export const matchFor = (st: DemoState, j: Job) => matchOf(j, st.tailored[j.id]);

export function jdParas(j: Job): [string, string][] {
  return [
    ['p1', `${j.company} tuyển ${j.title} làm việc tại ${j.loc}.`],
    ['p2', 'Thiết kế và phát triển REST API cho các dịch vụ backend; phối hợp với frontend và QA để phát hành tính năng.'],
    ['p3', `Bắt buộc: ${j.req.join(', ')}. Tối thiểu 6 tháng kinh nghiệm, tính cả thực tập.`],
    ['p4', `Ưu tiên: ${j.nice.join(', ')}; có kinh nghiệm viết test tự động.`],
    ['p5', j.extra || 'Làm việc theo nhóm nhỏ, review code hằng ngày.'],
    ['p6', `Hình thức: ${j.mode}. Lương ${j.salary.replace('tr', 'triệu')}.`],
  ];
}
