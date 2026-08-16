import { useMemo, useState } from 'react';
import { Activity, Check, Download, Eye, EyeOff, Loader2, Play, Plus, Save, Search, Upload } from 'lucide-react';
import type { ApiProfile } from '../../lib/modelLab';
import { discoverModels, loadProfiles, probeModel, saveProfiles } from '../../lib/modelLab';
import './modelLab.css';

const blank = (): ApiProfile => ({ id: crypto.randomUUID(), name: '新 API', baseUrl: 'https://api.openai.com', apiKey: '', timeoutSeconds: 30, models: [], updatedAt: new Date().toISOString() });

export default function ConsoleApiLab() {
  const [profiles, setProfiles] = useState<ApiProfile[]>(loadProfiles);
  const [draft, setDraft] = useState<ApiProfile>(profiles[0] || blank());
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState('');
  const [filter, setFilter] = useState('');
  const [results, setResults] = useState<Record<string, { ok: boolean; latency?: number; error?: string }>>({});
  const models = useMemo(() => draft.models.filter(m => m.toLowerCase().includes(filter.toLowerCase())), [draft.models, filter]);

  const persist = (nextDraft = draft) => {
    const next = [...profiles.filter(p => p.id !== nextDraft.id), { ...nextDraft, updatedAt: new Date().toISOString() }];
    setProfiles(next); saveProfiles(next); setDraft(next.find(p => p.id === nextDraft.id)!);
  };
  const discover = async () => {
    setBusy('discover');
    try {
      const data = await discoverModels(draft);
      const next = { ...draft, models: data.models.map(m => m.id) };
      setDraft(next); persist(next);
      setResults({ _discovery: { ok: true, latency: data.latency_ms } });
    } catch (e) { setResults({ _discovery: { ok: false, error: (e as Error).message } }); }
    finally { setBusy(''); }
  };
  const testOne = async (model: string) => {
    setBusy(model);
    try { const data = await probeModel(draft, model); setResults(r => Object.assign({}, r, Object.fromEntries([[model, { ok: true, latency: data.latency_ms }]]))); }
    catch (e) { setResults(r => Object.assign({}, r, Object.fromEntries([[model, { ok: false, error: (e as Error).message }]]))); }
    finally { setBusy(''); }
  };
  const testAll = async () => {
    setBusy('all');
    for (const model of models) await testOne(model);
    setBusy('');
  };
  const exportProfiles = () => {
    const safe = profiles.map(({ apiKey: _apiKey, ...profile }) => ({ ...profile, apiKey: '' }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'api-profiles.json'; a.click(); URL.revokeObjectURL(url);
  };
  const importProfiles = async (file: File) => {
    const incoming = JSON.parse(await file.text()) as ApiProfile[];
    const next = incoming.map(p => ({ ...blank(), ...p, id: p.id || crypto.randomUUID(), apiKey: p.apiKey || '' }));
    setProfiles(next); saveProfiles(next); if (next[0]) setDraft(next[0]);
  };

  return <div className="model-lab-page">
    <header className="lab-head"><div><span className="lab-kicker">MODEL CONNECTIVITY LAB</span><h1>API 信息测试台</h1><p>导入连接信息、探测模型目录，并逐个验证 Chat Completions 可用性。</p></div><div className="lab-actions">
      <label className="lab-btn secondary"><Upload size={15}/>导入<input hidden type="file" accept="application/json" onChange={e => e.target.files?.[0] && importProfiles(e.target.files[0])}/></label>
      <button className="lab-btn secondary" onClick={exportProfiles}><Download size={15}/>导出脱敏配置</button>
      <button className="lab-btn" onClick={() => { const p = blank(); setDraft(p); }}><Plus size={15}/>新建连接</button>
    </div></header>
    <div className="lab-workspace">
      <aside className="profile-rail"><div className="rail-title">已导入 API <span>{profiles.length}</span></div>{profiles.map(p => <button key={p.id} className={`profile-item ${draft.id === p.id ? 'active' : ''}`} onClick={() => setDraft(p)}><span className="profile-dot"/><span><b>{p.name}</b><small>{p.baseUrl}</small></span></button>)}</aside>
      <section className="lab-main">
        <div className="lab-panel connection-panel"><div className="panel-title"><div><Activity size={17}/><b>连接配置</b></div><span className="privacy-note">API Key 仅保存在当前浏览器</span></div>
          <div className="form-grid"><label>连接名称<input value={draft.name} onChange={e => setDraft({...draft, name:e.target.value})}/></label><label>Base URL<input value={draft.baseUrl} onChange={e => setDraft({...draft, baseUrl:e.target.value})}/></label><label className="key-field">API Key<div><input type={showKey?'text':'password'} value={draft.apiKey} onChange={e => setDraft({...draft, apiKey:e.target.value})}/><button onClick={() => setShowKey(v=>!v)}>{showKey?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></label><label>超时（秒）<input type="number" min="2" max="180" value={draft.timeoutSeconds} onChange={e => setDraft({...draft, timeoutSeconds:Number(e.target.value)})}/></label></div>
          <div className="connection-actions"><button className="lab-btn secondary" onClick={() => persist()}><Save size={15}/>保存配置</button><button className="lab-btn" disabled={!!busy} onClick={discover}>{busy==='discover'?<Loader2 className="spin" size={15}/>:<Search size={15}/>}探测可用模型</button></div>
        </div>
        <div className="lab-panel models-panel"><div className="panel-title"><div><b>模型可用性</b><span className="count-chip">{models.length} MODELS</span></div><div className="model-tools"><div className="searchbox"><Search size={14}/><input placeholder="筛选模型…" value={filter} onChange={e=>setFilter(e.target.value)}/></div><button className="lab-btn small" disabled={!models.length || !!busy} onClick={testAll}><Play size={14}/>一键测试全部</button></div></div>
          {results._discovery && <div className={`status-banner ${results._discovery.ok?'ok':'bad'}`}>{results._discovery.ok ? `模型目录读取成功 · ${results._discovery.latency} ms` : results._discovery.error}</div>}
          <div className="model-list">{models.length ? models.map(model => { const r=results[model]; return <div className="model-row" key={model}><div><span className="model-icon">M</span><span><b>{model}</b><small>OpenAI compatible</small></span></div><div className="model-result">{r && <span className={r.ok?'pass':'fail'}>{r.ok?<><Check size={13}/>可用 · {r.latency} ms</>:r.error}</span>}<button className="test-btn" disabled={!!busy} onClick={()=>testOne(model)}>{busy===model?<Loader2 className="spin" size={14}/>:<Play size={14}/>}测试</button></div></div>}) : <div className="empty-state">先填写连接信息，然后点击「探测可用模型」。</div>}</div>
        </div>
      </section>
    </div>
  </div>;
}
