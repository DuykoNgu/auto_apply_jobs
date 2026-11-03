// Sample data ported 1:1 from the design prototype (AI-CV-Auto-Apply-App/app.html).
// ponytail: static demo data, replace with feature api.ts calls once src/backend serves docs/api/openapi.yaml.
import type { AppStatus, Application, CvField, Job, LogEntry, Origin, Sentence, User } from '@/lib/types';

export const INITIAL_USER: User = { name: 'Nguyễn Minh Anh', email: 'minhanh.dev@gmail.com', role: 'Junior Backend Developer', city: 'TP.HCM' };
export const USER_SKILLS = ['Node.js', 'REST API', 'MySQL', 'Git', 'Jest', 'React'];
export const INFERRED: Record<string, string> = { SQL: 'MySQL', JavaScript: 'Node.js' };

export const JOBS: Job[] = [
  { id: 'j1', title: 'Backend Developer (Node.js)', company: 'Công ty ABC', loc: 'TP.HCM', mode: 'Hybrid', salary: '15–22 tr', source: 'TopCV', posted: '2 giờ trước', f: [36, 17, 18, 15], req: ['Node.js', 'MySQL', 'REST API'], nice: ['Docker', 'Jest'], comp: 'normal', extra: 'Làm việc theo Scrum, sprint 2 tuần.' },
  { id: 'j2', title: 'Junior Backend Engineer', company: 'FinPay', loc: 'TP.HCM', mode: 'Remote', salary: '14–20 tr', source: 'LinkedIn', posted: '12 ngày trước', f: [34, 16, 16, 15], req: ['Node.js', 'SQL', 'REST API'], nice: ['Redis'], comp: 'normal' },
  { id: 'j3', title: 'Node.js Developer', company: 'Saigon Tech Hub', loc: 'TP.HCM', mode: 'Onsite', salary: '16–24 tr', source: 'Trang công ty', posted: '1 ngày trước', f: [32, 16, 14, 15], req: ['Node.js', 'MongoDB'], nice: ['Docker'], comp: 'high', manual: true },
  { id: 'j11', title: 'Backend Developer', company: 'Nova Retail', loc: 'TP.HCM', mode: 'Hybrid', salary: '13–19 tr', source: 'TopCV', posted: '5 giờ trước', f: [33, 15, 14, 15], req: ['Node.js', 'MySQL'], nice: ['Redis'], comp: 'normal', manual: true },
  { id: 'j4', title: 'Backend Fresher (Node.js)', company: 'LogiNext VN', loc: 'Bình Dương', mode: 'Onsite', salary: '11–15 tr', source: 'TopCV', posted: '6 ngày trước', f: [30, 15, 15, 13], req: ['Node.js', 'MySQL'], nice: ['Docker', 'Kafka'], comp: 'normal' },
  { id: 'j10', title: 'Backend Developer', company: 'ShopNow', loc: 'TP.HCM', mode: 'Onsite', salary: '14–18 tr', source: 'LinkedIn', posted: '20 ngày trước', f: [31, 14, 15, 12], req: ['Node.js', 'REST API'], nice: ['AWS'], comp: 'normal' },
  { id: 'j5', title: 'Fullstack Developer (React/Node)', company: 'EduViet', loc: 'Hà Nội', mode: 'Remote', salary: '15–21 tr', source: 'LinkedIn', posted: '14 ngày trước', f: [30, 14, 15, 12], req: ['React', 'Node.js'], nice: ['TypeScript'], comp: 'normal' },
  { id: 'j7', title: 'Python Backend (FastAPI)', company: 'DataMinds', loc: 'TP.HCM', mode: 'Hybrid', salary: '15–22 tr', source: 'TopCV', posted: '3 ngày trước', f: [18, 12, 15, 13], req: ['Python', 'FastAPI'], nice: ['Docker'], comp: 'normal' },
  { id: 'j6', title: 'Java Backend Developer', company: 'BankCore', loc: 'TP.HCM', mode: 'Onsite', salary: '16–25 tr', source: 'Trang công ty', posted: '2 ngày trước', f: [12, 10, 14, 12], req: ['Java', 'Spring Boot'], nice: ['Docker'], comp: 'high' },
  { id: 'j8', title: 'DevOps Junior', company: 'CloudNine VN', loc: 'Đà Nẵng', mode: 'Onsite', salary: '12–18 tr', source: 'LinkedIn', posted: '4 ngày trước', f: [14, 9, 10, 11], req: ['Docker', 'Linux', 'CI/CD'], nice: ['AWS'], comp: 'normal' },
];
export const jobById = (id: string | null | undefined) => JOBS.find(j => j.id === id);

