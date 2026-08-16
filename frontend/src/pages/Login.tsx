import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { Logo } from '../components/layout/Logo';
import { apiLogin } from '../lib/api';
import { Button, Card, Field, Input, Spinner } from '../components/ui/ui';
import { useToast } from '../components/ui/toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!email || !password) { setErr('请填写邮箱和密码'); return; }
    setBusy(true);
    const r = await apiLogin(email, password);
    setBusy(false);
    if (r.error || !r.data?.user) { setErr(r.error ?? '登录失败'); return; }
    toast.push('success', `欢迎回来，${r.data.user.username}`);
    nav(r.data.user.role === 'admin' ? '/admin' : '/console');
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: 24, background: 'var(--bg-base)', position: 'relative' }}>
      <div className="bg-grid" style={{ position: 'absolute', inset: 0, maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 20%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 20%, transparent 70%)' }} />
      <Card style={{ width: 420, maxWidth: '100%', padding: 32, position: 'relative', zIndex: 1 }}>
        <div className="flex-center" style={{ justifyContent: 'space-between', marginBottom: 26 }}>
          <Link to="/"><Logo size={26} /></Link>
          <span className="chip chip-accent">用户登录</span>
        </div>
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>登录账户</h1>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 24 }}>进入控制台管理节点、卡密与流量。</p>
        <form onSubmit={submit} className="flex-col" style={{ gap: 16 }}>
          <Field label="邮箱">
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-faint)' }} />
              <Input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>
          </Field>
          <Field label="密码">
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-faint)' }} />
              <Input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>
          </Field>
          {err && <div className="chip chip-danger" style={{ justifyContent: 'center' }}>{err}</div>}
          <Button type="submit" block size="lg" disabled={busy}>{busy ? <Spinner size={16} /> : '登录'}</Button>
        </form>
        <div className="flex-center" style={{ marginTop: 20, fontSize: 13.5 }}>
          <span className="muted">还没有账户？</span>
          <Link to="/register">免费注册</Link>
        </div>
        <div className="faint" style={{ textAlign: 'center', fontSize: 11.5, marginTop: 18 }}>演示环境：admin@haizhu.dev / 任意 6 位以上密码</div>
      </Card>
    </div>
  );
}
