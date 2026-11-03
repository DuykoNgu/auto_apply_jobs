import type { Metadata } from 'next';
import { AuthForm } from '@/features/auth/components/auth-form';

export const metadata: Metadata = { title: 'Đăng nhập — ACAJ' };

export default function Page() { return <AuthForm mode="login" />; }
