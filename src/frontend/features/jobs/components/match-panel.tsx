'use client';

// "CV của bạn khớp với JD": live match score of the CV being edited (docs/09-algorithms.md §3–4, formula, not AI).
import { Bar } from '@/components/ui/misc';

import { CHANCE, CHANCE_HIGH_MIN, CHANCE_MEDIUM_MIN, FACTORS } from '@/lib/demo/match';
import { matchFor, useDemo } from '@/lib/demo/store';
import { cx } from '@/lib/cn';
import { Chance } from './badges';
import type { Job } from '@/lib/types';

/** `since`: score when the editor was opened, to show how far the edits moved it. */
export function MatchPanel({ job: j, since }: { job: Job; since?: number }) {
  const { s } = useDemo();
  const m = matchFor(s, j);
  const reqs = [...j.req, ...j.nice];
  const have = reqs.filter(r => m.credits[r] > 0).length, inferred = reqs.filter(r => m.credits[r] > 0 && m.credits[r] < 1).length;
  const delta = since === undefined ? 0 : m.score - since;

  return (
    <section aria-labelledby="mH" className="rounded-lg border border-rule bg-paper p-5">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 id="mH" className="text-16 font-medium">CV của bạn khớp với JD</h3>
        <span className="text-14 text-ink-2">
          <strong className="font-semibold text-ink">{have}/{reqs.length}</strong> yêu cầu đã có{inferred ? ` (${inferred} suy ra)` : ''}{reqs.length - have ? `, ${reqs.length - have} còn thiếu` : ''}
        </span>
        <span className="ml-auto text-13 font-light text-ink-3">tính bằng công thức, không do AI · cập nhật khi bạn sửa CV</span>
      </div>
      <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-8 max-lap:grid-cols-[minmax(0,1fr)] max-lap:gap-4">
        <div className="flex flex-col gap-2" aria-live="polite">
          <span className="flex items-baseline gap-2">
            <span className="text-[56px] leading-[.95] font-extralight tracking-[-.03em] tabular-nums">{m.score}</span>
            <small className="text-16 text-ink-3">/100</small>
            {delta !== 0 && <span className={cx('text-14 font-medium tabular-nums', delta > 0 ? 'text-ok' : 'text-danger')}>{delta > 0 ? '+' : ''}{delta}</span>}
          </span>
          <Chance job={j} />
          <p className="text-13 text-ink-2">{!m.reasons.length ? `Cao từ ${CHANCE_HIGH_MIN}, Trung bình từ ${CHANCE_MEDIUM_MIN} điểm.`
            : m.chance < m.baseChance ? `Điểm ${m.score} là mức ${CHANCE[m.baseChance]}, hạ xuống ${CHANCE[m.chance]} vì ${m.reasons.join(' và ')}.`
              : `Điểm ${m.score} là mức ${CHANCE[m.baseChance]}; lưu ý ${m.reasons.join(' và ')}.`}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 max-phone:grid-cols-1">{FACTORS.map((f, i) => (
          <div key={f.key} className="grid grid-cols-[minmax(0,1fr)_56px] items-baseline gap-x-3 gap-y-1 border-t border-rule py-2.5 [&:nth-child(-n+2)]:border-t-0 [&:nth-child(-n+2)]:pt-0 max-phone:[&:nth-child(2)]:border-t max-phone:[&:nth-child(2)]:pt-2.5">
            <span className="grid gap-0.5"><strong className="text-14">{f.k}</strong><span className="text-12 text-ink-3">{f.why}</span></span>
            <span className="text-right text-14 tabular-nums">{Math.round(m.points[i])}/{f.max}</span>
            <Bar value={m.points[i] / f.max} tone="brand" className="col-span-full" />
          </div>
        ))}</div>
      </div>
    </section>
  );
}

/** Compact live score for the modal header, so the effect of an edit stays visible while scrolling the CV. */
export function MatchBadge({ job: j, since }: { job: Job; since?: number }) {
  const { s } = useDemo();
  const score = matchFor(s, j).score, delta = since === undefined ? 0 : score - since;
  return (
    <span className="inline-flex items-baseline gap-2 text-14 text-ink-2" aria-live="polite">
      Điểm khớp <strong className="text-18 font-medium text-ink tabular-nums">{score}</strong>/100
      {delta !== 0 && <span className={cx('font-medium tabular-nums', delta > 0 ? 'text-ok' : 'text-danger')}>{delta > 0 ? '+' : ''}{delta}</span>}
      <Chance job={j} />
    </span>
  );
}
