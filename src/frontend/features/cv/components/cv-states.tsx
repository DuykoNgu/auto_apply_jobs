import { buttonClass } from '@/components/ui/button';
import { errClass } from '@/components/ui/form';
import { EmptyState, InlineNote, Skeleton } from '@/components/ui/misc';
import { SheetPane } from '@/components/workspace/shell';
import { cx } from '@/lib/cn';
import type { CvUpload } from '../hooks/use-cv-upload';
import { CvHeader } from './cv-header';
import { FilePicker, UploadButton } from './file-picker';

export function CvLoading() {
  return (
    <SheetPane>
      <CvHeader />
      <div className="mt-5 grid gap-3.5" role="status" aria-label="Đang tải CV">
        <Skeleton width="40%" />
        <Skeleton width="70%" />
        <Skeleton width="55%" />
      </div>
    </SheetPane>
  );
}

export function CvLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <SheetPane>
      <CvHeader />
      <InlineNote
        tone="warn"
        icon="alert"
        action={
          <button type="button" className={buttonClass('default', 'sm')} onClick={onRetry}>
            Thử lại
          </button>
        }
      >
        Không tải được CV. Kiểm tra kết nối rồi thử lại.
      </InlineNote>
    </SheetPane>
  );
}

export function CvEmpty({ upload }: { upload: CvUpload }) {
  return (
    <SheetPane>
      <CvHeader
        title="Tải CV của bạn lên"
        description="AI sẽ đọc CV và tách thành từng mục để bạn kiểm tra. CV gốc không bao giờ bị ghi đè."
      />
      <FilePicker inputRef={upload.fileRef} onFile={upload.handleFile} />
      <div
        className={cx(
          'mt-5 rounded-[2px] border border-dashed border-rule-2',
          upload.over && 'outline-2 outline-offset-[6px] outline-gold',
        )}
        {...upload.dropProps}
      >
        <EmptyState icon="upload" title="Chưa có CV nào" tall>
          <p>Kéo thả file PDF hoặc DOCX vào đây, tối đa 10 MB.</p>
          <UploadButton
            label="Chọn file CV"
            className="mt-2"
            disabled={upload.isUploading}
            onClick={upload.openPicker}
          />
          <span className={cx(errClass, 'block')} hidden={!upload.uploadError}>
            {upload.uploadError}
          </span>
        </EmptyState>
      </div>
    </SheetPane>
  );
}
