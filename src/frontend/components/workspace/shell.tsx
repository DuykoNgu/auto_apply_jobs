'use client';

// Workspace shell: one app navigation, always visible (every screen reachable, every screen has a way out).
// On first run a slim "Thiết lập" bar sits under it: the 4 setup steps + Quay lại / Tiếp theo, skippable.
// Plus the ⌘K palette.
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Fragment, useEffect, useRef, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icon';
import { useDialogs } from '@/components/dialogs';
import { buttonClass, linkClass } from '@/components/ui/button';
import { CommandPalette } from './command-palette';
import { useDemo } from '@/lib/demo/store';
import { cx } from '@/lib/cn';
import { isNarrow } from '@/lib/format';

/** One label per area, used by the nav, the setup steps, page titles and ⌘K. */
export const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: 'feed' },
  { href: '/jobs', label: 'Việc làm', icon: 'briefcase' },
  { href: '/applications', label: 'Hồ sơ ứng tuyển', icon: 'inbox' },
  { href: '/cv', label: 'CV', icon: 'file' },
  { href: '/insights', label: 'Thị trường', icon: 'chart' },
  { href: '/auto-apply', label: 'Tự động ứng tuyển', icon: 'bolt' },
];
const byHref = (h: string) => NAV.find(n => n.href === h)!;
/** First-run setup order. */
export const STAGES = ['/cv', '/insights', '/jobs', '/applications'].map(byHref);

const section = (path: string) => '/' + (path.split('/')[1] || '');

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sec = section(pathname);
  const { s } = useDemo();
  const setup = !s.onboarded;

  // Move focus to the new screen's heading when the section changes (not when picking a row in a list).
  const lastSec = useRef<string | null>(null);
  useEffect(() => {
    const first = lastSec.current === null, changed = lastSec.current !== sec;
    lastSec.current = sec;
    const detailOnMobile = isNarrow() && document.querySelector('#split[data-show="detail"]');
    if (first || (!changed && !detailOnMobile)) return;
    const h = document.querySelector<HTMLElement>(
      detailOnMobile ? '#detailPane [data-h1]' : document.querySelector('#split') ? '#listPane [data-lp-title]' : '#sheetPane [data-h1]');
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }, [sec, pathname]);

  // relative + overflow-clip: absolutely positioned bits (sr-only) stay inside the shell, and scrollIntoView can only scroll the inner panes.
  return (
    <div className="relative grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] overflow-clip">
      <main id="ws" className={cx('grid min-h-0 min-w-0 overflow-clip', setup ? 'grid-rows-[auto_auto_minmax(0,1fr)]' : 'grid-rows-[auto_minmax(0,1fr)]')}>
        <AppNav sec={sec} />
        {setup && <SetupBar sec={sec} />}
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}

/** First-run guide: where you are in the 4 setup steps, back / next, and a way to skip. */
function SetupBar({ sec }: { sec: string }) {
  const router = useRouter();
  const { update } = useDemo();
  const { toast } = useDialogs();
  const idx = STAGES.findIndex(st => st.href === sec);
  const prev = STAGES[idx - 1], next = STAGES[idx + 1];
  const finish = () => { update(d => { d.onboarded = true; }); toast('Thiết lập xong. Đây là trang tổng quan của bạn.'); router.push('/dashboard'); };

  return (
    <nav aria-label={idx >= 0 ? `Thiết lập lần đầu, bước ${idx + 1} trên ${STAGES.length}` : 'Thiết lập lần đầu'}
      className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2 border-b border-rule bg-pane px-8 py-2.5 max-tab:px-3">
      <span className="text-13 text-ink-3 max-tab:hidden">Thiết lập lần đầu</span>
      <ol className="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STAGES.map((st, i) => {
          const state = idx < 0 ? 'next' : i < idx ? 'past' : i === idx ? 'here' : 'next';
          return (
            <Fragment key={st.href}>
              <li className="flex flex-none items-center">
                <Link href={st.href} aria-current={state === 'here' ? 'step' : undefined} className="group flex items-center gap-2 px-1 py-1 text-14 text-ink-2">
                  <span className={cx('grid size-5 flex-none place-items-center border text-11 tabular-nums',
                    state === 'past' ? 'border-gold text-gold-ink' : state === 'here' ? 'border-ink bg-ink text-white' : 'border-rule-2')}>
                    {state === 'past' ? <Icon name="check" className="[--icon:12px]" /> : i + 1}</span>
                  <span className={cx('decoration-rule-2 underline-offset-4 group-hover:underline', state === 'here' ? 'font-medium text-ink' : 'max-tab:hidden')}>{st.label}</span>
                </Link>
              </li>
              {i < STAGES.length - 1 && <li aria-hidden="true" className={cx('mx-2 block h-px w-6 flex-none max-tab:w-3', state === 'past' ? 'bg-gold' : 'bg-rule-2')} />}
            </Fragment>
          );
        })}
      </ol>
      <div className="flex items-center gap-2">
        <button type="button" className={linkClass('mr-2 text-13 font-normal text-ink-3')} onClick={finish}>Bỏ qua</button>
        {idx < 0 ? <Link className={buttonClass('primary', 'sm')} href={STAGES[0].href}>Tiếp tục thiết lập<Icon name="right" /></Link> : <>
          {prev && <Link className={buttonClass('default', 'sm')} href={prev.href} aria-label={`Quay lại: ${prev.label}`}><Icon name="left" />Quay lại</Link>}
          {next
            ? <Link className={buttonClass('primary', 'sm')} href={next.href} aria-label={`Tiếp theo: ${next.label}`}>Tiếp theo<Icon name="right" /></Link>
            : <button type="button" className={buttonClass('primary', 'sm')} onClick={finish}>Hoàn tất thiết lập<Icon name="check" /></button>}
        </>}
      </div>
    </nav>
  );
}

