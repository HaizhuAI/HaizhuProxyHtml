import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Download, Plus, RefreshCw } from 'lucide-react';
import { apiAllNodes, apiCreateNode, apiImportNodes } from '../../lib/api';
import type { ProxyNode } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, Chip, Field, Input, Modal, Select, Spinner, usePaged, Pager } from '../../components/ui/ui';
import { useToast } from '../../components/ui/toast';
import { fmtBytes, fmtDate } from '../../lib/utils';

const PROTOCOLS = ['vless', 'vmess', 'trojan', 'shadowsocks'];

export default function AdminNodes() {
  const [nodes, setNodes] = useState<ProxyNode[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState({ name: '', region: 'HK', host: '', port: '443', protocol: 'vless' as ProxyNode['protocol'], tls: true, network: 'tcp' as ProxyNode['network'], path: '', sni: '', flow: '', security: 'tls' as ProxyNode['security'], realityPbk: '', realitySid: '' });
  const [adv, setAdv] = useState(false);
  const [bulk, setBulk] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ ok: number; fail: { line: string; reason: string }[] } | null>(null);
  const toast = useToast();

  const load = () => apiAllNodes().then(r => r.data ? setNodes(r.data) : setErr(r.error ?? '加载失败'));
  useEffect(() => { load(); }, []);

  const paged = usePaged(nodes ?? [], 10);
  if (err) return <div className="chip chip-danger">{err}</div>;
  if (!nodes) return <div className="flex-center" style={{ padding: 80 }}><Spinner size={22} /></div>;

  const addNode = async () => {
    if (!form.name || !form.host) { toast.push('error', '节点名称与地址必填'); return; }
    const r = await apiCreateNode({ ...form, port: Number(form.port), tls: form.security === 'none' ? false : form.tls });
    if (r.error || !r.data) { toast.push('error', r.error ?? '创建失败'); return; }
    toast.push('success', `节点 ${form.name} 已创建并触发连通性探测`);
    setOpen(false);
    setForm({ name: '', region: 'HK', host: '', port: '443', protocol: 'vless', tls: true, network: 'tcp', path: '', sni: '', flow: '', security: 'tls', realityPbk: '', realitySid: '' });
    load();
  };

  const importBulk = async () => {
    const lines = bulk.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { toast.push('warn', '粘贴内容为空'); return; }
    setBulkBusy(true);
    const r = await apiImportNodes(bulk, 'HK');
    setBulkBusy(false);
    if (r.error) { toast.push('error', r.error); return; }
    const res = r.data!;
    setBulkResult({ ok: res.created.length, fail: res.failed });
    if (res.created.length) {
      toast.push('success', `成功导入 ${res.created.length} 个节点，已自动进入订阅分发`);
      load();
    }
    if (res.failed.length) toast.push('warn', `${res.failed.length} 行无法识别`);
  };

  return (
    <>
      <PageHeader eyebrow="NODE OPS" title="节点管理" sub="导入 / 监控 / 限流节点，全部流量实时计量" right={
        <div className="flex" style={{ gap: 10 }}>
          <Button variant="ghost" onClick={() => { load(); toast.push('info', '已触发全节点状态刷新'); }}><RefreshCw size={15} />刷新</Button>
          <Button variant="ghost" onClick={() => setBulkOpen(true)}><Download size={15} />批量导入</Button>
          <Button onClick={() => setOpen(true)}><Plus size={15} />添加节点</Button>
        </div>
      } />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>节点</th><th>地区</th><th>协议</th><th>地址</th><th>入流量</th><th>出流量</th><th>状态</th><th>添加时间</th></tr>
            </thead>
            <tbody>
              {paged.slice.map(n => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 600, color: 'var(--fg-hi)', whiteSpace: 'nowrap' }}>{n.name}</td>
                  <td><Chip>{n.region}</Chip></td>
                  <td className="mono" style={{ fontSize: 12 }}>{n.protocol}{n.security === 'reality' ? ' · Reality' : n.security === 'none' ? '' : ' · TLS'}{n.network !== 'tcp' ? ` · ${n.network}` : ''}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{n.host}:{n.port}</td>
                  <td className="num">{fmtBytes(n.trafficIn)}</td>
                  <td className="num">{fmtBytes(n.trafficOut)}</td>
                  <td>
                    <Chip tone={n.status === 'online' ? 'ok' : n.status === 'degraded' ? 'warn' : 'danger'} dot>
                      {n.status === 'online' ? '在线' : n.status === 'degraded' ? '降级' : '离线'}
                    </Chip>
                    {n.note && <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{n.note}</div>}
                  </td>
                  <td className="mono" style={{ fontSize: 11.5, color: 'var(--fg-low)' }}>{fmtDate(n.addedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: 12 }}><Pager page={paged.page} pages={paged.pages} onPage={paged.setPage} /></div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="添加节点" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button onClick={addNode}>创建节点</Button></>}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }} data-node-form>
          <Field label="节点名称"><Input placeholder="HK-03 · CN2 GIA" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="地区">
            <Select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>
              {['HK', 'JP', 'SG', 'KR', 'US', 'US-EWR', 'DE', 'GB', 'NL', 'FR', 'AU', 'BR', 'ZA'].map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="主机地址"><Input placeholder="hk03.haizhu.dev" value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} /></Field>
          <Field label="端口"><Input type="number" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} /></Field>
          <Field label="协议">
            <Select value={form.protocol} onChange={e => setForm(f => ({ ...f, protocol: e.target.value as ProxyNode['protocol'] }))}>
              {PROTOCOLS.map(p => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="TLS 加密">
            <Select value={form.tls ? 'yes' : 'no'} onChange={e => setForm(f => ({ ...f, tls: e.target.value === 'yes' }))}>
              <option value="yes">启用</option><option value="no">关闭</option>
            </Select>
          </Field>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => setAdv(a => !a)}>
          {adv ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 传输协议高级参数 {adv ? '' : '（ws / grpc / reality）'}
        </button>
        {adv && (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 14 }} data-node-adv>
            <Field label="传输方式" hint="tcp / ws / grpc">
              <Select value={form.network} onChange={e => setForm(f => ({ ...f, network: e.target.value as ProxyNode['network'] }))}>
                {['tcp', 'ws', 'grpc'].map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="安全层" hint="none / tls / reality">
              <Select value={form.security} onChange={e => setForm(f => ({ ...f, security: e.target.value as ProxyNode['security'] }))}>
                {['tls', 'none', 'reality'].map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Path / ServiceName" hint="ws path 或 grpc serviceName"><Input placeholder="/ray 或 grpc" value={form.path} onChange={e => setForm(f => ({ ...f, path: e.target.value }))} /></Field>
            <Field label="SNI / WS Host" hint="留空默认使用主机地址"><Input placeholder="cdn.haizhu.dev" value={form.sni} onChange={e => setForm(f => ({ ...f, sni: e.target.value }))} /></Field>
            <Field label="Flow" hint="如 xtls-rprx-vision"><Input placeholder="xtls-rprx-vision" value={form.flow} onChange={e => setForm(f => ({ ...f, flow: e.target.value }))} /></Field>
            <Field label="Reality PublicKey" hint="reality 模式必填"><Input placeholder="base64 public key" value={form.realityPbk} onChange={e => setForm(f => ({ ...f, realityPbk: e.target.value }))} /></Field>
            <Field label="Reality ShortId"><Input placeholder="0123456789abcdef" value={form.realitySid} onChange={e => setForm(f => ({ ...f, realitySid: e.target.value }))} /></Field>
          </div>
        )}
        <div className="faint" style={{ fontSize: 12, marginTop: 14 }}>创建后自动执行连通性 / 延迟探测，并纳入流量计量与余额熔断。ws / grpc / reality 参数会写入订阅链接与 Clash 配置。</div>
      </Modal>

      <Modal open={bulkOpen} onClose={() => { setBulkOpen(false); setBulkResult(null); }} title="批量导入节点" wide footer={<><Button variant="ghost" onClick={() => { setBulkOpen(false); setBulkResult(null); }}>取消</Button><Button onClick={importBulk} disabled={bulkBusy}>{bulkBusy ? <Spinner size={14} /> : '解析并导入'}</Button></>}>
        <Field label="每行一个节点" hint="支持格式：标准 share 链接（vless:// vmess:// trojan:// ss://，自动解析 reality/ws/grpc 参数）或简单行 name|host:port|protocol|region|tls">
          <textarea className="textarea" style={{ minHeight: 200, fontFamily: 'var(--font-mono)', fontSize: 12.5 }} placeholder={'HK-04|hk04.haizhu.dev:443|vless|HK|tls\nJP-03|jp03.haizhu.dev:443|trojan|JP|tls\nvless://UUID@sg01.haizhu.dev:443?encryption=none&security=reality&pbk=KEY&sid=aa11#SG-01'} value={bulk} onChange={e => setBulk(e.target.value)} />
        </Field>
        {bulkResult && (
          <div className="panel" style={{ marginTop: 14, padding: 12 }} data-import-result>
            <div className="card-sub" style={{ marginBottom: 8 }}>导入结果：成功 {bulkResult.ok} 个，失败 {bulkResult.fail.length} 个</div>
            {bulkResult.fail.length > 0 && (
              <div className="flex-col" style={{ gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                {bulkResult.fail.map((f, i) => (
                  <div key={i} className="mono" style={{ fontSize: 11, color: 'var(--danger)' }}>{f.line} — {f.reason}</div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="faint" style={{ fontSize: 12, marginTop: 14 }}>导入即分发：节点落库后所有用户订阅自动更新，无需再配置。</div>
      </Modal>
    </>
  );
}
