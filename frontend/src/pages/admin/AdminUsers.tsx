import { useState } from 'react';
import { Ban, Search, ShieldCheck } from 'lucide-react';
import { MOCK_USERS } from '../../lib/mock';
import type { User } from '../../lib/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, Chip, Input, usePaged, Pager } from '../../components/ui/ui';
import { useToast } from '../../components/ui/toast';
import { fmtBytes, fmtDate } from '../../lib/utils';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [q, setQ] = useState('');
  const toast = useToast();

  const filtered = users.filter(u => u.email.includes(q) || u.username.includes(q) || u.inviteCode.includes(q.toUpperCase()));
  const paged = usePaged(filtered, 8);

  const toggleBan = (u: User) => {
    setUsers(s => s.map(x => x.id === u.id ? { ...x, status: x.status === 'active' ? 'banned' as const : 'active' as const } : x));
    toast.push(u.status === 'active' ? 'warn' : 'success', u.status === 'active' ? `已封禁 ${u.username}` : `已解封 ${u.username}`);
  };

  return (
    <>
      <PageHeader eyebrow="USER OPS" title="用户管理" sub="账户、余额、邀请关系与状态管控" right={
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-faint)' }} />
          <Input placeholder="搜索邮箱 / 用户名 / 邀请码" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 34, width: 260 }} />
        </div>
      } />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>用户</th><th>角色</th><th>余额</th><th>已用流量</th><th>邀请码</th><th>邀请人</th><th>注册时间</th><th>状态</th><th>操作</th></tr>
            </thead>
            <tbody>
              {paged.slice.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex" style={{ alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--hz-black-600)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{u.username.slice(0, 2).toUpperCase()}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--fg-hi)', fontSize: 13 }}>{u.username}</div>
                        <div className="faint mono" style={{ fontSize: 11 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.role === 'admin' ? <Chip tone="accent"><ShieldCheck size={11} />管理员</Chip> : <Chip>用户</Chip>}</td>
                  <td className="num accent-text">{fmtBytes(u.balance)}</td>
                  <td className="num">{fmtBytes(u.trafficUsed)}</td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{u.inviteCode}</td>
                  <td className="mono" style={{ fontSize: 11.5, color: 'var(--fg-low)' }}>{u.invitedBy ?? '—'}</td>
                  <td className="mono" style={{ fontSize: 11.5, color: 'var(--fg-low)' }}>{fmtDate(u.createdAt)}</td>
                  <td><Chip tone={u.status === 'active' ? 'ok' : 'danger'} dot>{u.status === 'active' ? '正常' : '封禁'}</Chip></td>
                  <td><Button variant={u.status === 'active' ? 'danger' : 'ghost'} size="sm" onClick={() => toggleBan(u)}><Ban size={13} />{u.status === 'active' ? '封禁' : '解封'}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: 12 }}><Pager page={paged.page} pages={paged.pages} onPage={paged.setPage} /></div>
      </Card>
    </>
  );
}
