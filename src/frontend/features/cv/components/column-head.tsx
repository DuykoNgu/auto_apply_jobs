import type { ReactNode } from 'react';

type Props = { title: string; titleId?: string; note?: ReactNode; children?: ReactNode };

export function ColumnHead({ title, titleId, note, children }: Props) {
  return (
    <div className="mb-3 flex min-h-[38px] flex-wrap items-center gap-2.5">
      <h2 id={titleId} className="text-13 font-medium tracking-[.02em] focus:outline-none">
        {title}
      </h2>
      {note}
      {children}
    </div>
  );
}
