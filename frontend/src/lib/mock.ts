/* ============================================================
   Mock dataset — powers the frontend standalone until the API
   server is wired. Same shapes as backend contracts.
   ============================================================ */
import type { User, NodeRegion, ProxyNode, Cdk, ShopEntry, TelegramConfig, ApiKey, UsageSummary, InviteStats, DashboardStats, Plan, TrafficPoint } from './types';

export const REGIONS: NodeRegion[] = [
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', continent: 'Asia', latencyMs: 42, uptime: 99.98, protocols: ['vless', 'trojan', 'shadowsocks'] },
  { code: 'JP', name: 'Tokyo', flag: '🇯🇵', continent: 'Asia', latencyMs: 68, uptime: 99.95, protocols: ['vmess', 'vless', 'trojan'] },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', continent: 'Asia', latencyMs: 76, uptime: 99.97, protocols: ['vless', 'trojan'] },
  { code: 'KR', name: 'Seoul', flag: '🇰🇷', continent: 'Asia', latencyMs: 54, uptime: 99.90, protocols: ['vmess', 'vless'] },
  { code: 'US', name: 'Los Angeles', flag: '🇺🇸', continent: 'North America', latencyMs: 148, uptime: 99.93, protocols: ['vless', 'trojan', 'shadowsocks'] },
  { code: 'US-EWR', name: 'New Jersey', flag: '🇺🇸', continent: 'North America', latencyMs: 198, uptime: 99.91, protocols: ['vmess', 'vless', 'trojan'] },
  { code: 'DE', name: 'Frankfurt', flag: '🇩🇪', continent: 'Europe', latencyMs: 205, uptime: 99.96, protocols: ['vless', 'trojan'] },
  { code: 'GB', name: 'London', flag: '🇬🇧', continent: 'Europe', latencyMs: 218, uptime: 99.89, protocols: ['vless', 'shadowsocks'] },
  { code: 'NL', name: 'Amsterdam', flag: '🇳🇱', continent: 'Europe', latencyMs: 212, uptime: 99.94, protocols: ['vmess', 'vless', 'trojan'] },
  { code: 'FR', name: 'Paris', flag: '🇫🇷', continent: 'Europe', latencyMs: 224, uptime: 99.87, protocols: ['vless', 'trojan'] },
  { code: 'AU', name: 'Sydney', flag: '🇦🇺', continent: 'Oceania', latencyMs: 176, uptime: 99.92, protocols: ['vless', 'trojan'] },
  { code: 'BR', name: 'São Paulo', flag: '🇧🇷', continent: 'South America', latencyMs: 268, uptime: 99.85, protocols: ['vless'] },
  { code: 'ZA', name: 'Johannesburg', flag: '🇿🇦', continent: 'Africa', latencyMs: 289, uptime: 99.80, protocols: ['vless'] },
];

export const PLANS: Plan[] = [
  { id: 'p1', name: 'Starter', traffic: 10240, price: 12, durationDays: 30, features: ['10 GB 流量', '2 个并发设备', '全节点可用', '标准优先级'] },
  { id: 'p2', name: 'Pro', traffic: 51200, price: 35, durationDays: 30, features: ['50 GB 流量', '5 个并发设备', '全节点可用', '高优先级路由', 'Telegram 工单优先'], popular: true },
  { id: 'p3', name: 'Max', traffic: 204800, price: 99, durationDays: 30, features: ['200 GB 流量', '不限设备数', '全节点可用', '专属线路', 'API 访问'] },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'admin@haizhu.dev', username: 'operator', role: 'admin', inviteCode: 'HZ-ADMIN-01', balance: 204800, trafficUsed: 31820, createdAt: daysAgo(320), status: 'active' },
  { id: 'u2', email: 'neo@example.com', username: 'neo_wong', role: 'user', inviteCode: 'HZ-8F2A1C', invitedBy: 'HZ-ADMIN-01', balance: 40960, trafficUsed: 12730, createdAt: daysAgo(64), status: 'active' },
  { id: 'u3', email: 'trinity@example.com', username: 'trinity', role: 'user', inviteCode: 'HZ-77C0DE', invitedBy: 'HZ-8F2A1C', balance: 9216, trafficUsed: 512, createdAt: daysAgo(21), status: 'active' },
  { id: 'u4', email: 'tank@example.com', username: 'tank_runner', role: 'user', inviteCode: 'HZ-5E1D9B', invitedBy: 'HZ-8F2A1C', balance: 0, trafficUsed: 40960, createdAt: daysAgo(150), status: 'banned' },
];

