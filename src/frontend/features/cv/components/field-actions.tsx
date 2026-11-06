import { Icon } from '@/components/icon';
import { buttonClass } from '@/components/ui/button';
import { cx } from '@/lib/cn';
import type { CvField } from '@/lib/types';
import { needsCheck } from '../lib';

type Props = { id: string; field: CvField; onConfirm: () => void; onEdit: () => void };

export function FieldActions({ id, field, onConfirm, onEdit }: Props) {
  const unchecked = needsCheck(field);
  return (
    <div id={id} className="flex flex-wrap items-center gap-2.5 px-1.5 pb-3 pl-[40px] max-phone:pl-[34px]">
      {field.note && (
        <p className={cx('flex items-center gap-1.5 text-13 [--icon:15px]', unchecked ? 'text-amber' : 'text-ink-3')}>
          <Icon name="alert" />
          {field.note}
        </p>
      )}
      <span className="ml-auto flex gap-1.5">
        {unchecked && (
          <button className={buttonClass('primary', 'sm')} type="button" onClick={onConfirm}>
            <Icon name="check" />
            Đúng
          </button>
        )}
        <button className={buttonClass('default', 'sm')} type="button" onClick={onEdit}>
          <Icon name="edit" />
          Sửa
        </button>
      </span>
    </div>
  );
}
