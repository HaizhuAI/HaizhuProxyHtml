import { useEffect, useState } from 'react';
import { Bot, MessageSquare, Send, ShieldCheck } from 'lucide-react';
import { apiSaveTelegram, apiTelegram, apiTestBot } from '../../lib/api';
import type { TelegramConfig } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, Field, Input, Spinner, Switch, Textarea } from '../../components/ui/ui';
import { useToast } from '../../components/ui/toast';

export default function AdminTelegram() {
  const [cfg, setCfg] = useState<TelegramConfig | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const toast = useToast();

  useEffect(() => { apiTelegram().then(r => r.data ? setCfg(r.data) : setErr(r.error ?? '加载失败')); }, []);
  if (err) return <div className="chip chip-danger">{err}</div>;
  if (!cfg) return <div className="flex-center" style={{ padding: 80 }}><Spinner size={22} /></div>;

  const set = <K extends keyof TelegramConfig>(k: K, v: TelegramConfig[K]) => setCfg(c => ({ ...c!, [k]: v }));

  const save = async () => {
    setBusy(true);
    const r = await apiSaveTelegram(cfg);
    setBusy(false);
    if (r.error) { toast.push('error', r.error); return; }
    toast.push('success', 'Telegram Bot 配置已保存，前端浮窗即时生效');
  };

  const test = async () => {
    setTesting(true);
    const r = await apiTestBot();
    setTesting(false);
    toast.push(r.data?.delivered ? 'success' : 'error', r.data?.message ?? r.error ?? '测试发送失败');
  };

  return (
    <>
      <PageHeader eyebrow="TELEGRAM BOT" title="在线客服 Bot" sub="配置 Bot 参数，用户前端右下角浮窗实时对话" right={<Button variant="outline" onClick={test} disabled={testing}>{testing ? <Spinner size={14} /> : <Send size={14} />}发送测试消息</Button>} />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)', alignItems: 'start' }} data-tg-grid>
        <Card style={{ padding: 24 }}>
          <div className="flex-between" style={{ marginBottom: 18 }}>
            <div className="flex" style={{ gap: 10, alignItems: 'center' }}><Bot size={18} style={{ color: 'var(--accent)' }} /><span className="card-title">Bot 参数</span></div>
            <Switch checked={cfg.enabled} onChange={v => set('enabled', v)} label={cfg.enabled ? '已启用' : '已停用'} />
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }} data-tg-form>
            <Field label="Bot Token" hint="从 @BotFather 获取"><Input type="password" value={cfg.botToken} onChange={e => set('botToken', e.target.value)} placeholder="123456:ABC-DEF..." /></Field>
            <Field label="Bot 用户名"><Input value={cfg.botUsername} onChange={e => set('botUsername', e.target.value)} placeholder="@HaizhuSupportBot" /></Field>
            <Field label="客服 Chat ID" hint="群组或用户 ID，接收消息与工单"><Input value={cfg.chatId} onChange={e => set('chatId', e.target.value)} placeholder="-1002345678901" /></Field>
            <Field label="浮窗标题"><Input value={cfg.widgetTitle} onChange={e => set('widgetTitle', e.target.value)} /></Field>
            <Field label="欢迎语">
              <Textarea value={cfg.welcomeMessage} onChange={e => set('welcomeMessage', e.target.value)} style={{ minHeight: 80 }} />
            </Field>
            <Field label="输入框占位符"><Input value={cfg.placeholder} onChange={e => set('placeholder', e.target.value)} /></Field>
          </div>
          <div className="flex" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
            <Button onClick={save} disabled={busy}>{busy ? <Spinner size={14} /> : '保存配置'}</Button>
          </div>
        </Card>

        <Card style={{ padding: 22 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>运行说明</div>
          <div className="flex-col" style={{ gap: 12 }}>
            <div className="flex" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="chip chip-accent" style={{ flexShrink: 0 }}>1</span>
              <span style={{ fontSize: 13, color: 'var(--fg-mid)' }}>在 Telegram 中向 <span className="mono" style={{ color: 'var(--accent)' }}>@BotFather</span> 创建 Bot，获取 Token。</span>
            </div>
            <div className="flex" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="chip chip-accent" style={{ flexShrink: 0 }}>2</span>
              <span style={{ fontSize: 13, color: 'var(--fg-mid)' }}>将 Bot 拉入客服群组，发送任意消息后获取 Chat ID（可用 <span className="mono">getUpdates</span> 查询）。</span>
            </div>
            <div className="flex" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="chip chip-accent" style={{ flexShrink: 0 }}>3</span>
              <span style={{ fontSize: 13, color: 'var(--fg-mid)' }}>保存配置后，用户前端右下角浮窗启用；消息通过后端转发至 Bot。</span>
            </div>
            <div className="flex" style={{ gap: 10, alignItems: 'flex-start' }}>
              <span className="chip chip-accent" style={{ flexShrink: 0 }}>4</span>
              <span style={{ fontSize: 13, color: 'var(--fg-mid)' }}>点击"发送测试消息"验证 Token 与 Chat ID 配置。</span>
            </div>
            <hr className="divider" />
            <div className="flex" style={{ gap: 8, alignItems: 'center', color: 'var(--fg-low)', fontSize: 12.5 }}>
              <ShieldCheck size={15} style={{ color: 'var(--ok)' }} />Token 加密存储，前端仅展示掩码。Webhook 由后端注册。
            </div>
            <div className="flex" style={{ gap: 8, alignItems: 'center', color: 'var(--fg-low)', fontSize: 12.5 }}>
              <MessageSquare size={15} style={{ color: 'var(--info)' }} />工单系统：用户消息自动建单，支持 @ 提及转人工。
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
