'use client';

// SCR-03: management overview after the guided flow — what needs the user, application progress,
// best-matching jobs, market and CV at a glance; each block links to its full screen.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { buttonClass, linkClass } from '@/components/ui/button';
import { fieldClass, fieldLabelClass, textareaClass } from '@/components/ui/form';
import { Bar, StatusLabel } from '@/components/ui/misc';
import { Eyebrow, H1 } from '@/components/ui/typography';
import { SheetPane } from '@/components/workspace/shell';
import { JOBS, STATUS, jobById } from '@/lib/demo/data';
import { appById, appForJob, firstReview, jdParas, matchFor, qualified, tailoredCount, useDemo, type DemoState } from '@/lib/demo/store';
import { cx } from '@/lib/cn';
import { useApplicationActions } from '@/features/applications/hooks/use-application-actions';
import { useSentenceActions } from '@/features/tailoring/hooks/use-sentence-actions';
import { APP_ORDER } from '@/features/applications/components/applications-list';
import { Chance, JobStatus } from '@/features/jobs/components/badges';
import { DemandChart } from '@/features/insights/components/insights-page';
import { GAPS } from '@/features/insights/data';

type Decision = { type: 'reply'; aid: string } | { type: 'review'; jid: string; sid: string } | { type: 'manual'; jid: string };

function decisions(s: DemoState): Decision[] {
  const out: Decision[] = [];
  s.apps.filter(a => a.draft && !a.draftSent).forEach(a => out.push({ type: 'reply', aid: a.id }));
  Object.entries(s.tailored).forEach(([jid, list]) => {
    if (appForJob(s, jid)) return;
    list.filter(x => x.origin === 'review').forEach(x => out.push({ type: 'review', jid, sid: x.id }));
  });
  JOBS.filter(j => j.manual && !appForJob(s, j.id)).forEach(j => out.push({ type: 'manual', jid: j.id }));
  return out;
}

/** Card used for every block of the management overview: title, optional link on the right, content. */
function Panel({ id, title, aside, href, linkLabel, children, className }: { id: string; title: string; aside?: ReactNode; href?: string; linkLabel?: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cx('rounded-lg border border-rule bg-paper p-5', className)}>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={id} className="text-16 font-medium">{title}</h2>
        {aside && <span className="text-13 font-light text-ink-3">{aside}</span>}
        {href && <Link className={linkClass('ml-auto text-14')} href={href}>{linkLabel ?? 'Xem tất cả'}<Icon name="right" /></Link>}
      </div>
      {children}
    </section>
  );
}

function Kpi({ href, label, value, sub }: { href: string; label: string; value: ReactNode; sub: ReactNode }) {
  return (
    <Link href={href} className="group grid content-start gap-1.5 rounded-lg border border-rule bg-paper p-5 transition-colors hover:border-rule-2">
      <span className="flex items-center justify-between text-13 text-ink-3">{label}<Icon name="right" className="text-ink-3 transition-transform group-hover:translate-x-[3px]" /></span>
      <span className="text-[40px] leading-none font-extralight tracking-[-.03em] tabular-nums">{value}</span>
      <span className="text-13 text-ink-2">{sub}</span>
    </Link>
  );
}

const STATUS_TONE = { interview: 'ok', submitted: 'mute', reminded: 'warn', rejected: 'bad' } as const;

