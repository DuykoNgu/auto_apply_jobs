import type { RefObject } from 'react';
import { Icon } from '@/components/icon';
import { buttonClass } from '@/components/ui/button';

export function FilePicker({
  inputRef,
  onFile,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
}) {
  return (
    <input
      type="file"
      ref={inputRef}
      className="sr-only"
      tabIndex={-1}
      aria-label="Tệp CV"
      accept=".pdf,.docx"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onFile(file);
        event.target.value = '';
      }}
    />
  );
}

type ButtonProps = { label: string; className?: string; disabled: boolean; onClick: () => void };

export function UploadButton({ label, className, disabled, onClick }: ButtonProps) {
  return (
    <button type="button" className={buttonClass('default', 'sm', className)} onClick={onClick} disabled={disabled}>
      <Icon name="upload" />
      {label}
    </button>
  );
}
