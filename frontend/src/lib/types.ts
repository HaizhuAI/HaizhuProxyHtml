/* ============================================================
   HaizhuProxy — Domain types (mirror of backend contracts)
   ============================================================ */

export type Role = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  inviteCode: string;
  invitedBy?: string;
  balance: number;            // 流量余额 (MB)
  trafficUsed: number;        // 已用 (MB)
  createdAt: string;
  status: 'active' | 'banned';
}

export interface Plan {
  id: string;
  name: string;
  traffic: number;            // MB
  price: number;              // 参考价
  durationDays: number;
  features: string[];
  popular?: boolean;
}

export interface NodeRegion {
  code: string;               // HK / US / JP ...
  name: string;
  flag: string;               // emoji flag
  continent: 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania' | 'Africa';
  latencyMs: number;
  uptime: number;             // %
  protocols: string[];        // vmess / vless / trojan / shadowsocks
}

export interface ProxyNode {
  id: string;
  name: string;
  region: string;             // region code
  host: string;
  port: number;
  protocol: 'vmess' | 'vless' | 'trojan' | 'shadowsocks';
  tls: boolean;
  network: 'tcp' | 'ws' | 'grpc';
  path: string;               // ws path / grpc serviceName
  sni: string;                // SNI / ws host
  flow: string;               // e.g. xtls-rprx-vision
  security: 'none' | 'tls' | 'reality';
  realityPbk: string;
  realitySid: string;
  trafficIn: number;          // MB
  trafficOut: number;         // MB
  status: 'online' | 'degraded' | 'offline';
  note?: string;
  addedAt: string;
}

export interface ProbeResult {
  nodeId: string;
  name: string;
  host: string;
  port: number;
  latencyMs: number | null;
  reachable: boolean;
}

export interface Cdk {
  id: string;
  code: string;
  traffic: number;            // MB
  status: 'unused' | 'used' | 'revoked' | 'expired';
  usedBy?: string;
  usedAt?: string;
  expiresAt?: string;
  batch?: string;
  createdAt: string;
}

export interface ShopEntry {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  description?: string;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;           // masked in UI
  botUsername: string;
  chatId: string;
  widgetTitle: string;
  welcomeMessage: string;
  placeholder: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;                // masked
  scopes: string[];
  createdAt: string;
  lastUsed?: string;
  enabled: boolean;
}

export interface TrafficPoint {
  ts: string;
  in: number;                 // MB
  out: number;                // MB
}

export interface UsageSummary {
  balance: number;            // MB
  used: number;               // MB
  total: number;              // MB
  activeNodes: number;
  todayIn: number;
  todayOut: number;
  series: TrafficPoint[];
}

export interface InviteStats {
  code: string;
  total: number;
  active: number;
  bonusPerInvite: number;     // MB
}

export interface DashboardStats {
  users: number;
  nodes: number;
  onlineNodes: number;
  cdksIssued: number;
  cdksUsed: number;
  trafficToday: number;       // MB
  revenueRef: number;         // 参考流水
}

export interface ApiResult<T> { data: T | null; error: string | null; }

export interface Session { user: User | null; token: string | null; }

export interface SmtpConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;       // masked when loaded; keep as-is to preserve
  passwordMasked: string;
  sender: string;
  useTls: boolean;
  useSsl: boolean;
}

export interface ConsoleNodesData {
  nodes: ProxyNode[];
  subUrl: string;         // relative /api/sub/{token}/v2ray
  clashUrl: string;       // relative /api/sub/{token}/clash
}

export interface TrafficItem {
  ts: string;
  nodeName: string;
  bytesIn: number;
  bytesOut: number;
}

export interface TrafficPage {
  total: number;
  items: TrafficItem[];
}

export interface ImportResult {
  created: ProxyNode[];
  failed: { line: string; reason: string }[];
}
