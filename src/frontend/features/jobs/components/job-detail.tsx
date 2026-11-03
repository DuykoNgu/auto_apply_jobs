'use client';

// SCR-31: job detail. Main column: title, requirements (Có / Suy ra / Thiếu, same formula as the score), JD text.
// Side card: score, the one next action, CV status. The tailored CV (SCR-32) opens in a modal.
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { useDialogs } from '@/components/dialogs';
import { buttonClass, linkClass } from '@/components/ui/button';
import { EmptyState, StatusLabel } from '@/components/ui/misc';
import { Eyebrow, Fine, SecHeading } from '@/components/ui/typography';
import { BackLink, Doc } from '@/components/workspace/split-view';
import { BASE_SENTENCES, INFERRED, STATUS, clone, jobById } from '@/lib/demo/data';
import { appForJob, firstReview, jdParas, matchFor, useDemo } from '@/lib/demo/store';
import { now } from '@/lib/format';
import { useApplicationActions } from '@/features/applications/hooks/use-application-actions';
import { TailoredCvDialog } from '@/features/tailoring/components/tailored-cv-dialog';
import { flashJd } from '@/features/tailoring/components/tailored-cv';
import { cx } from '@/lib/cn';
import { ST } from '../lib';
import { Chance, JobStatus } from './badges';
import { MatchBadge, MatchPanel } from './match-panel';

