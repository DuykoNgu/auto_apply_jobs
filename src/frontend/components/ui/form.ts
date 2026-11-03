import { cx } from '@/lib/cn';

const control = 'rounded-ctl border border-rule-2 bg-paper hover:border-[#A9B1B5] '
  + 'focus:border-gold-ink focus:outline-2 focus:-outline-offset-1 focus:outline-gold-ink aria-invalid:border-danger';

const SIZE = { md: 'py-[9px] text-15', sm: 'py-1.5 text-14' };
type Opts = { minH?: string; width?: string; px?: string; size?: keyof typeof SIZE; extra?: string };

/** Text input / select. Override minH, width, px or size instead of passing conflicting classes in `extra`. */
export const inputClass = ({ minH = 'min-h-[42px]', width = 'w-full', px = 'px-3', size = 'md', extra }: Opts = {}) => cx(control, SIZE[size], minH, width, px, extra);
export const textareaClass = ({ minH = 'min-h-[150px]', extra }: Opts = {}) => cx(control, SIZE.md, 'w-full resize-y px-3 leading-[1.6]', minH, extra);

export const fieldClass = 'grid gap-1.5';
export const fieldLabelClass = 'text-14 font-medium';
export const helpClass = 'text-13 text-ink-3';
export const errClass = 'text-13 font-medium text-danger';
