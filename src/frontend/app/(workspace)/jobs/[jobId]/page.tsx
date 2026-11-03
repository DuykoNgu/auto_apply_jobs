import { JobDetail } from '@/features/jobs/components/job-detail';

export default async function Page({ params }: { params: Promise<{ jobId: string }> }) {
  return <JobDetail jobId={(await params).jobId} />;
}
