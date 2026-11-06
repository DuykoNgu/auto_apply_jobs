import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/misc';
import { cx } from '@/lib/cn';
import type { CvField } from '@/lib/types';
import type { CvFact } from '../types';
import { SECTION_ORDER, bodyBelowHeading } from '../lib';
import { BodyText } from './body-text';

const sectionHead = 'mb-1.5 text-[10px] font-semibold tracking-[.16em] text-[#8A7F6E] uppercase';
const line = 'mt-0.5 text-[12.5px] text-[#3A342C]';

type Props = {
  facts: CvFact[];
  fields: CvField[];
  active: number | null;
  loading: boolean;
  onPick: (index: number) => void;
};

export function CvPaper({ facts, fields, active, loading, onPick }: Props) {
  const mark = (index: number, heading?: boolean): ReactNode => (
    <span
      role="button"
      tabIndex={0}
      data-cv-mark={index}
      className={cx(
        'inline cursor-pointer rounded-[1px] border-b transition-[background-color,border-color] duration-150 hover:border-gold-ink hover:bg-brand-soft',
        active === index
          ? 'border-gold-ink bg-brand-soft'
          : heading
            ? 'border-transparent'
            : 'border-[rgba(181,128,68,.55)]',
      )}
      onClick={() => onPick(index)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onPick(index);
        }
      }}
    >
      {fields[index].v}
    </span>
  );
  const profileIndex = facts.findIndex((fact) => fact.kind === 'PROFILE');

  return (
    <div
      id="cvPaper"
      aria-label="CV gốc"
      className="border border-rule bg-white px-[30px] pt-8 pb-[34px] font-paper text-13 leading-[1.65] text-[#221F1B] shadow-[0_1px_0_var(--color-rule),0_30px_56px_-44px_rgba(26,26,24,.4)] max-phone:px-5 max-phone:pt-6 max-phone:pb-[26px]"
    >
      {loading || facts.length === 0 ? (
        <div className="grid gap-3" aria-hidden="true">
          {[40, 62, 90, 74, 82, 56, 88, 70].map((width, i) => (
            <Skeleton key={i} width={`${width}%`} />
          ))}
        </div>
      ) : (
        <>
          {profileIndex >= 0 && (
            <header className="mb-[15px] border-b border-[#D9D3C8] pb-3.5">
              <h3 className="font-paper text-[27px] leading-[1.1] font-semibold tracking-[-.01em] max-phone:text-[23px]">
                {mark(profileIndex, true)}
              </h3>
              {facts[profileIndex].body && (
                <p className="mt-[5px] text-12 tracking-[.04em] text-[#6B6257]">{facts[profileIndex].body}</p>
              )}
            </header>
          )}
          {SECTION_ORDER.map((kind) => {
            const entries = facts.map((fact, index) => ({ fact, index })).filter((entry) => entry.fact.kind === kind);
            if (entries.length === 0) return null;
            return (
              <section key={kind} className="mt-3.5">
                <h4 className={sectionHead}>{fields[entries[0].index].k}</h4>
                {entries.map(({ fact, index }) => (
                  <div key={fact.id} className="mb-2">
                    <p className={kind === 'SKILL_LIST' ? line : 'text-[12.5px] font-semibold text-[#2A2620]'}>
                      {mark(index)}
                    </p>
                    {kind !== 'SKILL_LIST' && (
                      <div className={line}>
                        <BodyText text={bodyBelowHeading(fact)} />
                      </div>
                    )}
                  </div>
                ))}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
