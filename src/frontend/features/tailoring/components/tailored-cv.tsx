'use client';

// SCR-32 content: tailored CV with provenance colours, evidence margin, cover letter.
import { Fragment } from 'react';
import { Icon } from '@/components/icon';
import { useDialogs } from '@/components/dialogs';
import { buttonClass, linkClass } from '@/components/ui/button';
import { fieldClass, fieldLabelClass, helpClass, textareaClass } from '@/components/ui/form';
import { Legend, Skeleton, StatusLabel } from '@/components/ui/misc';
import { ORIGIN, SEC_META } from '@/lib/demo/data';
import { matchFor, useDemo } from '@/lib/demo/store';
import { cx } from '@/lib/cn';
import { reducedMotion } from '@/lib/format';
import { useSentenceActions } from '../hooks/use-sentence-actions';
import type { Application, Job, Origin } from '@/lib/types';

/** Scroll to a JD paragraph and flash it. */
export function flashJd(pid: string) {
  const row = document.getElementById(`jd-${pid}`); if (!row) return;
  row.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
  row.dataset.flash = ''; setTimeout(() => { delete row.dataset.flash; }, 1600);
}

/** Background per sentence origin; shared with the legend swatches. */
export const ORIGIN_BG: Record<Origin, string> = {
  original: 'bg-transparent',
  rewritten: 'bg-rewritten',
  inferred: 'bg-amber-soft',
  review: 'bg-review border-b-2 border-dashed border-amber-line',
};
export const PROVENANCE_LEGEND: [string, string][] = [
  ['border border-rule-2 bg-white', 'Giữ nguyên'], ['bg-rewritten', 'Viết lại từ thông tin của bạn'],
  ['bg-amber-soft', 'Suy ra'], ['bg-review border-b-2 border-dashed border-amber-line', 'Cần bạn xem lại'],
];

const paperH4 = 'mt-6 mb-1 border-b border-[#2A2F33] pb-1 font-paper text-15 font-medium';

