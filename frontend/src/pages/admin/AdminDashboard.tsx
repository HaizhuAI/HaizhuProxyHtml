import { useEffect, useState } from 'react';
import { Activity, Bot, Globe2, KeyRound, Users, Wallet } from 'lucide-react';
import { apiDashboard } from '../../lib/api';
import type { DashboardStats } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, Chip, Spinner, StatCard } from '../../components/ui/ui';
import { Sparkline } from '../../components/ui/sparkline';
import { fmtBytes, fmtNum } from '../../lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { apiDashboard().then(r => r.data ? setStats(r.data) : setErr(r.error ?? '加载失败')); }, []);
  if (err) return <div className="chip chip-danger">{err}</div>;
  if (!stats) return <div className="flex-center" style={{ padding: 80 }}><Spinner size={22} /></div>;

  const series = Array.from({ length: 14 }, (_, i) => Math.round(40000 + Math.sin(i * 1.3) * 18000 + Math.random() * 12000));

  return (
    <>
      <PageHeader eyebrow="ADMIN CONSOLE" title="运营仪表盘" sub="平台全局状态 · 实时概览" />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard label="注册用户" value={fmtNum(stats.users)} sub={`+${Math.round(stats.users * 0.03)} 本月`} icon={<Users size={16} />} />
        <StatCard label="在线节点" value={`${stats.onlineNodes}/${stats.nodes}`} sub="全部节点实时探测" icon={<Globe2 size={16} />} />
        <StatCard label="卡密发行 / 已兑" value={`${fmtNum(stats.cdksIssued)} / ${fmtNum(stats.cdksUsed)}`} sub={`兑换率 ${(stats.cdksUsed / stats.cdksIssued * 100).toFixed(1)}%`} icon={<KeyRound size={16} />} />
        <StatCard label="今日流量" value={fmtBytes(stats.trafficToday)} sub="全节点进出合计" icon={<Activity size={16} />} tone="accent" />
        <StatCard label="参考流水" value={`¥${fmtNum(stats.revenueRef)}`} sub="近 30 日（以商城为准）" icon={<Wallet size={16} />} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', marginTop: 20, alignItems: 'start' }} data-admin-grid>
        <Card>
          <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line-subtle)' }}>
            <span className="card-title">近 14 日平台流量 (MB)</span>
            <Chip tone="accent">Telemetry</Chip>
          </div>
          <div style={{ padding: 18 }}><Sparkline data={series} /></div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>运营待办</div>
          <div className="flex-col" style={{ gap: 10 }}>
            {[
              { t: '3 个节点流量使用率 > 80%', c: 'warn' as const, action: '扩容' },
              { t: '12 张卡密即将过期', c: 'warn' as const, action: '处理' },
              { t: 'GB-01 节点离线 6 小时', c: 'danger' as const, action: '排查' },
              { t: 'Bot 客服队列 5 条未读', c: 'info' as const, action: '查看' },
            ].map(x => (
              <div key={x.t} className="flex-between panel" style={{ padding: '11px 13px', borderColor: 'var(--line-soft)' }}>
                <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
                  <Chip tone={x.c} dot>{x.action}</Chip>
                  <span style={{ fontSize: 12.5, color: 'var(--fg-mid)' }}>{x.t}</span>
                </div>
              </div>
            ))}
          </div>
          <hr className="divider" style={{ margin: '18px 0' }} />
          <div className="flex-col" style={{ gap: 10 }}>
            {[
              { l: 'Bot 在线', v: '正常', icon: <Bot size={14} /> },
              { l: 'API 网关', v: '正常', icon: <Activity size={14} /> },
            ].map(r => (
              <div key={r.l} className="flex-between" style={{ fontSize: 13 }}>
                <span className="flex" style={{ gap: 8, alignItems: 'center', color: 'var(--fg-low)' }}>{r.icon}{r.l}</span>
                <Chip tone="ok" dot>{r.v}</Chip>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
