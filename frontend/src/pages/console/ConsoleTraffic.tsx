import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Database } from 'lucide-react';
import { apiMyTraffic } from '../../lib/api';
import type { TrafficPage } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, Chip, EmptyState, Pager, Spinner } from '../../components/ui/ui';
import { fmtBytes, fmtDate } from '../../lib/utils';

export default function ConsoleTraffic() {
  const [data, setData] = useState<TrafficPage | null>(null);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { apiMyTraffic(page, 20).then(r => r.data ? setData(r.data) : setErr(r.error ?? '加载失败')); }, [page]);
  if (err) return <div className="chip chip-danger">{err}</div>;
  if (!data) return <div className="flex-center" style={{ padding: 80 }}><Spinner size={22} /></div>;

  return (
    <>
      <PageHeader eyebrow="TRAFFIC LOG" title="流量明细" sub={`实时计量记录 · 共 ${data.total} 条`} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>时间</th><th>节点</th><th>入站</th><th>出站</th><th>合计</th></tr>
            </thead>
            <tbody>
              {data.items.map((it, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--fg-low)' }}>{fmtDate(it.ts)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--fg-hi)' }}>{it.nodeName}</td>
                  <td className="num" style={{ color: 'var(--info)' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><ArrowDown size={12} />{fmtBytes(it.bytesIn)}</span></td>
                  <td className="num" style={{ color: 'var(--accent)' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><ArrowUp size={12} />{fmtBytes(it.bytesOut)}</span></td>
                  <td className="num">{fmtBytes(it.bytesIn + it.bytesOut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.items.length === 0 && <EmptyState icon={<Database size={26} />} title="暂无流量记录" hint="兑换卡密并使用节点后，此处将实时显示计量明细" />}
        <div style={{ padding: 12 }}><Pager page={page} pages={Math.max(1, Math.ceil(data.total / 20))} onPage={setPage} /></div>
      </Card>
      <div className="flex" style={{ marginTop: 14, gap: 10 }}>
        <Chip tone="info" dot>入站</Chip><span className="faint" style={{ fontSize: 12.5 }}>从节点收到的下行流量</span>
        <Chip tone="accent" dot>出站</Chip><span className="faint" style={{ fontSize: 12.5 }}>经节点发送的上行流量</span>
      </div>
    </>
  );
}
