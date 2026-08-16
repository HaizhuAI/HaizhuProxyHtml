import { useEffect, useState } from 'react';
import { Activity, ArrowDownCircle, ArrowUpCircle, Globe2, KeyRound, Wallet } from 'lucide-react';
import { apiUsage } from '../../lib/api';
import type { UsageSummary } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, StatCard, Progress, Spinner, Chip } from '../../components/ui/ui';
import { Sparkline } from '../../components/ui/sparkline';
import { fmtBytes, pct } from '../../lib/utils';
import { loadSession } from '../../lib/api';

export default function ConsoleDashboard() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [err, setErr] = useState('');
  const session = loadSession();

  useEffect(() => { apiUsage().then(r => r.data ? setUsage(r.data) : setErr(r.error ?? '加载失败')); }, []);

  if (err) return <div className="chip chip-danger">{err}</div>;
  if (!usage) return <div className="flex-center" style={{ padding: 80 }}><Spinner size={22} /></div>;

  const usedPct = pct(usage.used, usage.total);

  return (
    <>
      <PageHeader eyebrow="USER CONSOLE" title={`你好，${session.user?.username ?? '用户'}`} sub="流量、节点与账户状态一览" />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <StatCard label="流量余额" value={fmtBytes(usage.balance)} sub={`已用 ${fmtBytes(usage.used)} / 共 ${fmtBytes(usage.total)}`} icon={<Wallet size={16} />} tone="accent" />
        <StatCard label="可用节点" value={usage.activeNodes} sub="在线节点实时状态" icon={<Globe2 size={16} />} />
        <StatCard label="今日上行" value={fmtBytes(usage.todayIn)} sub="今日累计流入" icon={<ArrowDownCircle size={16} />} />
        <StatCard label="今日下行" value={fmtBytes(usage.todayOut)} sub="今日累计流出" icon={<ArrowUpCircle size={16} />} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', marginTop: 20, alignItems: 'start' }} data-dash-grid>
        <Card>
          <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line-subtle)' }}>
            <div className="flex" style={{ gap: 10, alignItems: 'center' }}><Activity size={16} style={{ color: 'var(--accent)' }} /><span className="card-title">近 14 日流量</span></div>
            <Chip tone="accent">单位 MB</Chip>
          </div>
          <div style={{ padding: 18 }}>
            <Sparkline data={usage.series.map(p => p.in + p.out)} />
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <div className="card-title" style={{ marginBottom: 6 }}>流量使用进度</div>
          <div className="card-sub" style={{ marginBottom: 16 }}>余额用尽后自动熔断，不超额扣费</div>
          <Progress value={usedPct} tone={usedPct > 90 ? 'danger' : usedPct > 65 ? 'warn' : 'accent'} height={10} />
          <div className="flex-between mono" style={{ marginTop: 10, fontSize: 12.5, color: 'var(--fg-low)' }}>
            <span>{fmtBytes(usage.used)} 已用</span><span>{usedPct.toFixed(1)}%</span>
          </div>
          <hr className="divider" style={{ margin: '20px 0' }} />
          <div className="flex-col" style={{ gap: 12 }}>
            {[
              { l: '今日流入', v: fmtBytes(usage.todayIn) },
              { l: '今日流出', v: fmtBytes(usage.todayOut) },
              { l: '在线节点', v: `${usage.activeNodes} 个` },
              { l: '账户状态', v: '正常' },
            ].map(r => (
              <div key={r.l} className="flex-between" style={{ fontSize: 13.5 }}>
                <span className="muted">{r.l}</span><span style={{ color: 'var(--fg-hi)', fontFamily: 'var(--font-mono)' }}>{r.v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 20, padding: 20 }}>
        <div className="flex-between flex-wrap" style={{ gap: 12 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 4 }}>需要更多流量？</div>
            <div className="card-sub">前往官方商城购买卡密，或在控制台兑换已有卡密。</div>
          </div>
          <div className="flex" style={{ gap: 10 }}>
            <a href="#" className="btn btn-outline btn-sm">前往商城 <KeyRound size={14} /></a>
            <a href="#/console/redeem" className="btn btn-primary btn-sm">兑换卡密</a>
          </div>
        </div>
      </Card>
    </>
  );
}
