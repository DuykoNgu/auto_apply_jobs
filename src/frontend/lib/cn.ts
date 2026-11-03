/** Join class names, skipping falsy values. Callers must not pass two classes for the same CSS property. */
export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');
