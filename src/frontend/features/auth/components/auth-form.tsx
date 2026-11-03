'use client';

// SCR-01 Đăng nhập / SCR-02 Đăng ký. Validates on blur and on submit; errors say what is wrong and how to fix it.
// ponytail: no API yet — on success we only remember name + email in this browser (never the password) and enter the app.
// Replace `finish` with POST /auth/login | /auth/register (docs/api/openapi.yaml) once src/backend exists.
import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { errClass, fieldClass, fieldLabelClass, helpClass, inputClass } from '@/components/ui/form';
import { AuthShell, authButton, authLink } from './auth-shell';

type Mode = 'login' | 'register';
type Field = 'name' | 'email' | 'password';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function check(field: Field, v: string): string {
  if (field === 'name') return v.trim() ? '' : 'Hãy nhập họ tên để nhà tuyển dụng biết thư từ ai.';
  if (field === 'email') return EMAIL_RE.test(v.trim()) ? '' : 'Email chưa đúng định dạng, ví dụ ten@gmail.com.';
  return v.length >= MIN_PASSWORD ? '' : `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const fields: Field[] = mode === 'register' ? ['name', 'email', 'password'] : ['email', 'password'];
  const [val, setVal] = useState<Record<Field, string>>({ name: '', email: '', password: '' });
  const [err, setErr] = useState<Partial<Record<Field, string>>>({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const blur = (f: Field) => setErr(e => ({ ...e, [f]: check(f, val[f]) }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = Object.fromEntries(fields.map(f => [f, check(f, val[f])])) as Record<Field, string>;
    setErr(next);
    const firstBad = fields.find(f => next[f]);
    if (firstBad) { document.getElementById(`auth-${firstBad}`)?.focus(); return; }
    setBusy(true);
    try {
      const email = val.email.trim();
      const name = mode === 'register' ? val.name.trim() : (JSON.parse(localStorage.getItem('acaj.user') || 'null')?.name ?? email.split('@')[0]);
      localStorage.setItem('acaj.user', JSON.stringify({ name, email }));
      localStorage.setItem('acaj.onboarded', mode === 'register' ? '0' : '1');
    } catch { /* storage unavailable: the app falls back to demo data */ }
    // New accounts start the setup flow at the CV step; returning users land on the overview.
    window.location.href = mode === 'register' ? '/cv' : '/dashboard';
  };

  const label: Record<Field, string> = { name: 'Họ tên', email: 'Email', password: 'Mật khẩu' };
  const auto: Record<Field, string> = { name: 'name', email: 'email', password: mode === 'register' ? 'new-password' : 'current-password' };

  return (
    <AuthShell
      title={mode === 'register' ? 'Tạo tài khoản.' : 'Đăng nhập.'}
      lead={mode === 'register' ? 'Bước tiếp theo là nạp CV. Hệ thống đọc CV, tìm job phù hợp và nộp hồ sơ thay bạn.' : 'Chào mừng bạn quay lại. Hệ thống vẫn chạy trong lúc bạn vắng mặt.'}
      footer={mode === 'register'
        ? <>Đã có tài khoản? <Link className={authLink} href="/login">Đăng nhập</Link></>
        : <>Chưa có tài khoản? <Link className={authLink} href="/register">Tạo tài khoản</Link></>}>
      <form noValidate onSubmit={submit} className="grid gap-5">
        {fields.map(f => (
          <div key={f} className={fieldClass}>
            <label htmlFor={`auth-${f}`} className={fieldLabelClass}>{label[f]}</label>
            <div className="relative">
              <input id={`auth-${f}`} name={f} autoComplete={auto[f]} required
                type={f === 'password' && !show ? 'password' : f === 'email' ? 'email' : 'text'}
                className={inputClass({ minH: 'min-h-12', px: f === 'password' ? 'pr-20 pl-3' : 'px-3' })}
                aria-invalid={err[f] ? true : undefined} aria-describedby={err[f] ? `auth-${f}-err` : f === 'password' && mode === 'register' ? 'auth-password-help' : undefined}
                value={val[f]} onChange={e => { const v = e.target.value; setVal(x => ({ ...x, [f]: v })); if (err[f]) setErr(x => ({ ...x, [f]: check(f, v) })); }}
                onBlur={() => blur(f)} />
              {f === 'password' && (
                <button type="button" onClick={() => setShow(v => !v)} aria-pressed={show} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 py-1 text-13 font-medium text-ink-2 hover:bg-hover hover:text-ink">{show ? 'Ẩn' : 'Hiện'}</button>
              )}
            </div>
            {err[f]
              ? <span id={`auth-${f}-err`} className={errClass}>{err[f]}</span>
              : f === 'password' && mode === 'register' && <span id="auth-password-help" className={helpClass}>Ít nhất {MIN_PASSWORD} ký tự.</span>}
          </div>
        ))}
        <button type="submit" disabled={busy} className={authButton}>{mode === 'register' ? 'Tạo tài khoản và nạp CV' : 'Đăng nhập'}<Icon name="right" className="[--icon:16px]" /></button>
        {mode === 'register' && <p className="text-13 text-ink-3">CV và thông tin của bạn không dùng để huấn luyện mô hình. Bạn có thể xóa tài khoản và toàn bộ dữ liệu bất cứ lúc nào.</p>}
      </form>
    </AuthShell>
  );
}
