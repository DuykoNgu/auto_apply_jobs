'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EmptyState } from '@/components/ui/misc';
import { Doc } from '@/components/workspace/split-view';
import { filteredJobs } from '@/features/jobs/lib';
import { useDemo } from '@/lib/demo/store';
import { isNarrow } from '@/lib/format';

// SCR-30. On wide screens open the top job right away, like the prototype; on mobile show the list only.
export default function Page() {
  const router = useRouter();
  const { s } = useDemo();
  const first = filteredJobs(s)[0]?.id;
  useEffect(() => { if (first && !isNarrow()) router.replace(`/jobs/${first}`); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Doc><EmptyState icon="briefcase" title="Chọn một job để xem chi tiết" tall>
      <span className="text-14">Dùng <kbd>J</kbd> <kbd>K</kbd> để lướt danh sách.</span></EmptyState></Doc>
  );
}
