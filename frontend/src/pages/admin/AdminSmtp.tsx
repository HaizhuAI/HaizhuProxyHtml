import { useEffect, useState } from 'react';
import { Mail, Send, Server, ShieldCheck } from 'lucide-react';
import { apiSmtpGet, apiSmtpSave, apiSmtpTest } from '../../lib/api';
import type { SmtpConfig } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, Field, Input, Spinner, Switch } from '../../components/ui/ui';
import { useToast } from '../../components/ui/toast';

export default function AdminSmtp() {
  const [cfg, setCfg] = useState<SmtpConfig | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const toast = useToast();

  useEffect(() => { apiSmtpGet().then(r => r.data ? setCfg(r.data) : setErr(r.error ?? '加载失败')); }, []);
  if (err) return <div className="chip chip-danger">{err}</div>;
  if (!cfg) return <div className="flex-center" style={{ padding: 80 }}><Spinner size={22} /></div>;

  const set = <K extends keyof SmtpConfig>(k: K, v: SmtpConfig[K]) => setCfg(c => ({ ...c!, [k]: v }));

  const save = async () => {
    setBusy(true);
    const r = await apiSmtpSave(cfg);
    setBusy(false);
    if (r.error) { toast.push('error', r.error); return; }
    setCfg(r.data!);
    toast.push('success', 'SMTP 配置已保存');
  };

  const test = async () => {
    setTesting(true);
    const r = await apiSmtpTest();
    setTesting(false);
    toast.push(r.data?.delivered ? 'success' : 'error', r.data?.message ?? r.error ?? '测试发送失败');
  };

  return (
    <>
      <PageHeader eyebrow="SMTP MAILER" title="邮件发件系统" sub="配置 SMTP，卡密生成后直发买家邮箱" right={<Button variant="outline" onClick={test} disabled={testing}>{testing ? <Spinner size={14} /> : <Send size={14} />}发送测试邮件</Button>} />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)', alignItems: 'start' }} data-smtp-grid>
        <Card style={{ padding: 24 }}>
          <div className="flex-between" style={{ marginBottom: 18 }}>
            <div className="flex" style={{ gap: 10, alignItems: 'center' }}><Mail size={18} style={{ color: 'var(--accent)' }} /><span className="card-title">SMTP 参数</span></div>
            <Switch checked={cfg.enabled} onChange={v => set('enabled', v)} label={cfg.enabled ? '已启用' : '已停用'} />
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }} data-smtp-form>
            <Field label="SMTP 服务器" hint="如 smtp.example.com"><Input value={cfg.host} onChange={e => set('host', e.target.value)} placeholder="smtp.example.com" /></Field>
            <Field label="端口" hint="587=STARTTLS / 465=SSL"><Input type="number" value={cfg.port} onChange={e => set('port', Number(e.target.value) || 587)} /></Field>
            <Field label="用户名" hint="多数服务商为完整邮箱"><Input value={cfg.username} onChange={e => set('username', e.target.value)} placeholder="noreply@haizhu.dev" /></Field>
            <Field label="密码 / 授权码" hint="留 * 掩码表示不修改"><Input type="password" value={cfg.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" /></Field>
            <Field label="发件人地址" hint="用户将从此地址收到邮件"><Input value={cfg.sender} onChange={e => set('sender', e.target.value)} placeholder="noreply@haizhu.dev" /></Field>
            <div className="flex" style={{ gap: 18, alignItems: 'center', paddingTop: 22 }}>
              <Switch checked={cfg.useTls} onChange={v => set('useTls', v)} label="STARTTLS" />
              <Switch checked={cfg.useSsl} onChange={v => { set('useSsl', v); if (v) set('useTls', false); }} label="SSL" />
            </div>
          </div>
          <div className="flex" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
            <Button onClick={save} disabled={busy}>{busy ? <Spinner size={14} /> : '保存配置'}</Button>
          </div>
        </Card>

        <Card style={{ padding: 22 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>运行说明</div>
          <div className="flex-col" style={{ gap: 12 }}>
            <div className="flex" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="chip chip-accent" style={{ flexShrink: 0 }}>1</span>
              <span style={{ fontSize: 13, color: 'var(--fg-mid)' }}>填写服务商 SMTP 参数（QQ 邮箱 / Gmail / 阿里云邮件推送等），保存后点击"发送测试邮件"验证。</span>
            </div>
            <div className="flex" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="chip chip-accent" style={{ flexShrink: 0 }}>2</span>
              <span style={{ fontSize: 13, color: 'var(--fg-mid)' }}>在"卡密管理 → 生成卡密"中勾选"发到邮箱"，填写买家邮箱，生成后自动发送深色 HTML 卡密邮件。</span>
            </div>
            <div className="flex" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="chip chip-accent" style={{ flexShrink: 0 }}>3</span>
              <span style={{ fontSize: 13, color: 'var(--fg-mid)' }}>邮件发送失败不阻塞卡密生成（卡密仍有效），管理台会提示发送失败原因。</span>
            </div>
            <hr className="divider" />
            <div className="flex" style={{ gap: 8, alignItems: 'center', color: 'var(--fg-low)', fontSize: 12.5 }}>
              <Server size={15} style={{ color: 'var(--info)' }} />密码仅存数据库，接口只返回掩码，不回显明文。
            </div>
            <div className="flex" style={{ gap: 8, alignItems: 'center', color: 'var(--fg-low)', fontSize: 12.5 }}>
              <ShieldCheck size={15} style={{ color: 'var(--ok)' }} />纯标准库 smtplib 实现，支持 STARTTLS / SSL，零额外依赖。
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
