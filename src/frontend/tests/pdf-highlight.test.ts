import { describe, expect, it } from 'vitest';
import { buildTextIndex, locateFact, squash } from '@/features/cv/pdf-highlight';
import type { PdfTextItem } from '@/features/cv/types';

const item = (str: string, top: number, left = 0, page = 0): PdfTextItem => ({
  str,
  page,
  left,
  top,
  width: str.length * 5,
  height: 10,
});

const index = buildTextIndex([
  item('PHAN ĐỨC DUY', 0),
  item('Education', 40),
  item('Software Engineering', 60),
  item('HUST 2021 - 2025', 75),
  item('Experience', 100),
  item('AI Engineer', 120),
  item('Intern at', 135, 0),
  item('LUSIA', 135, 60),
  item('• Built agents with', 150),
  item('LangGraph and RAG', 165),
  item('Projects', 10, 0, 1),
]);

describe('squash', () => {
  it('keeps only lower-case letters and digits, including Vietnamese letters', () => {
    expect(squash('Kỹ sư • C++ (2025)!')).toBe('kỹsưc2025');
  });
});

describe('locateFact', () => {
  it('finds an entry by its title and covers every line down to the end of its body', () => {
    const boxes = locateFact(index, {
      title: 'AI Engineer',
      body: 'AI Engineer\nIntern at LUSIA\n• Built agents with LangGraph and RAG',
    });
    expect(boxes.map((box) => box.top)).toEqual([120, 135, 150, 165]);
  });

  it('merges pieces of the same line into one box', () => {
    const [line] = locateFact(index, { title: null, body: 'Intern at LUSIA' });
    expect(line).toMatchObject({ top: 135, left: 0, width: 60 + 25 });
  });

  it('is not thrown off by spacing or punctuation differences', () => {
    const boxes = locateFact(index, { title: 'Software  engineering', body: 'Software engineering\nHUST, 2021–2025' });
    expect(boxes.map((box) => box.top)).toEqual([60, 75]);
  });

  it('highlights only the title when the end of the body cannot be found', () => {
    const boxes = locateFact(index, { title: 'Education', body: 'text that is not in the pdf at all' });
    expect(boxes.map((box) => box.top)).toEqual([40]);
  });

  it('returns nothing when the title is not in the PDF or empty', () => {
    expect(locateFact(index, { title: 'Nowhere', body: 'x' })).toEqual([]);
    expect(locateFact(index, { title: null, body: '' })).toEqual([]);
  });

  it('keeps the page of each box', () => {
    expect(locateFact(index, { title: 'Projects', body: 'Projects' })[0].page).toBe(1);
  });
});
