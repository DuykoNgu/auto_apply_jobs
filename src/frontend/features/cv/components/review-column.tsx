import { Icon } from '@/components/icon';
import { Skeleton } from '@/components/ui/misc';
import type { CvField } from '@/lib/types';
import { needsCheck } from '../lib';
import type { CvFact } from '../types';
import { ColumnHead } from './column-head';
import { FieldList } from './field-list';

type Props = {
  facts: CvFact[];
  fields: CvField[];
  pending: boolean;
  failed: boolean;
  openIndex: number | null;
  onToggle: (index: number) => void;
  onHover: (index: number | null) => void;
  onConfirm: (index: number) => void;
  onEdit: (index: number) => void;
};

function summary(pending: boolean, failed: boolean, lowCount: number): string {
  if (pending) return 'đang đọc…';
  if (failed) return 'chưa đọc được';
  return lowCount ? `${lowCount} chỗ cần bạn xem lại` : 'đã kiểm tra hết';
}

function ReviewSkeleton() {
  return (
    <div className="grid gap-[18px] py-4" aria-hidden="true">
      {[78, 56, 64, 84, 48, 70, 58, 66].map((width, i) => (
        <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3.5" key={i}>
          <Skeleton width={56} />
          <Skeleton width={`${width}%`} />
        </div>
      ))}
    </div>
  );
}

export function ReviewColumn({ facts, fields, pending, failed, openIndex, ...handlers }: Props) {
  const lowCount = fields.filter(needsCheck).length;
  return (
    <section className="min-w-0" aria-labelledby="xH">
      <ColumnHead
        title="AI đã đọc được gì"
        titleId="xH"
        note={<span className="text-13 text-ink-3">{summary(pending, failed, lowCount)}</span>}
      />
      {pending ? <ReviewSkeleton /> : <FieldList facts={facts} fields={fields} openIndex={openIndex} {...handlers} />}
      <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-[1.55] text-ink-3 [--icon:14px]">
        <Icon name="lock" className="mt-0.5" />
        <span>Email và số điện thoại được che trước khi gửi AI; CV không dùng để huấn luyện mô hình.</span>
      </p>
    </section>
  );
}