export const BASE_SENTENCES: Sentence[] = [
  { id: 's1', sec: 'Giới thiệu', origin: 'rewritten', text: 'Lập trình viên backend mới tốt nghiệp, đã thực tập xây dựng REST API bằng Node.js cho hệ thống đặt hàng.', orig: 'Mục tiêu: trở thành lập trình viên giỏi trong môi trường chuyên nghiệp.', ev: ['Kinh nghiệm: Backend Intern, Công ty GHI — “Xây dựng REST API cho hệ thống đặt hàng”', 'Dự án: Ứng dụng quản lý thư viện — “Node.js, React, MySQL”'], jd: 'p2' },
  { id: 's2', sec: 'Giới thiệu', origin: 'review', text: 'Quen làm việc nhóm theo quy trình Agile.', orig: '', ev: [], note: 'Chưa tìm thấy thông tin nào trong CV gốc nói về Agile hoặc Scrum. Câu này chỉ được giữ nếu bạn xác nhận là đúng.', jd: 'p5' },
  { id: 's3', sec: 'Kinh nghiệm', origin: 'rewritten', text: 'Xây dựng REST API cho luồng đặt hàng; viết và tối ưu index cho truy vấn MySQL.', orig: 'Làm API cho hệ thống đặt hàng, có dùng MySQL.', ev: ['Kinh nghiệm: Backend Intern, Công ty GHI — “Làm API cho hệ thống đặt hàng, có dùng MySQL”'], jd: 'p3' },
  { id: 's4', sec: 'Kinh nghiệm', origin: 'original', text: 'Viết unit test cho các service bằng Jest.', orig: 'Viết unit test cho các service bằng Jest.', ev: ['Giữ nguyên từ CV gốc'], jd: 'p4' },
  { id: 's5', sec: 'Dự án', origin: 'original', text: 'Ứng dụng quản lý thư viện (đồ án tốt nghiệp, 2025): phụ trách backend Node.js và MySQL trong nhóm 3 người.', orig: 'Ứng dụng quản lý thư viện (đồ án tốt nghiệp, 2025): phụ trách backend Node.js và MySQL trong nhóm 3 người.', ev: ['Giữ nguyên từ CV gốc'] },
  { id: 's6', sec: 'Kỹ năng', origin: 'original', text: 'Node.js, REST API, MySQL, Git, Jest, React', orig: 'Node.js, REST API, MySQL, Git, Jest, React', ev: ['Giữ nguyên từ CV gốc'] },
  { id: 's7', sec: 'Kỹ năng', origin: 'inferred', text: 'SQL', orig: '', ev: ['Suy ra từ MySQL theo phả hệ kỹ năng (MySQL → SQL)'], jd: 'p3' },
  { id: 's8', sec: 'Học vấn', origin: 'original', text: 'Cử nhân Công nghệ thông tin, 2021 – 2025.', orig: 'Cử nhân Công nghệ thông tin, 2021 – 2025.', ev: ['Giữ nguyên từ CV gốc'] },
];
export const SEC_META: Record<string, string> = { 'Kinh nghiệm': 'Backend Intern · Công ty GHI · 06/2025 – 12/2025' };
export const ORIGIN: Record<Origin, [string, 'ok' | 'warn' | 'mute']> = { original: ['Giữ nguyên', 'mute'], rewritten: ['Viết lại', 'ok'], inferred: ['Suy ra', 'warn'], review: ['Cần bạn xem lại', 'warn'] };
export const STATUS: Record<AppStatus, string> = { interview: 'Phỏng vấn', submitted: 'Đã nộp', reminded: 'Đã nhắc', rejected: 'Từ chối' };

export const clone = <T,>(o: T): T => structuredClone(o);
export const noReview = () => clone(BASE_SENTENCES).filter(s => s.id !== 's2');

