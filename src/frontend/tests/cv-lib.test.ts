import { describe, expect, it } from 'vitest';
import type { CvFact } from '@/features/cv/types';
import {
  GIVE_UP_AFTER_MS,
  bodyBelowHeading,
  factToField,
  formatSize,
  groupFacts,
  nextPollDelay,
  parseBody,
  validateFile,
} from '@/features/cv/lib';

const fact = (overrides: Partial<CvFact>): CvFact => ({
  id: '1',
  position: 0,
  kind: 'EXPERIENCE',
  title: null,
  organization: null,
  body: 'Intern - ABC\nBuilt APIs',
  confidence: 0.9,
  needsReview: false,
  ...overrides,
});

describe('factToField', () => {
  it('uses the title and keeps the whole body as source', () => {
    const field = factToField(fact({ title: 'Intern - ABC' }));
    expect(field).toMatchObject({ k: 'Kinh nghiệm', v: 'Intern - ABC', src: 'Intern - ABC\nBuilt APIs', c: 0.9 });
    expect(field.note).toBeUndefined();
  });

  it('falls back to the first body line and flags low confidence', () => {
    const field = factToField(fact({ needsReview: true, confidence: 0.6 }));
    expect(field.v).toBe('Intern - ABC');
    expect(field.note).toMatch(/kiểm tra/);
  });
});

describe('validateFile', () => {
  const file = (name: string, size = 1000) => new File([new Uint8Array(size)], name);

  it('accepts pdf and docx', () => {
    expect(validateFile(file('cv.PDF'))).toBe('');
    expect(validateFile(file('cv.docx'))).toBe('');
  });

  it('rejects images and other types', () => {
    expect(validateFile(file('cv.jpg'))).toMatch(/PDF hoặc DOCX/);
    expect(validateFile(file('cv.exe'))).not.toBe('');
  });

  it('rejects files over 10 MB', () => {
    expect(validateFile(file('cv.pdf', 10 * 1024 * 1024 + 1))).toMatch(/10 MB/);
  });
});

describe('formatSize', () => {
  it('uses a decimal comma for megabytes and KB for small files', () => {
    expect(formatSize(2.5 * 1024 * 1024)).toBe('2,5 MB');
    expect(formatSize(37 * 1024)).toBe('37 KB');
  });
});

describe('nextPollDelay', () => {
  it('backs off from 2 seconds and caps at 10 seconds', () => {
    expect(nextPollDelay(0, 0)).toBe(2000);
    expect(nextPollDelay(1, 0)).toBe(3000);
    expect(nextPollDelay(2, 0)).toBe(4500);
    expect(nextPollDelay(20, 0)).toBe(10000);
  });

  it('stops polling once the CV has been pending for 3 minutes', () => {
    expect(nextPollDelay(5, GIVE_UP_AFTER_MS - 1)).toBe(10000);
    expect(nextPollDelay(5, GIVE_UP_AFTER_MS)).toBe(false);
  });
});

describe('groupFacts', () => {
  it('groups every entry of a section together in review order', () => {
    const facts = [
      fact({ id: 'a', kind: 'EXPERIENCE' }),
      fact({ id: 'b', kind: 'EDUCATION' }),
      fact({ id: 'c', kind: 'EXPERIENCE' }),
      fact({ id: 'd', kind: 'PROFILE' }),
      fact({ id: 'e', kind: 'EDUCATION' }),
    ];
    expect(groupFacts(facts)).toEqual([
      { kind: 'PROFILE', indexes: [3] },
      { kind: 'EDUCATION', indexes: [1, 4] },
      { kind: 'EXPERIENCE', indexes: [0, 2] },
    ]);
  });

  it('leaves out sections the CV does not have', () => {
    expect(groupFacts([fact({ kind: 'PROJECT' })]).map((group) => group.kind)).toEqual(['PROJECT']);
  });
});

describe('parseBody', () => {
  it('splits a flattened body into a lead line and one bullet per • mark', () => {
    const body = '10/2025 - 06/2026 Project Manager & Developer (Nhóm 4 người) •Ứng dụng Blockchain •Xây dựng UI';
    expect(parseBody(body)).toEqual({
      lead: ['10/2025 - 06/2026 Project Manager & Developer (Nhóm 4 người)'],
      bullets: ['Ứng dụng Blockchain', 'Xây dựng UI'],
    });
  });

  it('keeps a body that already has one bullet per line', () => {
    expect(parseBody('2025\n• First\n• Second')).toEqual({ lead: ['2025'], bullets: ['First', 'Second'] });
  });

  it('joins a wrapped line back onto the bullet it continues', () => {
    expect(parseBody('• Built an API for\norders and payments\n• Wrote tests').bullets).toEqual([
      'Built an API for orders and payments',
      'Wrote tests',
    ]);
  });

  it('treats a body without bullets as plain lines', () => {
    expect(parseBody('Line one\nLine two')).toEqual({ lead: ['Line one', 'Line two'], bullets: [] });
  });
});

describe('bodyBelowHeading', () => {
  it('drops the first line only when it repeats the heading', () => {
    expect(bodyBelowHeading(fact({ title: 'Intern - ABC', body: 'Intern - ABC\nBuilt APIs' }))).toBe('Built APIs');
    expect(bodyBelowHeading(fact({ title: 'Intern', body: '2025 - 2026\n• Built APIs' }))).toBe(
      '2025 - 2026\n• Built APIs',
    );
  });
});
