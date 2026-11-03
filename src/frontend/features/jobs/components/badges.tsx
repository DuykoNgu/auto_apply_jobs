'use client';

import { StatusLabel } from '@/components/ui/misc';
import { STATUS } from '@/lib/demo/data';
import { CHANCE } from '@/lib/demo/match';
import { appForJob, matchFor, useDemo } from '@/lib/demo/store';
import { cx } from '@/lib/cn';
import type { Job } from '@/lib/types';

const CHANCE_TONE = [['text-danger', 'bg-danger'], ['text-ink-2', 'bg-ink-2'], ['text-ok', 'bg-ok']];

/** Interview chance: 1–3 filled bars + label. */
export function Chance({ job, small }: { job: Job; small?: boolean }) {
  const { s } = useDemo();
  const lvl = matchFor(s, job).chance, [text, fill] = CHANCE_TONE[lvl];
  return (
    <span className={cx('inline-flex items-center font-medium whitespace-nowrap', text, small ? 'gap-1 text-11' : 'gap-1.5 text-13')}>
      <span className="inline-flex items-end gap-0.5" aria-hidden="true">
        {[6, 9, 12].map((h, i) => <i key={h} className={cx('block rounded-[1px]', small ? 'w-0.5' : 'w-[3px]', i <= lvl ? fill : 'bg-rule-2')} style={{ height: h }} />)}
      </span>
      {CHANCE[lvl]}
    </span>
  );
}

export function JobStatus({ job }: { job: Job }) {
  const { s } = useDemo();
  const a = appForJob(s, job.id);
  if (a) return <StatusLabel tone={a.status === 'interview' ? 'ok' : a.status === 'rejected' ? 'bad' : 'mute'}>{STATUS[a.status]} · {a.date}</StatusLabel>;
  if (job.manual) return <StatusLabel tone="warn">Cần nộp tay</StatusLabel>;
  const list = s.tailored[job.id];
  if (list) {
    const r = list.filter(x => x.origin === 'review').length;
    return r ? <StatusLabel tone="warn">{r} câu cần xem lại</StatusLabel> : <StatusLabel tone="ok">CV đã tối ưu</StatusLabel>;
  }
  if (matchFor(s, job).score < s.auto.minScore) return <StatusLabel tone="mute">Dưới ngưỡng tự nộp</StatusLabel>;
  return <StatusLabel tone="mute">Chờ tối ưu</StatusLabel>;
}