export const INITIAL_APPS: Application[] = [
  { id: 'a1', jobId: 'j2', status: 'interview', date: '24/10', to: 'thuha.tran@finpay.vn', thread: [
    { out: true, from: 'Bạn · gửi tự động', date: '24/10 · 08:14', subj: 'Ứng tuyển Junior Backend Engineer – Nguyễn Minh Anh', body: 'Kính gửi Anh/Chị phụ trách tuyển dụng,\n\nEm gửi CV ứng tuyển vị trí Junior Backend Engineer. CV đã đính kèm trong thư này.\n\nTrân trọng,\nNguyễn Minh Anh' },
    { out: false, from: 'Trần Thu Hà · FinPay', date: '02/11 · 16:40', subj: 'Mời phỏng vấn vòng 1 – Junior Backend Engineer', body: 'Chào Minh Anh,\n\nCảm ơn bạn đã ứng tuyển. Bên mình muốn mời bạn phỏng vấn online vòng 1 (45 phút). Bạn có thể tham gia lúc 10:00 thứ Năm 05/11 hoặc 14:00 thứ Sáu 06/11 không?\n\nThân,\nThu Hà', label: { t: 'Thư mời phỏng vấn', conf: 0.96 } },
  ], draft: 'Chào chị Hà,\n\nCảm ơn chị đã gửi lời mời. Em xin xác nhận tham gia phỏng vấn online lúc 10:00 thứ Năm 05/11.\n\nTrân trọng,\nNguyễn Minh Anh', draftSent: false },
  { id: 'a2', jobId: 'j5', status: 'reminded', date: '21/10', thread: [
    { out: true, from: 'Bạn · gửi tự động', date: '21/10 · 09:02', subj: 'Ứng tuyển Fullstack Developer – Nguyễn Minh Anh', body: 'Kính gửi Anh/Chị,\n\nEm gửi CV ứng tuyển vị trí Fullstack Developer (React/Node).\n\nTrân trọng,\nNguyễn Minh Anh' },
    { out: true, from: 'Bạn · nhắc tự động', date: '26/10 · 09:00', subj: 'Re: Ứng tuyển Fullstack Developer – Nguyễn Minh Anh', body: 'Kính gửi Anh/Chị,\n\nEm xin phép hỏi lại về hồ sơ đã gửi ngày 21/10. Em rất mong nhận được phản hồi.\n\nTrân trọng,\nNguyễn Minh Anh' },
  ] },
  { id: 'a3', jobId: 'j4', status: 'submitted', date: '30/10', thread: [
    { out: true, from: 'Bạn · gửi tự động', date: '30/10 · 08:20', subj: 'Ứng tuyển Backend Fresher (Node.js) – Nguyễn Minh Anh', body: 'Kính gửi Anh/Chị,\n\nEm gửi CV ứng tuyển vị trí Backend Fresher (Node.js).\n\nTrân trọng,\nNguyễn Minh Anh' },
  ] },
  { id: 'a4', jobId: 'j10', status: 'rejected', date: '15/10', thread: [
    { out: true, from: 'Bạn · gửi tự động', date: '15/10 · 08:11', subj: 'Ứng tuyển Backend Developer – Nguyễn Minh Anh', body: 'Kính gửi Anh/Chị,\n\nEm gửi CV ứng tuyển vị trí Backend Developer.\n\nTrân trọng,\nNguyễn Minh Anh' },
    { out: false, from: 'ShopNow Talent', date: '29/10 · 11:05', subj: 'Kết quả ứng tuyển Backend Developer', body: 'Chào bạn,\n\nCảm ơn bạn đã quan tâm. Hiện tại hồ sơ của bạn chưa phù hợp với vị trí này. Chúc bạn sớm tìm được công việc phù hợp.', label: { t: 'Từ chối', conf: 0.91 } },
  ] },
];

export const INITIAL_TODAY: LogEntry[] = [
  { t: '08:20', x: 'Nộp hồ sơ Backend Fresher · LogiNext VN' },
  { t: '08:14', x: 'Tối ưu CV cho Backend Developer · Công ty ABC — 1 câu chờ bạn xem lại' },
  { t: '08:09', x: '2 job có CAPTCHA, chuyển sang chờ bạn nộp tay' },
  { t: '08:06', x: 'Quét 214 tin, giữ lại 10 job phù hợp' },
  { t: '08:02', x: 'Đọc xong CV: 14 thông tin, 6 kỹ năng' },
];

export const INITIAL_CV_FIELDS: CvField[] = [
  { k: 'Họ tên', v: 'Nguyễn Minh Anh', c: .99, src: 'Nguyễn Minh Anh' },
  { k: 'Email', v: 'minhanh.dev@gmail.com', c: .98, src: 'minhanh.dev@gmail.com' },
  { k: 'Số điện thoại', v: '09•• ••• 412', c: .97, note: 'Đã che trước khi gửi cho AI', src: '09•• ••• 412' },
  { k: 'Vị trí mong muốn', v: 'Junior Backend Developer', c: .94, src: 'Junior Backend Developer' },
  { k: 'Kinh nghiệm', v: 'Backend Intern, Công ty GHI, 06/2025 – 12/2025', c: .91, src: 'Backend Intern · Công ty GHI · 06/2025 – 12/2025' },
  { k: 'Thời gian thực tập', v: '6 tháng', c: .62, note: 'Ngày kết thúc bị mờ trên ảnh chụp', src: '06/2025 – 12/2025' },
  { k: 'Kỹ năng', v: 'Node.js, REST API, MySQL, Git, Jest, React', c: .88, src: 'Node.js · REST API · MySQL · Git · Jest · React' },
  { k: 'Học vấn', v: 'Cử nhân Công nghệ thông tin, 2021 – 2025', c: .71, note: 'Không đọc được tên trường', src: 'Cử nhân Công nghệ thông tin, 2021 – 2025' },
];
