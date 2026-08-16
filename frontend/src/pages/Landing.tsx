import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPublicShops } from '../lib/api';
import {
  ArrowRight, BadgeCheck, ChevronDown, Gauge, Globe2, KeyRound, Radio, ShieldCheck, TerminalSquare, UserPlus, Zap,
} from 'lucide-react';
import { REGIONS, PLANS, MOCK_DASHBOARD } from '../lib/mock';
import { Card, Chip, Reveal } from '../components/ui/ui';
import { fmtNum } from '../lib/utils';

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="hero-section" style={{ position: 'relative', overflow: 'hidden', paddingTop: 72, paddingBottom: 48 }}>
      <div className="bg-grid" style={{ position: 'absolute', inset: 0, maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)' }} />
      <div style={{ position: 'absolute', top: -180, left: '50%', transform: 'translateX(-50%)', width: 720, height: 440, background: 'radial-gradient(ellipse, rgba(63,217,180,.13), transparent 65%)', pointerEvents: 'none' }} />
      <div className="container" style={{ position: 'relative' }}>
        <div className="flex-center" style={{ justifyContent: 'center', marginBottom: 22 }}>
          <Chip tone="accent"><span className="dot" />全球 {REGIONS.length} 地区在线 · 可用性 99.9%+</Chip>
        </div>
        <h1 className="display-xl" style={{ textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
          全球节点，<span className="accent-text glow-text">即充即用</span><br />一张卡密接入世界
        </h1>
        <p className="lede" style={{ textAlign: 'center', margin: '22px auto 0' }}>
          HaizhuProxy 提供多协议、多地区的优质代理节点。注册即送体验流量，商城购买卡密秒到账，
          控制台一键兑换，流量实时监控，余额透明可控。
        </p>
        <div className="flex-center" style={{ marginTop: 34, gap: 12 }}>
          <Link to="/register" className="btn btn-primary btn-lg"><UserPlus size={17} />免费注册</Link>
          <a href="#plans" className="btn btn-outline btn-lg">查看套餐 <ArrowRight size={16} /></a>
        </div>

        {/* Hero visual — live ops panel */}
        <Reveal>
          <Card style={{ marginTop: 56, overflow: 'hidden', borderColor: 'var(--line-strong)' }}>
            <div className="flex-between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-subtle)', background: 'var(--bg-panel-2)' }}>
              <div className="flex" style={{ gap: 10, alignItems: 'center' }}>
                <span className="dot pulse-dot" style={{ color: 'var(--ok)' }} />
                <span className="mono" style={{ fontSize: 12, color: 'var(--fg-mid)' }}>edge.haizhu.dev — 实时节点遥测</span>
              </div>
              <div className="flex" style={{ gap: 6 }}>
                {['HK', 'JP', 'US', 'DE'].map(c => <span key={c} className="chip chip-accent" style={{ fontSize: 10 }}>{c}</span>)}
              </div>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {REGIONS.slice(0, 6).map((r, i) => (
                <div key={r.code} className="panel" style={{ padding: 14, borderColor: 'var(--line-subtle)', background: 'var(--bg-panel-2)', animation: `rise var(--dur-slow) var(--ease) ${i * 90}ms both` }}>
                  <div className="flex-between">
                    <span style={{ fontSize: 20 }}>{r.flag}</span>
                    <span className="chip chip-ok" style={{ fontSize: 9.5 }}>{r.uptime}%</span>
                  </div>
                  <div style={{ marginTop: 10, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--fg-hi)' }}>{r.name}</div>
                  <div className="mono" style={{ marginTop: 4, fontSize: 11.5, color: 'var(--fg-low)' }}>{r.code} · {r.latencyMs}ms · {r.protocols.join(' / ')}</div>
                </div>
              ))}
              <div className="flex-center" style={{ flexDirection: 'column', minHeight: 108, border: '1px dashed var(--line-strong)', borderRadius: 'var(--radius-card)' }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>+{REGIONS.length - 6} 更多节点</span>
                <span className="faint" style={{ fontSize: 11, marginTop: 4 }}>控制台内全量可用</span>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Trust strip ---------------- */
function TrustStrip() {
  const stats = [
    { v: fmtNum(MOCK_DASHBOARD.users), l: '注册用户' },
    { v: String(MOCK_DASHBOARD.nodes), l: '在线节点' },
    { v: '99.9%', l: '服务可用性' },
    { v: fmtNum(MOCK_DASHBOARD.cdksUsed), l: '卡密已兑换' },
  ];
  return (
    <section className="section-tight" style={{ borderTop: '1px solid var(--line-subtle)', borderBottom: '1px solid var(--line-subtle)', background: 'var(--bg-panel)' }}>
      <div className="container grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24 }}>
        {stats.map((s, i) => (
          <Reveal key={s.l} delay={i * 70}>
            <div style={{ textAlign: 'center' }}>
              <div className="stat-value" style={{ fontSize: 30 }}>{s.v}</div>
              <div className="stat-label" style={{ marginTop: 4 }}>{s.l}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Nodes ---------------- */
function Nodes() {
  return (
    <section id="nodes" className="section" style={{ scrollMarginTop: 70 }}>
      <div className="container">
        <Reveal>
          <div className="eyebrow">全球节点 · Global Edge</div>
          <h2 className="display-lg" style={{ marginTop: 10 }}>一张卡密，解锁全球线路</h2>
          <p className="lede" style={{ marginTop: 12 }}>覆盖三大洲核心区域，全协议支持（Vless / Vmess / Trojan / Shadowsocks），晚高峰智能路由，延迟与可用性实时可见。</p>
        </Reveal>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', marginTop: 36 }}>
          {REGIONS.map((r, i) => (
            <Reveal key={r.code} delay={Math.min(i, 6) * 60}>
              <Card hover style={{ padding: 18 }}>
                <div className="flex-between">
                  <div className="flex" style={{ alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{r.flag}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--fg-hi)', fontSize: 14.5 }}>{r.name}</div>
                      <div className="faint mono" style={{ fontSize: 10.5 }}>{r.continent}</div>
                    </div>
                  </div>
                  <Chip tone={r.uptime > 99.9 ? 'ok' : 'default'} dot>{r.uptime}%</Chip>
                </div>
                <div className="flex" style={{ marginTop: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="flex" style={{ gap: 6, alignItems: 'center', color: 'var(--fg-low)' }}>
                    <Gauge size={13} /><span className="mono" style={{ fontSize: 12 }}>{r.latencyMs} ms</span>
                  </div>
                  <div className="flex" style={{ gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {r.protocols.map(p => <span key={p} className="chip" style={{ fontSize: 9.5, padding: '2px 7px' }}>{p}</span>)}
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Features ---------------- */
const FEATURES = [
  { icon: KeyRound, title: '卡密即充即用', desc: '商城购买 → 邮箱收卡密 → 控制台一键兑换，全程秒级到账，无需人工发卡。' },
  { icon: Globe2, title: '全协议接入', desc: 'Vless / Vmess / Trojan / Shadowsocks 全覆盖，主流客户端开箱即用，支持订阅链接。' },
  { icon: Gauge, title: '流量实时监控', desc: '每节点进出流量按小时计量，控制台可视化图表，余额用完自动熔断，绝不超额。' },
  { icon: Radio, title: '智能路由', desc: '多地区 BGP / CN2 / IGP 线路，晚高峰自动调度，延迟与丢包持续探测。' },
  { icon: UserPlus, title: '邀请返利', desc: '邀请好友注册，双方均得流量奖励，邀请关系链透明可查。' },
  { icon: TerminalSquare, title: '开放 API', desc: '节点列表、流量查询、卡密校验全部开放 API，适合二次开发与自动化运维。' },
];

function Features() {
  return (
    <section id="features" className="section" style={{ scrollMarginTop: 70, background: 'var(--bg-panel)', borderTop: '1px solid var(--line-subtle)', borderBottom: '1px solid var(--line-subtle)' }}>
      <div className="container">
        <Reveal>
          <div className="eyebrow">平台能力 · Capabilities</div>
          <h2 className="display-lg" style={{ marginTop: 10 }}>为运营者与用户双端设计</h2>
        </Reveal>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: 36, gap: 16 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={Math.min(i, 5) * 60}>
              <Card hover style={{ padding: 22, height: '100%' }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(63,217,180,.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <f.icon size={19} style={{ color: 'var(--accent)' }} />
                </span>
                <div style={{ fontWeight: 600, color: 'var(--fg-hi)', fontSize: 15.5 }}>{f.title}</div>
                <p className="muted" style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.65 }}>{f.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
const STEPS = [
  { n: '01', t: '注册账户', d: '邮箱 + 邀请码注册，新用户赠送体验流量。' },
  { n: '02', t: '商城购买卡密', d: '官方商城按需购买流量套餐，付款后卡密自动发送至邮箱。' },
  { n: '03', t: '兑换并接入', d: '控制台输入卡密 → 流量到账 → 选择地区节点，一键复制订阅链接。' },
];

function HowItWorks() {
  return (
    <section className="section">
      <div className="container">
        <Reveal><div className="eyebrow">三步上手 · Getting Started</div></Reveal>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 32, gap: 20 }}>
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <Card hover style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                <span style={{ position: 'absolute', right: 14, top: 8, fontFamily: 'var(--font-display)', fontSize: 58, fontWeight: 700, color: 'rgba(63,217,180,.08)' }}>{s.n}</span>
                <Chip tone="accent" style={{ marginBottom: 14 }}>STEP {s.n}</Chip>
                <div style={{ fontWeight: 600, color: 'var(--fg-hi)', fontSize: 16 }}>{s.t}</div>
                <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>{s.d}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Plans ---------------- */
function Plans() {
  const [shopUrl, setShopUrl] = useState('');
  useEffect(() => { apiPublicShops().then(r => { if (r.data && r.data.length) setShopUrl(r.data.find(x => x.enabled)?.url ?? ''); }); }, []);
  return (
    <section id="plans" className="section" style={{ scrollMarginTop: 70, background: 'var(--bg-panel)', borderTop: '1px solid var(--line-subtle)', borderBottom: '1px solid var(--line-subtle)' }}>
      <div className="container">
        <Reveal>
          <div className="eyebrow">流量套餐 · Plans</div>
          <h2 className="display-lg" style={{ marginTop: 10 }}>按需付费，无隐藏成本</h2>
          <p className="lede" style={{ marginTop: 12 }}>商城购买后以卡密形式交付，余额实时到账。以下为参考价，以商城实时价格为准。</p>
        </Reveal>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: 36, gap: 20, alignItems: 'stretch' }}>
          {PLANS.map((p, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <Card hover style={{ padding: 26, height: '100%', position: 'relative', borderColor: p.popular ? 'rgba(63,217,180,.5)' : undefined, boxShadow: p.popular ? 'var(--shadow-glow)' : undefined }}>
                {p.popular && <Chip tone="accent" style={{ position: 'absolute', top: -11, left: 26 }}>最受欢迎</Chip>}
                <div className="flex-between">
                  <div style={{ fontWeight: 700, color: 'var(--fg-hi)', fontSize: 17, fontFamily: 'var(--font-display)' }}>{p.name}</div>
                  <BadgeCheck size={17} style={{ color: p.popular ? 'var(--accent)' : 'var(--fg-faint)' }} />
                </div>
                <div style={{ marginTop: 16 }}>
                  <span className="stat-value" style={{ fontSize: 38 }}>¥{p.price}</span>
                  <span className="muted" style={{ fontSize: 13 }}> / {p.durationDays} 天</span>
                </div>
                <div className="mono" style={{ marginTop: 4, fontSize: 12, color: 'var(--fg-low)' }}>{p.traffic / 1024} GB 流量</div>
                <hr className="divider" style={{ margin: '18px 0' }} />
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map(f => (
                    <li key={f} className="flex" style={{ gap: 9, alignItems: 'flex-start', fontSize: 13.5, color: 'var(--fg-mid)' }}>
                      <Zap size={14} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                {shopUrl ? (
                  <a href={shopUrl} target="_blank" rel="noreferrer" className={`btn ${p.popular ? 'btn-primary' : 'btn-outline'} btn-block`} style={{ marginTop: 22 }}>
                    购买 {p.name} <ArrowRight size={15} />
                  </a>
                ) : (
                  <Link to="/register" className={`btn ${p.popular ? 'btn-primary' : 'btn-outline'} btn-block`} style={{ marginTop: 22 }}>
                    购买 {p.name} <ArrowRight size={15} />
                  </Link>
                )}
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
const FAQS = [
  { q: '卡密是什么？怎么使用？', a: '卡密（CDK）是流量充值凭证，在官方商城购买后发送到你的邮箱。登录控制台 → 卡密兑换，输入 HZ- 开头的卡密即可将对应流量充入账户余额。' },
  { q: '支持哪些协议和客户端？', a: '支持 Vless、Vmess、Trojan、Shadowsocks 四种协议，兼容 v2rayN、Nekobox、Shadowrocket、Clash 等主流客户端，控制台可一键复制订阅链接。' },
  { q: '流量如何计费？用完会怎样？', a: '流量按节点进出合计计量，控制台实时显示余额与用量。余额用尽后自动断开连接，不会产生超额扣费，充值后续用。' },
  { q: '邀请好友有什么奖励？', a: '邀请好友注册并完成首次兑换后，双方各获得 1 GB 体验流量奖励，邀请关系与奖励记录在控制台可查。' },
  { q: '节点不稳定怎么办？', a: '每个节点都有实时延迟与可用性探测，可在控制台切换线路。高峰期建议使用 HK / JP 低延迟线路，也可通过 Telegram 客服反馈。' },
  { q: '商城无法访问怎么办？', a: '我们提供多个商城镜像入口，官网导航栏与后台配置均可切换。也可通过 Telegram Bot 直接联系客服获取最新商城地址。' },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="section" style={{ scrollMarginTop: 70 }}>
      <div className="container" style={{ maxWidth: 820 }}>
        <Reveal><div className="eyebrow">常见问题 · FAQ</div></Reveal>
        <h2 className="display-lg" style={{ marginTop: 10 }}>你可能想问</h2>
        <div className="flex-col" style={{ marginTop: 30, gap: 10 }}>
          {FAQS.map((f, i) => (
            <Card key={i} style={{ padding: 0, overflow: 'hidden' }}>
              <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex-between"
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', textAlign: 'left', color: 'var(--fg-hi)', fontFamily: 'var(--font-body)', fontSize: 14.5, fontWeight: 600 }}>
                {f.q}
                <ChevronDown size={17} style={{ color: 'var(--accent)', transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-fast) var(--ease)' }} />
              </button>
              {open === i && (
                <div style={{ padding: '0 20px 18px', color: 'var(--fg-mid)', fontSize: 13.5, lineHeight: 1.7, animation: 'fadeIn var(--dur-med) var(--ease)' }}>
                  {f.a}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function Cta() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <Reveal>
          <div className="panel flex-center" style={{ flexDirection: 'column', padding: '56px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', borderColor: 'rgba(63,217,180,.35)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(63,217,180,.1), transparent 70%)' }} />
            <div style={{ position: 'relative' }}>
              <ShieldCheck size={30} style={{ color: 'var(--accent)', margin: '0 auto 16px' }} />
              <h2 className="display-md">现在注册，送体验流量</h2>
              <p className="lede" style={{ margin: '12px auto 0' }}>60 秒完成注册，即刻解锁全球节点。有邀请码输入邀请码，双方得奖励。</p>
              <div className="flex-center" style={{ marginTop: 26, gap: 12 }}>
                <Link to="/register" className="btn btn-primary btn-lg">免费注册 <ArrowRight size={16} /></Link>
                <Link to="/login" className="btn btn-ghost btn-lg">已有账户，登录</Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */
export default function Landing() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Nodes />
      <Features />
      <HowItWorks />
      <Plans />
      <Faq />
      <Cta />
    </>
  );
}
