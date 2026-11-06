import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import type { CvField } from '@/lib/types';
import type { ConnectorLine } from '../types';

export function useConnectorLine(
  containerRef: RefObject<HTMLElement | null>,
  active: number | null,
  fields: CvField[],
  pending: boolean,
) {
  const [line, setLine] = useState<ConnectorLine | null>(null);

  const draw = useCallback(() => {
    const wrap = containerRef.current;
    const row = active === null ? null : wrap?.querySelector(`[data-cv-item="${active}"]`);
    const mark = active === null ? null : wrap?.querySelector(`[data-cv-mark="${active}"]`);
    const paper = wrap?.querySelector('#cvPaper');
    if (!wrap || !row || !mark || !paper || matchMedia('(max-width:1180px)').matches) return setLine(null);
    const wrapBox = wrap.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const valueBox = (row.querySelector('[data-cv-v]') || row).getBoundingClientRect();
    const markBox = mark.getBoundingClientRect();
    const paperBox = paper.getBoundingClientRect();
    const x1 = rowBox.left - wrapBox.left - 10;
    const y1 = valueBox.top - wrapBox.top + Math.min(valueBox.height, 24) / 2;
    const x2 = paperBox.right - wrapBox.left + 12;
    const y2 = markBox.top - wrapBox.top + markBox.height / 2;
    setLine({ d: `M${x1} ${y1} C${x1 - 44} ${y1}, ${x2 + 44} ${y2}, ${x2} ${y2}`, x1, y1, x2, y2 });
  }, [containerRef, active]);

  useLayoutEffect(draw, [draw, fields, pending]);
  useEffect(() => {
    window.addEventListener('resize', draw);
    void document.fonts?.ready.then(draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  return line;
}
