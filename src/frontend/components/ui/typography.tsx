import type { ReactNode } from 'react';
import { cx } from '@/lib/cn';

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('block text-14 tracking-[.01em] text-ink-3', className)}>{children}</span>;
}

/** Page title with the gold rule underneath. `flush` drops the top margin. */
export function H1({ children, className, flush }: { children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <h1 data-h1 className={cx(
      'text-[clamp(36px,4.2vw,58px)] leading-[1.08] font-extralight tracking-[-.025em] focus:outline-none',
      "after:mt-7 after:block after:h-px after:w-[72px] after:bg-gold after:content-['']",
      flush ? 'mt-0' : 'mt-2', className)}>{children}</h1>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-3 max-w-[62ch] text-17 font-light text-ink-2">{children}</p>;
}

export function Fine({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('text-13 text-ink-3', className ?? 'mt-3')}>{children}</p>;
}

/** Section heading row: title on the left, quiet note on the right. */
export function SecHeading({ id, children, aside, as: Tag = 'h2', className }: { id?: string; children: ReactNode; aside?: ReactNode; as?: 'h2' | 'h3'; className?: string }) {
  return (
    <Tag id={id} className={cx('mb-4 flex items-baseline gap-3 text-16 font-medium focus:outline-none', className)}>
      {children}{aside && <span className="ml-auto font-light text-ink-3">{aside}</span>}
    </Tag>
  );
}

export function Section({ id, headingId, title, aside, children }: { id?: string; headingId: string; title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={headingId} className="mt-[72px] border-t border-rule pt-6">
      <SecHeading id={headingId} aside={aside}>{title}</SecHeading>
      {children}
    </section>
  );
}
