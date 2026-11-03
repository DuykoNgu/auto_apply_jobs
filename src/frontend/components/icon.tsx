const ICONS = {
  feed: 'M4 6h16M4 12h10M4 18h13',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  file: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6',
  chart: 'M4 20V11M10 20V5M16 20v-6M2 20h20',
  briefcase: 'M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13L22 12v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6 6l12 12M18 6 6 18',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
  right: 'M5 12h14M13 6l6 6-6 6',
  left: 'M19 12H5M11 6l-6 6 6 6',
  chev: 'M9 6l6 6-6 6',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 4l13 8-13 8z',
  alert: 'M12 3 2 21h20zM12 10v4M12 17.5v.01',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  plus: 'M12 5v14M5 12h14',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  hand: 'M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7 6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.6L8 15',
  refresh: 'M20 11a8 8 0 0 0-14.6-4.5L3 9M3 4v5h5M4 13a8 8 0 0 0 14.6 4.5L21 15M21 20v-5h-5',
};
export type IconName = keyof typeof ICONS;

/** Size follows the nearest `--icon` custom property (default 1em). */
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg className={`inline-block size-[var(--icon,1em)] flex-none ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}
