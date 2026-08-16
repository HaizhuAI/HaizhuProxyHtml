import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CreditCard, Globe2, KeyRound, LayoutDashboard, LogOut, Mail, Settings2, ShoppingCart, Users, Bot } from 'lucide-react';
import { Logo } from './Logo';
import { loadSession, clearSession } from '../../lib/api';
import { useToast } from '../ui/toast';
import { cn } from '../../lib/utils';

const nav = [
  { to: '/admin', label: '仪表盘', icon: LayoutDashboard, end: true },
  { to: '/admin/nodes', label: '节点管理', icon: Globe2 },
  { to: '/admin/cdks', label: '卡密管理', icon: KeyRound },
  { to: '/admin/users', label: '用户管理', icon: Users },
  { to: '/admin/shops', label: '商城管理', icon: ShoppingCart },
  { to: '/admin/telegram', label: 'Telegram Bot', icon: Bot },
  { to: '/admin/smtp', label: '邮件发件', icon: Mail },
  { to: '/admin/api', label: 'API 密钥', icon: CreditCard },
  { to: '/admin/settings', label: '系统设置', icon: Settings2 },
];

export function AdminLayout() {
  const [session, setSession] = useState(loadSession());
  const navGo = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!session.user) { navGo('/login'); return; }
    if (session.user.role !== 'admin') { navGo('/console'); }
  }, [session, navGo]);

  if (!session.user || session.user.role !== 'admin') return null;

  const logout = () => {
    clearSession();
    setSession({ user: null, token: null });
    toast.push('info', '已退出登录');
    navGo('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <aside style={{
        width: 240, flexShrink: 0, borderRight: '1px solid var(--line-subtle)', background: 'var(--bg-panel)',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line-subtle)' }}>
          <NavLink to="/"><Logo size={26} /></NavLink>
          <div className="chip chip-accent" style={{ marginTop: 10 }}>管理员控制台</div>
        </div>
        <nav style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn('console-nav-item', isActive && 'active')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: 13.5, fontWeight: 500, color: 'var(--fg-mid)', transition: 'all var(--dur-fast) var(--ease)' }}>
              <n.icon size={16} />{n.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: 14, borderTop: '1px solid var(--line-subtle)' }}>
          <div className="flex" style={{ alignItems: 'center', gap: 10, padding: '0 6px 10px' }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(63,217,180,.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>
              {session.user.username.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-hi)' }}>{session.user.username}</div>
              <div className="faint mono" style={{ fontSize: 10.5 }}>root · operator</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-block" onClick={logout}><LogOut size={14} />退出登录</button>
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, padding: 28, background: 'var(--bg-base)' }}>
        <Outlet />
      </main>
    </div>
  );
}
