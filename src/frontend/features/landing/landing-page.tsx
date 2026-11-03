// Landing (from AI-CV-Auto-Apply-App/index.html). Static markup; motion lives in LandingMotion.
import { cx } from '@/lib/cn';
import { LandingMotion } from './landing-motion';

const STEPS: { who: string; title: string; text: string; ask?: string; you?: boolean }[] = [
  { who: '1 · Bạn làm', title: 'Nạp CV', text: 'PDF, DOCX hoặc ảnh chụp. Đây là việc đầu tiên và gần như duy nhất của bạn.', you: true },
  { who: '2 · Tự động', title: 'Đọc CV', text: 'Tách CV thành từng thông tin, chuẩn hóa tên kỹ năng, che số điện thoại trước khi gửi AI.' },
  { who: '3 · Tự động', title: 'Phân tích thị trường', text: 'So CV với các tin đang mở: nhu cầu tuyển dụng, mức lương, kỹ năng còn thiếu.' },
  { who: '4 · Tự động', title: 'Tìm và chấm điểm job', text: 'Quét tin mới, tính điểm khớp 0–100 bằng công thức, kèm giá trị từng yếu tố.' },
  { who: '5 · Tự động', title: 'Tối ưu CV cho từng job', text: 'Viết lại CV và cover letter theo JD. Mỗi câu phải trỏ về thông tin trong CV gốc.', ask: 'Hỏi bạn nếu có câu chưa đủ căn cứ' },
  { who: '6 · Tự động', title: 'Nộp hồ sơ', text: 'Chỉ nộp job đạt ngưỡng, không nộp trùng, không vượt hạn mức trong ngày.', ask: 'Hỏi bạn nếu trang có CAPTCHA' },
  { who: '7 · Tự động', title: 'Theo dõi và nhắc', text: 'Sau 5 ngày chưa có phản hồi, gửi một thư nhắc lịch sự từ hộp thư của bạn.' },
  { who: '8 · Tự động', title: 'Báo bạn khi có tin', text: 'Đọc thư phản hồi, nhận ra thư mời phỏng vấn và soạn sẵn thư trả lời.', ask: 'Chỉ gửi khi bạn xác nhận' },
  { who: '9 · Bạn làm', title: 'Xác nhận lịch phỏng vấn', text: 'Đọc thư trả lời, sửa nếu muốn, rồi bấm gửi. Phần còn lại là buổi phỏng vấn của bạn.', you: true },
];

const SHOWCASE: { before: string; after: React.ReactNode; tag: [string, string]; why: string }[] = [
  { before: 'Mục tiêu: trở thành lập trình viên giỏi trong môi trường chuyên nghiệp.',
    after: <mark className="bg-rewritten px-1 py-0.5 box-decoration-clone text-inherit">Lập trình viên backend mới tốt nghiệp, đã thực tập xây dựng REST API bằng Node.js cho hệ thống đặt hàng.</mark>,
    tag: ['text-ok', 'Viết lại'], why: 'từ kinh nghiệm thực tập tại Công ty GHI' },
  { before: 'Làm API cho hệ thống đặt hàng, có dùng MySQL.',
    after: <mark className="bg-rewritten px-1 py-0.5 box-decoration-clone text-inherit">Xây dựng REST API cho luồng đặt hàng; viết và tối ưu index cho truy vấn MySQL.</mark>,
    tag: ['text-ok', 'Viết lại'], why: 'cùng việc bạn đã làm, nói đúng ngôn ngữ của JD' },
  { before: 'Kỹ năng: Node.js, MySQL, Git.',
    after: <>Kỹ năng: Node.js, MySQL, <mark className="bg-amber-soft px-1 py-0.5 box-decoration-clone text-inherit">SQL</mark>, Git.</>,
    tag: ['text-amber', 'Suy ra'], why: 'có MySQL thì có SQL, theo phả hệ kỹ năng' },
];

const PROMISES = [
  ['Không bịa', 'Không thêm công ty, vị trí, bằng cấp hay chứng chỉ bạn không có.'],
  ['Câu nào cũng có căn cứ', 'Mỗi câu viết lại đều trỏ về một dòng trong CV gốc của bạn.'],
  ['Bạn có lời cuối', 'Câu chưa đủ căn cứ sẽ chờ bạn xác nhận. Sửa hoặc hoàn tác từng câu bất cứ lúc nào.'],
];

