import { Skeleton } from '@/components/ui/misc';

export function PdfSkeleton() {
  return (
    <div className="grid gap-3 border border-rule bg-white p-8" aria-hidden="true">
      {[40, 62, 90, 74, 82, 56, 88, 70].map((width, i) => (
        <Skeleton key={i} width={`${width}%`} />
      ))}
    </div>
  );
}
