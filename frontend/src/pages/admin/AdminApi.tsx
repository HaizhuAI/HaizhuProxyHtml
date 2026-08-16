import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiApiKeys } from '../../lib/api';
import type { ApiKey } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, Chip, Field, Input, Modal, Spinner, Switch, usePaged, Pager, CopyButton } from '../../components/ui/ui';
import { useToast } from '../../components/ui/toast';
import { fmtDate } from '../../lib/utils';

const SCOPES = ['nodes:read', 'nodes:write', 'traffic:read', 'cdk:read', 'cdk:write', 'users:read', 'users:write', 'shop:write'];

export default function AdminApi() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', scopes: ['traffic:read'] as string[] });
  const [created, setCreated] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => { apiApiKeys().then(r => r.data ? setKeys(r.data) : setErr(r.error ?? '加载失败')); }, []);
  const paged = usePaged(keys ?? [], 8);
  if (err) return <div className="chip chip-danger">{err}</div>;
  if (!keys) return <div className="flex-center" style={{ padding: 80 }}><Spinner size={22} /></div>;

  const toggleScope = (s: string) => {
    setForm(f => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter(x => x !== s) : [...f.scopes, s] }));
  };

  const create = () => {
    if (!form.name) { toast.push('error', '名称必填'); return; }
    const fakeKey = `hz_${Math.random().toString(36).slice(2, 10)}_${Math.random().toString(36).slice(2, 18)}`;
    setKeys(s => [{ id: `k${Date.now()}`, name: form.name, key: fakeKey, scopes: form.scopes, createdAt: new Date().toISOString(), enabled: true }, ...s!]);
    setCreated(fakeKey);
    setOpen(false);
  };

  const toggleKey = (id: string) => {
    setKeys(s => s!.map(k => k.id === id ? { ...k, enabled: !k.enabled } : k));
    toast.push('info', '密钥状态已更新');
  };

  const remove = (id: string) => {
    setKeys(s => s!.filter(k => k.id !== id));
    toast.push('warn', '密钥已删除，调用立即失效');
  };

  return (
    <>
      <PageHeader eyebrow="API GATEWAY" title="API 密钥管理" sub="为自动化运维与第三方集成签发带作用域的密钥" right={<Button onClick={() => setOpen(true)}><Plus size={15} />创建密钥</Button>} />
      {created && (
        <Card style={{ padding: 18, marginBottom: 20, borderColor: 'rgba(63,217,180,.5)', boxShadow: 'var(--shadow-glow)' }}>
          <div className="flex-between flex-wrap" style={{ gap: 12 }}>
            <div>
              <div className="card-title" style={{ fontSize: 14, marginBottom: 4 }}>新密钥已创建 — 仅展示一次</div>
              <code style={{ fontSize: 13, color: 'var(--accent)', wordBreak: 'break-all' }}>{created}</code>
            </div>
            <div className="flex" style={{ gap: 8 }}>
              <CopyButton text={created} label="复制" />
              <Button variant="ghost" size="sm" onClick={() => setCreated(null)}>关闭</Button>
            </div>
          </div>
        </Card>
      )}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>名称</th><th>密钥</th><th>作用域</th><th>最近使用</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {paged.slice.map(k => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 600, color: 'var(--fg-hi)' }}>{k.name}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{k.key}</td>
                  <td><div className="flex" style={{ gap: 4, flexWrap: 'wrap' }}>{k.scopes.map(s => <span key={s} className="chip" style={{ fontSize: 9.5, padding: '2px 7px' }}>{s}</span>)}</div></td>
                  <td className="mono" style={{ fontSize: 11.5, color: 'var(--fg-low)' }}>{k.lastUsed ? fmtDate(k.lastUsed) : '从未使用'}</td>
                  <td><Chip tone={k.enabled ? 'ok' : 'default'} dot>{k.enabled ? '启用' : '停用'}</Chip></td>
                  <td>
                    <div className="flex" style={{ gap: 6 }}>
                      <Switch checked={k.enabled} onChange={() => toggleKey(k.id)} />
                      <Button variant="ghost" size="sm" onClick={() => remove(k.id)}><Trash2 size={13} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: 12 }}><Pager page={paged.page} pages={paged.pages} onPage={paged.setPage} /></div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="创建 API 密钥" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button onClick={create}>生成密钥</Button></>}>
        <div className="flex-col" style={{ gap: 16 }}>
          <Field label="密钥名称"><Input placeholder="生产网关" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="作用域（最小权限原则）">
            <div className="flex" style={{ gap: 6, flexWrap: 'wrap' }}>
              {SCOPES.map(s => (
                <button key={s} type="button" onClick={() => toggleScope(s)}
                  style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '5px 10px', borderRadius: 99, border: `1px solid ${form.scopes.includes(s) ? 'var(--accent)' : 'var(--line-soft)'}`, background: form.scopes.includes(s) ? 'rgba(63,217,180,.1)' : 'transparent', color: form.scopes.includes(s) ? 'var(--accent)' : 'var(--fg-low)' }}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <div className="faint" style={{ fontSize: 12 }}>密钥经哈希后存储，仅创建时展示一次；请妥善保存。</div>
        </div>
      </Modal>
    </>
  );
}