const INDICATORS: [number, string, boolean?][] = [[24, '2.4s,3s'], [34, '2.46s,3.1s'], [44, '2.52s,3.2s', true], [28, '2.58s,3.3s'], [38, '2.64s,3.4s'], [48, '2.7s,3.5s', true], [30, '2.76s,3.6s']];

// Entrance animation helpers: start hidden, fade/slide in once, show immediately when motion is reduced.
const enter = 'opacity-0 motion-reduce:animate-none motion-reduce:opacity-100';
const wrap = 'mx-auto max-w-[1360px] px-12 max-[960px]:px-7 max-[620px]:px-5';
const h2 = "max-w-[18ch] text-[clamp(36px,4.6vw,60px)] leading-[1.1] font-extralight tracking-[-.025em] focus:outline-none after:mt-8 after:block after:h-px after:w-[72px] after:bg-gold after:content-['']";
const intro = 'mt-7 max-w-[60ch] text-18 font-light text-ink-2';
const goldline = 'mx-auto h-px w-[88px] bg-gold';

function Corner({ className }: { className: string }) {
  return (
    <svg className={cx('absolute animate-[fade_.8s_ease-out_.2s_forwards]', enter, className)} width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path d="M0 0L0 26M0 0L26 0" stroke="#D4A574" strokeWidth=".8" opacity=".6" />
    </svg>
  );
}

