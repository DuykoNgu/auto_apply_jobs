'use client';

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cx } from '@/lib/cn';
import { reducedMotion } from '@/lib/format';
import { usePdfDocument } from '../hooks/use-pdf-document';
import { locateFact } from '../pdf-highlight';
import type { CvFact, FocusRequest, LoadedPdf, TextBox } from '../types';
import { PdfSkeleton } from './pdf-skeleton';

type Props = {
  url: string;
  facts: CvFact[];
  activeIndex: number | null;
  focus: FocusRequest | null;
  onFail: () => void;
};

const PAGE_PADDING = 12;

export function OriginalPdf({ url, facts, activeIndex, focus, onFail }: Props) {
  const { loaded, failed } = usePdfDocument(url);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [width, setWidth] = useState(0);
  const setPageRef = useCallback((page: number, element: HTMLDivElement | null) => {
    pageRefs.current[page] = element;
  }, []);

  useEffect(() => {
    if (failed) onFail();
  }, [failed, onFail]);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    let frame = 0;
    const measure = () => setWidth(Math.max(0, element.clientWidth - PAGE_PADDING * 2));
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [loaded]);

  const boxesByFact = useMemo(
    () => (loaded ? facts.map((fact) => locateFact(loaded.index, fact)) : []),
    [loaded, facts],
  );

  const softByPage = useMemo(
    () => groupByPage(activeIndex === null ? [] : boxesByFact[activeIndex]),
    [activeIndex, boxesByFact],
  );
  const flashByPage = useMemo(() => groupByPage(focus ? boxesByFact[focus.index] : []), [focus, boxesByFact]);

  useEffect(() => {
    if (!focus || !loaded || width === 0) return;
    const first = boxesByFact[focus.index]?.[0];
    const container = scrollRef.current;
    const pageElement = first && pageRefs.current[first.page];
    if (!first || !container || !pageElement) return;
    const scale = width / loaded.sizes[first.page].width;
    const behavior = reducedMotion() ? 'auto' : 'smooth';
    container.scrollTo({
      top: Math.max(0, pageElement.offsetTop + first.top * scale - container.clientHeight / 3),
      behavior,
    });
    container.scrollIntoView({ block: 'nearest', behavior });
  }, [focus, loaded, width, boxesByFact]);

  if (!loaded) return <PdfSkeleton />;

  return (
    <div
      ref={scrollRef}
      id="cvPaper"
      tabIndex={0}
      aria-label="CV gốc"
      className="relative h-[min(1100px,calc(100vh-180px))] min-h-[640px] overflow-y-auto border border-rule bg-[#ECE9E3]"
      style={{ padding: PAGE_PADDING }}
    >
      {width > 0 &&
        loaded.sizes.map((size, page) => (
          <PdfPage
            key={page}
            loaded={loaded}
            page={page}
            scale={width / size.width}
            soft={softByPage.get(page) ?? NO_BOXES}
            flash={flashByPage.get(page) ?? NO_BOXES}
            flashKey={focus?.nonce ?? 0}
            setRef={setPageRef}
          />
        ))}
    </div>
  );
}

const NO_BOXES: TextBox[] = [];

function groupByPage(boxes: TextBox[] | undefined): Map<number, TextBox[]> {
  const pages = new Map<number, TextBox[]>();
  for (const box of boxes ?? []) pages.set(box.page, [...(pages.get(box.page) ?? []), box]);
  return pages;
}

type PageProps = {
  loaded: LoadedPdf;
  page: number;
  scale: number;
  soft: TextBox[];
  flash: TextBox[];
  flashKey: number;
  setRef: (page: number, element: HTMLDivElement | null) => void;
};

const PdfPage = memo(function PdfPage({ loaded, page, scale, soft, flash, flashKey, setRef }: PageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = loaded.sizes[page];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    let cancelled = false;
    let cancelRender = () => {};
    void loaded.pdf.getPage(page + 1).then((pdfPage) => {
      if (cancelled) return;
      const viewport = pdfPage.getViewport({ scale });
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      const task = pdfPage.render({ canvas, viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
      cancelRender = () => task.cancel();
      task.promise.catch((error: unknown) => {
        if (!(error instanceof Error && error.name === 'RenderingCancelledException')) {
          console.error('Could not draw a page of the original PDF', error);
        }
      });
    });
    return () => {
      cancelled = true;
      cancelRender();
    };
  }, [loaded, page, scale]);

  const place = (box: TextBox) => ({
    left: box.left * scale - 2,
    top: box.top * scale - 2,
    width: box.width * scale + 4,
    height: box.height * scale + 4,
  });

  return (
    <div
      ref={(element) => setRef(page, element)}
      className="relative mx-auto mb-3 bg-white shadow-[0_1px_3px_rgba(26,26,24,.18)]"
      style={{ width: size.width * scale, height: size.height * scale }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Trang ${page + 1} của CV gốc`}
        style={{ width: size.width * scale, height: size.height * scale }}
      />
      {soft.map((box, i) => (
        <span
          key={`s${i}`}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[2px] bg-[rgba(255,138,0,.2)]"
          style={place(box)}
        />
      ))}
      {flash.map((box, i) => (
        <span
          key={`f${flashKey}-${i}`}
          aria-hidden="true"
          className={cx(
            'pointer-events-none absolute rounded-[2px] animate-cv-flash motion-reduce:animate-none motion-reduce:bg-[rgba(255,138,0,.4)]',
          )}
          style={place(box)}
        />
      ))}
    </div>
  );
});
