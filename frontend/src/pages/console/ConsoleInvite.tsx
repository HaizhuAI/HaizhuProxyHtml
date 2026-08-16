import { useEffect, useState } from 'react';
import { Share2, Users } from 'lucide-react';
import { apiInvite } from '../../lib/api';
import type { InviteStats } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, CopyButton, Spinner } from '../../components/ui/ui';
import { useToast } from '../../components/ui/toast';
import { fmtBytes } from '../../lib/utils';

export default function ConsoleInvite() {
  const [inv, setInv] = useState<InviteStats | null>(null);
  const [err, setErr] = useState('');
  const toast = useToast();

  useEffect(() => { apiInvite().then(r => r.data ? setInv(r.data) : setErr(r.error ?? '加载失败')); }, []);

  if (err) return <div className="chip chip-danger">{err}</div>;
  if (!inv) return <div className="flex-center" style={{ padding: 80 }}><Spinner size={22} /></div>;

  const inviteUrl = `${location.origin}/register?invite=${inv.code}`;

  return (
    <>
      <PageHeader eyebrow="INVITE & REWARD" title="邀请好友" sub="每邀请一位好友注册并完成兑换，双方各得奖励流量" />
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, 1fr)', alignItems: 'start' }} data-invite-grid>
        <Card style={{ padding: 24 }}>
          <div className="card-title" style={{ marginBottom: 6 }}>你的专属邀请码</div>
          <div className="card-sub" style={{ marginBottom: 18 }}>把邀请链接或邀请码分享给好友，注册即绑定关系</div>
          <div className="flex" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <code style={{ padding: '12px 16px', background: 'var(--bg-panel-2)', border: '1px solid var(--line-strong)', borderRadius: 10, fontSize: 15, letterSpacing: '.08em', color: 'var(--accent)' }}>{inv.code}</code>
            <CopyButton text={inv.code} label="复制邀请码" />
          </div>
          <div className="card-sub" style={{ margin: '20px 0 8px' }}>邀请链接</div>
          <div className="flex" style={{ gap: 8 }}>
            <code style={{ flex: 1, padding: '11px 14px', background: 'var(--bg-panel-2)', border: '1px solid var(--line-soft)', borderRadius: 10, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--fg-mid)' }}>{inviteUrl}</code>
            <CopyButton text={inviteUrl} label="复制" />
          </div>
          <Button variant="outline" style={{ marginTop: 20 }} onClick={() => toast.push('info', '分享到 Telegram 需在服务端配置 Bot 后可用')}><Share2 size={15} />分享到 Telegram</Button>
        </Card>
        <Card style={{ padding: 22 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>邀请统计</div>
          <div className="flex-col" style={{ gap: 14 }}>
            {[
              { l: '累计邀请', v: String(inv.total), icon: <Users size={15} /> },
              { l: '活跃好友', v: String(inv.active) },
              { l: '每邀奖励', v: fmtBytes(inv.bonusPerInvite) },
            ].map(r => (
              <div key={r.l} className="flex-between panel" style={{ padding: '12px 14px', borderColor: 'var(--line-soft)' }}>
                <span className="muted" style={{ fontSize: 13 }}>{r.l}</span>
                <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg-hi)' }}>{r.v}</span>
              </div>
            ))}
            <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.7 }}>奖励规则：好友注册时填写你的邀请码，且完成首次卡密兑换后，双方各得 1 GB。防刷校验按设备指纹与邮箱域执行。</div>
          </div>
        </Card>
      </div>
    </>
  );
}