export function LandingPage() {
  const side = 'absolute top-1/2 text-12 tracking-[6px] whitespace-nowrap text-ink-3 uppercase animate-[fade_1s_ease-out_1.8s_forwards] max-[960px]:hidden';
  return (
    <>
      <header className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 pt-[120px] pb-[160px] text-center max-[620px]:pb-[140px]">
        <div aria-hidden="true" className={cx('pointer-events-none absolute inset-0 animate-[fade_1.4s_ease-out_forwards] bg-[radial-gradient(ellipse_1300px_700px_at_32%_42%,rgba(212,165,116,.08)_0%,transparent_70%)]', enter)} />
        <Corner className="top-12 left-12 max-[960px]:top-6 max-[960px]:left-6" />
        <Corner className="right-12 bottom-12 rotate-180 max-[960px]:right-6 max-[960px]:bottom-6" />
        <span aria-hidden="true" className={cx(side, enter, 'left-12 [transform:translate(-50%,-50%)_rotate(-90deg)_translateY(12px)]')}>Nạp CV một lần</span>
        <span aria-hidden="true" className={cx(side, enter, 'right-12 [transform:translate(50%,-50%)_rotate(90deg)_translateY(12px)]')}>Chờ thư mời</span>
        <span aria-hidden="true" className={cx('absolute top-10 right-[104px] animate-[fade_1.2s_ease-out_2.6s_forwards] text-[28px] font-extralight text-gold max-[960px]:hidden', enter)}>◇</span>

        <p className={cx('mb-8 animate-[up_.9s_ease-out_.5s_forwards] text-14 tracking-[8px] text-ink-3 uppercase max-[620px]:text-12 max-[620px]:tracking-[5px]', enter)}>AI CV · Auto Apply Jobs</p>
        <h1 className="text-[clamp(112px,20vw,260px)] leading-none font-extralight tracking-[-.025em]" aria-label="ACAJ">
          {['A', 'C', 'A', 'J'].map((ch, i) => (
            <span key={i} aria-hidden="true" style={{ animationDelay: `${0.6 + i * 0.09}s` }}
              className="inline-block translate-y-[30px] animate-[ch_.7s_var(--ease-out)_forwards] opacity-0 motion-reduce:translate-y-0 motion-reduce:animate-none motion-reduce:opacity-100">{ch}</span>
          ))}
        </h1>
        <div aria-hidden="true" className={cx(goldline, 'mt-12 mb-9 scale-x-0 animate-[grow_1s_var(--ease-out)_1.9s_forwards] motion-reduce:scale-x-100 motion-reduce:animate-none')} />
        <p className="sr-only">Nạp CV một lần. ACAJ đọc CV, tìm job, tối ưu CV cho từng job và nộp hồ sơ. Hệ thống chỉ dừng lại hỏi bạn ba lần. Bạn quay lại khi có thư mời phỏng vấn.</p>
        <div id="captions" aria-hidden="true" className={cx('grid min-h-[calc(2*1.75em)] max-w-[760px] animate-[up_1s_ease-out_2.2s_forwards] text-[clamp(19px,2vw,24px)] leading-[1.75] font-light text-ink-2', enter)}>
          {[<>Nạp CV một lần.<br />Hệ thống đọc, tìm job, tối ưu CV và nộp hồ sơ thay bạn.</>,
            <>Chỉ dừng lại hỏi bạn ba lần —<br />một câu cần xác nhận, một trang phải nộp tay, một thư cần trả lời.</>,
            <>Bạn quay lại <strong className="text-ink">khi có thư mời phỏng vấn.</strong></>].map((c, i) => (
            <p key={i} data-on={i === 0 ? '' : undefined}
              className="[grid-area:1/1] translate-y-3 opacity-0 transition-[opacity,transform] duration-600 ease-out data-on:translate-y-0 data-on:opacity-100">{c}</p>
          ))}
        </div>
        <div aria-hidden="true" className="absolute bottom-14 left-1/2 flex -translate-x-1/2 items-end gap-6">
          {INDICATORS.map(([h, delay, gold], i) => (
            <i key={i} style={{ height: h, animationDelay: delay }}
              className={cx('origin-bottom scale-y-0 animate-[rise_.6s_var(--ease-out)_forwards,breathe_4s_ease-in-out_3s_infinite] motion-reduce:scale-y-100 motion-reduce:animate-none', gold ? 'w-0.5 bg-gold' : 'w-[1.5px] bg-[#D8D4CE]')} />
          ))}
        </div>
      </header>

      <main>
        <section id="cach-hoat-dong" aria-labelledby="h-two" className="pt-[144px] max-[620px]:pt-[104px]">
          <div className={cx(wrap, 'grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-x-20 max-[960px]:grid-cols-[minmax(0,1fr)]')}>
            <div className="sticky top-16 max-[960px]:static">
              <h2 className={h2} id="h-two">Bạn chỉ làm hai việc.</h2>
              <p className={intro}>Việc đầu và việc cuối là của bạn. Mọi bước ở giữa chạy tự động theo điều kiện bạn đặt; giá trị mặc định đã đủ để chạy.</p>
              <h3 className="mt-12 border-t border-rule pt-5 text-24 font-light tracking-[-.01em] max-[960px]:mt-16">Hồ sơ của bạn đi qua chín bước</h3>
            </div>
            <ol id="pipe" className="relative pt-6 [--p:0] [--track:0px]">
              <li aria-hidden="true" data-pipe-track className="absolute top-[46px] left-[31px] h-(--track) w-px bg-rule-2 max-[760px]:left-[21px]">
                <span className="absolute top-0 -left-[0.5px] h-full w-0.5 origin-top scale-y-(--p) bg-gold" />
                <span className="absolute top-0 -left-1.5 size-[13px] translate-y-[calc(var(--p)*var(--track)-6px)] rounded-full bg-ink shadow-[0_0_0_5px_var(--color-bg),0_0_0_6px_var(--color-gold)]" />
              </li>
              {STEPS.map(st => (
                <li key={st.who} data-pn className="group relative grid grid-cols-[64px_minmax(0,1fr)] gap-x-10 pt-4 pb-12 last:pb-0 max-[760px]:grid-cols-[44px_minmax(0,1fr)] max-[760px]:pb-10 max-[760px]:last:pb-0">
                  <span data-pn-node aria-hidden="true" className={cx('relative z-[1] rounded-full border bg-bg transition-[background-color,border-color] duration-300 ease-out',
                    st.you ? 'mt-[3px] ml-[23px] size-[17px] border-ink group-data-on:bg-ink max-[760px]:ml-[13px]'
                      : cx('mt-1.5 ml-[26px] size-[11px] max-[760px]:ml-4', st.ask ? 'border-gold group-data-on:bg-gold' : 'border-rule-2 group-data-on:border-ink group-data-on:bg-ink'))} />
                  <div className="translate-y-2 opacity-[.38] transition-[opacity,transform] duration-400 ease-out group-data-on:translate-y-0 group-data-on:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100">
                    <span className={cx('block text-14 tabular-nums', st.you ? 'font-medium text-ink' : 'text-ink-3')}>{st.who}</span>
                    <h3 className={cx('mt-1 mb-2 text-[clamp(26px,2.8vw,36px)] leading-[1.2] tracking-[-.02em]', st.you ? 'font-light' : 'font-extralight')}>{st.title}</h3>
                    <p className="max-w-[60ch] text-ink-2">{st.text}</p>
                    {st.ask && <span className="mt-3 inline-block text-14 font-medium text-gold-ink">{st.ask}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="h-ev" className="pt-[144px] max-[620px]:pt-[104px]">
          <div className={wrap}>
            <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-end gap-x-20 max-[960px]:grid-cols-[minmax(0,1fr)]">
              <h2 className={h2} id="h-ev">Một CV gốc.<br />Mỗi job một bản viết riêng.</h2>
              <p className={intro}>Cùng kinh nghiệm của bạn, viết lại cho đúng điều nhà tuyển dụng đang tìm. Không thêm một dòng nào bạn chưa từng làm.</p>
            </div>
            <div className="mt-[72px] grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start gap-16 max-[960px]:grid-cols-[minmax(0,1fr)] max-[960px]:gap-10">
              <div id="scStage" data-state="before" className="group border border-rule bg-paper shadow-[0_30px_60px_-36px_rgba(26,26,24,.28)]">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule px-5 py-4">
                  <div role="group" aria-label="Xem CV" className="inline-flex border border-rule-2">
                    {[['before', 'CV gốc của bạn'], ['after', 'Bản gửi Công ty ABC']].map(([v, l], i) => (
                      <button key={v} type="button" data-sc={v} aria-pressed={i === 0}
                        className={cx('min-h-10 px-4 text-14 font-medium text-ink-2 transition-colors duration-200 hover:bg-[#F1F0EB] hover:text-ink aria-pressed:bg-ink aria-pressed:text-white', i > 0 && 'border-l border-rule-2')}>{l}</button>
                    ))}
                  </div>
                  <span className="text-14 text-ink-3">Backend Developer (Node.js)</span>
                </div>
                <article aria-live="polite" className="px-[clamp(24px,4vw,56px)] pt-10 pb-12 font-paper text-[#1A1D20]">
                  <p className="mb-6 border-b border-[#2A2F33] pb-3 font-paper text-22 font-semibold">Nguyễn Minh Anh</p>
                  {SHOWCASE.map((l, i) => {
                    const line = '[grid-area:1/1] text-[clamp(17px,1.6vw,20px)] leading-[1.65] transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none';
                    return (
                      <div key={i} className="grid border-b border-rule py-4 last:border-b-0">
                        <p className={cx(line, 'text-ink-3 group-data-[state=after]:-translate-y-2 group-data-[state=after]:opacity-0')}>{l.before}</p>
                        <p className={cx(line, 'translate-y-2 opacity-0 group-data-[state=after]:translate-y-0 group-data-[state=after]:opacity-100')}>{l.after}</p>
                        <p className="mt-2 font-sans text-14 text-ink-2 opacity-0 transition-opacity delay-150 duration-400 ease-out [grid-area:2/1] group-data-[state=after]:opacity-100 motion-reduce:transition-none">
                          <span className={l.tag[0]}>{l.tag[1]}</span> {l.why}</p>
                      </div>
                    );
                  })}
                </article>
              </div>
              <ul>
                {PROMISES.map(([t, p], i) => (
                  <li key={t} className={cx('py-7', i === 0 ? 'pt-2' : 'border-t border-rule')}>
                    <h3 className="mb-2 text-[clamp(26px,2.4vw,32px)] leading-[1.2] font-extralight tracking-[-.015em]">{t}</h3>
                    <p className="max-w-[40ch] text-ink-2">{p}</p>
                  </li>
                ))}
              </ul>
            </div>
            <a href="/register" className="mt-10 inline-block py-2 text-16 font-medium underline decoration-gold underline-offset-[6px] hover:decoration-ink">Thử với CV của bạn</a>
          </div>
        </section>

        <section aria-labelledby="h-close" className="pt-[176px] pb-[120px] text-center">
          <div className={wrap}>
            <h2 id="h-close" className="mx-auto max-w-[16ch] text-[clamp(36px,5.4vw,72px)] leading-[1.1] font-extralight tracking-[-.03em]">Bạn quay lại khi có thư mời phỏng vấn.</h2>
            <div aria-hidden="true" className={cx(goldline, 'mt-12 mb-9')} />
            <p className="mx-auto mb-10 max-w-[52ch] text-ink-2">Nạp CV, đặt điều kiện nếu muốn, rồi để hệ thống làm phần còn lại.</p>
            <a href="/register" className="inline-flex min-h-[52px] items-center justify-center border border-ink bg-ink px-8 text-16 font-medium tracking-[.01em] text-white transition-colors duration-200 ease-out hover:border-ink-hover hover:bg-ink-hover">Nạp CV và bắt đầu</a>
          </div>
        </section>
      </main>
      <LandingMotion />
    </>
  );
}
