import { useMemo, useState } from 'react';
import { useDialogs } from '@/components/dialogs';
import type { CvField } from '@/lib/types';
import { factToField } from '../lib';
import type { CvEdit, CvFact } from '../types';

export function useFieldEdits(facts: CvFact[], afterChange: (index: number) => void) {
  const { toast, edit } = useDialogs();
  const [edits, setEdits] = useState<Record<string, CvEdit>>({});

  const fields: CvField[] = useMemo(
    () =>
      facts.map((fact) => {
        const field = factToField(fact);
        const change = edits[fact.id];
        if (!change) return field;
        return { ...field, v: change.v ?? field.v, ...(change.confirmed && { c: 0.99, ok: true, note: '' }) };
      }),
    [facts, edits],
  );

  const apply = (index: number, change: CvEdit) =>
    setEdits((previous) => ({ ...previous, [facts[index].id]: { ...previous[facts[index].id], ...change } }));

  const confirmField = (index: number) => {
    apply(index, { confirmed: true });
    toast(`Đã xác nhận ${fields[index].k}`);
    afterChange(index);
  };

  const editField = (index: number) =>
    edit({
      title: `Sửa ${fields[index].k}`,
      label: fields[index].k,
      value: fields[index].v,
      cb: (value) => {
        apply(index, { v: value, confirmed: true });
        toast(`Đã sửa ${fields[index].k}`);
        afterChange(index);
      },
    });

  return { fields, confirmField, editField, resetEdits: () => setEdits({}) };
}
