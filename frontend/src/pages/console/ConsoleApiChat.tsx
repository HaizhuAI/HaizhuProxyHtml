import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Bot, Loader2, MessageSquare, RotateCcw, Send, User } from 'lucide-react';
import type { ApiProfile, LabMessage } from '../../lib/modelLab';
import { loadProfiles, sendChat } from '../../lib/modelLab';
import './modelLab.css';

export default function ConsoleApiChat() {
  const profiles = useMemo(loadProfiles, []);
  const [profileId, setProfileId] = useState(profiles[0]?.id || '');
  const profile = profiles.find(p => p.id === profileId) as ApiProfile | undefined;
  const [model, setModel] = useState(profile?.models[0] || '');
  const [temperature, setTemperature] = useState(.7);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<LabMessage[]>([{ role:'system', content:'You are a helpful assistant.' }]);
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!profile || !model || !input.trim() || busy) return;
    const next=[...messages,{role:'user' as const,content:input.trim()}]; setMessages(next); setInput(''); setBusy(true);
    try { const r=await sendChat(profile,model,next,temperature); setMessages([...next,{role:'assistant',content:r.content||'(空响应)'}]); setMeta(`${r.model} · ${r.latency_ms} ms${r.usage ? ` · ${r.usage.total_tokens || 0} tokens` : ''}`); }
    catch(e){ setMessages([...next,{role:'assistant',content:`请求失败：${(e as Error).message}`}]); }
    finally{setBusy(false)}
  };
  return <div className="model-lab-page chat-page"><header className="lab-head"><div><span className="lab-kicker">BROWSER CHAT PLAYGROUND</span><h1>网页测试对话</h1><p>选择已导入的 API 与模型，直接验证多轮对话效果。</p></div><button className="lab-btn secondary" onClick={()=>{setMessages([{role:'system',content:'You are a helpful assistant.'}]);setMeta('')}}><RotateCcw size={15}/>清空对话</button></header>
    <div className="chat-shell"><aside className="chat-settings"><div className="panel-title"><div><MessageSquare size={16}/><b>会话参数</b></div></div><label>API 连接<select value={profileId} onChange={e=>{setProfileId(e.target.value);const p=profiles.find(x=>x.id===e.target.value);setModel(p?.models[0]||'')}}><option value="">请选择连接</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>模型<select value={model} onChange={e=>setModel(e.target.value)}><option value="">请选择模型</option>{profile?.models.map(m=><option key={m}>{m}</option>)}</select></label><label>Temperature <span>{temperature.toFixed(1)}</span><input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e=>setTemperature(Number(e.target.value))}/></label><label>System Prompt<textarea value={messages[0]?.role==='system'?messages[0].content:''} onChange={e=>setMessages([{role:'system',content:e.target.value},...messages.filter(m=>m.role!=='system')])}/></label>{!profiles.length&&<div className="status-banner bad">测试台中还没有 API 配置，请先导入或创建。</div>}</aside>
      <section className="conversation"><div className="conversation-top"><span><span className={`live-dot ${profile?'on':''}`}/>{profile?`${profile.name} / ${model||'未选模型'}`:'未连接'}</span><small>{meta}</small></div><div className="message-stream">{messages.filter(m=>m.role!=='system').length===0&&<div className="empty-chat"><Bot size={30}/><b>开始一次真实 API 对话</b><span>消息将由后端代理发送，避免浏览器 CORS 限制。</span></div>}{messages.filter(m=>m.role!=='system').map((m,i)=><div className={`message ${m.role}`} key={i}><span className="avatar">{m.role==='user'?<User size={15}/>:<Bot size={15}/>}</span><div><small>{m.role==='user'?'YOU':'MODEL'}</small><p>{m.content}</p></div></div>)}{busy&&<div className="message assistant"><span className="avatar"><Bot size={15}/></span><div><small>MODEL</small><p><Loader2 className="spin" size={17}/> 正在生成…</p></div></div>}</div><form className="composer" onSubmit={submit}><textarea placeholder="输入消息，Ctrl/⌘ + Enter 发送…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')e.currentTarget.form?.requestSubmit()}}/><button disabled={!profile||!model||!input.trim()||busy}><Send size={17}/>发送</button></form></section>
    </div></div>;
}
