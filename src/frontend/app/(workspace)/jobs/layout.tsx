'use client';

import { useParams } from 'next/navigation';
import { SplitView } from '@/components/workspace/split-view';
import { JobsList } from '@/features/jobs/components/jobs-list';

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  const { jobId } = useParams<{ jobId?: string }>();
  return <SplitView list={<JobsList />} showDetail={!!jobId} listLabel="Danh sách việc làm" basePath="/jobs">{children}</SplitView>;
}
