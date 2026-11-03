'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Fragment } from 'react';
import { StatusLabel } from '@/components/ui/misc';
import { ListHead } from '@/components/workspace/split-view';
import { STATUS, jobById } from '@/lib/demo/data';
import { useDemo, type DemoState } from '@/lib/demo/store';
import type { AppStatus } from '@/lib/types';

export const APP_ORDER: AppStatus[] = ['interview', 'submitted', 'reminded', 'rejected'];
export const orderedApps = (s: DemoState) => APP_ORDER.flatMap(st => s.apps.filter(a => a.status === st));

export function ApplicationsList() {
  const { s } = useDemo();
  const { applicationId } = useParams<{ applicationId?: string }>();
  return (
    <>
      <ListHead title="Hồ sơ ứng tuyển" count={s.apps.length}>
        <p className="text-13 text-ink-3">Hệ thống đọc hộp thư, gắn nhãn phản hồi và tự nhắc sau 5 ngày.</p>
      </ListHead>
      <div className="relative min-h-0 overflow-y-auto" id="listScroll"><div id="rows">
        {APP_ORDER.map(st => {
          const g = s.apps.filter(a => a.status === st);
          if (!g.length) return null;
          return (
            <Fragment key={st}>
              <div className="sticky top-0 z-[1] flex gap-2 bg-pane px-4 pt-3 pb-2 text-13 font-medium text-ink-3"><span>{STATUS[st]}</span><span className="tabular-nums">{g.length}</span></div>
              {g.map(a => {
                const j = jobById(a.jobId)!, need = a.draft && !a.draftSent;
                return (
                  <Link key={a.id} data-row href={`/applications/${a.id}`} aria-current={applicationId === a.id}
                    className="relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-t border-rule px-4 py-3.5 text-left hover:bg-hover aria-[current=true]:bg-bg aria-[current=true]:before:absolute aria-[current=true]:before:inset-y-0 aria-[current=true]:before:left-0 aria-[current=true]:before:w-0.5 aria-[current=true]:before:bg-gold aria-[current=true]:before:content-['']">
                    <span>
                      <span className="block truncate text-15 font-medium">{j.company}</span>
                      <span className="block truncate text-14 text-ink-2">{j.title}</span>
                      {need && <span className="mt-0.5 block text-13"><StatusLabel tone="warn">Chờ bạn xác nhận thư</StatusLabel></span>}
                    </span>
                    <span className="grid justify-items-end gap-0.5"><span className="text-13 text-ink-3 tabular-nums">{a.thread[a.thread.length - 1].date.split(' ·')[0]}</span></span>
                  </Link>
                );
              })}
            </Fragment>
          );
        })}
      </div></div>
    </>
  );
}
