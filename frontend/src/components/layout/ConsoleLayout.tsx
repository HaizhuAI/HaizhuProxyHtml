import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, Globe2, LogOut, Share2, User, KeyRound, ChartNoAxesColumnIncreasing } from 'lucide-react';
import { Logo } from './Logo';
import { loadSession, clearSession } from '../../lib/api';
import { useToast } from '../ui/toast';
import { cn } from '../../lib/utils';

const nav = [
  { to: '/console', label: '概览', icon: Activity, end: true },
  { to: '/console/redeem', label: '卡密兑换', icon: KeyRound },
  { to: '/console/nodes', label: '我的节点', icon: Globe2 },
  { to: '/console/invite', label: '邀请好友', icon: Share2 },
  { to: '/console/traffic', label: '流量明细', icon: ChartNoAxesColumnIncreasing },
  { to: '/console/profile', label: '账户设置', icon: User },
];

export function ConsoleLayout() {
  const [session, setSession] = useState(loadSession());
  const navGo = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!session.user) { navGo('/login'); }
  }, [session, navGo]);

  if (!session.user) return null;

  const logout = () => {
    clearSession();
    setSession({ user: null, token: null });
    toast.push('info', '已退出登录');
    navGo('/');
  };

  return (
    <div className="console-shell" style={{ minHeight: '100vh', display: 'flex' }}>
      <aside className="console-side" style={{
        width: 232, flexShrink: 0, borderRight: '1px solid var(--line-subtle)', background: 'linear-gradient(180deg, rgba(19,23,27,.98), rgba(10,12,15,.98))',
        boxShadow: '12px 0 40px rgba(0,0,0,.18)', backdropFilter: 'blur(18px)',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line-subtle)' }}>
          <NavLink to="/"><Logo size={26} /></NavLink>
        </div>
        <nav style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
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
            <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--hz-black-600)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>
              {session.user.username.slice(0, 2).toUpperCase()}
            </span>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-hi)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{session.user.username}</div>
              <div className="faint mono" style={{ fontSize: 10.5 }}>{session.user.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-block" onClick={logout} style={{ justifyContent: 'center' }}><LogOut size={14} />退出登录</button>
        </div>
      </aside>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="console-topbar" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--line-subtle)', background: 'var(--bg-panel)' }}>
          <Logo size={24} />
          <span className="chip chip-accent">移动端菜单将在正式版启用抽屉</span>
        </div>
        <main style={{ flex: 1, padding: 'clamp(18px, 2.4vw, 38px)', background: 'radial-gradient(circle at 80% 0%, rgba(120,169,255,.035), transparent 32%)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
