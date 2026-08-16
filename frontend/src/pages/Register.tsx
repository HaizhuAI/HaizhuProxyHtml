import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Lock, Mail, User as UserIcon } from 'lucide-react';
import { Logo } from '../components/layout/Logo';
import { apiRegister } from '../lib/api';
import { Button, Card, Field, Input, Spinner } from '../components/ui/ui';
import { useToast } from '../components/ui/toast';

export default function Register() {
  const [form, setForm] = useState({ email: '', username: '', password: '', inviteCode: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const toast = useToast();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (form.password.length < 6) { setErr('密码至少 6 位'); return; }
    setBusy(true);
    const r = await apiRegister(form);
    setBusy(false);
    if (r.error || !r.data?.user) { setErr(r.error ?? '注册失败'); return; }
    toast.push('success', form.inviteCode ? '注册成功，邀请双方各得 1 GB 体验流量' : '注册成功，已赠送体验流量');
    nav('/console');
  };

  const iconStyle = { position: 'absolute' as const, left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-faint)', display: 'inline-flex' };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: 24, background: 'var(--bg-base)', position: 'relative' }}>
      <div className="bg-grid" style={{ position: 'absolute', inset: 0, maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 20%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 20%, transparent 70%)' }} />
      <Card style={{ width: 440, maxWidth: '100%', padding: 32, position: 'relative', zIndex: 1 }}>
        <div className="flex-between" style={{ marginBottom: 26 }}>
          <Link to="/"><Logo size={26} /></Link>
          <span className="chip chip-accent"><Gift size={12} /> 注册送 1 GB</span>
        </div>
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>创建账户</h1>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 24 }}>有邀请码请填写，双方各得流量奖励。</p>
        <form onSubmit={submit} className="flex-col" style={{ gap: 14 }}>
          <Field label="邮箱">
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={iconStyle} />
              <Input type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} style={{ paddingLeft: 36 }} />
            </div>
          </Field>
          <Field label="用户名">
            <div style={{ position: 'relative' }}>
              <UserIcon size={15} style={iconStyle} />
              <Input required placeholder="用户名（用于展示）" value={form.username} onChange={set('username')} style={{ paddingLeft: 36 }} />
            </div>
          </Field>
          <Field label="密码" hint="至少 6 位，建议包含字母与数字">
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={iconStyle} />
              <Input type="password" required placeholder="••••••••" value={form.password} onChange={set('password')} style={{ paddingLeft: 36 }} />
            </div>
          </Field>
          <Field label="邀请码（可选）" hint="输入邀请码注册，双方各得 1 GB 流量">
            <Input placeholder="HZ-XXXX-XXXX" value={form.inviteCode} onChange={set('inviteCode')} style={{ fontFamily: 'var(--font-mono)' }} />
          </Field>
          {err && <div className="chip chip-danger" style={{ justifyContent: 'center' }}>{err}</div>}
          <Button type="submit" block size="lg" disabled={busy}>{busy ? <Spinner size={16} /> : '注册并进入控制台'}</Button>
        </form>
        <div className="flex-center" style={{ marginTop: 20, fontSize: 13.5 }}>
          <span className="muted">已有账户？</span>
          <Link to="/login">直接登录</Link>
        </div>
      </Card>
    </div>
  );
}
