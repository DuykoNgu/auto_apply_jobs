import type { CvField } from '@/lib/types';
import type { BodyParts, CvFact, FactGroup, FactKind } from './types';

export const MAX_FILE_MB = 10;

const REVIEW_ORDER: FactKind[] = [
  'PROFILE',
  'SUMMARY',
  'EDUCATION',
  'EXPERIENCE',
  'PROJECT',
  'CERTIFICATE',
  'SKILL_LIST',
];

export const SECTION_TITLE: Record<FactKind, string> = {
  PROFILE: 'Hồ sơ',
  SUMMARY: 'Tóm tắt',
  EDUCATION: 'Học vấn',
  EXPERIENCE: 'Kinh nghiệm',
  PROJECT: 'Dự án',
  CERTIFICATE: 'Chứng chỉ',
  SKILL_LIST: 'Kỹ năng',
};

export function groupFacts(facts: CvFact[]): FactGroup[] {
  return REVIEW_ORDER.map((kind) => ({
    kind,
    indexes: facts.flatMap((fact, index) => (fact.kind === kind ? [index] : [])),
  })).filter((group) => group.indexes.length > 0);
}

export const SECTION_ORDER = REVIEW_ORDER.filter((kind) => kind !== 'PROFILE');

export const needsCheck = (field: CvField): boolean => field.c < 0.8 && !field.ok;

export function factToField(fact: CvFact): CvField {
  return {
    k: fact.kind === 'PROFILE' ? 'Họ tên' : SECTION_TITLE[fact.kind],
    v: fact.title ?? fact.body.split('\n')[0],
    src: fact.body,
    c: fact.confidence ?? 1,
    ok: false,
    note: fact.needsReview ? 'Độ tin cậy thấp, hãy kiểm tra lại chỗ này.' : undefined,
  };
}

export function validateFile(file: File): string {
  if (!/\.(pdf|docx)$/i.test(file.name)) {
    return 'File chưa đúng định dạng. Hãy chọn PDF hoặc DOCX. Ảnh chụp CV sẽ được hỗ trợ sau.';
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `File lớn hơn ${MAX_FILE_MB} MB. Hãy nén file rồi tải lại.`;
  }
  return '';
}

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

const POLL_FIRST_MS = 2000;
const POLL_MAX_MS = 10000;
const POLL_BACKOFF = 1.5;
export const GIVE_UP_AFTER_MS = 3 * 60 * 1000;

export function nextPollDelay(pollCount: number, pendingForMs: number): number | false {
  if (pendingForMs >= GIVE_UP_AFTER_MS) return false;
  return Math.min(POLL_FIRST_MS * POLL_BACKOFF ** pollCount, POLL_MAX_MS);
}

export const pendingForMs = (createdAt: string): number => Date.now() - Date.parse(createdAt);

const BULLET_MARK = /\s*[•●▪]\s*/;

export function parseBody(body: string): BodyParts {
  const lead: string[] = [];
  const bullets: string[] = [];
  for (const line of body.split('\n')) {
    const [head, ...items] = line.split(BULLET_MARK);
    const text = head.trim();
    if (text) {
      if (bullets.length > 0) bullets[bullets.length - 1] += ` ${text}`;
      else lead.push(text);
    }
    bullets.push(...items.map((item) => item.trim()).filter(Boolean));
  }
  return { lead, bullets };
}

export function bodyBelowHeading(fact: CvFact): string {
  const lines = fact.body.split('\n');
  const repeatsHeading = fact.title ? lines[0].trim() === fact.title.trim() : true;
  return repeatsHeading ? lines.slice(1).join('\n') : fact.body;
}
