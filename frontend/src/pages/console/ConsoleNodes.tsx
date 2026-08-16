import { useEffect, useState } from 'react';
import { FileText, Gauge, Globe2, Link2 } from 'lucide-react';
import { apiMyNodes, apiProbeNode } from '../../lib/api';
import type { ConsoleNodesData, ProbeResult } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, Chip, CopyButton, EmptyState, Spinner } from '../../components/ui/ui';
import { useToast } from '../../components/ui/toast';

export default function ConsoleNodes() {
  const [data, setData] = useState<ConsoleNodesData | null>(null);
  const [err, setErr] = useState('');
  const [probing, setProbing] = useState<Record<string, ProbeResult>>({});
  const [busyId, setBusyId] = useState('');
  const toast = useToast();

  useEffect(() => { apiMyNodes().then(r => r.data ? setData(r.data) : setErr(r.error ?? '加载失败')); }, []);

  const abs = (path: string) => path.startsWith('http') ? path : `${window.location.origin}${path}`;

  const probe = async (nodeId: string) => {
    setBusyId(nodeId);
    const r = await apiProbeNode(nodeId);
    setBusyId('');
    if (r.error || !r.data) { toast.push('error', r.error ?? '测速失败'); return; }
    setProbing(p => ({ ...p, [nodeId]: r.data! }));
    toast.push(r.data.reachable ? 'success' : 'warn', r.data.reachable ? `${r.data.name} ${r.data.latencyMs} ms` : `${r.data.name} 不可达`);
  };

  const copySub = async (kind: 'v2ray' | 'clash') => {
    if (!data) return;
    const url = abs(kind === 'v2ray' ? data.subUrl : data.clashUrl);
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    toast.push('success', kind === 'v2ray' ? 'v2rayN / sing-box 订阅链接已复制' : 'Clash (mihomo) 订阅链接已复制');
  };

  if (err) return <div className="chip chip-danger">{err}</div>;
  if (!data) return <div className="flex-center" style={{ padding: 80 }}><Spinner size={22} /></div>;
  const nodes = data.nodes;

  const region = (code: string) => ({ HK: '🇭🇰 香港', JP: '🇯🇵 东京', SG: '🇸🇬 新加坡', US: '🇺🇸 洛杉矶', 'US-EWR': '🇺🇸 新泽西', DE: '🇩🇪 法兰克福', GB: '🇬🇧 伦敦', AU: '🇦🇺 悉尼' } as Record<string, string>)[code] ?? code;

  return (
    <>
      <PageHeader eyebrow="MY NODES" title="我的节点" sub="选择地区节点，一键复制订阅链接" right={
        <div className="flex" style={{ gap: 10 }}>
          <Button variant="outline" onClick={() => copySub('v2ray')}><Link2 size={15} />v2ray 订阅</Button>
          <Button variant="outline" onClick={() => copySub('clash')}><FileText size={15} />Clash 订阅</Button>
        </div>
      } />
      <Card style={{ padding: 18, marginBottom: 18 }}>
        <div className="card-sub" style={{ marginBottom: 12 }}>订阅地址（导入客户端即可分发全部节点）</div>
        <div className="flex-col" style={{ gap: 10 }}>
          <div className="flex-between" style={{ gap: 12 }}>
            <code className="mono" style={{ flex: 1, fontSize: 12, color: 'var(--accent)', wordBreak: 'break-all', background: 'var(--bg-panel)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line-subtle)' }}>{abs(data.subUrl)}</code>
            <Button variant="outline" size="sm" onClick={() => copySub('v2ray')}><Link2 size={13} />复制</Button>
          </div>
          <div className="flex-between" style={{ gap: 12 }}>
            <code className="mono" style={{ flex: 1, fontSize: 12, color: 'var(--fg-mid)', wordBreak: 'break-all', background: 'var(--bg-panel)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line-subtle)' }}>{abs(data.clashUrl)}</code>
            <Button variant="outline" size="sm" onClick={() => copySub('clash')}><FileText size={13} />复制</Button>
          </div>
        </div>
      </Card>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>节点</th><th>地区</th><th>协议</th><th>地址</th><th>状态</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map(n => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 600, color: 'var(--fg-hi)', whiteSpace: 'nowrap' }}>{n.name}</td>
                  <td>{region(n.region)}</td>
                  <td><Chip>{n.protocol}{n.tls ? ' · TLS' : ''}</Chip></td>
                  <td className="mono" style={{ fontSize: 12 }}>{n.host}:{n.port}</td>
                  <td>
                    <Chip tone={n.status === 'online' ? 'ok' : n.status === 'degraded' ? 'warn' : 'danger'} dot>
                      {n.status === 'online' ? '在线' : n.status === 'degraded' ? '降级' : '离线'}
                    </Chip>
                    {n.note && <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{n.note}</div>}
                  </td>
                  <td>
                    <div className="flex" style={{ gap: 6 }}>
                      <CopyButton text={`${n.protocol}://${n.host}:${n.port}?security=${n.tls ? 'tls' : 'none'}#${n.name}`} label="复制链接" />
                      {busyId === n.id ? <Button variant="ghost" size="sm" disabled><Spinner size={12} /></Button> : (
                        <Button variant="ghost" size="sm" onClick={() => probe(n.id)}>
                          {probing[n.id] ? (probing[n.id].reachable ? `${probing[n.id].latencyMs} ms` : '不可达') : '测速'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {nodes.length === 0 && <EmptyState icon={<Globe2 size={28} />} title="暂无可用节点" hint="先兑换卡密获取流量，节点将自动可用" />}
      </Card>
      <div className="flex" style={{ marginTop: 16, alignItems: 'center', gap: 8, color: 'var(--fg-low)', fontSize: 12.5 }}>
        <Gauge size={14} />
        提示：订阅链接包含全部在线节点；导入 v2rayN / Clash / sing-box 后自动更新。管理台导入新节点即自动分发，无需重复配置。
      </div>
    </>
  );
}