export function DashboardPage() {
  const { s, update } = useDemo();
  const ds = decisions(s), a = s.auto;
  const log = s.feedAll ? s.today : s.today.slice(0, 4);
  const first = s.user.name.split(/\s+/).slice(-2).join(' ');

  const interviews = s.apps.filter(x => x.status === 'interview').length;
  const waiting = s.apps.filter(x => x.status === 'submitted' || x.status === 'reminded').length;
  const lowFields = s.cvFields.filter(f => f.c < .8 && !f.ok).length;
  const topJobs = [...JOBS].filter(j => !appForJob(s, j.id)).sort((x, y) => matchFor(s, y).score - matchFor(s, x).score).slice(0, 5);
  const missing = GAPS.filter(g => !g.have);

  return (
    <SheetPane>
      <Eyebrow>Thứ Ba, 03/11 · {s.user.role} · {s.user.city}</Eyebrow>
      <H1>Chào {first}.</H1>
      <p className="mt-6 text-17 font-light text-ink-2">{ds.length ? `${ds.length} việc cần bạn. Phần còn lại, hệ thống tự làm.` : 'Không có gì cần bạn lúc này. Hệ thống đang tự làm phần còn lại.'}</p>

      <div className="mt-10 grid grid-cols-4 gap-4 max-desk:grid-cols-2 max-phone:grid-cols-1">
        <Kpi href="/jobs" label="Việc làm phù hợp" value={JOBS.length} sub={`${qualified(s)} job từ ${a.minScore} điểm, đủ để tự nộp`} />
        <Kpi href="/applications" label="Hồ sơ ứng tuyển" value={s.apps.length} sub={`${interviews} mời phỏng vấn · ${waiting} đang chờ phản hồi`} />
        <Kpi href="/cv" label="CV" value={tailoredCount(s)} sub={`bản tối ưu theo job${lowFields ? ` · ${lowFields} chỗ trong CV gốc cần xem` : ''}`} />
        <Kpi href="/insights" label="Thị trường" value="14–17 tr" sub={`mức lương bạn có thể đạt · còn thiếu ${missing.length} kỹ năng`} />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start gap-6 max-desk:grid-cols-[minmax(0,1fr)]">
        <div className="grid gap-6">
          <Panel id="needH" title="Cần bạn" aside={ds.length ? 'bấm để mở từng việc' : undefined}>
            {ds.length ? ds.map(d => <DecisionBlock key={'aid' in d ? d.aid : `${d.jid}-${'sid' in d ? d.sid : ''}`} d={d} />)
              : <p className="text-ink-2">Khi có câu CV cần xác nhận, job phải nộp tay hoặc thư mời phỏng vấn, chúng sẽ hiện ở đây.</p>}
          </Panel>

          <Panel id="progH" title="Hồ sơ ứng tuyển" aside="theo trạng thái · tự nhắc sau 5 ngày" href="/applications" linkLabel="Xem tất cả">
            <div className="grid grid-cols-4 gap-3 max-lap:grid-cols-2">
              {APP_ORDER.map(st => {
                const g = s.apps.filter(x => x.status === st);
                return (
                  <div key={st} className="grid content-start gap-2 rounded-ctl bg-pane p-3">
                    <span className="flex items-center justify-between"><StatusLabel tone={STATUS_TONE[st]}>{STATUS[st]}</StatusLabel><span className="text-13 text-ink-3 tabular-nums">{g.length}</span></span>
                    {g.length ? g.map(x => {
                      const j = jobById(x.jobId)!;
                      return (
                        <Link key={x.id} href={`/applications/${x.id}`} className="grid gap-0.5 rounded-ctl border border-rule bg-paper px-3 py-2 hover:border-rule-2">
                          <span className="block truncate text-14 font-medium">{j.company}</span>
                          <span className="block truncate text-12 text-ink-2">{j.title}</span>
                          <span className="text-11 text-ink-3 tabular-nums">{x.thread[x.thread.length - 1].date.split(' ·')[0]}</span>
                        </Link>
                      );
                    }) : <span className="text-13 text-ink-3">Chưa có</span>}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel id="tlH" title="Hôm nay autopilot đã làm">
            <ul>{log.map((e, i) => (
              <li key={i} className={cx('grid grid-cols-[64px_minmax(0,1fr)] gap-4 py-2.5 text-15 max-phone:grid-cols-[52px_minmax(0,1fr)]', i > 0 && 'border-t border-rule', e.you && 'font-medium text-brand-ink')}>
                <time className="pt-0.5 text-13 font-normal text-ink-3 tabular-nums">{e.t}</time><span>{e.you ? 'Bạn · ' : ''}{e.x}</span>
              </li>
            ))}</ul>
            {s.today.length > 4 && <button className={linkClass('mt-3 text-14')} onClick={() => update(d => { d.feedAll = !d.feedAll; })}>{s.feedAll ? 'Thu gọn' : `Xem thêm ${s.today.length - 4} mục`}</button>}
          </Panel>
        </div>

        <div className="grid gap-6">
          <Panel id="topH" title="Job khớp nhất" aside="chưa nộp" href="/jobs">
            <ul>{topJobs.map((j, i) => (
              <li key={j.id} className={cx(i > 0 && 'border-t border-rule')}>
                <Link href={`/jobs/${j.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-2.5 hover:bg-bg">
                  <span className="grid min-w-0 gap-0.5">
                    <span className="block truncate text-14 font-medium">{j.title}</span>
                    <span className="block truncate text-12 text-ink-3"><span className="text-ink-2">{j.company}</span> · {j.loc} · <span className="font-medium text-brand-ink">{j.salary}</span></span>
                    <span className="text-12"><JobStatus job={j} /></span>
                  </span>
                  <span className="grid justify-items-end gap-0.5">
                    <span className="text-20 leading-none font-extralight tracking-[-.03em] tabular-nums">{matchFor(s, j).score}<small className="ml-px text-[9px] font-normal text-ink-3">/100</small></span>
                    <Chance job={j} small />
                  </span>
                </Link>
              </li>
            ))}</ul>
          </Panel>

          <Panel id="mktH" title="Thị trường" aside="Junior Backend · TP.HCM" href="/insights" linkLabel="Phân tích">
            <p className="mb-2 text-13 text-ink-2">Số tin mỗi tháng, 12 tháng gần nhất: <strong className="font-medium text-ink">1.240</strong> tin đang mở.</p>
            <DemandChart />
            <h3 className="mt-4 mb-1 text-14 font-medium">Kỹ năng còn thiếu</h3>
            {missing.map((g, i) => (
              <div key={g.s} className={cx('grid grid-cols-[92px_minmax(0,1fr)_40px] items-center gap-3 py-2 text-14', i > 0 && 'border-t border-rule')}>
                <span>{g.s}</span><Bar value={g.d / 100} tone="amber" /><span className="text-right text-13 tabular-nums">{g.d}%</span>
              </div>
            ))}
          </Panel>

          <Panel id="cvH" title="CV của bạn" href="/cv" linkLabel="Quản lý CV">
            <div className="flex items-start gap-3 rounded-ctl bg-pane px-3 py-2.5 [--icon:18px]">
              <Icon name="file" className="mt-0.5 text-ink-3" />
              <span className="grid min-w-0 gap-0.5">
                <span className="block truncate text-14 font-medium">{s.cvFile.name}</span>
                <span className="text-12 text-ink-3">{s.cvFile.size} · tải lên {s.cvFile.when} · {s.cvFields.length} thông tin{lowFields ? ` · ${lowFields} chỗ cần xem` : ''}</span>
              </span>
            </div>
            <h3 className="mt-4 mb-1 text-14 font-medium">Bản tối ưu theo job</h3>
            <ul>{Object.keys(s.tailored).map((jid, i) => {
              const j = jobById(jid)!, app = appForJob(s, jid), rev = s.tailored[jid].filter(x => x.origin === 'review').length;
              return (
                <li key={jid} className={cx(i > 0 && 'border-t border-rule')}>
                  <Link href={`/jobs/${jid}?cv=${rev ? firstReview(s, jid) : 's1'}`} className="flex items-center gap-3 py-2 text-14 hover:bg-bg">
                    <span className="min-w-0 flex-1 truncate">{j.company} <span className="text-ink-3">· {j.title}</span></span>
                    {app ? <StatusLabel tone="mute">Đã nộp</StatusLabel> : rev ? <StatusLabel tone="warn">{rev} câu cần xem</StatusLabel> : <StatusLabel tone="ok">Sẵn sàng</StatusLabel>}
                  </Link>
                </li>
              );
            })}</ul>
          </Panel>
        </div>
      </div>
    </SheetPane>
  );
}

const actions = 'flex flex-wrap items-center gap-2';
const note = 'text-14 text-ink-2';

function DecisionBlock({ d }: { d: Decision }) {
  const { s, update } = useDemo();
  const apps = useApplicationActions();
  const sent = useSentenceActions();
  let id: string, kind: string, tone: 'ok' | 'warn', title: string, meta: string, body: ReactNode;

  if (d.type === 'reply') {
    const ap = appById(s, d.aid)!, j = jobById(ap.jobId)!, m = ap.thread.find(t => t.label)!;
    const draftId = `draft-${ap.id}`;
    id = 'p-' + ap.id; kind = 'Thư mời phỏng vấn'; tone = 'ok'; title = `${j.company} mời bạn phỏng vấn`; meta = m.date.split(' ·')[0];
    body = <>
      <p className="line-clamp-3 text-15 whitespace-pre-line text-ink-2">{m.body}</p>
      <div className={fieldClass}><label htmlFor={draftId} className={fieldLabelClass}>Thư trả lời đã soạn sẵn</label>
        <textarea className={textareaClass({ minH: 'min-h-[140px]' })} id={draftId} value={ap.draft} onChange={e => { const v = e.target.value; update(x => { appById(x, ap.id)!.draft = v; }); }} /></div>
      <div className={actions}>
        <button className={buttonClass('primary')} onClick={() => apps.sendReply(ap.id, () => document.getElementById(draftId)?.focus())}><Icon name="mail" />Xem lại và gửi</button>
        <Link className={buttonClass('quiet')} href={`/applications/${ap.id}`}>Mở chuỗi thư</Link>
      </div>
    </>;
  } else if (d.type === 'review') {
    const j = jobById(d.jid)!, x = s.tailored[d.jid].find(t => t.id === d.sid)!;
    const jd = jdParas(j).find(p => p[0] === x.jd);
    id = `r-${j.id}-${x.id}`; kind = 'Câu cần xác nhận'; tone = 'warn'; title = `“${x.text}”`; meta = j.company;
    body = <>
      <p className={note}>{x.note || ''}{jd ? ` JD viết: “${jd[1]}”` : ''}</p>
      <div className={actions}>
        <button className={buttonClass()} onClick={() => sent.confirm(j.id, x.id)}><Icon name="check" />Đúng, giữ câu</button>
        <button className={buttonClass()} onClick={() => sent.edit(j.id, x.id)}><Icon name="edit" />Sửa</button>
        <button className={buttonClass('danger')} onClick={() => sent.drop(j.id, x.id)}><Icon name="trash" />Bỏ câu</button>
        <Link className={buttonClass('quiet')} href={`/jobs/${j.id}?cv=${x.id}`}>Xem cả CV</Link>
      </div>
    </>;
  } else {
    const j = jobById(d.jid)!;
    id = 'm-' + j.id; kind = 'Nộp tay'; tone = 'warn'; title = `${j.title}, ${j.company}`; meta = `${matchFor(s, j).score} điểm`;
    body = <>
      <p className={note}>Trang tuyển dụng có CAPTCHA nên hệ thống không tự nộp. Mở trang, nộp bằng CV đã tối ưu, rồi đánh dấu đã nộp.</p>
      <div className={actions}>
        <button className={buttonClass()} onClick={apps.openSite}><Icon name="external" />Mở trang tuyển dụng</button>
        <button className={buttonClass()} onClick={() => apps.markManual(j.id)}><Icon name="check" />Đánh dấu đã nộp</button>
        <Link className={buttonClass('quiet')} href={`/jobs/${j.id}`}>Xem job</Link>
      </div>
    </>;
  }

  // Accordion: opening one closes the others.
  return (
    <details className="group border-t border-rule last:border-b" open={s.decOpen === id}
      onToggle={e => { const o = e.currentTarget.open; if (o && s.decOpen !== id) update(x => { x.decOpen = id; }); else if (!o && s.decOpen === id) update(x => { x.decOpen = null; }); }}>
      <summary className="group/sum grid min-h-[60px] grid-cols-[150px_minmax(0,1fr)_auto_16px] items-center gap-4 py-2 [--icon:16px] max-[760px]:grid-cols-[minmax(0,1fr)_16px] max-[760px]:gap-x-3 max-[760px]:gap-y-1">
        <StatusLabel tone={tone} className="max-[760px]:col-start-1">{kind}</StatusLabel>
        <span className="block truncate text-16 decoration-rule-2 underline-offset-4 group-hover/sum:underline max-[760px]:col-start-1">{title}</span>
        <span className="text-14 whitespace-nowrap text-ink-3 max-[760px]:col-start-1">{meta}</span>
        <Icon name="chev" className="text-ink-3 transition-transform duration-150 group-open:rotate-90 max-[760px]:col-start-2 max-[760px]:row-span-3 max-[760px]:row-start-1" />
      </summary>
      <div className="grid gap-4 pt-1 pb-7 pl-[166px] max-[760px]:pl-0">{body}</div>
    </details>
  );
}
