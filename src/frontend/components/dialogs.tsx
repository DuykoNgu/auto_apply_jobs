'use client';

// Toast + confirm + edit dialogs, shared by every workspace screen. Native <dialog> keeps focus trapping and Esc.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from './icon';
import { buttonClass } from './ui/button';
import { errClass, fieldClass, fieldLabelClass, textareaClass } from './ui/form';
import { cx } from '@/lib/cn';

type ConfirmOpts = { title: string; body: ReactNode; ok: string; danger?: boolean; cb: () => void };
type EditOpts = { title: string; label: string; value: string; cb: (v: string) => void };
type Api = { toast: (msg: string) => void; confirm: (o: ConfirmOpts) => void; edit: (o: EditOpts) => void };

const DialogsCtx = createContext<Api | null>(null);
export const useDialogs = () => {
  const ctx = useContext(DialogsCtx);
  if (!ctx) throw new Error('useDialogs must be used inside DialogsProvider');
  return ctx;
};

/** Focus the current screen's main heading. */
export const focusHeading = () => {
  const h = document.querySelector<HTMLElement>('#ws [data-h1], #ws [data-lp-title]');
  if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
};

export const dialogClass = (extra?: string) => cx(
  'rounded-xl p-0 text-ink shadow-[0_24px_64px_rgba(0,0,0,.24)] backdrop:bg-[rgba(12,16,18,.42)] open:animate-pop',
  extra ?? 'w-[min(540px,calc(100vw-32px))]');
const dlgTitle = 'text-22 font-light tracking-[-.01em]';
const dlgFoot = 'flex flex-wrap justify-end gap-2 border-t border-rule bg-pane px-6 py-3';

/** Open a modal, remembering focus; on close, return focus unless the action moved it. */
export function useModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const back = useRef<Element | null>(null);
  const keep = useRef(false);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    const onClose = () => {
      if (!keep.current) setTimeout(() => {
        if (back.current instanceof HTMLElement && back.current.isConnected) back.current.focus(); else focusHeading();
      }, 0);
      keep.current = false;
    };
    const onClick = (e: MouseEvent) => { if ((e.target as Element).closest('[data-close]') || e.target === d) d.close(); };
    d.addEventListener('close', onClose); d.addEventListener('click', onClick);
    return () => { d.removeEventListener('close', onClose); d.removeEventListener('click', onClick); };
  }, []);
  const open = useCallback(() => { back.current = document.activeElement; ref.current?.showModal(); }, []);
  const closeKeepFocus = useCallback(() => { keep.current = true; ref.current?.close(); }, []);
  return { ref, open, closeKeepFocus };
}

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toastRef = useRef<HTMLDivElement>(null);
  // Popover = top layer, so the toast shows above any open modal (z-index can't beat a modal <dialog>).
  useEffect(() => {
    const el = toastRef.current; if (!el) return;
    if (msg) { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); }
    else if (el.matches(':popover-open')) el.hidePopover();
  }, [msg]);
  const toast = useCallback((m: string) => {
    setMsg(m); clearTimeout(toastT.current); toastT.current = setTimeout(() => setMsg(null), 3000);
  }, []);

  const confirmDlg = useModal();
  const [conf, setConf] = useState<ConfirmOpts | null>(null);
  const confirm = useCallback((o: ConfirmOpts) => {
    setConf(o); confirmDlg.open();
    requestAnimationFrame(() => (confirmDlg.ref.current?.querySelector('[data-close]') as HTMLElement | null)?.focus());
  }, [confirmDlg.open, confirmDlg.ref]);

  const editDlg = useModal();
  const [ed, setEd] = useState<EditOpts | null>(null);
  const [edVal, setEdVal] = useState('');
  const [edErr, setEdErr] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const edit = useCallback((o: EditOpts) => {
    setEd(o); setEdVal(o.value); setEdErr(false); editDlg.open();
    requestAnimationFrame(() => { const i = inputRef.current; if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
  }, [editDlg.open]);
  const editSave = () => {
    const v = edVal.trim();
    if (!v) { setEdErr(true); inputRef.current?.focus(); return; }
    editDlg.closeKeepFocus(); ed?.cb(v);
  };

  const api = useMemo(() => ({ toast, confirm, edit }), [toast, confirm, edit]);
  return (
    <DialogsCtx.Provider value={api}>
      {children}

      <dialog className={dialogClass()} ref={confirmDlg.ref} aria-labelledby="confirmTitle">
        <div className="grid gap-3 p-6"><h2 className={dlgTitle} id="confirmTitle">{conf?.title}</h2><div>{conf?.body}</div></div>
        <div className={dlgFoot}>
          <button className={buttonClass()} type="button" data-close>Hủy</button>
          <button className={buttonClass(conf?.danger ? 'dangerSolid' : 'primary')} type="button"
            onClick={() => { const cb = conf?.cb; confirmDlg.closeKeepFocus(); cb?.(); }}>{conf?.ok}</button>
        </div>
      </dialog>

      <dialog className={dialogClass()} ref={editDlg.ref} aria-labelledby="editTitle">
        <div className="grid gap-3 p-6">
          <h2 className={dlgTitle} id="editTitle">{ed?.title}</h2>
          <div className={fieldClass}>
            <label htmlFor="editInput" className={fieldLabelClass}>{ed?.label}</label>
            <textarea className={textareaClass({ minH: 'min-h-[120px]' })} id="editInput" ref={inputRef} value={edVal}
              aria-invalid={edErr || undefined}
              onChange={e => setEdVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); editSave(); } }} />
            <span className={errClass} hidden={!edErr}>Nội dung không được để trống. Hãy nhập lại hoặc bấm Hủy.</span>
          </div>
        </div>
        <div className={dlgFoot}>
          <button className={buttonClass()} type="button" data-close>Hủy</button>
          <button className={buttonClass('primary')} type="button" onClick={editSave}>Lưu</button>
        </div>
      </dialog>

      <div ref={toastRef} popover="manual" role="status" aria-live="polite"
        className="fixed inset-auto bottom-6 left-1/2 m-0 flex not-[:popover-open]:hidden max-w-[calc(100vw-32px)] -translate-x-1/2 border-0 items-center gap-3 rounded-[9px] bg-ink px-[18px] py-[11px] text-14 font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,.25)] [--icon:17px]">
        {msg && <><Icon name="check" className="text-[#86D8BF]" /><span>{msg}</span></>}
      </div>
    </DialogsCtx.Provider>
  );
}