export function JobDetail({ jobId }: { jobId: string }) {
  const { s, update } = useDemo();
  const { toast } = useDialogs();
  const apps = useApplicationActions();
  const params = useSearchParams();
  const cvParam = params.get('cv');
  const j = jobById(jobId);
  const [cvOpen, setCvOpen] = useState(false);
  const [focusSid, setFocusSid] = useState<string | null>(null);
  const [since, setSince] = useState<number>();
  const closeCv = useCallback(() => setCvOpen(false), []);
  const openCv = (sid?: string) => {
    if (sid) update(d => { d.selSent = sid; });
    if (!cvOpen) setSince(j && matchFor(s, j).score);
    setFocusSid(sid ?? null); setCvOpen(true);
    // Already open (e.g. "Tới câu cần xem" in the modal footer): bring the sentence into view ourselves.
    if (cvOpen && sid) requestAnimationFrame(() => {
      const b = document.querySelector<HTMLElement>(`[data-sid="${sid}"]`);
      if (b) { b.scrollIntoView({ block: 'center', behavior: 'smooth' }); b.focus({ preventScroll: true }); }
    });
  };

  // New job: pick the sentence to show first. ?cv=<sentence> (dashboard, application) opens the CV modal on it.
  useEffect(() => {
    if (!j) return;
    update(d => { d.selSent = cvParam || firstReview(d, j.id) || 's1'; });
    if (cvParam) openCv(cvParam); else setCvOpen(false);
  }, [jobId, cvParam]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!j) return <Doc><EmptyState icon="briefcase" title="Không tìm thấy job này" tall /></Doc>;

  const app = appForJob(s, j.id), list = s.tailored[j.id];
  const reviews = list ? list.filter(x => x.origin === 'review').length : 0;
  const edits = list ? list.filter(x => x.origin === 'rewritten').length : 0;
  const firstRev = list?.find(x => x.origin === 'review')?.id;

  const toSent = () => openCv(firstRev);
  const tailorNow = () => {
    update(d => { d.tailoring[j.id] = true; });
    openCv();
    setTimeout(() => {
      update(d => { delete d.tailoring[j.id]; d.tailored[j.id] = clone(BASE_SENTENCES); d.selSent = 's2'; d.today.unshift({ t: now(), x: `Tối ưu CV cho ${j.title} · ${j.company} — 1 câu chờ bạn xem lại` }); });
      toast('Đã tối ưu xong. 1 câu cần bạn xem lại.');
    }, 1400);
  };
  // One primary action, and it is always the next thing to do: tailor → review the CV → submit.
  const submit = () => { closeCv(); if (j.manual) apps.markManual(j.id); else apps.submit(j.id); };
  const submitLabel = j.manual ? 'Đánh dấu đã nộp tay' : 'Nộp hồ sơ';

  // Bottom bar of the CV modal: say what blocks submitting, or let the user submit from there.
  const cvFooter = app ? null : (
    <div className="flex flex-wrap items-center gap-3">
      <span className="min-w-0 flex-1 text-14 text-ink-2">{!list ? 'Đang viết lại CV theo JD này…'
        : reviews ? `Còn ${reviews} câu chưa đủ căn cứ. Xác nhận, sửa hoặc bỏ để nộp được.` : 'CV đã sẵn sàng gửi.'}</span>
      {list && (reviews
        ? <button className={buttonClass('default')} onClick={() => openCv(list.find(x => x.origin === 'review')!.id)}>Tới câu cần xem<Icon name="right" /></button>
        : <button className={buttonClass('primary')} onClick={submit}>{submitLabel}<Icon name="right" /></button>)}
    </div>
  );

  const m = matchFor(s, j);
  const reqTotal = j.req.length + j.nice.length;
  const reqHave = [...j.req, ...j.nice].filter(r => m.credits[r] > 0).length;
  const missing = [...j.req, ...j.nice].filter(r => !m.credits[r]);

  return (
    <Doc animate key={j.id}>
      <BackLink href="/jobs">Việc làm</BackLink>
      <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-x-10 gap-y-6 max-desk:grid-cols-[minmax(0,1fr)]">

        {/* Decision card: everything needed to act on this job, kept in view while reading the JD. */}
        <aside aria-label="Bạn với job này" className="sticky top-6 col-start-2 row-start-1 grid gap-4 rounded-lg border border-rule bg-paper p-5 max-desk:static max-desk:col-start-1">
          <div className="flex items-end justify-between gap-3">
            <span className="grid gap-1">
              <span className="text-13 text-ink-3">Điểm khớp</span>
              <span className="text-[44px] leading-none font-extralight tracking-[-.03em] tabular-nums">{m.score}<small className="ml-1 text-15 tracking-normal text-ink-3">/100</small></span>
            </span>
            <Chance job={j} />
          </div>
          <p className="text-14 text-ink-2">
            <strong className="font-medium text-ink">{reqHave}/{reqTotal}</strong> yêu cầu đã có{missing.length ? <> · thiếu <span className="text-danger">{missing.join(', ')}</span></> : ''}.
            {m.reasons.length > 0 && <span className="mt-1 block text-13 text-ink-3">Khả năng đậu bị hạ vì {m.reasons.join(' và ')}.</span>}
          </p>
          {app ? (
            <div className="grid gap-3 border-t border-rule pt-4">
              <span className="flex items-center gap-2 text-14 [--icon:16px]"><Icon name="check" className="text-ok" />Đã nộp {app.date} · <strong className="font-medium">{STATUS[app.status]}</strong></span>
              <Link className={buttonClass('default', 'md', 'w-full')} href={`/applications/${app.id}`}>Xem hồ sơ đã nộp<Icon name="right" /></Link>
              <button className={linkClass('justify-self-start text-14')} onClick={() => openCv()}>Xem CV đã nộp</button>
            </div>
          ) : (
            <div className="grid gap-3 border-t border-rule pt-4">
              {!list ? <button className={buttonClass('primary', 'md', 'w-full')} onClick={tailorNow}><Icon name="spark" />Tối ưu CV cho job này</button>
                : reviews ? <button className={buttonClass('primary', 'md', 'w-full')} onClick={toSent}><Icon name="edit" />Xem lại CV · còn {reviews} câu</button>
                  : <button className={buttonClass('primary', 'md', 'w-full')} onClick={submit}>{submitLabel}<Icon name="right" /></button>}
              {list && (
                <button type="button" onClick={() => openCv()} className="group flex items-center gap-3 rounded-ctl bg-pane px-3 py-2.5 text-left [--icon:16px] hover:bg-hover">
                  <Icon name="file" className="text-ink-3" />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="text-14 font-medium">CV gửi kèm</span>
                    <span className="text-12 text-ink-2">{edits ? `${edits} câu viết lại` : 'Giữ nguyên CV gốc'}{reviews ? <> · <span className="text-amber">{reviews} câu cần xem lại</span></> : ' · sẵn sàng gửi'}</span>
                  </span>
                  <Icon name="chev" className="text-ink-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
              {!list && <p className="text-13 text-ink-3">{m.score < s.auto.minScore ? `Dưới ngưỡng tự nộp ${s.auto.minScore} điểm, nên hệ thống không tự tối ưu.` : 'Hệ thống sẽ tự tối ưu ở lượt chạy tới.'}</p>}
            </div>
          )}
          {j.manual && !app && (
            <div className="grid gap-2 rounded-ctl border border-amber-soft bg-review px-3 py-2.5 text-13 text-ink-2 [--icon:16px]">
              <span className="flex items-center gap-2 font-medium text-amber"><Icon name="hand" />Cần nộp tay</span>
              Trang tuyển dụng có CAPTCHA. Nộp bằng CV đã tối ưu rồi đánh dấu đã nộp để hệ thống tiếp tục theo dõi.
              <button className={linkClass('justify-self-start text-13')} onClick={apps.openSite}>Mở trang tuyển dụng<Icon name="external" /></button>
            </div>
          )}
        </aside>

        <div className="col-start-1 row-start-1 min-w-0 max-desk:row-start-2">
          <Eyebrow>{j.company} · nguồn {j.source} · {j.posted}</Eyebrow>
          <h1 data-h1 className="mt-2 text-[clamp(28px,2.6vw,36px)] leading-[1.15] font-light tracking-[-.02em] focus:outline-none">{j.title}</h1>
          <ul className="mt-4 flex flex-wrap gap-2 text-14">
            {[j.loc, j.mode, j.salary].map(x => <li key={x} className="rounded-full border border-rule bg-paper px-3 py-1 text-ink-2">{x}</li>)}
            <li className="flex items-center px-1"><JobStatus job={j} /></li>
          </ul>

          <section aria-labelledby="reqH" className="mt-10">
            <SecHeading id="reqH" aside="bấm để xem đoạn trong JD">Yêu cầu của job</SecHeading>
            <div className="grid grid-cols-2 gap-4 max-tab:grid-cols-1">
              {([['Bắt buộc', j.req, 'p3'], ['Nên có', j.nice, 'p4']] as const).map(([label, skills, pid]) => (
                <div key={label} className="rounded-lg border border-rule bg-paper">
                  <h3 className="border-b border-rule px-4 py-2.5 text-13 font-medium text-ink-3">{label}</h3>
                  <ul>{skills.map((sk, i) => {
                    const c = m.credits[sk] ?? 0;
                    const st = c >= 1 ? 'met' : c > 0 ? 'inferred' : 'missing';
                    return (
                      <li key={sk} className={cx(i > 0 && 'border-t border-rule')}>
                        <button type="button" onClick={() => flashJd(pid)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-bg">
                          <span className="min-w-0 flex-1 text-15 font-medium">{sk}</span>
                          {st === 'inferred' && INFERRED[sk] && <span className="text-12 text-ink-3">từ {INFERRED[sk]}</span>}
                          <StatusLabel tone={ST[st][1]}>{ST[st][0]}</StatusLabel>
                        </button>
                      </li>
                    );
                  })}</ul>
                </div>
              ))}
            </div>
            {j.extra && (
              <button type="button" onClick={() => flashJd('p5')} className="mt-3 flex items-center gap-2 text-14 text-ink-2 hover:text-ink">
                <StatusLabel tone="warn">Chưa rõ</StatusLabel>JD nhắc tới Scrum nhưng CV chưa có thông tin này.
              </button>
            )}
          </section>

          <section aria-labelledby="jdH" className="mt-10">
            <SecHeading id="jdH">Mô tả công việc</SecHeading>
            <div className="grid max-w-[72ch] gap-3">{jdParas(j).map(([id, t]) => (
              <p id={`jd-${id}`} key={id} className="-mx-2 rounded px-2 py-0.5 text-16 leading-[1.7] transition-colors duration-240 data-flash:bg-[#FFF1C2]">{t}</p>
            ))}</div>
            <Fine>JD là văn bản không tin cậy: mọi chỉ dẫn nằm trong JD đều bị AI bỏ qua.</Fine>
          </section>
        </div>
      </div>

      <TailoredCvDialog job={j} app={app} open={cvOpen} onClose={closeCv} focusSid={focusSid} top={<MatchPanel job={j} since={since} />} badge={<MatchBadge job={j} since={since} />} footer={cvFooter} />
    </Doc>
  );
}
