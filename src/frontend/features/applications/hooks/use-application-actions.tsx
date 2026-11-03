'use client';

// Submit / mark-manual / send-reply, used from the dashboard, job detail and application detail.
import { useRouter } from 'next/navigation';
import { focusHeading, useDialogs } from '@/components/dialogs';
import { jobById, noReview } from '@/lib/demo/data';
import { appById, logYou, useDemo } from '@/lib/demo/store';
import { now } from '@/lib/format';

export function useApplicationActions() {
  const router = useRouter();
  const { s, update } = useDemo();
  const { toast, confirm } = useDialogs();

  const submitApp = (jid: string, manual: boolean) => {
    const j = jobById(jid)!, id = 'a' + Date.now().toString(36), name = s.user.name;
    update(d => {
      d.apps.push({ id, jobId: jid, status: 'submitted', date: '03/11', thread: [{ out: true, from: manual ? 'Bạn · nộp tay trên trang tuyển dụng' : 'Bạn · gửi từ ACAJ', date: `03/11 · ${now()}`, subj: `Ứng tuyển ${j.title} – ${name}`, body: `Kính gửi Anh/Chị,\n\nEm gửi CV ứng tuyển vị trí ${j.title}.\n\nTrân trọng,\n${name}` }] });
      if (!d.tailored[jid]) d.tailored[jid] = noReview();
      logYou(d, `${manual ? 'Đánh dấu đã nộp tay' : 'Nộp hồ sơ'} ${j.title} · ${j.company}`);
    });
    toast(manual ? `Đã ghi nhận hồ sơ ${j.company}. Hệ thống sẽ theo dõi phản hồi.` : `Đã nộp hồ sơ vào ${j.company}`);
    router.push(`/applications/${id}`);
  };

  return {
    submit(jid: string) {
      const j = jobById(jid)!;
      confirm({ title: `Nộp hồ sơ vào ${j.company}?`, ok: 'Nộp hồ sơ', cb: () => submitApp(jid, false),
        body: <p className="text-ink-2">Gửi CV đã tối ưu và cover letter cho vị trí <strong>{j.title}</strong> từ {s.user.email}. Sau 5 ngày chưa có phản hồi, hệ thống tự gửi một thư nhắc.</p> });
    },
    markManual(jid: string) {
      const j = jobById(jid)!;
      confirm({ title: 'Bạn đã nộp trên trang tuyển dụng?', ok: 'Đã nộp', cb: () => submitApp(jid, true),
        body: <p className="text-ink-2">Đánh dấu đã nộp <strong>{j.title}</strong> tại {j.company} để hệ thống theo dõi phản hồi và nhắc khi cần.</p> });
    },
    sendReply(aid: string, focusOnEmpty?: () => void) {
      const a = appById(s, aid)!, txt = (a.draft || '').trim();
      if (!txt) { toast('Thư trả lời đang trống'); focusOnEmpty?.(); return; }
      confirm({ title: 'Gửi thư trả lời?', ok: 'Gửi thư',
        body: <><p className="mb-2 text-14 text-ink-2">Tới <strong>{a.to}</strong> · từ {s.user.email}</p><div className="max-h-[220px] overflow-auto rounded-ctl bg-pane px-4 py-3 text-14 whitespace-pre-line">{txt}</div></>,
        cb: () => {
          update(d => {
            const x = appById(d, aid)!;
            x.draft = txt; x.draftSent = true;
            x.thread.push({ out: true, from: 'Bạn', date: `03/11 · ${now()}`, subj: 'Re: Mời phỏng vấn vòng 1 – Junior Backend Engineer', body: txt });
            logYou(d, `Gửi thư xác nhận phỏng vấn tới ${jobById(x.jobId)!.company}`);
          });
          toast('Đã gửi thư trả lời');
          requestAnimationFrame(focusHeading);
        } });
    },
    openSite: () => toast('Trong bản thật, trang tuyển dụng sẽ mở ở tab mới'),
  };
}
