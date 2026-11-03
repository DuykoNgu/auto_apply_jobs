import type { Metadata } from 'next';
import { fontVars } from '@/lib/fonts';
import './landing.css';

export const metadata: Metadata = {
  title: 'ACAJ — Nạp CV một lần, phần còn lại hệ thống tự làm',
  description: 'ACAJ đọc CV, tìm job phù hợp, tối ưu CV cho từng job, nộp hồ sơ và theo dõi phản hồi. Bạn chỉ quay lại khi có thư mời phỏng vấn.',
};

// Separate root layout so the landing stylesheet never leaks into the workspace (and vice versa).
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi" className={fontVars} suppressHydrationWarning><body>{children}</body></html>;
}
