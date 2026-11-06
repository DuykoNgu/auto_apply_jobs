import type { PDFDocumentProxy } from 'pdfjs-dist';

export type AiStatus = 'PENDING' | 'READY' | 'NEEDS_REVIEW' | 'FAILED';
export type FactKind = 'PROFILE' | 'SUMMARY' | 'EXPERIENCE' | 'PROJECT' | 'EDUCATION' | 'CERTIFICATE' | 'SKILL_LIST';
export type OriginalFileType = 'pdf' | 'docx';

export type CvSummary = {
  id: string;
  status: AiStatus;
  isPrimary: boolean;
  createdAt: string;
  originalFileType: OriginalFileType | null;
};

export type CvFact = {
  id: string;
  position: number;
  kind: FactKind;
  title: string | null;
  organization: string | null;
  body: string;
  confidence: number | null;
  needsReview: boolean;
};

export type Cv = CvSummary & { facts: CvFact[] };

export type FactGroup = { kind: FactKind; indexes: number[] };
export type BodyParts = { lead: string[]; bullets: string[] };
export type CvEdit = { v?: string; confirmed?: boolean };
export type FocusRequest = { index: number; nonce: number };
export type ConnectorLine = { d: string; x1: number; y1: number; x2: number; y2: number };

export type TextBox = { page: number; left: number; top: number; width: number; height: number };
export type PdfTextItem = TextBox & { str: string };
export type TextIndex = { flat: string; boxes: TextBox[]; owners: number[] };
export type PdfPageSize = { width: number; height: number };
export type LoadedPdf = { pdf: PDFDocumentProxy; sizes: PdfPageSize[]; index: TextIndex };
