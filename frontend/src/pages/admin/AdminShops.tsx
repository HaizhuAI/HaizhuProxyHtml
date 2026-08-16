import { useEffect, useState } from 'react';
import { ExternalLink, Plus, ShoppingCart, Star, Trash2 } from 'lucide-react';
import { apiCreateShop, apiDeleteShop, apiShops, apiUpdateShop } from '../../lib/api';
import type { ShopEntry } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, Chip, Field, Input, Modal, Spinner, Switch } from '../../components/ui/ui';
import { useToast } from '../../components/ui/toast';

export default function AdminShops() {
  const [shops, setShops] = useState<ShopEntry[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', description: '' });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = () => apiShops().then(r => r.data ? setShops(r.data) : setErr(r.error ?? '加载失败'));
  useEffect(() => { load(); }, []);
  if (err) return <div className="chip chip-danger">{err}</div>;
  if (!shops) return <div className="flex-center" style={{ padding: 80 }}><Spinner size={22} /></div>;

  const toggle = async (s: ShopEntry) => {
    const r = await apiUpdateShop(s.id, { name: s.name, url: s.url, enabled: !s.enabled, description: s.description });
    if (r.error) { toast.push('error', r.error); return; }
    setShops(list => list!.map(x => x.id === s.id ? { ...x, enabled: r.data!.enabled } : x));
    toast.push('success', r.data!.enabled ? '卡网入口已启用' : '卡网入口已停用');
  };

  const add = async () => {
    if (!form.name || !form.url) { toast.push('error', '名称与地址必填'); return; }
    setBusy(true);
    const r = await apiCreateShop(form);
    if (r.error || !r.data) { setBusy(false); toast.push('error', r.error ?? '添加失败'); return; }
    // 只留一个主卡网：新保存的地址设为唯一启用，其余自动停用
    const others = shops!.filter(x => x.enabled && x.id !== r.data!.id);
    for (const o of others) {
      const u = await apiUpdateShop(o.id, { name: o.name, url: o.url, enabled: false, description: o.description });
      if (!u.error && u.data) setShops(list => list!.map(x => x.id === o.id ? { ...x, enabled: false } : x));
    }
    setShops(list => [...list!.filter(x => x.id !== r.data!.id), r.data!]);
    setBusy(false);
    setOpen(false);
    setForm({ name: '', url: '', description: '' });
    toast.push('success', '卡网地址已保存并设为主卡网，用户端购买入口即时生效');
  };

  const remove = async (s: ShopEntry) => {
    if (s.enabled) { toast.push('warn', '请先停用再删除，避免用户端入口失效'); return; }
    const r = await apiDeleteShop(s.id);
    if (r.error) { toast.push('error', r.error); return; }
    setShops(list => list!.filter(x => x.id !== s.id));
    toast.push('warn', '卡网入口已删除');
  };

  const primary = shops.find(s => s.enabled);

  return (
    <>
      <PageHeader eyebrow="CARD SHOP" title="卡网购买地址" sub="填写你的卡网地址，用户端所有购买入口自动跳转" right={<Button onClick={() => setOpen(true)}><Plus size={15} />添加卡网地址</Button>} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {shops.map(s => (
          <Card key={s.id} hover style={{ padding: 20, borderColor: primary?.id === s.id ? 'rgba(63,217,180,.45)' : undefined, boxShadow: primary?.id === s.id ? 'var(--shadow-glow)' : undefined }}>
            <div className="flex-between">
              <span style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(63,217,180,.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={18} style={{ color: 'var(--accent)' }} />
              </span>
              <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
                {primary?.id === s.id && <Chip tone="accent"><Star size={11} />主卡网</Chip>}
                <Switch checked={s.enabled} onChange={() => toggle(s)} label={s.enabled ? '启用' : '停用'} />
              </div>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--fg-hi)', marginTop: 14, fontSize: 15 }}>{s.name}</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--fg-low)', marginTop: 4, wordBreak: 'break-all' }}>{s.url}</div>
            {s.description && <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>{s.description}</p>}
            <div className="flex" style={{ marginTop: 16, gap: 8 }}>
              <a href={s.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm grow"><ExternalLink size={13} />打开</a>
              <Button variant="ghost" size="sm" onClick={() => remove(s)}><Trash2 size={13} /></Button>
            </div>
            <div style={{ marginTop: 12 }}><Chip tone={s.enabled ? 'ok' : 'default'} dot>{s.enabled ? '用户端可见' : '已隐藏'}</Chip></div>
          </Card>
        ))}
      </div>
      {shops.length === 0 && (
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <div className="card-title">还没有卡网地址</div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 8 }}>点击右上角「添加卡网地址」，填入你的发卡网 URL，用户端「前往商城购买」按钮将自动跳转。</p>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="添加卡网地址" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button onClick={add} disabled={busy}>{busy ? <Spinner size={14} /> : '保存'}</Button></>}>
        <div className="flex-col" style={{ gap: 14 }}>
          <Field label="名称" hint="如：官方卡网 / 主站"><Input placeholder="官方卡网" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="购买地址" hint="用户点击购买时跳转的卡网 URL">
            <Input placeholder="https://card.haizhu.dev" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }} />
          </Field>
          <Field label="备注（可选）"><Input placeholder="支持 USDT / 微信 / 支付宝" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
          <div className="faint" style={{ fontSize: 12 }}>保存后立即生效：官网套餐按钮、控制台卡密兑换页「前往商城购买」全部跳转到第一个启用的卡网地址。</div>
        </div>
      </Modal>
    </>
  );
}
