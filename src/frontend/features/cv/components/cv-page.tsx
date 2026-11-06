'use client';

import { useMemo, useRef } from 'react';
import { SheetPane } from '@/components/workspace/shell';
import { useCurrentCv, useOriginalPdf } from '../hooks/use-cv';
import { useConnectorLine } from '../hooks/use-connector-line';
import { useCvUpload } from '../hooks/use-cv-upload';
import { useFieldEdits } from '../hooks/use-field-edits';
import { useReadyAnnouncement } from '../hooks/use-ready-announcement';
import { useSelection } from '../hooks/use-selection';
import { CvHeader } from './cv-header';
import { CvNotices } from './cv-notices';
import { CvEmpty, CvLoadError, CvLoading } from './cv-states';
import { FilePicker } from './file-picker';
import { OriginalColumn } from './original-column';
import { ReviewColumn } from './review-column';

export function CvPage() {
  const { cv, stalled, isLoading, isError, refetch } = useCurrentCv();
  const splitRef = useRef<HTMLDivElement>(null);
  const selection = useSelection();
  const facts = useMemo(() => cv?.facts ?? [], [cv]);
  const { fields, confirmField, editField, resetEdits } = useFieldEdits(facts, (index) => {
    selection.clear();
    selection.focusRow(index);
  });
  const upload = useCvUpload(() => {
    resetEdits();
    selection.clear();
  });
  const pdf = useOriginalPdf(cv);
  const failed = cv?.status === 'FAILED';
  const pending = upload.isUploading || (cv?.status === 'PENDING' && !stalled);
  const line = useConnectorLine(splitRef, selection.active, fields, pending);
  useReadyAnnouncement(cv);

  if (isLoading) return <CvLoading />;
  if (isError) return <CvLoadError onRetry={refetch} />;
  if (!cv && !upload.isUploading) return <CvEmpty upload={upload} />;

  return (
    <SheetPane>
      <CvHeader />
      <FilePicker inputRef={upload.fileRef} onFile={upload.handleFile} />
      <CvNotices failed={failed} stalled={stalled} upload={upload} onCheckAgain={refetch} />
      <div
        ref={splitRef}
        className="relative mt-5 grid grid-cols-[minmax(0,1.06fr)_minmax(360px,.94fr)] items-start gap-14 max-cv:grid-cols-[minmax(0,1fr)] max-cv:gap-8"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute inset-0 z-[2] size-full overflow-visible max-cv:hidden"
        >
          {line && (
            <>
              <path d={line.d} fill="none" stroke="var(--color-gold-ink)" strokeWidth="1" opacity=".5" />
              <circle cx={line.x2} cy={line.y2} r="3" fill="var(--color-gold)" />
              <circle cx={line.x1} cy={line.y1} r="2.5" fill="var(--color-gold-ink)" />
            </>
          )}
        </svg>
        <OriginalColumn
          cv={cv}
          facts={facts}
          fields={fields}
          pending={pending}
          active={selection.active}
          focusRequest={selection.focusRequest}
          upload={upload}
          pdf={pdf}
          onPickMark={(index) => selection.select(index, index)}
        />
        <ReviewColumn
          facts={facts}
          fields={fields}
          pending={pending}
          failed={failed}
          openIndex={selection.selected}
          onToggle={selection.toggle}
          onHover={selection.setHovered}
          onConfirm={confirmField}
          onEdit={editField}
        />
      </div>
    </SheetPane>
  );
}