export const MOCK_NODES: ProxyNode[] = [
  { id: 'n1', name: 'HK-01 · BGP', region: 'HK', host: 'hk01.haizhu.dev', port: 443, protocol: 'vless', tls: true, trafficIn: 48231, trafficOut: 51902, status: 'online', addedAt: daysAgo(120), network: 'tcp', path: '', sni: '', flow: '', security: 'tls', realityPbk: '', realitySid: '', },
  { id: 'n2', name: 'HK-02 · CN2', region: 'HK', host: 'hk02.haizhu.dev', port: 443, protocol: 'trojan', tls: true, trafficIn: 39102, trafficOut: 40771, status: 'online', addedAt: daysAgo(118), network: 'tcp', path: '', sni: '', flow: '', security: 'tls', realityPbk: '', realitySid: '', },
  { id: 'n3', name: 'JP-01 · IGP', region: 'JP', host: 'jp01.haizhu.dev', port: 443, protocol: 'vmess', tls: true, trafficIn: 27560, trafficOut: 28903, status: 'online', addedAt: daysAgo(96), network: 'tcp', path: '', sni: '', flow: '', security: 'tls', realityPbk: '', realitySid: '', },
  { id: 'n4', name: 'JP-02 · SoftBank', region: 'JP', host: 'jp02.haizhu.dev', port: 8443, protocol: 'vless', tls: true, trafficIn: 18802, trafficOut: 19940, status: 'degraded', note: '晚高峰限速', addedAt: daysAgo(90), network: 'tcp', path: '', sni: '', flow: '', security: 'tls', realityPbk: '', realitySid: '', },
  { id: 'n5', name: 'SG-01', region: 'SG', host: 'sg01.haizhu.dev', port: 443, protocol: 'trojan', tls: true, trafficIn: 15670, trafficOut: 16012, status: 'online', addedAt: daysAgo(80), network: 'tcp', path: '', sni: '', flow: '', security: 'tls', realityPbk: '', realitySid: '', },
  { id: 'n6', name: 'US-01 · LAX', region: 'US', host: 'us01.haizhu.dev', port: 443, protocol: 'vless', tls: true, trafficIn: 22031, trafficOut: 23110, status: 'online', addedAt: daysAgo(70), network: 'tcp', path: '', sni: '', flow: '', security: 'tls', realityPbk: '', realitySid: '', },
  { id: 'n7', name: 'US-02 · EWR', region: 'US-EWR', host: 'us02.haizhu.dev', port: 443, protocol: 'vmess', tls: true, trafficIn: 9612, trafficOut: 9844, status: 'online', addedAt: daysAgo(55), network: 'tcp', path: '', sni: '', flow: '', security: 'tls', realityPbk: '', realitySid: '', },
  { id: 'n8', name: 'DE-01 · Frankfurt', region: 'DE', host: 'de01.haizhu.dev', port: 443, protocol: 'vless', tls: true, trafficIn: 7420, trafficOut: 7691, status: 'online', addedAt: daysAgo(48), network: 'tcp', path: '', sni: '', flow: '', security: 'tls', realityPbk: '', realitySid: '', },
  { id: 'n9', name: 'GB-01 · London', region: 'GB', host: 'gb01.haizhu.dev', port: 443, protocol: 'shadowsocks', tls: false, trafficIn: 5021, trafficOut: 5290, status: 'offline', addedAt: daysAgo(40), network: 'tcp', path: '', sni: '', flow: '', security: 'tls', realityPbk: '', realitySid: '', },
  { id: 'n10', name: 'AU-01 · Sydney', region: 'AU', host: 'au01.haizhu.dev', port: 443, protocol: 'vless', tls: true, trafficIn: 3190, trafficOut: 3301, status: 'online', addedAt: daysAgo(30), network: 'tcp', path: '', sni: '', flow: '', security: 'tls', realityPbk: '', realitySid: '', },
];

