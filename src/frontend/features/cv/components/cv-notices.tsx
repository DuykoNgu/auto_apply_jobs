import { buttonClass } from '@/components/ui/button';
import { InlineNote } from '@/components/ui/misc';
import type { CvUpload } from '../hooks/use-cv-upload';
import { UploadButton } from './file-picker';

type Props = { failed: boolean; stalled: boolean; upload: CvUpload; onCheckAgain: () => void };

export function CvNotices({ failed, stalled, upload, onCheckAgain }: Props) {
  const uploadAnother = (
    <UploadButton label="Tải file khác" disabled={upload.isUploading} onClick={upload.openPicker} />
  );
  return (
    <>
      {failed && (
        <InlineNote tone="warn" icon="alert" action={uploadAnother}>
          AI chưa đọc được CV này. File có thể là bản scan, hoặc dài hơn 5 trang. Hãy thử file PDF hoặc DOCX có chữ chọn
          được.
        </InlineNote>
      )}
      {stalled && (
        <InlineNote
          tone="warn"
          icon="alert"
          action={
            <button type="button" className={buttonClass('default', 'sm')} onClick={onCheckAgain}>
              Kiểm tra lại
            </button>
          }
        >
          AI đang đọc lâu hơn bình thường nên trang đã ngừng chờ. Bấm kiểm tra lại, hoặc tải file khác.
        </InlineNote>
      )}
    </>
  );
}
