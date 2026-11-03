import { cx } from '@/lib/cn';

const base = 'inline-flex items-center justify-center gap-2 rounded-ctl border font-medium whitespace-nowrap [--icon:16px] transition-[background-color,border-color] duration-150 '
  + 'disabled:cursor-not-allowed disabled:border-[#ECEEEF] disabled:bg-[#ECEEEF] disabled:text-[#6A7177] '
  + 'aria-disabled:cursor-not-allowed aria-disabled:border-[#ECEEEF] aria-disabled:bg-[#ECEEEF] aria-disabled:text-[#6A7177]';

const variants = {
  default: 'border-rule-2 bg-paper text-ink hover:border-[#A9B1B5] hover:bg-pane',
  primary: 'border-ink bg-ink text-white hover:border-ink-hover hover:bg-ink-hover',
  quiet: 'border-transparent bg-transparent text-ink hover:bg-hover',
  danger: 'border-[#E6B9B3] bg-paper text-danger hover:border-danger hover:bg-danger-soft',
  dangerSolid: 'border-danger bg-danger text-white hover:border-[#8C1A12] hover:bg-[#8C1A12]',
};
const sizes = { md: 'min-h-[38px] px-4 text-14', sm: 'min-h-[34px] px-3 text-13' };

export type ButtonVariant = keyof typeof variants;

/** Class string for anything that looks like a button (button, Link, label). */
export const buttonClass = (variant: ButtonVariant = 'default', size: keyof typeof sizes = 'md', extra?: string) =>
  cx(base, variants[variant], sizes[size], extra);

/** Underlined text button. Has no font-size so callers can set one. */
export const linkClass = (extra?: string) =>
  cx('inline-flex items-center gap-1 font-medium text-ink underline decoration-rule-2 underline-offset-4 [--icon:14px] hover:decoration-ink', extra);