export const MOCK_CDKS: Cdk[] = [
  { id: 'c1', code: 'HZ-9F3A-4B2C-7D1E', traffic: 20480, status: 'used', usedBy: 'neo_wong', usedAt: daysAgo(20), batch: 'B-2026-07', createdAt: daysAgo(40) },
  { id: 'c2', code: 'HZ-1C8D-9E0F-2A3B', traffic: 10240, status: 'used', usedBy: 'trinity', usedAt: daysAgo(12), batch: 'B-2026-07', createdAt: daysAgo(40) },
  { id: 'c3', code: 'HZ-5E7F-0A1B-8C9D', traffic: 51200, status: 'unused', batch: 'B-2026-08', createdAt: daysAgo(6) },
  { id: 'c4', code: 'HZ-2B3C-4D5E-6F70', traffic: 10240, status: 'unused', batch: 'B-2026-08', createdAt: daysAgo(6) },
  { id: 'c5', code: 'HZ-8A9B-0C1D-2E3F', traffic: 10240, status: 'revoked', batch: 'B-2026-07', createdAt: daysAgo(38) },
  { id: 'c6', code: 'HZ-4D5E-6F70-8A9B', traffic: 20480, status: 'expired', expiresAt: daysAgo(3), batch: 'B-2026-06', createdAt: daysAgo(60) },
];

export const MOCK_SHOPS: ShopEntry[] = [
  { id: 's1', name: '官方商城 · 国际站', url: 'https://shop.haizhu.dev', enabled: true, description: '主商城，支持 USDT / 信用卡 / 本地支付' },
  { id: 's2', name: '备用商城 · 镜像', url: 'https://mirror.haizhu.dev', enabled: true, description: '主商城不可达时使用' },
  { id: 's3', name: '旧版商城', url: 'https://legacy.haizhu.dev', enabled: false, description: '已下架，仅保留入口' },
];

export const MOCK_TG: TelegramConfig = {
  enabled: true,
  botToken: '********:MASKED',
  botUsername: '@HaizhuSupportBot',
  chatId: '-1002345678901',
  widgetTitle: 'Haizhu 客服',
  welcomeMessage: '你好，我是 HaizhuProxy 在线客服 🤖 下单 / 节点 / 卡密问题都可以直接问我。',
  placeholder: '输入消息，按 Enter 发送…',
};

export const MOCK_API_KEYS: ApiKey[] = [
  { id: 'k1', name: '生产网关', key: 'hz_live_****f3a2', scopes: ['nodes:read', 'traffic:read'], createdAt: daysAgo(90), lastUsed: daysAgo(1), enabled: true },
  { id: 'k2', name: '监控探针', key: 'hz_probe_****b7c1', scopes: ['traffic:read'], createdAt: daysAgo(45), lastUsed: daysAgo(2), enabled: true },
  { id: 'k3', name: '旧密钥', key: 'hz_old_****9d00', scopes: ['nodes:read'], createdAt: daysAgo(200), lastUsed: daysAgo(120), enabled: false },
];

function genSeries(days: number, baseIn: number, baseOut: number): TrafficPoint[] {
  const out: TrafficPoint[] = [];
  for (let i = days; i >= 0; i--) {
    const t = new Date(Date.now() - i * 86400000);
    const wave = 0.6 + 0.4 * Math.abs(Math.sin(i * 1.7));
    out.push({
      ts: t.toISOString().slice(0, 10),
      in: Math.round(baseIn * wave * (0.8 + Math.random() * 0.4)),
      out: Math.round(baseOut * wave * (0.8 + Math.random() * 0.4)),
    });
  }
  return out;
}

export const MOCK_USAGE: UsageSummary = {
  balance: 40960,
  used: 12730,
  total: 53690,
  activeNodes: 9,
  todayIn: 382,
  todayOut: 415,
  series: genSeries(14, 420, 460),
};

export const MOCK_INVITE: InviteStats = { code: 'HZ-8F2A1C', total: 3, active: 2, bonusPerInvite: 1024 };

export const MOCK_DASHBOARD: DashboardStats = {
  users: 1284,
  nodes: 42,
  onlineNodes: 39,
  cdksIssued: 9830,
  cdksUsed: 7214,
  trafficToday: 120842,
  revenueRef: 88231,
};

export const genCdkCodes = (n: number): string[] =>
  Array.from({ length: n }, () => {
    const seg = () => Math.random().toString(16).slice(2, 6).toUpperCase().padEnd(4, '0');
    return `HZ-${seg()}-${seg()}-${seg()}`;
  });
