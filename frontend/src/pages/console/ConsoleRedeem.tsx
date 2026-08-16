import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, ShoppingCart, Sparkles } from 'lucide-react';
import { apiPublicShops, apiRedeem } from '../../lib/api';
import type { ShopEntry } from '../../lib/types';
import { Button, Card, Chip, Field, Input, Spinner } from '../../components/ui/ui';
import { PageHeader } from '../../components/layout/PageHeader';
import { useToast } from '../../components/ui/toast';
import { fmtBytes } from '../../lib/utils';

export default function ConsoleRedeem() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ added: number; balance: number } | null>(null);
  const [shops, setShops] = useState<ShopEntry[]>([]);
  const toast = useToast();

  useEffect(() => { apiPublicShops().then(r => { if (r.data) setShops(r.data); }); }, []);
  const shopUrl = shops.find(s => s.enabled)?.url;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    const r = await apiRedeem(code);
    setBusy(false);
    if (r.error || !r.data) { toast.push('error', r.error ?? '兑换失败'); return; }
    setDone(r.data);
    setCode('');
    toast.push('success', `成功兑换 ${fmtBytes(r.data.added)} 流量`);
  };

  return (
    <>
      <PageHeader eyebrow="REDEEM CDK" title="卡密兑换" sub="输入商城购买的 HZ- 卡密，流量秒到账" />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, 1fr)', alignItems: 'start' }} data-redeem-grid>
        <Card style={{ padding: 24 }}>
          {done ? (
            <div className="flex-center" style={{ flexDirection: 'column', padding: '30px 10px', textAlign: 'center' }}>
              <CheckCircle2 size={44} style={{ color: 'var(--ok)', marginBottom: 14 }} />
              <div className="card-title" style={{ fontSize: 18 }}>兑换成功</div>
              <div className="mono accent-text" style={{ fontSize: 26, fontWeight: 700, margin: '12px 0 4px' }}>+{fmtBytes(done.added)}</div>
              <div className="muted" style={{ fontSize: 13 }}>当前余额：<span className="mono">{fmtBytes(done.balance)}</span></div>
              <div className="flex" style={{ marginTop: 22, gap: 10 }}>
                <Button variant="ghost" onClick={() => setDone(null)}>继续兑换</Button>
                <a href="#/console/nodes" className="btn btn-primary">去选节点</a>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="flex-col" style={{ gap: 16 }}>
              <Field label="卡密" hint="格式：HZ-XXXX-XXXX-XXXX，不区分大小写">
                <Input
                  placeholder="HZ-9F3A-4B2C-7D1E"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setDone(null); }}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '.06em', fontSize: 16, padding: '12px 14px' }}
                  autoFocus
                />
              </Field>
              <Button type="submit" size="lg" block disabled={busy || code.trim().length < 10}>
                {busy ? <Spinner size={16} /> : <><KeyRound size={16} />立即兑换</>}
              </Button>
              <div className="faint" style={{ fontSize: 12, lineHeight: 1.7 }}>
                提示：卡密在官方商城购买后发送至注册邮箱。若卡密已使用、过期或已被撤回，兑换会明确提示原因。
              </div>
            </form>
          )}
        </Card>
        <Card style={{ padding: 22 }}>
          <div className="card-title" style={{ marginBottom: 12 }}><Sparkles size={15} style={{ color: 'var(--accent)', verticalAlign: -2 }} /> 常见套餐卡密</div>
          <div className="flex-col" style={{ gap: 10 }}>
            {[
              { name: 'Starter', gb: 10, price: '¥12' },
              { name: 'Pro', gb: 50, price: '¥35' },
              { name: 'Max', gb: 200, price: '¥99' },
            ].map(p => (
              <div key={p.name} className="flex-between panel" style={{ padding: '12px 14px', borderColor: 'var(--line-soft)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--fg-hi)', fontSize: 13.5 }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-low)' }}>{p.gb} GB</div>
                </div>
                <Chip tone="accent">{p.price}</Chip>
              </div>
            ))}
            {shopUrl ? (
              <a href={shopUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm btn-block" style={{ marginTop: 4 }}><ShoppingCart size={13} />前往商城购买</a>
            ) : (
              <div className="chip chip-warn" style={{ marginTop: 4, justifyContent: 'center' }}>商城地址未配置，请联系客服获取</div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
