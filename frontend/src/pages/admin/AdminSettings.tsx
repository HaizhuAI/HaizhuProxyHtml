import { useState } from 'react';
import { Save, Settings2 } from 'lucide-react';
import { Button, Card, Field, Input, Select, Switch } from '../../components/ui/ui';
import { PageHeader } from '../../components/layout/PageHeader';
import { useToast } from '../../components/ui/toast';

export default function AdminSettings() {
  const [form, setForm] = useState({
    siteName: 'HaizhuProxy',
    siteUrl: 'https://haizhu.dev',
    registerEnabled: true,
    inviteRequired: false,
    inviteBonusMb: '1024',
    currency: 'CNY',
    maintenance: false,
    trafficUnit: 'MB',
    maxDevices: '5',
  });
  const toast = useToast();

  const save = () => { toast.push('success', '系统设置已保存（演示模式）'); };
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      <PageHeader eyebrow="SYSTEM" title="系统设置" sub="平台级参数与运营开关" right={<Button onClick={save}><Save size={15} />保存设置</Button>} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
        <Card style={{ padding: 24 }}>
          <div className="card-title" style={{ marginBottom: 18 }}><Settings2 size={15} style={{ color: 'var(--accent)', verticalAlign: -2 }} /> 基础信息</div>
          <div className="flex-col" style={{ gap: 14 }}>
            <Field label="站点名称"><Input value={form.siteName} onChange={e => set('siteName', e.target.value)} /></Field>
            <Field label="站点地址"><Input value={form.siteUrl} onChange={e => set('siteUrl', e.target.value)} /></Field>
            <Field label="币种">
              <Select value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option>CNY</option><option>USD</option><option>USDT</option>
              </Select>
            </Field>
            <Field label="流量计量单位">
              <Select value={form.trafficUnit} onChange={e => set('trafficUnit', e.target.value)}>
                <option>MB</option><option>GB</option>
              </Select>
            </Field>
          </div>
        </Card>
        <Card style={{ padding: 24 }}>
          <div className="card-title" style={{ marginBottom: 18 }}>注册与邀请</div>
          <div className="flex-col" style={{ gap: 16 }}>
            <div className="flex-between"><span style={{ fontSize: 13.5 }}>开放注册</span><Switch checked={form.registerEnabled} onChange={v => set('registerEnabled', v)} /></div>
            <div className="flex-between"><span style={{ fontSize: 13.5 }}>注册必须邀请码</span><Switch checked={form.inviteRequired} onChange={v => set('inviteRequired', v)} /></div>
            <Field label="邀请奖励 (MB)" hint="好友完成首次兑换后发放"><Input type="number" value={form.inviteBonusMb} onChange={e => set('inviteBonusMb', e.target.value)} /></Field>
            <Field label="默认最大设备数"><Input type="number" value={form.maxDevices} onChange={e => set('maxDevices', e.target.value)} /></Field>
          </div>
        </Card>
        <Card style={{ padding: 24 }}>
          <div className="card-title" style={{ marginBottom: 18 }}>运维</div>
          <div className="flex-col" style={{ gap: 16 }}>
            <div className="flex-between"><span style={{ fontSize: 13.5 }}>维护模式（全站只读公告）</span><Switch checked={form.maintenance} onChange={v => set('maintenance', v)} /></div>
            <div className="panel" style={{ padding: 14, borderColor: 'var(--line-soft)' }}>
              <div className="card-sub" style={{ marginBottom: 6 }}>流量熔断策略</div>
              <div style={{ fontSize: 12.5, color: 'var(--fg-mid)', lineHeight: 1.7 }}>
                用户余额 ≤ 0 时自动断开全部节点连接；管理员可在用户管理手动调整余额。节点级限速按节点配置执行。
              </div>
            </div>
            <div className="panel" style={{ padding: 14, borderColor: 'var(--line-soft)' }}>
              <div className="card-sub" style={{ marginBottom: 6 }}>安全策略</div>
              <div style={{ fontSize: 12.5, color: 'var(--fg-mid)', lineHeight: 1.7 }}>
                登录失败 5 次锁定 15 分钟；API 密钥哈希存储；卡密生成使用 CSPRNG 并做防碰撞校验。
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
