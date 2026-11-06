import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { ApiError } from '@/lib/api-client';
import { formatSize, validateFile } from '../lib';
import { useUploadCv } from './use-cv';

export function useCvUpload(onUploaded: () => void) {
  const upload = useUploadCv();
  const params = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState('');
  const [fileLabel, setFileLabel] = useState<{ name: string; size: string } | null>(null);
  const [over, setOver] = useState(false);

  const openPicker = () => fileRef.current?.click();
  useEffect(() => {
    if (params.get('upload')) fileRef.current?.click();
  }, [params]);

  const handleFile = (file: File) => {
    const problem = validateFile(file);
    setFileError(problem);
    if (problem) return;
    upload.mutate(file, {
      onSuccess: () => {
        setFileLabel({ name: file.name, size: formatSize(file.size) });
        onUploaded();
      },
    });
  };

  const dropProps = {
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setOver(false);
      const file = event.dataTransfer.files[0];
      if (file) handleFile(file);
    },
  };

  return {
    fileRef,
    fileLabel,
    over,
    dropProps,
    openPicker,
    handleFile,
    isUploading: upload.isPending,
    uploadError: fileError || (upload.error instanceof ApiError ? upload.error.message : ''),
  };
}

export type CvUpload = ReturnType<typeof useCvUpload>;
