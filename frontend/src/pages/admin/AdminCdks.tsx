import { useEffect, useState } from 'react';
import { Mail, Plus, RefreshCw, ShieldAlert, Ticket } from 'lucide-react';
import { apiAllCdks, apiExportCdks, apiGenerateCdks } from '../../lib/api';
import type { Cdk } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, Chip, Field, Input, Modal, Spinner, Switch, usePaged, Pager, CopyButton } from '../../components/ui/ui';
import { useToast } from '../../components/ui/toast';
import { fmtBytes, fmtDate } from '../../lib/utils';

export default function AdminCdks() {
  const [cdks, setCdks] = useState<Cdk[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [gen, setGen] = useState({ count: '20', traffic: '10240', days: '30', email: '', send: false });
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<Cdk[]>([]);
  const toast = useToast();

  useEffect(() => { apiAllCdks().then(r => r.data ? setCdks(r.data) : setErr(r.error ?? '加载失败')); }, []);
  const paged = usePaged(cdks ?? [], 10);
  if (err) return <div className="chip chip-danger">{err}</div>;
  if (!cdks) return <div className="flex-center" style={{ padding: 80 }}><Spinner size={22} /></div>;
  const statusTone = (s: Cdk['status']) => s === 'unused' ? 'ok' : s === 'used' ? 'accent' : s === 'revoked' ? 'danger' : 'warn';
  const statusLabel = (s: Cdk['status']) => s === 'unused' ? '未使用' : s === 'used' ? '已使用' : s === 'revoked' ? '已撤回' : '已过期';

  const generate = async () => {
    const count = Math.min(500, Math.max(1, Number(gen.count) || 1));
    const traffic = Math.max(1, Number(gen.traffic) || 1024);
    const days = Number(gen.days) || 30;
    if (gen.send && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(gen.email.trim())) { toast.push('error', '请填写有效的收件邮箱'); return; }
    setBusy(true);
    const r = await apiGenerateCdks(count, traffic, days, gen.send, gen.email.trim());
    setBusy(false);
    if (r.error || !r.data) { toast.push('error', r.error ?? '生成失败'); return; }
    setFresh(r.data);
    setCdks(s => [...r.data!, ...(s ?? [])]);
    toast.push('success', `已生成 ${r.data.length} 张卡密，共 ${fmtBytes(traffic * r.data.length)} 流量`);
  };

  const revoke = (c: Cdk) => {
    setCdks(s => s!.map(x => x.id === c.id ? { ...x, status: 'revoked' as const } : x));
    toast.push('warn', `卡密 ${c.code.slice(0, 10)}… 已撤回`);
  };

  return (
    <>
      <PageHeader eyebrow="CDK FACTORY" title="卡密管理" sub="生成、发行、撤回与兑换记录" right={
        <div className="flex" style={{ gap: 10 }}>
          <Button variant="ghost" onClick={async () => {
            setBusy(true);
            const r = await apiExportCdks();
            setBusy(false);
            if (r.error || !r.data) { toast.push('error', r.error ?? '导出失败'); return; }
            const blob = new Blob([r.data], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `haizhu-cdks-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
            toast.push('success', `已导出 ${cdks.length} 张卡密 CSV`);
          }}><RefreshCw size={15} />导出 CSV</Button>
          <Button onClick={() => setOpen(true)}><Plus size={15} />生成卡密</Button>
        </div>
      } />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 20 }}>
        {[
          { l: '总计', v: String(cdks.length) },
          { l: '未使用', v: String(cdks.filter(c => c.status === 'unused').length) },
          { l: '已使用', v: String(cdks.filter(c => c.status === 'used').length) },
          { l: '已撤回 / 过期', v: String(cdks.filter(c => c.status === 'revoked' || c.status === 'expired').length) },
        ].map(s => (
          <div key={s.l} className="panel" style={{ padding: 16 }}>
            <div className="stat-label">{s.l}</div>
            <div className="stat-value" style={{ fontSize: 24, marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>卡密</th><th>流量</th><th>批次</th><th>状态</th><th>使用者</th><th>有效期</th><th>创建时间</th><th>操作</th></tr>
            </thead>
            <tbody>
              {paged.slice.map(c => (
                <tr key={c.id}>
                  <td><div className="flex" style={{ gap: 8, alignItems: 'center' }}><span className="mono" style={{ fontSize: 12.5, color: 'var(--fg-hi)' }}>{c.code}</span><CopyButton text={c.code} label="" /></div></td>
                  <td className="num accent-text">{fmtBytes(c.traffic)}</td>
                  <td><Chip>{c.batch ?? '—'}</Chip></td>
                  <td><Chip tone={statusTone(c.status)} dot>{statusLabel(c.status)}</Chip></td>
                  <td className="mono" style={{ fontSize: 12 }}>{c.usedBy ?? '—'}</td>
                  <td className="mono" style={{ fontSize: 11.5, color: 'var(--fg-low)' }}>{c.expiresAt ? fmtDate(c.expiresAt) : '永久'}</td>
                  <td className="mono" style={{ fontSize: 11.5, color: 'var(--fg-low)' }}>{fmtDate(c.createdAt)}</td>
                  <td>{c.status === 'unused' && <Button variant="danger" size="sm" onClick={() => revoke(c)}><ShieldAlert size={13} />撤回</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: 12 }}><Pager page={paged.page} pages={paged.pages} onPage={paged.setPage} /></div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="生成卡密" footer={
        <><Button variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button onClick={generate} disabled={busy}>{busy ? <Spinner size={14} /> : <><Ticket size={14} />生成</>}</Button></>
      }>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }} data-gen-form>
          <Field label="数量" hint="1-500"><Input type="number" min={1} max={500} value={gen.count} onChange={e => setGen(g => ({ ...g, count: e.target.value }))} /></Field>
          <Field label="每张流量 (MB)" hint="如 10240 = 10GB"><Input type="number" min={1} value={gen.traffic} onChange={e => setGen(g => ({ ...g, traffic: e.target.value }))} /></Field>
          <Field label="有效期 (天)" hint="0 = 永久"><Input type="number" min={0} value={gen.days} onChange={e => setGen(g => ({ ...g, days: e.target.value }))} /></Field>
        </div>
        <div className="panel" style={{ marginTop: 16, padding: 14 }}>
          <div className="flex-between">
            <div className="flex" style={{ gap: 10, alignItems: 'center' }}><Mail size={15} style={{ color: 'var(--accent)' }} /><span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-hi)' }}>生成后发送到买家邮箱</span></div>
            <Switch checked={gen.send} onChange={v => setGen(g => ({ ...g, send: v }))} label={gen.send ? '开启' : '关闭'} />
          </div>
          {gen.send && (
            <div style={{ marginTop: 12 }}>
              <Field label="收件邮箱" hint="卡密生成后通过 SMTP 直发该邮箱">
                <Input type="email" value={gen.email} onChange={e => setGen(g => ({ ...g, email: e.target.value }))} placeholder="buyer@example.com" />
              </Field>
            </div>
          )}
        </div>
        {fresh.length > 0 && (
          <div className="panel" style={{ marginTop: 18, padding: 14, maxHeight: 220, overflowY: 'auto' }}>
            <div className="card-sub" style={{ marginBottom: 10 }}>本次生成结果：</div>
            <div className="flex-col" style={{ gap: 6 }}>
              {fresh.slice(0, 40).map(c => (
                <div key={c.id} className="flex-between">
                  <span className="mono" style={{ fontSize: 12, color: 'var(--fg-hi)' }}>{c.code}</span>
                  <div className="flex" style={{ gap: 6, alignItems: 'center' }}>
                    <span className="faint mono" style={{ fontSize: 11 }}>{fmtBytes(c.traffic)}</span>
                    <CopyButton text={c.code} label="" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="faint" style={{ fontSize: 12, marginTop: 14 }}>卡密规则：HZ- 前缀 + 随机段，防碰撞校验；支持批量导出与撤回。密钥生成使用 CSPRNG。</div>
      </Modal>
    </>
  );
}
