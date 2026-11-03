'use client';

import { useParams } from 'next/navigation';
import { SplitView } from '@/components/workspace/split-view';
import { ApplicationsList } from '@/features/applications/components/applications-list';

export default function ApplicationsLayout({ children }: { children: React.ReactNode }) {
  const { applicationId } = useParams<{ applicationId?: string }>();
  return <SplitView list={<ApplicationsList />} showDetail={!!applicationId} listLabel="Danh sách hồ sơ" basePath="/applications">{children}</SplitView>;
}
