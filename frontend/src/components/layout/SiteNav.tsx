import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Menu, UserPlus, X } from 'lucide-react';
import { Logo } from './Logo';
import { loadSession, clearSession } from '../../lib/api';
import { useToast } from '../ui/toast';

const links = [
  { to: '/#nodes', label: '全球节点' },
  { to: '/#plans', label: '套餐' },
  { to: '/#features', label: '特性' },
  { to: '/#faq', label: 'FAQ' },
];

export function SiteNav() {
  const [session, setSession] = useState(loadSession());
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const nav = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const logout = () => {
    clearSession();
    setSession({ user: null, token: null });
    toast.push('info', '已退出登录');
    nav('/');
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 80,
      background: scrolled ? 'rgba(5,7,10,.82)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--line-subtle)' : '1px solid transparent',
      transition: 'background var(--dur-med) var(--ease), border-color var(--dur-med) var(--ease)',
    }}>
      <nav className="container flex-between" style={{ height: 66 }}>
        <Link to="/" aria-label="HaizhuProxy home"><Logo /></Link>
        <div className="site-links flex-center" style={{ gap: 28 }}>
          {links.map(l => (
            <a key={l.to} href={l.to} style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-mid)', whiteSpace: 'nowrap' }}>{l.label}</a>
          ))}
        </div>
        <div className="site-cta flex-center" style={{ gap: 10 }}>
          {session.user ? (
            <>
              <Link to={session.user.role === 'admin' ? '/admin' : '/console'} className="btn btn-ghost btn-sm">控制台</Link>
              <button className="btn btn-ghost btn-sm" onClick={logout}>退出</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm site-login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><LogIn size={14} />登录</Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><UserPlus size={14} />注册</Link>
            </>
          )}
        </div>
        <button className="btn btn-ghost btn-icon site-burger" onClick={() => setOpen(o => !o)} aria-label="menu" aria-expanded={open}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>
      {open && (
        <div className="site-mobile-menu">
          {links.map(l => <a key={l.to} href={l.to} onClick={() => setOpen(false)} style={{ color: 'var(--fg-hi)' }}>{l.label}</a>)}
          <div className="flex" style={{ gap: 10 }}>
            {session.user ? (
              <>
                <Link to={session.user.role === 'admin' ? '/admin' : '/console'} className="btn btn-ghost btn-sm grow" onClick={() => setOpen(false)}>控制台</Link>
                <button className="btn btn-ghost btn-sm grow" onClick={logout}>退出</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm grow" onClick={() => setOpen(false)}>登录</Link>
                <Link to="/register" className="btn btn-primary btn-sm grow" onClick={() => setOpen(false)}>注册</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
