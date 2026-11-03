'use client';

// SCR-42: 8-step pipeline, apply conditions, when the system asks the user.
import Link from 'next/link';
import { useRef, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { useDialogs } from '@/components/dialogs';
import { buttonClass } from '@/components/ui/button';
import { helpClass, inputClass } from '@/components/ui/form';
import { Chip, IconList, StatusLabel } from '@/components/ui/misc';
import { Eyebrow, H1, Section } from '@/components/ui/typography';
import { SheetPane } from '@/components/workspace/shell';
import { qualified, useDemo } from '@/lib/demo/store';
import { cx } from '@/lib/cn';
import { fold } from '@/lib/format';
import { STEPS, currentStep, stepHref } from '../steps';

type StepState = 'done' | 'running' | 'wait';
const stepState = (n: number, cur: number): StepState => (n < cur ? 'done' : n === cur ? 'running' : 'wait');
const selectClass = inputClass({ width: 'w-[140px]' });

function RunStrip() {
  const { s } = useDemo();
  const a = s.auto, cur = currentStep(s);
  const status = a.finished ? 'Đã chạy xong 8 bước' : a.paused ? `Tạm dừng ở bước ${cur}/8` : `Đang chạy bước ${cur}/8 · ${STEPS[cur - 1][0]}`;
  return (
    <ol aria-label={status} className="grid grid-cols-8 gap-1.5 max-tab:grid-cols-4 max-tab:gap-y-3">
      {STEPS.map((st, i) => {
        const n = i + 1, state = stepState(n, cur);
        return (
          <li key={n} className="grid gap-1.5">
            <span aria-hidden="true" className={cx('block h-1 rounded-sm',
              state === 'done' ? 'bg-gold'
                : state === 'running' ? (a.paused ? 'bg-ink-3' : 'animate-run bg-[linear-gradient(90deg,var(--color-ink)_0_40%,var(--color-rule)_40%_100%)] bg-size-[250%_100%]')
                  : 'bg-rule')} />
            <span className={cx('block truncate text-13', state === 'running' ? 'font-medium text-ink' : state === 'done' ? 'text-ink-2' : 'text-ink-3')}>
              <span className="tabular-nums">{n}</span> {st[0]}{state === 'done' && <span className="sr-only"> — xong</span>}{state === 'running' && <span className="sr-only"> — đang chạy</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Settings row: label + help on the left, control on the right. */
function SetRow({ label, help, children, first }: { label: ReactNode; help: ReactNode; children: ReactNode; first?: boolean }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-6 py-4', !first && 'border-t border-rule')}>
      <div className="grid flex-[1_1_280px] gap-0.5">{label}<span className={helpClass}>{help}</span></div>
      <div className="grid flex-[0_1_360px] justify-items-end gap-2 max-tab:basis-full max-tab:justify-items-start">{children}</div>
    </div>
  );
}

export function AutopilotPage() {
  const { s, update } = useDemo();
  const { toast } = useDialogs();
  const exRef = useRef<HTMLInputElement>(null);
  const a = s.auto, cur = currentStep(s);

  const togglePause = () => {
    if (s.deleteScheduled) { toast('Hủy yêu cầu xóa tài khoản để bật lại autopilot'); return; }
    update(d => { d.auto.paused = !d.auto.paused; });
    toast(a.paused ? 'Autopilot tiếp tục chạy' : 'Đã tạm dừng autopilot');
  };
  const addEx = () => {
    const inp = exRef.current!, v = inp.value.trim();
    if (!v) { inp.focus(); return; }
    update(d => { if (!d.auto.excluded.some(c => fold(c) === fold(v))) d.auto.excluded.push(v); });
    inp.value = ''; toast(`Sẽ không nộp vào ${v}`); inp.focus();
  };

  return (
    <SheetPane>
      <Eyebrow>Tự động ứng tuyển</Eyebrow>
      <div className="flex flex-wrap items-end gap-6">
        <div className="min-w-[260px] flex-1"><H1>Nạp CV một lần,<br />hệ thống lo phần còn lại.</H1></div>
        <div className="flex flex-wrap items-center gap-2">
          {!a.finished && <button className={buttonClass()} onClick={togglePause}><Icon name={a.paused ? 'play' : 'pause'} />{a.paused ? 'Tiếp tục' : 'Tạm dừng'}</button>}
          <button className={buttonClass()} onClick={() => { update(d => { Object.assign(d.auto, { step: 1, finished: false, paused: false, live: true }); }); toast('Bắt đầu lượt chạy mới'); }}><Icon name="refresh" />Chạy lại từ đầu</button>
        </div>
      </div>
      <div className="mt-8"><RunStrip /></div>

      <Section headingId="stH" title="Tám bước" aside={a.finished ? 'đã xong' : a.paused ? `tạm dừng ở bước ${cur}` : `đang ở bước ${cur}`}>
        <ol>{STEPS.map((st, i) => {
          const n = i + 1, state = stepState(n, cur);
          return (
            <li key={n} className={cx(i > 0 && 'border-t border-rule')}>
              <Link href={stepHref(i, s)} aria-label={`Bước ${n}: ${st[0]} — xem chi tiết`}
                className="group -mx-3 grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)_20px] items-start gap-4 rounded-ctl px-3 py-3 transition-colors hover:bg-pane max-tab:grid-cols-[32px_minmax(0,1fr)_20px]">
                <span className={cx('pt-0.5 text-14 tabular-nums', state === 'done' ? 'text-gold-ink' : state === 'running' ? 'font-medium text-ink' : 'text-ink-3')}>
                  {state === 'done' ? <Icon name="check" /> : String(n).padStart(2, '0')}</span>
                <div><strong className="decoration-rule-2 underline-offset-4 group-hover:underline">{st[0]}</strong>{state === 'running' && <> <StatusLabel tone="ink" plain>· {a.paused ? 'tạm dừng' : 'đang chạy'}</StatusLabel></>}<p className="text-14 text-ink-2">{st[1]}</p></div>
                <div className="text-14 max-tab:col-start-2 max-tab:row-start-2">{state === 'done' ? st[2](s) : <span className="text-ink-3">—</span>}{st[3] && <p className="mt-1 text-13 text-amber">{st[3]}</p>}</div>
                <Icon name="chev" className="mt-1 text-ink-3 transition-transform [--icon:16px] group-hover:translate-x-0.5 max-tab:col-start-3 max-tab:row-start-1" />
              </Link>
            </li>
          );
        })}</ol>
      </Section>

      <Section headingId="cdH" title="Điều kiện nộp" aside="có sẵn mặc định, không chỉnh vẫn chạy">
        <SetRow first label={<label htmlFor="minScore" className="font-medium">Chỉ nộp job khớp từ</label>} help={`${qualified(s)} job đang đạt ngưỡng này`}>
          <select id="minScore" className={selectClass} value={a.minScore}
            onChange={e => { const v = +e.target.value; update(d => { d.auto.minScore = v; }); toast(`Chỉ nộp job từ ${v} điểm`); }}>
            {[60, 65, 70, 75, 80].map(v => <option key={v} value={v}>{v} điểm</option>)}</select>
        </SetRow>
        <SetRow label={<label htmlFor="daily" className="font-medium">Tối đa mỗi ngày</label>} help={`Hôm nay đã nộp ${s.apps.length}`}>
          <select id="daily" className={selectClass} value={a.daily}
            onChange={e => { const v = +e.target.value; update(d => { d.auto.daily = v; }); toast(`Tối đa ${v} hồ sơ mỗi ngày`); }}>
            {[5, 10, 20, 30].map(v => <option key={v} value={v}>{v} hồ sơ</option>)}</select>
        </SetRow>
        <SetRow label={<label htmlFor="exInput" className="font-medium">Không nộp vào</label>} help="Ví dụ công ty bạn đang làm">
          <div className="flex flex-wrap justify-end gap-2 max-tab:justify-start">{a.excluded.length ? a.excluded.map((c, i) => (
            <Chip key={c} removeLabel={`Bỏ ${c} khỏi danh sách loại trừ`} onRemove={() => { update(d => { d.auto.excluded.splice(i, 1); }); toast(`Đã bỏ ${c} khỏi danh sách loại trừ`); exRef.current?.focus(); }}>{c}</Chip>
          )) : <span className="text-13 text-ink-3">Chưa loại trừ công ty nào</span>}</div>
          <div className="flex w-full items-center gap-2">
            <input id="exInput" ref={exRef} className={inputClass({ extra: 'min-w-0 flex-1' })} placeholder="Tên công ty" autoComplete="off" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEx(); } }} />
            <button className={buttonClass('default', 'md', 'flex-none')} type="button" onClick={addEx}><Icon name="plus" />Thêm</button>
          </div>
        </SetRow>
        <fieldset>
          <legend className="sr-only">Cách dùng CV đã tối ưu</legend>
          <SetRow label={<span className="font-medium">Cách dùng CV đã tối ưu</span>} help="Áp dụng cho mọi job tự nộp">
            {([['auto', 'Tự động — dùng ngay, xem lại sau'], ['review', 'Duyệt trước — chờ bạn đồng ý từng bản']] as const).map(([v, l]) => (
              <label key={v} className="flex min-h-9 items-center gap-2 text-15"><input type="radio" name="mode" value={v} checked={a.mode === v} className="size-[17px] accent-ink"
                onChange={() => { update(d => { d.auto.mode = v; }); toast(v === 'auto' ? 'Tự động: dùng CV đã tối ưu ngay khi nộp' : 'Duyệt trước: chờ bạn đồng ý từng bản'); }} />{l}</label>
            ))}
          </SetRow>
        </fieldset>
      </Section>

      <Section headingId="askH" title="Hệ thống chỉ hỏi bạn khi">
        <IconList items={[['edit', 'Một câu trong CV đã tối ưu chưa đủ căn cứ'], ['hand', 'Trang tuyển dụng bắt buộc nộp tay, ví dụ có CAPTCHA'], ['mail', 'Có thư mời phỏng vấn cần trả lời']]} />
      </Section>
    </SheetPane>
  );
}
