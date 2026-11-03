import { ApplicationDetail } from '@/features/applications/components/application-detail';

export default async function Page({ params }: { params: Promise<{ applicationId: string }> }) {
  return <ApplicationDetail applicationId={(await params).applicationId} />;
}
