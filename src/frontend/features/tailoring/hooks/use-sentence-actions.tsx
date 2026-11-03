'use client';

// Confirm / edit / drop / undo one sentence of a tailored CV (BR: unsupported sentences wait for the user).
import { focusHeading, useDialogs } from '@/components/dialogs';
import { logYou, useDemo, type DemoState } from '@/lib/demo/store';

const focusSent = (sid?: string) => requestAnimationFrame(() => {
  const b = sid && document.querySelector<HTMLElement>(`[data-sid="${sid}"]`);
  if (b) b.focus({ preventScroll: true }); else focusHeading();
});

export function useSentenceActions() {
  const { s, update } = useDemo();
  const { toast, confirm, edit } = useDialogs();
  const find = (d: DemoState, jid: string, sid: string) => d.tailored[jid].find(x => x.id === sid)!;
  const after = (sid?: string) => { update(d => { if (sid) d.selSent = sid; }); focusSent(sid); };

  return {
    confirm(jid: string, sid: string) {
      update(d => { const x = find(d, jid, sid); x.origin = 'rewritten'; x.ev = ['Bạn xác nhận câu này đúng với kinh nghiệm thực tế']; x.note = ''; logYou(d, 'Xác nhận 1 câu trong CV đã tối ưu'); });
      toast('Đã giữ câu này'); after(sid);
    },
    drop(jid: string, sid: string) {
      const list = s.tailored[jid], i = list.findIndex(x => x.id === sid);
      confirm({ title: 'Bỏ câu này khỏi CV?', ok: 'Bỏ câu', danger: true,
        body: <p className="text-ink-2">“{list[i].text}” sẽ bị xóa khỏi bản CV cho job này. CV gốc không thay đổi.</p>,
        cb: () => {
          const rest = list.filter(x => x.id !== sid), next = rest[Math.min(i, rest.length - 1)]?.id;
          update(d => { d.tailored[jid] = d.tailored[jid].filter(x => x.id !== sid); logYou(d, 'Bỏ 1 câu chưa đủ căn cứ khỏi CV'); });
          toast('Đã bỏ câu'); after(next);
        } });
    },
    edit(jid: string, sid: string) {
      const cur = s.tailored[jid].find(x => x.id === sid)!;
      edit({ title: 'Sửa câu trong CV', label: 'Nội dung câu', value: cur.text, cb: v => {
        if (v !== cur.text) {
          update(d => { const x = find(d, jid, sid); x.text = v; x.origin = 'rewritten'; x.ev = ['Bạn tự viết lại câu này']; x.note = ''; logYou(d, 'Sửa 1 câu trong CV đã tối ưu'); });
          toast('Đã lưu câu');
        }
        after(sid);
      } });
    },
    undo(jid: string, sid: string) {
      update(d => { const x = find(d, jid, sid); x.text = x.orig; x.origin = 'original'; x.ev = ['Giữ nguyên từ CV gốc']; x.note = ''; });
      toast('Đã hoàn tác về bản gốc'); after(sid);
    },
  };
}
