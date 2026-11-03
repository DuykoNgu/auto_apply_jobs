'use client';

// SCR-10/11: original CV next to what AI extracted, with a link line between a field and its source.
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { useDialogs } from '@/components/dialogs';
import { buttonClass } from '@/components/ui/button';
import { errClass } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/misc';
import { Eyebrow, H1, Lead } from '@/components/ui/typography';
import { SheetPane } from '@/components/workspace/shell';
import { cx } from '@/lib/cn';

import { useDemo } from '@/lib/demo/store';
import { now } from '@/lib/format';
import type { CvField } from '@/lib/types';

const MAX_MB = 10; // BR-002, mirrors CV_MAX_FILE_MB

export function CvPage() {
  const { s, update } = useDemo();
  const { toast, edit } = useDialogs();
  const params = useSearchParams();
  const splitRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [ln, setLink] = useState<{ d: string; x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const f = s.cvFields, pop = s.cvPop, active = hover ?? pop;
  const low = f.filter(x => x.c < .8).length;

  const focusItem = (i: number | null) => requestAnimationFrame(() => {
    if (i !== null) document.querySelector<HTMLElement>(`[data-cv-item="${i}"]`)?.focus({ preventScroll: true });
  });
  const setPop = (i: number | null, focus = pop) => { update(d => { d.cvPop = i; }); focusItem(i ?? focus); };

  // Bezier from the active extracted field to its mark on the paper (wide screens only).
  const draw = useCallback(() => {
    const wrap = splitRef.current;
    if (!wrap || active === null || matchMedia('(max-width:1180px)').matches) { setLink(null); return; }
    const row = wrap.querySelector(`[data-cv-item="${active}"]`), mark = wrap.querySelector(`[data-cv-mark="${active}"]`), paper = wrap.querySelector('#cvPaper');
    if (!row || !mark || !paper) { setLink(null); return; }
    const wr = wrap.getBoundingClientRect(), rr = row.getBoundingClientRect(), vr = (row.querySelector('[data-cv-v]') || row).getBoundingClientRect();
    const mr = mark.getBoundingClientRect(), pr = paper.getBoundingClientRect();
    const x1 = rr.left - wr.left - 10, y1 = vr.top - wr.top + Math.min(vr.height, 24) / 2;
    const x2 = pr.right - wr.left + 12, y2 = mr.top - wr.top + mr.height / 2;
    setLink({ d: `M${x1} ${y1} C${x1 - 44} ${y1}, ${x2 + 44} ${y2}, ${x2} ${y2}`, x1, y1, x2, y2 });
  }, [active]);
  useLayoutEffect(draw, [draw, s.cvFields, s.cvLoading]);
  useEffect(() => {
    window.addEventListener('resize', draw);
    document.fonts?.ready.then(draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  // Palette "Tải CV mới" lands here with ?upload=1
  useEffect(() => { if (params.get('upload')) fileRef.current?.click(); }, [params]);

  // Esc closes the field popover
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && pop !== null && !document.querySelector('dialog[open]')) setPop(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const handleFile = (file: File) => {
    const okType = /\.(pdf|docx)$/i.test(file.name) || /^image\//.test(file.type);
    if (!okType) { setErr('File chưa đúng định dạng. Hãy chọn PDF, DOCX hoặc ảnh chụp.'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setErr(`File lớn hơn ${MAX_MB} MB. Hãy nén file hoặc chụp ảnh nhỏ hơn.`); return; }
    setErr('');
    update(d => { d.cvFile = { name: file.name, size: (file.size / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB', when: `03/11 · ${now()}` }; d.cvPop = null; d.cvLoading = true; });
    // ponytail: simulated OCR/extraction delay; real flow polls the PARSE_CV task (lib/poll.ts).
    setTimeout(() => {
      update(d => {
        d.cvLoading = false;
        d.cvFields.forEach(x => { if (x.k === 'Thời gian thực tập') { x.c = .62; x.ok = false; x.note = 'Ngày kết thúc chưa rõ, hãy kiểm tra'; } });
        d.today.unshift({ t: now(), x: `Đọc xong CV mới: ${file.name}` });
      });
      requestAnimationFrame(() => { const h = document.getElementById('xH'); if (h) { h.tabIndex = -1; h.focus(); } });
      toast('AI đã đọc xong CV. Kiểm tra các chỗ còn nghi ngờ.');
    }, 1600);
  };

  const confirmField = (i: number) => { update(d => { Object.assign(d.cvFields[i], { c: .99, ok: true, note: '' }); d.cvPop = null; }); toast(`Đã xác nhận ${f[i].k}`); focusItem(i); };
  const editField = (i: number) => edit({ title: `Sửa ${f[i].k}`, label: f[i].k, value: f[i].v, cb: v => {
    update(d => { Object.assign(d.cvFields[i], { v, c: .99, ok: true, note: '' }); d.cvPop = null; }); toast(`Đã lưu ${f[i].k}`); focusItem(i);
  } });

  const mark = (i: number, heading?: boolean) => (
    <span role="button" tabIndex={0} data-cv-mark={i}
      className={cx('inline cursor-pointer rounded-[1px] border-b transition-[background-color,border-color] duration-150 hover:border-gold-ink hover:bg-brand-soft',
        active === i ? 'border-gold-ink bg-brand-soft' : heading ? 'border-transparent' : 'border-[rgba(181,128,68,.55)]')}
      onClick={() => setPop(i, i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPop(i, i); } }}>{f[i].v}</span>
  );
  const colHead = 'mb-3 flex min-h-[38px] flex-wrap items-center gap-2.5';
  const colH = 'text-13 font-medium tracking-[.02em]';
  const sub = 'text-13 text-ink-3';
  const cpSec = 'mt-3.5';
  const cpH4 = 'mb-1.5 text-[10px] font-semibold tracking-[.16em] text-[#8A7F6E] uppercase';
  const cpLine = 'mt-0.5 text-[12.5px] text-[#3A342C]';
  const cpJob = 'text-[12.5px] font-semibold text-[#2A2620]';

  return (
    <SheetPane>
      <Eyebrow>CV</Eyebrow>
      <H1>CV gốc của bạn.</H1>
      <Lead>CV gốc không bao giờ bị ghi đè. Mỗi job có một bản tối ưu riêng, tạo từ đây.</Lead>
      <div ref={splitRef} className="relative mt-8 grid grid-cols-[minmax(0,1.06fr)_minmax(360px,.94fr)] items-start gap-14 max-cv:grid-cols-[minmax(0,1fr)] max-cv:gap-8">
        <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 z-[2] size-full overflow-visible max-cv:hidden">
          {ln && <><path d={ln.d} fill="none" stroke="var(--color-gold-ink)" strokeWidth="1" opacity=".5" /><circle cx={ln.x2} cy={ln.y2} r="3" fill="var(--color-gold)" /><circle cx={ln.x1} cy={ln.y1} r="2.5" fill="var(--color-gold-ink)" /></>}
        </svg>
        <div className="min-w-0">
          <div className={colHead}>
            <h2 className={colH}>Bản gốc</h2>
            <span className={cx(sub, 'block max-w-[34ch] min-w-0 truncate')}>{s.cvFile.size} · tải lên {s.cvFile.when}</span>
            <label className={buttonClass('default', 'sm', 'ml-auto focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold-ink max-phone:min-h-11')}>
              <Icon name="upload" />Tải file mới
              <input type="file" ref={fileRef} className="sr-only" accept=".pdf,.docx,image/*" onChange={e => { const fl = e.target.files?.[0]; if (fl) handleFile(fl); e.target.value = ''; }} />
            </label>
          </div>
          <span className={cx(errClass, 'mb-2 block')} hidden={!err}>{err}</span>
          <div aria-busy={s.cvLoading} title="Kéo thả file mới để quét lại"
            className={cx('relative rounded-[2px]', over && 'outline-2 outline-offset-[6px] outline-gold')}
            onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={e => { e.preventDefault(); setOver(false); const fl = e.dataTransfer.files[0]; if (fl) handleFile(fl); }}>
            <div className="relative z-[1]">
              <div id="cvPaper" aria-label={`CV gốc của ${f[0].v}`}
                className="border border-rule bg-white px-[30px] pt-8 pb-[34px] font-paper text-13 leading-[1.65] text-[#221F1B] shadow-[0_1px_0_var(--color-rule),0_30px_56px_-44px_rgba(26,26,24,.4)] max-phone:px-5 max-phone:pt-6 max-phone:pb-[26px]">
                <header className="mb-[15px] border-b border-[#D9D3C8] pb-3.5">
                  <h3 className="font-paper text-[27px] leading-[1.1] font-semibold tracking-[-.01em] max-phone:text-[23px]">{mark(0, true)}</h3>
                  <p className="mt-[5px] text-12 tracking-[.04em] text-[#6B6257]">{mark(3)}</p>
                  <p className="mt-2 text-[11.5px] leading-normal text-[#6B6257]">{mark(1)}<span className="mx-1.5 text-[#B8AE9F]">·</span>{mark(2)}<span className="mx-1.5 text-[#B8AE9F]">·</span>{s.user.city}</p>
                </header>
                <section className={cpSec}><h4 className={cpH4}>Kinh nghiệm</h4>
                  <p className={cpJob}>{mark(4)}</p>
                  <ul className="mt-1 grid list-disc gap-0.5 pl-3.5 text-[12.5px] text-[#3A342C]"><li className="pl-0.5">Xây dựng REST API cho luồng đặt hàng; viết và tối ưu index cho truy vấn MySQL.</li><li className="pl-0.5">Viết unit test cho các service bằng Jest.</li></ul>
                  <p className="mt-[7px] text-[11.5px] text-[#7C7264]">Thời gian thực tập: {mark(5)}</p>
                </section>
                <section className={cpSec}><h4 className={cpH4}>Dự án</h4>
                  <p className={cpJob}>Ứng dụng quản lý thư viện <span className="font-normal text-[#8A7F6E]">(đồ án tốt nghiệp, 2025)</span></p>
                  <p className={cpLine}>Backend Node.js và MySQL cho nhóm 3 người; API mượn trả và tìm kiếm sách.</p>
                </section>
                <section className={cpSec}><h4 className={cpH4}>Kỹ năng</h4><p className={cpLine}>{mark(6)}</p></section>
                <section className={cpSec}><h4 className={cpH4}>Học vấn</h4><p className={cpLine}>{mark(7)}</p></section>
              </div>
              {/* scanning sweep */}
              <div aria-hidden="true" className={cx('pointer-events-none absolute inset-0 z-[3] overflow-hidden transition-opacity duration-180', s.cvLoading ? 'opacity-100' : 'opacity-0')}>
                <div className="absolute -inset-x-[4%] top-[-160px] h-[150px] animate-cv-scan border-b border-gold bg-[linear-gradient(180deg,transparent_0%,rgba(212,165,116,.07)_58%,rgba(212,165,116,.3)_96%,rgba(181,128,68,.45)_100%)] shadow-[0_14px_30px_-14px_rgba(212,165,116,.75)]" />
              </div>
              {s.cvLoading && <span className="pointer-events-none absolute top-3 right-3 z-[4] inline-flex items-center gap-1.5 rounded-full bg-[rgba(26,26,24,.9)] py-[5px] pr-2.5 pl-[9px] text-12 font-medium text-white shadow-[0_6px_18px_-8px_rgba(0,0,0,.35)] [--icon:13px] max-phone:hidden"><Icon name="spark" className="text-gold" />Đang quét bản gốc…</span>}
            </div>
            <p className="mt-[9px] text-12 text-ink-3 tabular-nums">{s.cvLoading ? 'Đang tách thông tin…' : `Bản gốc · ${s.cvFile.name} · 1 trang`}</p>
          </div>
        </div>
        <section className="min-w-0" aria-labelledby="xH">
          <div className={colHead}>
            <h2 className={cx(colH, 'focus:outline-none')} id="xH">AI đã đọc được gì</h2>
            <span className={sub}>{s.cvLoading ? 'đang đọc…' : low ? `${low} chỗ cần bạn xem lại` : 'đã kiểm tra hết'}</span>
          </div>
          {s.cvLoading ? (
            <div className="grid gap-[18px] py-4" aria-hidden="true">{[78, 56, 64, 84, 48, 70, 58, 66].map((w, i) => <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3.5" key={i}><Skeleton width={56} /><Skeleton width={`${w}%`} /></div>)}</div>
          ) : (
            <ol className="border-t border-rule" id="cvList">{f.map((x, i) => {
              const open = pop === i, isLow = x.c < .8;
              return (
                <li key={i} className="group relative border-b border-rule" data-open={open || undefined}>
                  <button type="button" data-cv-item={i} aria-expanded={open} aria-controls={`cvpop-${i}`}
                    className="group/item grid w-full grid-cols-[24px_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-2 px-1.5 py-[11px] text-left text-ink hover:bg-pane group-data-open:bg-pane max-phone:grid-cols-[20px_minmax(0,1fr)_auto] max-phone:px-1"
                    onClick={() => setPop(open ? null : i, i)}
                    onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                    <span className="pt-[3px] text-11 tracking-[.06em] text-ink-3 tabular-nums group-data-open:text-gold-ink">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0">
                      <span className="mb-px block text-12 text-ink-3">{x.k}</span>
                      <span data-cv-v className="inline border-b border-[rgba(181,128,68,.45)] text-[14.5px] leading-[1.45] box-decoration-clone transition-colors duration-150 group-hover/item:border-ink group-data-open:border-gold-ink max-phone:text-14">{x.v}</span>
                    </span>
                    <span className={cx('pt-[3px] text-[11.5px] whitespace-nowrap tabular-nums', isLow ? 'text-amber' : 'text-ink-3')}>{x.ok ? 'đã xác nhận' : Math.round(x.c * 100) + '%'}</span>
                  </button>
                  {open && <FieldPopover f={x} i={i} above={i >= f.length - 2} onClose={() => setPop(null)} onOk={() => confirmField(i)} onEdit={() => editField(i)} />}
                </li>
              );
            })}</ol>
          )}
          <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-[1.55] text-ink-3 [--icon:14px]"><Icon name="lock" className="mt-0.5" /><span>Bản gốc được quét ngay trên máy bạn. Số điện thoại đã che trước khi gửi AI; CV không dùng để huấn luyện mô hình.</span></p>
        </section>
      </div>
    </SheetPane>
  );
}

function FieldPopover({ f, i, above, onClose, onOk, onEdit }: { f: CvField; i: number; above: boolean; onClose: () => void; onOk: () => void; onEdit: () => void }) {
  const low = f.c < .8;
  return (
    <div id={`cvpop-${i}`} role="group" aria-label={`Chi tiết ${f.k}`}
      className={cx('absolute right-0 z-20 grid w-[min(350px,100%)] animate-pop-fast gap-2.5 rounded-lg border border-rule-2 bg-paper px-4 pt-3.5 pb-[13px] shadow-[0_24px_48px_-30px_rgba(26,26,24,.5),0_2px_6px_rgba(26,26,24,.05)]',
        above ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]',
        'max-phone:static max-phone:mb-2.5 max-phone:w-auto max-phone:shadow-none')}>
      <div className="flex items-center gap-2.5">
        <strong className="text-14 font-medium">{f.k}</strong>
        <button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="ml-auto grid size-7 place-items-center rounded-md text-ink-3 [--icon:14px] hover:bg-hover hover:text-ink max-phone:-my-2 max-phone:-mr-2 max-phone:size-11"><Icon name="x" /></button>
      </div>
      <p className="text-15 leading-normal">{f.v}</p>
      <div className="grid gap-[3px] rounded-md bg-pane px-3 py-[9px] font-paper text-13 leading-normal text-ink-2">
        <span className="font-sans text-[10.5px] tracking-[.06em] text-ink-3 uppercase">Trong CV gốc</span><span>{f.src || f.v}</span>
      </div>
      {f.note && <p className={cx('flex items-start gap-2 text-13 leading-normal [--icon:15px]', low ? 'text-amber' : 'text-ink-3')}><Icon name={low ? 'alert' : 'lock'} className="mt-0.5" /><span>{f.note}</span></p>}
      <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
        <span className={cx('text-[11.5px] whitespace-nowrap tabular-nums', low ? 'text-amber' : 'text-ink-3')}>Độ tin cậy {Math.round(f.c * 100)}%</span>
        <span className="ml-auto flex gap-1.5">
          {low && <button className={buttonClass('primary', 'sm')} type="button" onClick={onOk}><Icon name="check" />Đúng</button>}
          <button className={buttonClass('default', 'sm')} type="button" onClick={onEdit}><Icon name="edit" />Sửa</button>
        </span>
      </div>
    </div>
  );
}
