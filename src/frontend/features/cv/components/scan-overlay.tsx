import { Icon } from '@/components/icon';
import { cx } from '@/lib/cn';

export function ScanOverlay({ active }: { active: boolean }) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cx(
          'pointer-events-none absolute inset-0 z-[3] overflow-hidden transition-opacity duration-180',
          active ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="absolute -inset-x-[4%] top-[-160px] h-[150px] animate-cv-scan border-b border-gold bg-[linear-gradient(180deg,transparent_0%,rgba(212,165,116,.07)_58%,rgba(212,165,116,.3)_96%,rgba(181,128,68,.45)_100%)] shadow-[0_14px_30px_-14px_rgba(212,165,116,.75)]" />
      </div>
      {active && (
        <span className="pointer-events-none absolute top-3 right-3 z-[4] inline-flex items-center gap-1.5 rounded-full bg-[rgba(26,26,24,.9)] py-[5px] pr-2.5 pl-[9px] text-12 font-medium text-white shadow-[0_6px_18px_-8px_rgba(0,0,0,.35)] [--icon:13px] max-phone:hidden">
          <Icon name="spark" className="text-gold" />
          Đang quét bản gốc…
        </span>
      )}
    </>
  );
}
