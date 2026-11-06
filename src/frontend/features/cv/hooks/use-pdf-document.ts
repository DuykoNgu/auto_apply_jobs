import type { PDFDocumentLoadingTask } from 'pdfjs-dist';
import { useEffect, useState } from 'react';
import { buildTextIndex } from '../pdf-highlight';
import type { LoadedPdf, PdfPageSize, PdfTextItem } from '../types';

type State = { loaded: LoadedPdf | null; failed: boolean };

async function loadPdf(url: string, register: (task: PDFDocumentLoadingTask) => void): Promise<LoadedPdf> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const task = pdfjs.getDocument({ url });
  register(task);
  const pdf = await task.promise;
  const pages = await Promise.all(Array.from({ length: pdf.numPages }, (_, i) => pdf.getPage(i + 1)));
  const contents = await Promise.all(pages.map((page) => page.getTextContent()));
  const sizes: PdfPageSize[] = [];
  const items: PdfTextItem[] = [];
  pages.forEach((page, pageIndex) => {
    const viewport = page.getViewport({ scale: 1 });
    sizes.push({ width: viewport.width, height: viewport.height });
    for (const item of contents[pageIndex].items) {
      if (!('str' in item)) continue;
      const transform = pdfjs.Util.transform(viewport.transform, item.transform);
      items.push({
        str: item.str,
        page: pageIndex,
        left: transform[4],
        top: transform[5] - item.height,
        width: item.width,
        height: item.height,
      });
    }
  });
  return { pdf, sizes, index: buildTextIndex(items) };
}

export function usePdfDocument(url: string): State {
  const [state, setState] = useState<State>({ loaded: null, failed: false });
  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | null = null;
    loadPdf(url, (created) => (task = created)).then(
      (loaded) => !cancelled && setState({ loaded, failed: false }),
      (error: unknown) => {
        console.error('Could not open the original PDF', error);
        if (!cancelled) setState({ loaded: null, failed: true });
      },
    );
    return () => {
      cancelled = true;
      void (task as PDFDocumentLoadingTask | null)?.destroy();
    };
  }, [url]);
  return state;
}
