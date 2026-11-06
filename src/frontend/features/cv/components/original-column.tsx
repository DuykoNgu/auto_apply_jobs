import dynamic from 'next/dynamic';
import { errClass } from '@/components/ui/form';
import { cx } from '@/lib/cn';
import type { CvField } from '@/lib/types';
import type { CvUpload } from '../hooks/use-cv-upload';
import type { Cv, CvFact, FocusRequest } from '../types';
import { ColumnHead } from './column-head';
import { CvPaper } from './cv-paper';
import { UploadButton } from './file-picker';
import { PdfSkeleton } from './pdf-skeleton';
import { ScanOverlay } from './scan-overlay';

const OriginalPdf = dynamic(() => import('./original-pdf').then((module) => module.OriginalPdf), {
  ssr: false,
  loading: () => <PdfSkeleton />,
});

type Props = {
  cv: Cv | undefined;
  facts: CvFact[];
  fields: CvField[];
  pending: boolean;
  active: number | null;
  focusRequest: FocusRequest | null;
  upload: CvUpload;
  pdf: { show: boolean; url: string | null; onFail: () => void };
  onPickMark: (index: number) => void;
};

const uploadedAt = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function OriginalColumn({ cv, facts, fields, pending, active, focusRequest, upload, pdf, onPickMark }: Props) {
  const label = upload.fileLabel;
  return (
    <div className="min-w-0">
      <ColumnHead
        title="Bản gốc"
        note={
          <span className="block max-w-[34ch] min-w-0 truncate text-13 text-ink-3">
            {label ? `${label.size} · ` : ''}tải lên {uploadedAt(cv?.createdAt ?? new Date().toISOString())}
          </span>
        }
      >
        <UploadButton
          label="Tải file mới"
          className="ml-auto max-phone:min-h-11"
          disabled={upload.isUploading}
          onClick={upload.openPicker}
        />
      </ColumnHead>
      <span className={cx(errClass, 'mb-2 block')} role="alert" hidden={!upload.uploadError}>
        {upload.uploadError}
      </span>
      <div
        aria-busy={pending}
        title="Kéo thả file mới để quét lại"
        className={cx('relative rounded-[2px]', upload.over && 'outline-2 outline-offset-[6px] outline-gold')}
        {...upload.dropProps}
      >
        <div className="relative z-[1]">
          {pdf.show ? (
            pdf.url ? (
              <OriginalPdf url={pdf.url} facts={facts} activeIndex={active} focus={focusRequest} onFail={pdf.onFail} />
            ) : (
              <PdfSkeleton />
            )
          ) : (
            <CvPaper facts={facts} fields={fields} active={active} loading={pending} onPick={onPickMark} />
          )}
          <ScanOverlay active={pending} />
        </div>
        <p className="mt-[9px] text-12 text-ink-3 tabular-nums" role="status">
          {pending ? 'Đang tách thông tin…' : `Bản gốc · ${label?.name ?? 'CV đã tải lên'}`}
        </p>
      </div>
    </div>
  );
}
