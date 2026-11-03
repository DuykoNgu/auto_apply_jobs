import type { ReactNode } from 'react';
import { cx } from '@/lib/cn';
import { Icon, type IconName } from '@/components/icon';

const TONE = { ok: 'text-ok', warn: 'text-amber', bad: 'text-danger', mute: 'text-ink-3', ink: 'text-ink' };
export type Tone = keyof typeof TONE;

/** Coloured status text with a small square marker. */
export function StatusLabel({ tone, plain, children, className }: { tone: Tone; plain?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap text-13 font-medium [--icon:13px]', TONE[tone],
      !plain && "before:size-[7px] before:flex-none before:rounded-[2px] before:bg-current before:content-['']", className)}>{children}</span>
  );
}

/** "AI recognised / AI drafted" chip. */
export function AiTag({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded bg-amber-soft px-1.5 py-px text-12 font-medium text-amber [--icon:12px]"><Icon name="spark" />{children}</span>;
}

const BAR = { ink: 'bg-ink', brand: 'bg-gold-ink', amber: 'bg-amber-line' };
/** Thin horizontal meter, value 0..1. */
export function Bar({ value, tone = 'ink', className }: { value: number; tone?: keyof typeof BAR; className?: string }) {
  return (
    <span className={cx('block h-1 overflow-hidden rounded-sm bg-rule', className)}>
      <i className={cx('block h-full origin-left transition-transform duration-400 ease-out', BAR[tone])} style={{ transform: `scaleX(${value})` }} />
    </span>
  );
}

export function Skeleton({ className, width }: { className?: string; width?: string | number }) {
  return <div className={cx('h-3.5 animate-skeleton rounded bg-[linear-gradient(90deg,#ECEFF0_0%,#F7F8F8_50%,#ECEFF0_100%)] bg-size-[200%_100%]', className)} style={{ width }} />;
}

export function Chip({ children, onRemove, removeLabel }: { children: ReactNode; onRemove: () => void; removeLabel: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-rule-2 pl-2.5 text-14">{children}
      <button aria-label={removeLabel} onClick={onRemove} className="grid size-[30px] place-items-center rounded-full text-ink-3 [--icon:13px] hover:bg-hover hover:text-ink"><Icon name="x" /></button>
    </span>
  );
}

export function EmptyState({ icon, title, children, tall }: { icon: IconName; title: string; children?: ReactNode; tall?: boolean }) {
  return (
    <div className={cx('grid justify-items-center gap-2 px-4 pb-12 text-center text-ink-2', tall ? 'pt-[20vh]' : 'pt-12')}>
      <span className="text-ink-3 [--icon:24px]"><Icon name={icon} /></span>
      <strong className="text-16 text-ink">{title}</strong>
      {children}
    </div>
  );
}

/** Divided list with an icon per item (".plain-list"). */
export function IconList({ items }: { items: [IconName, ReactNode][] }) {
  return (
    <ul className="grid">
      {items.map(([ic, text], i) => (
        <li key={i} className={cx('flex gap-3 py-3 text-15 [--icon:16px]', i > 0 && 'border-t border-rule')}>
          <Icon name={ic} className="mt-1 text-ink-3" /><span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Note row bordered top and bottom (".inline-note"). */
export function InlineNote({ tone, icon, children, action }: { tone: 'warn' | 'ok'; icon: IconName; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-6 flex items-start gap-3 border-y border-rule py-3 text-15 [--icon:18px]">
      <Icon name={icon} className={cx('mt-[3px]', tone === 'warn' ? 'text-amber' : 'text-gold-ink')} />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

/** Colour swatch + caption legend. */
export function Legend({ items, className }: { items: [string, ReactNode][]; className?: string }) {
  return (
    <div className={cx('flex flex-wrap gap-x-6 gap-y-2 text-13 text-ink-2', className ?? 'mb-4')}>
      {items.map(([sw, text], i) => <span key={i} className="inline-flex items-center gap-1.5"><i className={cx('inline-block h-2.5 w-3.5 rounded-[2px]', sw)} />{text}</span>)}
    </div>
  );
}
