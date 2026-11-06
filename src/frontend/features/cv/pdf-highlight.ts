import type { CvFact, PdfTextItem, TextBox, TextIndex } from './types';

const KEY_LENGTH = 40;

export const squash = (text: string): string =>
  text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');

export function buildTextIndex(items: PdfTextItem[]): TextIndex {
  let flat = '';
  const owners: number[] = [];
  items.forEach((item, boxIndex) => {
    const text = squash(item.str);
    flat += text;
    for (let i = 0; i < text.length; i++) owners.push(boxIndex);
  });
  const boxes = items.map(({ page, left, top, width, height }) => ({ page, left, top, width, height }));
  return { flat, boxes, owners };
}

export function locateFact(index: TextIndex, fact: Pick<CvFact, 'title' | 'body'>): TextBox[] {
  const lines = fact.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const headKey = squash(fact.title ?? lines[0] ?? '').slice(0, KEY_LENGTH);
  if (!headKey) return [];
  const start = index.flat.indexOf(headKey);
  if (start < 0) return [];
  const tailKey = squash(lines[lines.length - 1] ?? '').slice(-KEY_LENGTH);
  const tailAt = tailKey ? index.flat.indexOf(tailKey, start) : -1;
  const end = tailAt >= 0 ? tailAt + tailKey.length : start + headKey.length;
  return mergeIntoLines(index, start, end);
}

function mergeIntoLines(index: TextIndex, start: number, end: number): TextBox[] {
  const boxIds = [...new Set(index.owners.slice(start, end))];
  const lines = new Map<string, TextBox>();
  for (const id of boxIds) {
    const box = index.boxes[id];
    const key = `${box.page}:${Math.round(box.top)}`;
    const line = lines.get(key);
    if (!line) {
      lines.set(key, { ...box });
      continue;
    }
    const right = Math.max(line.left + line.width, box.left + box.width);
    const bottom = Math.max(line.top + line.height, box.top + box.height);
    line.left = Math.min(line.left, box.left);
    line.top = Math.min(line.top, box.top);
    line.width = right - line.left;
    line.height = bottom - line.top;
  }
  return [...lines.values()];
}
