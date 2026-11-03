import { JOBS } from '@/lib/demo/data';
import { qualified, tailoredCount, type DemoState } from '@/lib/demo/store';

/** The 8 autopilot steps: [name, what it does, result once done, when it asks the user]. */
export const STEPS: [string, string, (s: DemoState) => string, string?][] = [
  ['Nạp CV', 'Bạn tải CV lên — việc duy nhất bạn cần làm.', s => `Đã nhận ${s.cvFile.name} · ${s.cvFile.size}`],
  ['Đọc CV', 'Tách CV thành từng thông tin, chuẩn hóa tên kỹ năng.', () => '14 thông tin, 6 kỹ năng. Số điện thoại được che trước khi gửi AI.'],
  ['Thị trường', 'So CV với tin đang mở cho vị trí bạn nhắm tới.', () => 'Junior Backend · TP.HCM: lương phổ biến 12–18 tr, thiếu Docker.'],
  ['Chấm điểm', 'Quét TopCV, LinkedIn, trang công ty; tính điểm bằng công thức.', s => `214 tin → ${JOBS.length} job phù hợp, ${qualified(s)} job từ ${s.auto.minScore} điểm.`],
  ['Tối ưu CV', 'Viết lại CV theo từng JD, mỗi câu có căn cứ từ CV gốc.', s => `${tailoredCount(s)} bản CV đã tối ưu.`, 'Câu chưa đủ căn cứ chờ bạn xem lại'],
  ['Nộp hồ sơ', 'Nộp job đạt điều kiện, không vượt hạn mức, không nộp trùng.', s => `${s.apps.length} hồ sơ đã nộp.`, 'Trang có CAPTCHA chờ bạn nộp tay'],
  ['Theo dõi', 'Sau 5 ngày chưa có phản hồi, gửi một thư nhắc.', () => '1 thư nhắc đã gửi (EduViet).'],
  ['Báo tin', 'Nhận ra thư mời phỏng vấn và soạn sẵn thư trả lời.', () => 'FinPay mời phỏng vấn, thư trả lời đã soạn.', 'Thư chỉ gửi khi bạn xác nhận'],
];

export const currentStep = (s: DemoState) => (s.auto.finished ? 9 : s.auto.step);

/** Screen that shows what each step did / is doing (the guided-flow screens). */
export function stepHref(i: number, s: DemoState): string {
  const firstApp = (st: string) => s.apps.find(a => a.status === st)?.id;
  const reviewJob = Object.keys(s.tailored).find(jid => !s.apps.some(a => a.jobId === jid) && s.tailored[jid].some(x => x.origin === 'review'));
  switch (i) {
    case 0: case 1: return '/cv';
    case 2: return '/insights';
    case 3: return '/jobs';
    case 4: return reviewJob ? `/jobs/${reviewJob}?cv=${s.tailored[reviewJob].find(x => x.origin === 'review')!.id}` : '/jobs';
    case 5: return '/applications';
    case 6: { const id = firstApp('reminded'); return id ? `/applications/${id}` : '/applications'; }
    default: { const id = firstApp('interview'); return id ? `/applications/${id}` : '/applications'; }
  }
}
