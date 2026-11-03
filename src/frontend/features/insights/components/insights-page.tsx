'use client';

// SCR-20: where you stand, hiring demand, skill gaps + 3-year roadmap.
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icon';
import { linkClass } from '@/components/ui/button';
import { Bar, Legend, StatusLabel } from '@/components/ui/misc';
import { Eyebrow, Fine, H1, Lead, SecHeading, Section } from '@/components/ui/typography';
import { SheetPane } from '@/components/workspace/shell';
import { JOBS } from '@/lib/demo/data';
import { useDemo } from '@/lib/demo/store';
import { cx } from '@/lib/cn';
import { DEMAND, DEMAND_MIX, FOCUS_PATHS, GAPS, LEVELS, MONTHS } from '../data';

type Tab = 'you' | 'demand' | 'gaps';
const TABS: [Tab, string][] = [['you', 'Bạn đang ở đâu'], ['demand', 'Nhu cầu tuyển dụng'], ['gaps', 'Skill gaps & lộ trình']];
const muted66 = 'max-w-[66ch] text-ink-2';

export function InsightsPage() {
  const { s, update } = useDemo();
  const tab = s.marketTab;
  const setTab = (id: Tab, focus = true) => {
    update(d => { d.marketTab = id; });
    const sp = document.getElementById('sheetPane'); if (sp) sp.scrollTop = 0;
    if (focus) document.getElementById(`mtab-${id}`)?.focus();
  };
  return (
    <SheetPane>
      <Eyebrow>Thị trường · Junior Backend · TP.HCM</Eyebrow>
      <div role="tablist" aria-label="Thị trường của bạn"
        className="mt-6 flex gap-8 overflow-x-auto border-b border-rule [scrollbar-width:none] max-phone:gap-6 [&::-webkit-scrollbar]:hidden">
        {TABS.map(([id, label], i) => (
          <button key={id} id={`mtab-${id}`} type="button" role="tab" aria-selected={id === tab} aria-controls="mpanel" tabIndex={id === tab ? 0 : -1}
            className="relative min-h-12 flex-none pb-[13px] text-15 whitespace-nowrap text-ink-3 transition-colors duration-150 hover:text-ink aria-selected:font-medium aria-selected:text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-px after:content-[''] aria-selected:after:h-0.5 aria-selected:after:bg-gold"
            onClick={() => setTab(id)}
            onKeyDown={e => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
              e.preventDefault();
              const n = e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
              setTab(TABS[n][0]);
            }}>{label}</button>
        ))}
      </div>
      <div className="animate-fade-in pt-8" id="mpanel" role="tabpanel" aria-labelledby={`mtab-${tab}`} key={tab}>
        {tab === 'you' ? <You /> : tab === 'demand' ? <Demand /> : <Gaps />}
      </div>
    </SheetPane>
  );
}

function You() {
  const lo = 8, hi = 26, p = (x: number) => ((x - lo) / (hi - lo) * 100).toFixed(1) + '%';
  const kpi = (n: string, t: string) => (
    <div className="grid gap-1.5"><span className="block text-[clamp(30px,3.4vw,44px)] leading-none font-extralight tracking-[-.03em] tabular-nums">{n}</span><span className="block text-14 text-ink-2">{t}</span></div>
  );
  return <>
    <H1 flush>Bạn đang ở đâu.</H1>
    <Lead>So CV của bạn với 1.240 tin đang mở. Con số do thống kê tính, AI chỉ viết phần giải thích.</Lead>
    <div className="mt-8 grid grid-cols-3 gap-6 max-phone:grid-cols-2">
      {kpi('Junior', 'cấp độ hiện tại · 6 tháng thực tập')}{kpi('14–17 tr', 'mức lương bạn có thể đạt')}{kpi('4/8', 'kỹ năng hay gặp bạn đã có')}
    </div>
    <Section headingId="sH" title="Mức lương" aside="triệu đồng/tháng">
      <p className={muted66}>Khoảng phổ biến 12–18 tr, trung vị 15 tr. Ước tính của bạn dựa trên 6 tháng thực tập và bộ kỹ năng hiện có.</p>
      <div className="relative mt-4 mb-2 h-9" aria-hidden="true">
        <div className="absolute inset-x-0 top-4 h-1 rounded-sm bg-rule" />
        <div className="absolute top-3.5 h-2 rounded-sm bg-[#9FCBBC]" style={{ left: p(12), width: `calc(${p(18)} - ${p(12)})` }} />
        <div className="absolute top-2 h-5 rounded border-2 border-ink" style={{ left: p(14), width: `calc(${p(17)} - ${p(14)})` }} />
        <div className="absolute top-1 h-7 w-0.5 bg-ink" style={{ left: p(15) }} />
      </div>
      <div className="flex justify-between text-12 text-ink-3 tabular-nums" aria-hidden="true">{[8, 11, 14, 17, 20, 23, 26].map(x => <span key={x}>{x}</span>)}</div>
      <Legend className="mt-3" items={[['bg-[#9FCBBC]', 'Khoảng phổ biến'], ['border-2 border-ink', 'Bạn có thể đạt'], ['!w-[3px] bg-ink', 'Trung vị']]} />
    </Section>
    <Section headingId="lH" title="So với các cấp" aside="lương theo tháng">
      {LEVELS.map(([n, r, note], i) => {
        const now = n === 'Junior';
        return (
          <div key={n} className={cx('grid grid-cols-[104px_108px_minmax(0,1fr)] items-center gap-4 py-[13px] text-14 max-phone:grid-cols-[84px_minmax(0,1fr)] max-phone:gap-y-0.5',
            now ? '-mx-3 rounded bg-brand-soft px-3 max-phone:-mx-2 max-phone:px-2' : i > 0 && 'border-t border-rule')}>
            <span className="text-15 font-medium">{n}</span><span className="text-ink-2">{r}</span>
            <span className="flex flex-wrap items-center gap-2.5 text-ink-3 max-phone:col-span-full">{note}
              {now && <span className="rounded-full border border-brand-soft bg-paper px-2 text-12 leading-[19px] font-medium text-brand-ink">bạn ở đây</span>}</span>
          </div>
        );
      })}
      <Fine>Lương Junior ở TP.HCM cao hơn mặt bằng chung khoảng 8%, đổi lại cạnh tranh cũng cao hơn.</Fine>
    </Section>
  </>;
}

