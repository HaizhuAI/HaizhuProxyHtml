import { useEffect, useRef, useState } from 'react';
import { Bot, ExternalLink, MessageCircle, Send, X } from 'lucide-react';
import { apiTelegram } from '../../lib/api';
import type { TelegramConfig } from '../../lib/types';
import { cn } from '../../lib/utils';

interface Msg { id: number; from: 'user' | 'bot'; text: string; at: string }

const canned: Array<[RegExp, string]> = [
  [/卡密|兑换|cdk/i, '卡密兑换请登录控制台 → 卡密兑换，输入 HZ- 开头的卡密即可到账流量。'],
  [/节点|线路|速度/i, '节点状态可在控制台实时查看。高峰期建议切换 HK / JP 线路，延迟最低。'],
  [/购买|商城|下单|支付/i, '商城地址在首页导航栏，支持 USDT / 信用卡 / 本地支付，付款后自动发卡密到邮箱。'],
  [/套餐|价格|流量/i, '套餐有 Starter / Pro / Max 三档，购买后以卡密形式充值，随时兑换。'],
  [/人工|客服|投诉/i, '这是自动客服机器人，复杂问题请 @HaizhuSupportBot 转人工处理。'],
];

function botReply(input: string): string {
  for (const [re, ans] of canned) if (re.test(input)) return ans;
  return '收到，已记录你的问题。机器人无法自动回答时，请点击"打开 Telegram"转人工客服。';
}

export function TelegramChatWidget() {
  const [cfg, setCfg] = useState<TelegramConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const idRef = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiTelegram().then(r => { if (r.data) setCfg(r.data); });
  }, []);

  useEffect(() => {
    if (open && cfg && msgs.length === 0) {
      setMsgs([{ id: ++idRef.current, from: 'bot', text: cfg.welcomeMessage, at: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }]);
    }
  }, [open, cfg, msgs.length]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMsgs(m => [...m, { id: ++idRef.current, from: 'user', text, at: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMsgs(m => [...m, { id: ++idRef.current, from: 'bot', text: botReply(text), at: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }]);
      setTyping(false);
    }, 900 + Math.random() * 700);
  };

  const tgUrl = cfg?.botUsername ? `https://t.me/${cfg.botUsername.replace('@', '')}` : 'https://t.me';

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? '关闭客服' : '打开客服'}
        className="flex-center"
        style={{
          position: 'fixed', right: 22, bottom: 22, zIndex: 120,
          width: 56, height: 56, borderRadius: '50%', cursor: 'pointer', border: 'none',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))',
          color: 'var(--accent-on)', boxShadow: 'var(--shadow-pop), var(--shadow-glow)',
          transition: 'transform var(--dur-med) var(--ease-spring)',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
        {!open && <span className="dot pulse-dot" style={{ position: 'absolute', top: 8, right: 8, background: 'var(--ok)' }} />}
      </button>

      {open && (
        <div className="tg-window" role="dialog" aria-label="在线客服" style={{
          position: 'fixed', right: 22, bottom: 90, zIndex: 121,
          width: 372, maxWidth: 'calc(100vw - 32px)', height: 520, maxHeight: 'calc(100vh - 140px)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'var(--bg-panel)', border: '1px solid var(--line-strong)', borderRadius: 18,
          boxShadow: 'var(--shadow-pop)', animation: 'popIn var(--dur-med) var(--ease-spring)',
        }}>
          <div className="flex-between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-subtle)', background: 'var(--bg-panel-2)' }}>
            <div className="flex" style={{ alignItems: 'center', gap: 10 }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(63,217,180,.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} style={{ color: 'var(--accent)' }} />
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-hi)' }}>{cfg?.widgetTitle ?? 'Haizhu 客服'}</div>
                <div className="flex" style={{ alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ok)' }}>
                  <span className="dot" />在线 · 通常几分钟内回复
                </div>
              </div>
            </div>
            <div className="flex" style={{ gap: 4 }}>
              <a href={tgUrl} target="_blank" rel="noreferrer" aria-label="打开 Telegram" className="btn btn-ghost btn-icon" title="打开 Telegram">
                <ExternalLink size={15} />
              </a>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="关闭"><X size={15} /></button>
            </div>
          </div>

          <div ref={bodyRef} className="tg-body" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-base)' }}>
            {msgs.map(m => (
              <div key={m.id} className={cn('flex-col')} style={{ alignItems: m.from === 'user' ? 'flex-end' : 'flex-start', gap: 3 }}>
                <div style={{
                  maxWidth: '82%', padding: '9px 13px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.5,
                  background: m.from === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: m.from === 'user' ? 'var(--accent-on)' : 'var(--fg-hi)',
                  border: m.from === 'user' ? 'none' : '1px solid var(--line-soft)',
                  borderBottomRightRadius: m.from === 'user' ? 4 : 14,
                  borderBottomLeftRadius: m.from === 'user' ? 14 : 4,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>{m.text}</div>
                <span className="faint mono" style={{ fontSize: 10 }}>{m.at}</span>
              </div>
            ))}
            {typing && (
              <div className="flex" style={{ alignItems: 'center', gap: 5, padding: '9px 13px', background: 'var(--bg-elevated)', borderRadius: 14, borderBottomLeftRadius: 4, alignSelf: 'flex-start', border: '1px solid var(--line-soft)' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fg-low)', animation: `typingBounce 1.2s ${i * 0.18}s infinite` }} />
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid var(--line-subtle)', background: 'var(--bg-panel-2)' }}>
            <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
              <input
                className="input" style={{ flex: 1 }}
                placeholder={cfg?.placeholder ?? '输入消息，按 Enter 发送…'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                aria-label="消息内容"
              />
              <button className="btn btn-primary btn-icon" onClick={send} aria-label="发送" disabled={!input.trim()}><Send size={16} /></button>
            </div>
            <div className="faint" style={{ fontSize: 10.5, marginTop: 8, textAlign: 'center' }}>
              由 <span className="mono" style={{ color: 'var(--accent)' }}>{cfg?.botUsername ?? '@HaizhuSupportBot'}</span> 驱动 · 网页内直聊或跳转 Telegram
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes typingBounce { 0%,60%,100% { transform: translateY(0); opacity:.5 } 30% { transform: translateY(-4px); opacity:1 } }
      `}</style>
    </>
  );
}
