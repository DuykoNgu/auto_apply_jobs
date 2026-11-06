import { useEffect, useState } from 'react';
import type { FocusRequest } from '../types';

const focusRow = (index: number | null) =>
  requestAnimationFrame(() => {
    if (index !== null)
      document.querySelector<HTMLElement>(`[data-cv-item="${index}"]`)?.focus({ preventScroll: true });
  });

export function useSelection() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  const select = (index: number | null, focusAfter: number | null = selected) => {
    setSelected(index);
    focusRow(index ?? focusAfter);
  };
  const toggle = (index: number) => {
    if (selected !== index) setFocusRequest((previous) => ({ index, nonce: (previous?.nonce ?? 0) + 1 }));
    select(selected === index ? null : index, index);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selected !== null && !document.querySelector('dialog[open]')) {
        setSelected(null);
        focusRow(selected);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected]);

  return {
    active: hovered ?? selected,
    selected,
    focusRequest,
    setHovered,
    select,
    toggle,
    clear: () => setSelected(null),
    focusRow,
  };
}