export function DemandChart() {
  const W = 720, H = 220, Lp = 44, R = 12, T = 20, B = 30, min = 700, max = 1300;
  const x = (i: number) => Lp + i * (W - Lp - R) / (DEMAND.length - 1);
  const y = (val: number) => T + (1 - (val - min) / (max - min)) * (H - T - B);
  const lx = x(11), ly = y(DEMAND[11]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" className="block h-auto w-full" aria-label="Số tin Junior Backend ở TP.HCM theo tháng, tăng từ 820 lên 1.240 trong 12 tháng">
      {[800, 1000, 1200].map(g => <g key={g}><line x1={Lp} x2={W - R} y1={y(g)} y2={y(g)} stroke="#E2E5E6" />
        <text x={Lp - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="#5E656B">{g}</text></g>)}
      <polyline points={DEMAND.map((val, i) => `${x(i).toFixed(1)},${y(val).toFixed(1)}`).join(' ')} fill="none" stroke="#111416" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="4.5" fill="#0F5C4D" />
      <text x={lx - 10} y={ly - 10} textAnchor="end" fontSize="12" fontWeight="600" fill="#111416">1.240</text>
      {MONTHS.map((m, i) => (i % 2 === 0 || i === 11) && <text key={m} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#5E656B">{m}</text>)}
    </svg>
  );
}

function Demand() {
  return <>
    <H1 flush>Nhu cầu tuyển dụng.</H1>
    <Lead>1.240 tin Junior Backend đang mở tại TP.HCM. Tin tập trung ở đâu, ở vị trí nào và làm theo hình thức nào.</Lead>
    <Section headingId="dH" title="Số tin mỗi tháng" aside="12 tháng gần nhất"><DemandChart /></Section>
    <Section headingId="mixH" title="Tin tập trung ở đâu" aside="tỷ lệ trong 1.240 tin">
      <div className="grid grid-cols-3 gap-x-8 gap-y-6 max-lap:grid-cols-1 max-lap:gap-6">{DEMAND_MIX.map(([h, rows]) => (
        <div key={h}><h3 className="mb-1 border-b border-rule pb-2 text-14 font-medium">{h}</h3>
          {rows.map(([k, n]) => (
            <div className="grid grid-cols-[90px_minmax(0,1fr)_40px] items-center gap-3 py-2 text-14" key={k}>
              <span>{k}</span><Bar value={n / 100} tone={k === 'TP.HCM' ? 'brand' : 'ink'} /><span className="text-right text-13 tabular-nums">{n}%</span>
            </div>
          ))}
        </div>
      ))}</div>
      <Fine>Hybrid và remote cộng lại 54%, nhưng phần lớn vẫn yêu cầu có mặt ở TP.HCM ít nhất vài ngày mỗi tuần.</Fine>
    </Section>
  </>;
}

function Gaps() {
  const router = useRouter();
  const { s, update } = useDemo();
  const d = s.focusPath ? FOCUS_PATHS[s.focusPath] : null;
  const toJobs = (skill: string | null) => { update(x => { x.filter = { chance: 'all', skill }; }); router.push('/jobs'); };
  return <>
    <H1 flush>Skill gaps &amp; lộ trình.</H1>
    <Lead>8 kỹ năng xuất hiện nhiều nhất trong tin Junior Backend tại TP.HCM. Bạn đã có 4, còn 4 kỹ năng cần bổ sung. Chọn hướng bạn muốn đi để xem lộ trình 3 năm.</Lead>
    <Section headingId="gH" title="Tỷ lệ tin nhắc tới" aside="cao → thấp">
      <div>{GAPS.map((g, i) => (
        <div key={g.s} className={cx('grid grid-cols-[130px_minmax(0,1fr)_48px_160px] items-center gap-4 py-2.5 max-phone:grid-cols-[100px_minmax(0,1fr)_40px]', i > 0 && 'border-t border-rule')}>
          <strong className="text-14">{g.s}</strong><Bar value={g.d / 100} tone={g.have ? 'brand' : 'amber'} /><span className="text-13 tabular-nums">{g.d}%</span>
          <span className="max-phone:col-span-full">{g.have ? <StatusLabel tone="ok">Bạn có</StatusLabel>
            : <button className={linkClass()} onClick={() => toJobs(g.s)}>Thiếu · ưu tiên {g.p} — xem job cần</button>}</span>
        </div>
      ))}</div>
      <Fine>Ưu tiên tính theo tỷ lệ tin nhắc tới nhân với khoảng cách so với CV của bạn. Bấm vào một kỹ năng còn thiếu để xem tin yêu cầu kỹ năng đó.</Fine>
    </Section>
    <Section headingId="pH" title="Lộ trình theo hướng bạn chọn" aside="3 năm">
      <p className={muted66}>Ba hướng đi khác nhau cho cùng một xuất phát điểm. Chọn một hướng — lộ trình, kỹ năng cần học và mốc lương bên dưới sẽ đổi theo lựa chọn đó.</p>
      <fieldset className="mt-6 min-w-0">
        <legend className="mb-3 text-14 text-ink-2">Bạn muốn đi theo hướng nào?</legend>
        <div className="grid grid-cols-3 gap-3 max-lap:grid-cols-1">{Object.entries(FOCUS_PATHS).map(([id, fp]) => (
          <label key={id} className="group relative grid gap-1.5 rounded-ctl border border-rule-2 bg-bg p-4 transition-[border-color,background-color,box-shadow] duration-150 hover:border-ink-3 hover:bg-paper has-checked:border-ink has-checked:bg-paper has-checked:shadow-[inset_0_0_0_1px_var(--color-ink)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold-ink">
            <input className="sr-only" type="radio" name="focusPath" value={id} checked={s.focusPath === id} onChange={() => update(x => { x.focusPath = id; })} />
            <span className="flex items-start justify-between gap-2.5">
              <span className="text-15 leading-[1.3] font-medium">{fp.label}</span>
              <span aria-hidden="true" className="mt-0.5 grid size-4 flex-none place-items-center rounded-full border border-rule-2 group-has-checked:border-ink group-has-checked:bg-ink after:size-1.5 after:rounded-full after:transition-colors after:content-[''] group-has-checked:after:bg-paper" />
            </span>
            <span className="text-14 leading-normal text-ink-2">{fp.summary}</span>
            <span className="text-13 text-ink-3 tabular-nums">{fp.meta}</span>
          </label>
        ))}</div>
      </fieldset>
      <div aria-live="polite" className="mt-6 animate-fade-in border-t border-rule pt-4" key={s.focusPath ?? 'none'}>
        {!d ? (
          <div className="grid gap-1.5"><strong className="text-15 font-medium">Chưa chọn hướng</strong><p className="text-14 text-ink-2">Chọn một hướng ở trên để xem lộ trình 3 năm, kỹ năng cần học và mốc lương mục tiêu.</p></div>
        ) : <>
          <SecHeading as="h3" id="roadH" aside={d.label}>Lộ trình 3 năm</SecHeading>
          <div className="grid grid-cols-3 max-tab:grid-cols-1 max-tab:gap-4">{d.years.map(([yr, t, sal, it], i) => (
            <div key={yr} className={cx('grid content-start gap-1.5', i > 0 ? 'border-l border-rule px-6 max-tab:border-t max-tab:border-l-0 max-tab:px-0 max-tab:pt-4' : 'pr-6 max-tab:pr-0')}>
              <Eyebrow>{yr}</Eyebrow><strong className="text-22 font-medium">{t}</strong>
              <span className="text-14 text-ink-2 tabular-nums">{sal}</span>
              <ul className="mt-2 grid list-disc gap-1 pl-4 text-15">{it.map(x => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}</div>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-rule pt-3">
            <Fine className="m-0">Mốc lương là khoảng tham khảo cho Junior Backend ở TP.HCM, không phải cam kết.</Fine>
            <button className={linkClass('ml-auto max-phone:ml-0')} onClick={() => toJobs(null)}>Xem {JOBS.length} job phù hợp <Icon name="right" /></button>
          </div>
        </>}
      </div>
    </Section>
  </>;
}
