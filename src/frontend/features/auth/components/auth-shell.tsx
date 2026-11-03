// Shared frame for SCR-01 / SCR-02: brand side on the left (landing style), the form on the right.
import Link from 'next/link';
import type { ReactNode } from 'react';

const PROMISES = [
  ['Không bịa', 'Không thêm công ty, vị trí hay bằng cấp bạn không có.'],
  ['Câu nào cũng có căn cứ', 'Mỗi câu viết lại đều trỏ về CV gốc của bạn.'],
  ['Bạn có lời cuối', 'Thư chỉ gửi khi bạn xác nhận.'],
];

export function AuthShell({ title, lead, children, footer }: { title: string; lead: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-[minmax(0,5fr)_minmax(0,6fr)] max-[960px]:grid-cols-[minmax(0,1fr)]">
      <aside className="relative flex flex-col justify-between overflow-hidden border-r border-rule bg-pane px-14 py-12 max-[960px]:hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_900px_600px_at_30%_40%,rgba(212,165,116,.10)_0%,transparent_70%)]" />
        <Link href="/" className="relative text-24 font-medium tracking-[-.01em]">ACAJ<span className="text-gold-ink">.</span></Link>
        <div className="relative">
          <p className="max-w-[16ch] text-[clamp(32px,3.4vw,48px)] leading-[1.1] font-extralight tracking-[-.025em]">Kết quả bạn nhận.<br /><span className="text-gold-ink">Tiến trình ACAJ lo.</span></p>
          <div aria-hidden="true" className="mt-8 h-px w-[72px] bg-gold" />
          <ul className="mt-8 grid max-w-[44ch] gap-5">
            {PROMISES.map(([t, d]) => (
              <li key={t}><strong className="block font-medium">{t}</strong><span className="text-15 text-ink-2">{d}</span></li>
            ))}
          </ul>
        </div>
        <p className="relative text-13 text-ink-3">AI CV · Auto Apply Jobs</p>
      </aside>

      <main className="flex flex-col px-14 py-12 max-[620px]:px-5 max-[620px]:py-8">
        <Link href="/" className="text-22 font-medium tracking-[-.01em] min-[961px]:hidden">ACAJ<span className="text-gold-ink">.</span></Link>
        <div className="my-auto w-full max-w-[420px] self-center py-10">
          <h1 className="text-[clamp(32px,3vw,40px)] leading-[1.1] font-extralight tracking-[-.025em] after:mt-6 after:block after:h-px after:w-[56px] after:bg-gold after:content-['']">{title}</h1>
          <p className="mt-6 text-ink-2">{lead}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 border-t border-rule pt-6 text-15 text-ink-2">{footer}</p>
        </div>
      </main>
    </div>
  );
}

/** Square primary button of the public pages (same as the landing CTA). */
export const authButton = 'inline-flex min-h-[52px] w-full items-center justify-center gap-2 border border-ink bg-ink px-8 text-16 font-medium tracking-[.01em] text-white transition-colors duration-200 hover:border-ink-hover hover:bg-ink-hover disabled:opacity-60';
export const authLink = 'font-medium text-ink underline decoration-gold underline-offset-[6px] hover:decoration-ink';
