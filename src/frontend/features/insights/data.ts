// Market sample data (SCR-20). Numbers come from statistics; AI only writes the explanation (docs/09-algorithms.md).
export const MONTHS = ['T11', 'T12', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10'];
export const DEMAND = [820, 860, 910, 880, 950, 1010, 980, 1060, 1120, 1150, 1190, 1240];
export const GAPS = [
  { s: 'Node.js', d: 78, have: true }, { s: 'MySQL / SQL', d: 71, have: true }, { s: 'REST API', d: 66, have: true },
  { s: 'Docker', d: 58, have: false, p: 'cao' }, { s: 'Git', d: 55, have: true }, { s: 'TypeScript', d: 47, have: false, p: 'vừa' },
  { s: 'Redis', d: 31, have: false, p: 'thấp' }, { s: 'AWS', d: 28, have: false, p: 'thấp' },
];
export const LEVELS = [
  ['Fresher', '8–12 tr', 'Mới ra trường'],
  ['Junior', '12–18 tr', '0–2 năm'],
  ['Mid', '20–30 tr', '2–4 năm · tự chủ một mảng'],
  ['Senior', '30–45 tr', '4+ năm · dẫn dắt kỹ thuật'],
];
export const DEMAND_MIX: [string, [string, number][]][] = [
  ['Khu vực', [['TP.HCM', 58], ['Hà Nội', 31], ['Đà Nẵng', 6], ['Khác', 5]]],
  ['Vị trí', [['Junior Backend', 38], ['Backend (Node)', 27], ['Fullstack', 20], ['Fresher', 15]]],
  ['Hình thức', [['Onsite', 46], ['Hybrid', 38], ['Remote', 16]]],
];
type Year = [string, string, string, string[]];
export const FOCUS_PATHS: Record<string, { label: string; summary: string; meta: string; years: Year[] }> = {
  backend: {
    label: 'Backend chuyên sâu', summary: 'Đi sâu Node.js, dữ liệu và hệ thống phân tán.', meta: '3 năm · 30–45 tr',
    years: [['Năm 1', 'Junior vững', '16–20 tr', ['Docker: đóng gói một API Node.js', 'TypeScript cho backend', 'Viết test tích hợp']],
      ['Năm 2', 'Backend Mid', '20–30 tr', ['Redis và cache', 'CI/CD với GitHub Actions', 'Chứng chỉ AWS Cloud Practitioner']],
      ['Năm 3', 'Hướng Senior', '30–45 tr', ['Thiết kế hệ thống', 'Message queue (Kafka)', 'Dẫn dắt code review']]],
  },
  fullstack: {
    label: 'Fullstack Node + React', summary: 'Thêm frontend để nhận việc ở team nhỏ và startup.', meta: '3 năm · 34–46 tr',
    years: [['Năm 1', 'Junior Fullstack', '16–21 tr', ['TypeScript cho cả hai phía', 'React và luồng dữ liệu', 'Viết test cho component']],
      ['Năm 2', 'Fullstack Mid', '22–32 tr', ['Next.js và SSR', 'Thiết kế API cho nhiều client', 'Review PR frontend']],
      ['Năm 3', 'Fullstack Senior', '34–46 tr', ['Kiến trúc end-to-end', 'Tối ưu hiệu năng', 'Mentor cho junior']]],
  },
  platform: {
    label: 'Backend + hạ tầng', summary: 'Docker, CI/CD, cloud — đi về platform và DevOps.', meta: '3 năm · 32–48 tr',
    years: [['Năm 1', 'Backend có nền hạ tầng', '16–20 tr', ['Docker và docker-compose', 'Linux cơ bản', 'GitHub Actions đầu tiên']],
      ['Năm 2', 'Platform Engineer', '22–32 tr', ['Kubernetes', 'Terraform', 'Log và metrics (observability)']],
      ['Năm 3', 'Platform / DevOps', '32–48 tr', ['Multi-cloud', 'SLO và on-call', 'Bảo mật hạ tầng']]],
  },
};
