import type { Metadata } from 'next';
import { AuthForm } from '@/features/auth/components/auth-form';

export const metadata: Metadata = { title: 'Tạo tài khoản — ACAJ' };

export default function Page() { return <AuthForm mode="register" />; }
