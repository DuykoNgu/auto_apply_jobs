'use client';

// SCR-50: profile, mailbox connection, security and data deletion.
import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { useDialogs } from '@/components/dialogs';
import { buttonClass } from '@/components/ui/button';
import { errClass, fieldClass, fieldLabelClass, helpClass, inputClass } from '@/components/ui/form';
import { IconList, InlineNote } from '@/components/ui/misc';
import { Eyebrow, H1, Section } from '@/components/ui/typography';
import { SheetPane } from '@/components/workspace/shell';
import { useDemo } from '@/lib/demo/store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const focus = (sel: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(sel)?.focus());
const Req = () => <span className="text-danger" aria-hidden="true">*</span>;

function MailboxRow({ title, help, children }: { title: ReactNode; help: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-6 py-4">
      <div className="grid flex-[1_1_280px] gap-0.5">{title}<span className={helpClass}>{help}</span></div>
      <div className="grid flex-[0_1_360px] justify-items-end max-tab:basis-full max-tab:justify-items-start">{children}</div>
    </div>
  );
}

export function AccountPage() {
  const { s, update } = useDemo();
  const { toast, confirm } = useDialogs();
  const [form, setForm] = useState(s.user);
  const [bad, setBad] = useState({ name: false, email: false });
  const check = (k: 'name' | 'email', val = form[k]) => {
    const ok = k === 'email' ? EMAIL_RE.test(val.trim()) : val.trim().length > 0;
    setBad(b => ({ ...b, [k]: !ok })); return ok;
  };
  const save = () => {
    const okN = check('name'), okE = check('email');
    if (!okN || !okE) { document.getElementById(okN ? 'fEmail' : 'fName')?.focus(); return; }
    update(d => { d.user = { name: form.name.trim(), email: form.email.trim(), role: form.role.trim() || d.user.role, city: form.city }; });
    toast('Đã lưu thông tin cá nhân');
  };

  return (
    <SheetPane>
      <Eyebrow>Tài khoản</Eyebrow>
      <H1>{s.user.name}</H1>
      {s.deleteScheduled && (
        <InlineNote tone="warn" icon="alert" action={<button className={buttonClass('default', 'sm')} onClick={() => { update(d => { d.deleteScheduled = false; }); toast('Đã hủy yêu cầu xóa'); focus('#deleteAcc'); }}>Hủy yêu cầu xóa</button>}>
          Tài khoản và toàn bộ dữ liệu sẽ bị xóa trong 30 ngày. Autopilot đã dừng.
        </InlineNote>
      )}
      <Section headingId="pH" title="Thông tin cá nhân">
        <div className="grid grid-cols-2 gap-4 max-tab:grid-cols-1">
          <div className={fieldClass}><label htmlFor="fName" className={fieldLabelClass}>Họ tên <Req /></label>
            <input id="fName" className={inputClass()} required aria-describedby="fNameErr" aria-invalid={bad.name || undefined} value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} onBlur={() => check('name')} />
            <span className={errClass} id="fNameErr" hidden={!bad.name}>Hãy nhập họ tên để nhà tuyển dụng biết thư từ ai.</span></div>
          <div className={fieldClass}><label htmlFor="fEmail" className={fieldLabelClass}>Email <Req /></label>
            <input id="fEmail" className={inputClass()} type="email" required aria-describedby="fEmailErr" aria-invalid={bad.email || undefined} value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} onBlur={() => check('email')} />
            <span className={errClass} id="fEmailErr" hidden={!bad.email}>Email chưa đúng định dạng, ví dụ ten@gmail.com.</span></div>
          <div className={fieldClass}><label htmlFor="fRole" className={fieldLabelClass}>Vị trí nhắm tới</label>
            <input id="fRole" className={inputClass()} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
          <div className={fieldClass}><label htmlFor="fCity" className={fieldLabelClass}>Nơi muốn làm việc</label>
            <select id="fCity" className={inputClass()} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
              {['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Remote'].map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="mt-4"><button className={buttonClass('primary')} onClick={save}><Icon name="check" />Lưu thay đổi</button></div>
      </Section>
      <Section headingId="mbH" title="Hộp thư">
        {s.mailbox ? (
          <MailboxRow title={<strong>{s.user.email}</strong>} help="Gmail · đã kết nối. Dùng để gửi hồ sơ, gửi thư nhắc và đọc phản hồi.">
            <button id="disconnect" className={buttonClass('danger')} onClick={() => confirm({ title: 'Ngắt kết nối hộp thư?', ok: 'Ngắt kết nối', danger: true,
              body: <p className="text-ink-2">Hệ thống sẽ không gửi được hồ sơ qua email, không gửi thư nhắc và không đọc được phản hồi cho tới khi bạn kết nối lại.</p>,
              cb: () => { update(d => { d.mailbox = false; }); toast('Đã ngắt kết nối hộp thư'); focus('#connect'); } })}>Ngắt kết nối</button>
          </MailboxRow>
        ) : (
          <MailboxRow title={<strong className="text-amber">Chưa kết nối hộp thư</strong>} help="Không gửi được thư nhắc và không nhận ra thư mời phỏng vấn.">
            <button id="connect" className={buttonClass('primary')} onClick={() => { update(d => { d.mailbox = true; }); toast('Đã kết nối Gmail'); focus('#disconnect'); }}><Icon name="mail" />Kết nối Gmail</button>
          </MailboxRow>
        )}
      </Section>
      <Section headingId="sessH" title="Phiên đăng nhập">
        <MailboxRow title={<strong>Đang đăng nhập bằng {s.user.email}</strong>} help="Đăng xuất để quay về trang giới thiệu ACAJ.">
          <a className={buttonClass()} href="/"><Icon name="logout" />Đăng xuất</a>
        </MailboxRow>
      </Section>
      <Section headingId="dzH" title="Bảo mật và dữ liệu">
        <IconList items={[['lock', 'Phiên đăng nhập hết hạn sau 30 phút không hoạt động.'], ['lock', 'Thông tin nhạy cảm được che trước khi gửi cho AI.'], ['lock', 'CV của bạn không được dùng để huấn luyện mô hình.']]} />
        <div className="mt-4">
          <button id="deleteAcc" className={buttonClass('danger')} disabled={s.deleteScheduled} onClick={() => confirm({ title: 'Xóa tài khoản và toàn bộ dữ liệu?', ok: 'Xóa dữ liệu', danger: true,
            body: <p className="text-ink-2">CV, các bản CV đã tối ưu, hồ sơ ứng tuyển và chuỗi thư sẽ bị xóa vĩnh viễn trong 30 ngày. Trong thời gian đó bạn vẫn có thể hủy.</p>,
            cb: () => { update(d => { d.deleteScheduled = true; d.auto.paused = true; }); toast('Đã lên lịch xóa trong 30 ngày'); } })}><Icon name="trash" />Xóa tài khoản và dữ liệu</button>
        </div>
      </Section>
    </SheetPane>
  );
}