export function TailoredCv({ job: j, app, onJd = flashJd }: { job: Job; app?: Application; onJd?: (pid: string) => void }) {
  const { s, update } = useDemo();
  const { toast } = useDialogs();
  const act = useSentenceActions();
  const list = s.tailored[j.id];

  if (s.tailoring[j.id]) return (
    <div className="flex flex-col gap-3.5" aria-busy="true">
      <span className="text-14 text-ink-2">Đang viết lại CV theo JD này…</span>
      {[92, 64, 80, 70, 52].map(w => <Skeleton key={w} width={`${w}%`} />)}
    </div>
  );
  if (!list) return <p className="text-ink-2">{matchFor(s, j).score < s.auto.minScore
    ? `Job dưới ngưỡng ${s.auto.minScore} điểm nên autopilot bỏ qua. Bạn vẫn có thể tối ưu và nộp tay.`
    : 'Autopilot sẽ tối ưu trong lượt chạy tới, hoặc bấm “Tối ưu CV cho job này” ở trên.'}</p>;

  const sel = list.find(x => x.id === s.selSent) || list.find(x => x.origin === 'review') || list[0];
  const secs = [...new Set(list.map(x => x.sec))];
  const cover = s.cover[j.id] ?? `Kính gửi Anh/Chị phụ trách tuyển dụng ${j.company},\n\nEm là ${s.user.name}, lập trình viên backend mới tốt nghiệp. Trong 6 tháng thực tập tại Công ty GHI, em đã xây dựng REST API cho hệ thống đặt hàng bằng Node.js và MySQL, đúng với phần việc chính của vị trí ${j.title}.\n\nEm mong có cơ hội trao đổi thêm.\n\nTrân trọng,\n${s.user.name}`;

  const select = (sid: string) => {
    update(d => { d.selSent = sid; });
    if (matchMedia('(max-width:1240px)').matches) requestAnimationFrame(() => document.getElementById('evidence')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  };

  return (
    <>
      <Legend items={PROVENANCE_LEGEND} />
      <div className="grid grid-cols-[minmax(0,1fr)_260px] items-start gap-8 max-desk:grid-cols-[minmax(0,1fr)]">
        <article aria-label="CV đã tối ưu. Bấm từng câu để xem căn cứ"
          className="border border-rule bg-white px-[clamp(20px,4vw,52px)] py-12 font-paper text-[#1A1D20] shadow-[0_1px_0_var(--color-rule),0_18px_40px_-24px_rgba(26,26,24,.22)] max-phone:px-4 max-phone:py-6">
          <h3 className="font-paper text-24 font-medium">{s.user.name}</h3>
          <p className="mt-1 text-13 text-[#50575D]">{j.title} · {s.user.city} · {s.user.email} · 09•• ••• 412</p>
          {secs.map(sec => (
            <Fragment key={sec}>
              <h4 className={paperH4}>{sec}</h4>
              {SEC_META[sec] && <p className="mt-2 text-14 font-medium">{SEC_META[sec]}</p>}
              {list.filter(x => x.sec === sec).map(x => (
                <button key={x.id} data-sid={x.id} aria-pressed={sel?.id === x.id} onClick={() => select(x.id)}
                  className={cx('-mx-2 mt-0.5 block w-[calc(100%+16px)] rounded-[3px] px-2 py-1 text-left font-paper text-15 leading-[1.6]',
                    'hover:shadow-[inset_0_0_0_1px_var(--color-rule-2)] aria-pressed:shadow-[inset_0_0_0_2px_var(--color-ink)]',
                    x.origin === 'review' ? ORIGIN_BG.review : cx('border-b-2 border-transparent', ORIGIN_BG[x.origin]))}>
                  <span className="sr-only">{ORIGIN[x.origin][0]}: </span>{x.text}
                </button>
              ))}
            </Fragment>
          ))}
        </article>
        <aside id="evidence" aria-live="polite" aria-label="Căn cứ của câu đang chọn"
          className="sticky top-6 grid gap-4 text-14 max-desk:static max-desk:border-t max-desk:border-rule max-desk:pt-4">
          {sel && (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-13 font-medium">Vì sao có câu này</h3>
              <StatusLabel tone={ORIGIN[sel.origin][1]}>{ORIGIN[sel.origin][0]}</StatusLabel>
              {sel.note && <p className="text-amber">{sel.note}</p>}
              {sel.ev.length > 0 && <ul className="grid list-disc gap-1.5 pl-4">{sel.ev.map(e => <li key={e}>{e}</li>)}</ul>}
              {sel.orig && sel.orig !== sel.text && (
                <div className="flex flex-col gap-1"><span className="text-13 text-ink-3">Trong CV gốc</span>
                  <p className="border-l-2 border-rule-2 pl-3 font-paper text-14 text-ink-2">{sel.orig}</p></div>
              )}
              {sel.jd && <button className={linkClass('self-start')} onClick={() => onJd(sel.jd!)}>Đoạn JD liên quan</button>}
              {app ? <p className="text-13 text-ink-3">Hồ sơ đã nộp nên bản này không sửa được nữa.</p> : (
                <div className="flex flex-wrap gap-2">
                  {sel.origin === 'review' && <>
                    <button className={buttonClass('default', 'sm')} onClick={() => act.confirm(j.id, sel.id)}><Icon name="check" />Đúng, giữ</button>
                    <button className={buttonClass('danger', 'sm')} onClick={() => act.drop(j.id, sel.id)}><Icon name="trash" />Bỏ</button>
                  </>}
                  <button className={buttonClass('default', 'sm')} onClick={() => act.edit(j.id, sel.id)}><Icon name="edit" />Sửa</button>
                  {sel.orig && sel.orig !== sel.text && <button className={buttonClass('default', 'sm')} onClick={() => act.undo(j.id, sel.id)}><Icon name="undo" />Hoàn tác</button>}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
      <details className="group mt-6 border-y border-rule" open={s.coverOpen} onToggle={e => { const o = e.currentTarget.open; if (o !== s.coverOpen) update(d => { d.coverOpen = o; }); }}>
        <summary className="flex min-h-12 items-center gap-2 font-medium [--icon:16px]"><Icon name="chev" className="transition-transform duration-150 group-open:rotate-90" />Cover letter</summary>
        <div className="grid gap-3 pb-4">
          <div className={fieldClass}><label htmlFor="coverText" className={fieldLabelClass}>Gửi kèm hồ sơ {j.company}</label><span className={helpClass}>Mọi câu đều dựa trên thông tin trong CV gốc.</span>
            <textarea id="coverText" className={textareaClass({ minH: 'min-h-[260px]' })} readOnly={!!app} value={cover}
              onChange={e => { const v = e.target.value; update(d => { d.cover[j.id] = v; }); }} />
          </div>
          {!app && <div><button className={buttonClass('default', 'sm')} onClick={() => toast('Đã lưu cover letter')}><Icon name="check" />Lưu cover letter</button></div>}
        </div>
      </details>
    </>
  );
}
