/** Accent-insensitive lowercase, for Vietnamese search. */
export const fold = (s: string) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/** Current time as HH:MM. */
export const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const isNarrow = () => matchMedia('(max-width:900px)').matches;
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
