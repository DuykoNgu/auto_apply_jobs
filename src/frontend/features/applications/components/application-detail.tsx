'use client';

// SCR-41: status stepper, mail thread with AI labels, reply draft that only sends after confirmation (BR-022).
import Link from 'next/link';
import { Fragment } from 'react';
import { Icon } from '@/components/icon';
import { buttonClass } from '@/components/ui/button';
import { AiTag, EmptyState, StatusLabel } from '@/components/ui/misc';
import { Eyebrow, H1, Section } from '@/components/ui/typography';
import { BackLink, Doc } from '@/components/workspace/split-view';
import { jobById } from '@/lib/demo/data';
import { appById, useDemo } from '@/lib/demo/store';
import { cx } from '@/lib/cn';
import { useApplicationActions } from '../hooks/use-application-actions';

export function ApplicationDetail({ applicationId }: { applicationId: string }) {
  const { s, update } = useDemo();
  const { sendReply } = useApplicationActions();
  const a = appById(s, applicationId);
  if (!a) return <Doc><EmptyState icon="inbox" title="Không tìm thấy hồ sơ này" tall /></Doc>;

  const j = jobById(a.jobId)!;
  const steps: [string, boolean][] = a.status === 'rejected'
    ? [['Đã nộp', true], ['Có phản hồi', true], ['Từ chối', true]]
    : [['Đã nộp', true], ['Đã nhắc', a.status === 'reminded'], ['Có phản hồi', a.status === 'interview'], ['Phỏng vấn', a.status === 'interview']];
  const need = a.draft && !a.draftSent;
  const draftId = `draft-${a.id}`;

  return (
    <Doc animate key={a.id}>
      <BackLink href="/applications">Hồ sơ ứng tuyển</BackLink>
      <div className="flex flex-wrap items-end gap-6">
        <div className="min-w-[260px] flex-1">
          <Eyebrow>{j.company} · nộp ngày {a.date}</Eyebrow>
          <H1>{j.title}</H1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-14 text-ink-3 [--icon:14px]" aria-label="Trạng thái hồ sơ">{steps.map(([l, on], i) => (
            <Fragment key={l}>{i > 0 && <Icon name="chev" />}<span className={cx(on && 'font-medium text-ink')}>{l}{!on && <span className="sr-only"> (chưa tới)</span>}</span></Fragment>
          ))}</div>
        </div>
        <div className="grid justify-items-end gap-1.5 max-tab:justify-items-start"><Link className={buttonClass()} href={`/jobs/${j.id}?cv=s1`}><Icon name="file" />Bản CV đã nộp</Link></div>
      </div>
      <Section headingId="thH" title="Chuỗi thư" aside={`${a.thread.length} thư`}>
        <div>{a.thread.map((m, i) => (
          <article key={i} className="grid gap-2 border-t border-rule py-6 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2"><strong className="min-w-0 flex-1">{m.from}</strong><span className="text-13 text-ink-3 tabular-nums">{m.date}</span></div>
            <span className="text-14 font-medium">{m.subj}</span>
            {m.label && <div className="flex flex-wrap items-center gap-2"><StatusLabel tone={m.label.t === 'Từ chối' ? 'bad' : 'ok'}>{m.label.t}</StatusLabel><AiTag>AI nhận diện · {m.label.conf.toFixed(2)}</AiTag></div>}
            <p className="max-w-[68ch] whitespace-pre-line text-ink-2">{m.body}</p>
          </article>
        ))}</div>
        {need && (
          <div className="mt-6 overflow-hidden rounded-[10px] border border-rule-2">
            <div className="flex flex-wrap items-center gap-2 border-b border-rule px-4 py-3 text-14 text-ink-2"><span className="min-w-0 flex-1">Trả lời tới <strong>{a.to}</strong></span><AiTag>AI soạn sẵn</AiTag></div>
            <label htmlFor={draftId} className="sr-only">Nội dung thư trả lời</label>
            <textarea id={draftId} value={a.draft} className="block min-h-[180px] w-full resize-y bg-paper p-4 text-15 leading-[1.6] focus:outline-2 focus:-outline-offset-2 focus:outline-gold-ink"
              onChange={e => { const v = e.target.value; update(d => { appById(d, a.id)!.draft = v; }); }} />
            <div className="flex flex-wrap items-center gap-2 border-t border-rule bg-pane px-4 py-3">
              <span className="min-w-0 flex-1 text-13 text-ink-3">Thư chỉ được gửi sau khi bạn xác nhận ở bước tiếp theo.</span>
              <button className={buttonClass('primary')} onClick={() => sendReply(a.id, () => document.getElementById(draftId)?.focus())}><Icon name="mail" />Xem lại và gửi</button>
            </div>
          </div>
        )}
      </Section>
    </Doc>
  );
}
