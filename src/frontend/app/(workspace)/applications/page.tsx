'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EmptyState } from '@/components/ui/misc';
import { Doc } from '@/components/workspace/split-view';
import { orderedApps } from '@/features/applications/components/applications-list';
import { useDemo } from '@/lib/demo/store';
import { isNarrow } from '@/lib/format';

// SCR-40. Wide screens open the first application; mobile shows the list only.
export default function Page() {
  const router = useRouter();
  const { s } = useDemo();
  const first = orderedApps(s)[0]?.id;
  useEffect(() => { if (first && !isNarrow()) router.replace(`/applications/${first}`); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Doc><EmptyState icon="inbox" title="Chọn một hồ sơ để xem chuỗi thư" tall>
      <span className="text-14">Dùng <kbd>J</kbd> <kbd>K</kbd> để lướt danh sách.</span></EmptyState></Doc>
  );
}
