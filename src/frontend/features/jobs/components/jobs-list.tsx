'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { buttonClass } from '@/components/ui/button';
import { Chip, EmptyState } from '@/components/ui/misc';
import { ListHead } from '@/components/workspace/split-view';
import { matchFor, useDemo } from '@/lib/demo/store';
import { cx } from '@/lib/cn';
import { filteredJobs, companyMark, companyTone } from '../lib';
import { Chance, JobStatus } from './badges';

const CHANCES = [['all', 'Tất cả'], ['2', 'Cao'], ['1', 'Trung bình'], ['0', 'Thấp']];
const LOGO_TONE = ['bg-brand-soft text-brand-ink', 'bg-[#E7EFE9] text-[#3F5B4B]', 'bg-[#ECE9F1] text-[#544A68]', 'bg-[#E7EDF1] text-[#415565]'];

export function JobsList() {
  const { s, update } = useDemo();
  const { jobId } = useParams<{ jobId?: string }>();
  const list = filteredJobs(s);

  const clearFilter = () => { update(d => { d.filter = { chance: 'all', skill: null }; }); };

  return (
    <>
      <ListHead title="Việc làm" count={list.length}>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-12 text-ink-3">Cơ hội</span>
          <div className="flex flex-wrap gap-3.5" role="group" aria-label="Lọc theo khả năng đậu">
            {CHANCES.map(([v, l]) => (
              <button key={v} aria-pressed={s.filter.chance === v} onClick={() => update(d => { d.filter.chance = v; })}
                className="border-b-2 border-transparent py-1 text-13 font-medium text-ink-3 hover:text-ink aria-pressed:border-ink aria-pressed:text-ink">{l}</button>
            ))}
          </div>
        </div>
        {s.filter.skill && (
          <div><Chip removeLabel={`Bỏ lọc kỹ năng ${s.filter.skill}`} onRemove={() => { update(d => { d.filter.skill = null; }); }}>Cần {s.filter.skill}</Chip></div>
        )}
      </ListHead>
      <div className="relative min-h-0 overflow-y-auto" id="listScroll">
        <div id="rows" className="grid gap-1.5 px-2.5 pt-2 pb-4">
          {!list.length ? (
            <EmptyState icon="search" title="Không có job nào khớp">
              <span className="text-14">Thử bỏ bớt bộ lọc.</span>
              <button className={buttonClass('default', 'sm')} onClick={clearFilter}>Xóa bộ lọc</button>
            </EmptyState>
          ) : list.map(j => {
            const tags = [...j.req, ...j.nice], shown = tags.slice(0, 2), more = tags.length - shown.length;
            return (
              <Link key={j.id} data-row href={`/jobs/${j.id}`} aria-current={jobId === j.id}
                className={cx('grid w-full grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-2.5 rounded-lg border border-rule bg-paper px-3 py-2.5 text-left',
                  'shadow-[0_1px_0_rgba(26,26,24,.02)] hover:border-rule-2 hover:shadow-[0_10px_22px_-18px_rgba(26,26,24,.35)]',
                  'aria-[current=true]:border-gold aria-[current=true]:shadow-[0_0_0_1px_var(--color-gold)] focus-visible:rounded-lg')}>
                <span aria-hidden="true" className={cx('grid size-8 place-items-center rounded-ctl text-[10.5px] font-medium tracking-[.02em]', LOGO_TONE[companyTone(j.company)])}>{companyMark(j.company)}</span>
                <span className="grid min-w-0 gap-0.5">
                  <span className="line-clamp-2 text-14 leading-[1.35] font-medium wrap-anywhere text-ink">{j.title}</span>
                  <span className="block truncate text-12 text-ink-3"><span className="text-ink-2">{j.company}</span> · {j.loc} · {j.mode}</span>
                  <span className={"mt-0.5 flex items-center gap-1 overflow-hidden"}>
                    <span className="mr-1 whitespace-nowrap text-12 font-medium text-brand-ink">{j.salary}</span>
                    {shown.map(t => <span key={t} className="rounded border border-rule bg-bg px-1.5 text-[10.5px] leading-4 whitespace-nowrap text-ink-2">{t}</span>)}
                    {more > 0 && <span className="rounded border border-dashed border-rule bg-bg px-1.5 text-[10.5px] leading-4 whitespace-nowrap text-ink-3">+{more}</span>}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-12"><JobStatus job={j} /><span className={"ml-auto text-11 whitespace-nowrap text-ink-3"}>{j.posted}</span></span>
                </span>
                <span className="grid justify-items-end gap-0.5">
                  <span className="text-20 leading-none font-extralight tracking-[-.03em]">{matchFor(s, j).score}<small className="ml-px text-[9px] font-normal tracking-normal text-ink-3">/100</small></span>
                  <Chance job={j} small />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