/** App navigation: every area, autopilot status, ⌘K, account. */
function AppNav({ sec }: { sec: string }) {
  const { s } = useDemo();
  const a = s.auto;
  const openPalette = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
  const closeMenu = () => document.getElementById('accountMenu')?.hidePopover();
  const initials = s.user.name.split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();
  return (
    <header className="flex h-16 min-w-0 items-center gap-8 border-b border-rule bg-bg px-8 max-tab:gap-3 max-tab:px-3">
      <Link href="/dashboard" className="flex-none text-22 font-medium tracking-[-.01em] max-[520px]:hidden">ACAJ<span className="text-gold-ink">.</span></Link>
      <nav aria-label="Điều hướng chính" className="flex h-full min-w-0 flex-1 items-stretch gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV.map(n => {
          const on = sec === n.href;
          return (
            <Link key={n.href} href={n.href} aria-current={on ? 'page' : undefined} aria-label={n.label}
              className={cx('group relative flex flex-none items-center gap-2 px-3.5 text-15 font-medium whitespace-nowrap [--icon:18px] max-tab:px-2.5',
                "after:absolute after:inset-x-3.5 after:-bottom-px after:h-0.5 after:content-[''] max-tab:after:inset-x-2.5",
                on ? 'text-ink after:bg-gold' : 'text-ink-2 hover:text-ink')}>
              <Icon name={n.icon} />
              <span className={cx('decoration-rule-2 underline-offset-[6px] max-tab:hidden', !on && 'group-hover:underline')}>{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <Link href="/auto-apply" className="flex min-h-10 flex-none items-center gap-2.5 border border-rule px-3 text-13 text-ink-2 hover:border-rule-2 hover:bg-pane">
        <span aria-hidden="true" className={cx('h-4 w-0.5 rounded-[1px]', a.paused ? 'bg-hush' : 'animate-breathe bg-gold')} />
        <span className="max-desk:hidden">Tự động: {a.paused ? 'tạm dừng' : 'đang chạy'} · <span className="tabular-nums">{s.apps.length}/{a.daily}</span> hồ sơ hôm nay</span>
      </Link>
      <button type="button" onClick={openPalette} aria-label="Tìm hoặc ra lệnh (Ctrl K)"
        className="flex min-h-10 flex-none items-center gap-2 border border-rule px-2.5 text-ink-2 [--icon:16px] hover:border-rule-2 hover:bg-pane hover:text-ink">
        <Icon name="search" /><kbd className="max-tab:hidden">⌘K</kbd>
      </button>
      {/* Account menu: native popover (top layer, Esc / click outside to close). */}
      <button type="button" popoverTarget="accountMenu" aria-label={`Tài khoản của ${s.user.name}`} aria-haspopup="menu"
        className="grid size-10 flex-none place-items-center">
        <span aria-hidden="true" className={cx('grid size-[30px] place-items-center rounded-full bg-gold-ink text-12 font-medium text-white',
          sec === '/account' && 'shadow-[0_0_0_2px_var(--color-bg),0_0_0_3px_var(--color-gold)]')}>{initials}</span>
      </button>
      <div id="accountMenu" popover="auto" role="menu"
        className="fixed inset-auto top-[60px] right-6 m-0 w-64 rounded-lg border border-rule-2 bg-paper p-1.5 text-ink shadow-[0_24px_48px_-30px_rgba(26,26,24,.5),0_2px_6px_rgba(26,26,24,.05)] max-tab:right-3">
        <div className="grid gap-0.5 border-b border-rule px-3 pt-2 pb-3">
          <strong className="block truncate text-14 font-medium">{s.user.name}</strong>
          <span className="block truncate text-13 text-ink-3">{s.user.email}</span>
        </div>
        <Link role="menuitem" href="/account" onClick={closeMenu}
          className="mt-1 flex items-center gap-3 rounded-ctl px-3 py-2 text-14 [--icon:16px] hover:bg-hover"><Icon name="user" className="text-ink-3" />Tài khoản</Link>
        {/* Full page load: the landing is a separate root layout. ponytail: no auth yet, so this only leaves the app; clear the session when the API exists. */}
        <a role="menuitem" href="/"
          className="flex items-center gap-3 rounded-ctl px-3 py-2 text-14 [--icon:16px] hover:bg-hover"><Icon name="logout" className="text-ink-3" />Đăng xuất</a>
      </div>
    </header>
  );
}

/** Scrollable single-column screen (everything except the list/detail split views). */
export function SheetPane({ children }: { children: ReactNode }) {
  return (
    <section id="sheetPane" className="relative min-h-0 overflow-y-auto bg-bg">
      <div className="mx-auto max-w-[1360px] animate-fade-in px-12 pt-12 pb-16 max-lap:px-6 max-lap:pt-6 max-lap:pb-12 max-phone:px-4">{children}</div>
    </section>
  );
}
