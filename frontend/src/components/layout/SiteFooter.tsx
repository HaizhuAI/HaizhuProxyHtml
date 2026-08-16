import { Link } from 'react-router-dom';
import { Globe2, Mail, Send } from 'lucide-react';
import { Logo } from './Logo';

export function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--line-subtle)', background: 'var(--bg-panel)', marginTop: 'auto' }}>
      <div className="container" style={{ paddingBlock: 48 }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 36 }}>
          <div className="flex-col" style={{ gap: 14 }}>
            <Logo />
            <p className="muted" style={{ fontSize: 13.5, maxWidth: 300 }}>
              全球代理节点分发平台 — 注册即得流量，卡密即充即用。高可用、低延迟、全协议支持。
            </p>
            <div className="flex" style={{ gap: 10 }}>
              <a href="#" aria-label="Telegram" className="btn btn-ghost btn-icon"><Send size={15} /></a>
              <a href="#" aria-label="Email" className="btn btn-ghost btn-icon"><Mail size={15} /></a>
              <a href="#" aria-label="Status" className="btn btn-ghost btn-icon"><Globe2 size={15} /></a>
            </div>
          </div>
          <div className="flex-col" style={{ gap: 8 }}>
            <div className="stat-label" style={{ marginBottom: 6 }}>产品</div>
            {['全球节点', '套餐定价', '卡密兑换', 'API 文档'].map(t => <a key={t} href="#" className="muted" style={{ fontSize: 13.5 }}>{t}</a>)}
          </div>
          <div className="flex-col" style={{ gap: 8 }}>
            <div className="stat-label" style={{ marginBottom: 6 }}>支持</div>
            {['帮助中心', '节点状态', 'Telegram 客服', '服务条款'].map(t => <a key={t} href="#" className="muted" style={{ fontSize: 13.5 }}>{t}</a>)}
          </div>
          <div className="flex-col" style={{ gap: 8 }}>
            <div className="stat-label" style={{ marginBottom: 6 }}>账户</div>
            <Link to="/login" className="muted" style={{ fontSize: 13.5 }}>登录</Link>
            <Link to="/register" className="muted" style={{ fontSize: 13.5 }}>注册 / 邀请码</Link>
            <Link to="/console" className="muted" style={{ fontSize: 13.5 }}>用户控制台</Link>
          </div>
        </div>
        <div className="flex-between flex-wrap" style={{ marginTop: 44, paddingTop: 22, borderTop: '1px solid var(--line-subtle)' }}>
          <span className="faint" style={{ fontSize: 12.5 }}>© 2026 HaizhuProxy · All rights reserved.</span>
          <span className="faint mono" style={{ fontSize: 11.5 }}>v1.0.0 · built for scale</span>
        </div>
      </div>
    </footer>
  );
}
