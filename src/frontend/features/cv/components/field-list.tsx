import { cx } from '@/lib/cn';
import type { CvField } from '@/lib/types';
import type { CvFact } from '../types';
import { SECTION_TITLE, groupFacts } from '../lib';
import { FieldActions } from './field-actions';

type Props = {
  facts: CvFact[];
  fields: CvField[];
  openIndex: number | null;
  onToggle: (index: number) => void;
  onHover: (index: number | null) => void;
  onConfirm: (index: number) => void;
  onEdit: (index: number) => void;
};

export function FieldList({ facts, fields, openIndex, onToggle, onHover, onConfirm, onEdit }: Props) {
  const groups = groupFacts(facts);
  let shown = 0;
  return (
    <div id="cvList" className="grid gap-7 border-t border-rule pt-5">
      {groups.map((group) => (
        <section key={group.kind} aria-labelledby={`cv-group-${group.kind}`}>
          <h3 id={`cv-group-${group.kind}`} className="mb-1 flex items-baseline gap-2 text-13 font-medium text-ink">
            {SECTION_TITLE[group.kind]}
            {group.indexes.length > 1 && (
              <span className="text-12 font-normal text-ink-3 tabular-nums">{group.indexes.length} mục</span>
            )}
          </h3>
          <ol className="border-t border-rule">
            {group.indexes.map((i) => {
              const position = shown++;
              const field = fields[i];
              const organization = facts[i].organization;
              const open = openIndex === i;
              const isLow = field.c < 0.8;
              return (
                <li key={facts[i].id} className="group relative border-b border-rule" data-open={open || undefined}>
                  <button
                    type="button"
                    data-cv-item={i}
                    aria-expanded={open}
                    aria-controls={`cvact-${i}`}
                    className="group/item grid w-full grid-cols-[24px_minmax(0,1fr)_auto] items-start gap-x-2.5 gap-y-2 px-1.5 py-[11px] text-left text-ink hover:bg-pane group-data-open:bg-pane max-phone:grid-cols-[20px_minmax(0,1fr)_auto] max-phone:px-1"
                    onClick={() => onToggle(i)}
                    onPointerEnter={() => onHover(i)}
                    onPointerLeave={() => onHover(null)}
                    onFocus={() => onHover(i)}
                    onBlur={() => onHover(null)}
                  >
                    <span className="pt-[3px] text-11 tracking-[.06em] text-ink-3 tabular-nums group-data-open:text-gold-ink">
                      {String(position + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">
                      <span
                        data-cv-v
                        className="inline border-b border-[rgba(181,128,68,.45)] text-[14.5px] leading-[1.45] box-decoration-clone transition-colors duration-150 group-hover/item:border-ink group-data-open:border-gold-ink max-phone:text-14"
                      >
                        {field.v}
                      </span>
                      {organization && <span className="mt-0.5 block text-12 text-ink-3">{organization}</span>}
                    </span>
                    <span
                      className={cx(
                        'pt-[3px] text-[11.5px] whitespace-nowrap tabular-nums',
                        isLow ? 'text-amber' : 'text-ink-3',
                      )}
                    >
                      {field.ok ? 'đã xác nhận' : `${Math.round(field.c * 100)}%`}
                    </span>
                  </button>
                  {open && (
                    <FieldActions
                      id={`cvact-${i}`}
                      field={field}
                      onConfirm={() => onConfirm(i)}
                      onEdit={() => onEdit(i)}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
