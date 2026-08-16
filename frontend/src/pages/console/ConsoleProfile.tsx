import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { apiUpdateProfile, loadSession } from '../../lib/api';
import { Button, Card, Field, Input, Spinner } from '../../components/ui/ui';
import { PageHeader } from '../../components/layout/PageHeader';
import { useToast } from '../../components/ui/toast';
import { fmtDate } from '../../lib/utils';

export default function ConsoleProfile() {
  const session = loadSession();
  const user = session.user!;
  const [form, setForm] = useState({ username: user.username, email: user.email });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await apiUpdateProfile(form);
    setBusy(false);
    if (r.error) { toast.push('error', r.error); return; }
    toast.push('success', '资料已更新');
  };

  return (
    <>
      <PageHeader eyebrow="ACCOUNT" title="账户设置" sub="管理个人资料与安全选项" />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 1fr)', alignItems: 'start' }} data-profile-grid>
        <Card style={{ padding: 24 }}>
          <form onSubmit={save} className="flex-col" style={{ gap: 16 }}>
            <Field label="用户名">
              <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </Field>
            <Field label="邮箱" hint="邮箱不可修改，用于登录与收卡密">
              <Input value={form.email} disabled />
            </Field>
            <Field label="修改密码">
              <Input type="password" placeholder="新密码（留空不修改）" />
            </Field>
            <div className="flex" style={{ justifyContent: 'flex-end' }}>
              <Button type="submit" disabled={busy}>{busy ? <Spinner size={15} /> : '保存修改'}</Button>
            </div>
          </form>
        </Card>
        <Card style={{ padding: 22 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>账户信息</div>
          <div className="flex-col" style={{ gap: 12 }}>
            {[
              { l: '用户 ID', v: user.id },
              { l: '角色', v: user.role === 'admin' ? '管理员' : '普通用户' },
              { l: '邀请码', v: user.inviteCode },
              { l: '注册时间', v: fmtDate(user.createdAt) },
              { l: '账户状态', v: user.status === 'active' ? '正常' : '已封禁' },
            ].map(r => (
              <div key={r.l} className="flex-between" style={{ fontSize: 13 }}>
                <span className="muted">{r.l}</span>
                <span className="mono" style={{ color: 'var(--fg-hi)' }}>{r.v}</span>
              </div>
            ))}
            <hr className="divider" />
            <div className="flex" style={{ gap: 8, alignItems: 'center', color: 'var(--fg-low)', fontSize: 12.5 }}>
              <ShieldCheck size={15} style={{ color: 'var(--ok)' }} />双重验证 / 设备绑定将在正式版开放
            </div>
            <Button variant="ghost" size="sm" onClick={() => toast.push('info', '会话令牌：演示环境不展示真实 Token')}><KeyRound size={14} />查看 API Token</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
