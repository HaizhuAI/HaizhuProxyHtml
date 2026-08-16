/* ============================================================
   API client — dual mode:
     VITE_DEMO=1 (default) → mock adapter (standalone demo)
     VITE_DEMO=0           → real HTTP client against /api
   Same function signatures; pages never know the difference.
   ============================================================ */
import type {
  ApiResult, Session, User, UsageSummary, InviteStats, DashboardStats,
  ProxyNode, Cdk, ShopEntry, TelegramConfig, ApiKey, SmtpConfig, ConsoleNodesData, ProbeResult, TrafficPage, ImportResult,
} from './types';
import * as mock from './mock';

const DEMO = (import.meta.env.VITE_DEMO ?? '1') !== '0';

/* ============================ session store ============================ */
const SESSION_KEY = 'haizhu.session';
export const loadSession = (): Session => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') || { user: null, token: null }; }
  catch { return { user: null, token: null }; }
};
export const saveSession = (s: Session) => localStorage.setItem(SESSION_KEY, JSON.stringify(s));
export const clearSession = () => localStorage.removeItem(SESSION_KEY);

/* ============================ http core ============================ */
async function http<T>(method: string, path: string, body?: unknown, auth = true): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const session = loadSession();
  if (auth && session.token) headers.Authorization = `Bearer ${session.token}`;
  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 401 || res.status === 403) {
      if (auth) clearSession();
    }
    if (res.status === 204) return { data: null as unknown as T, error: null };
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: json.detail ?? `HTTP ${res.status}` };
    return { data: json as T, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : '网络错误' };
  }
}

/* ============================ adapters ============================ */
interface RawUser { id: string; email: string; username: string; role: string; invite_code: string; invited_by: string | null; balance_mb: number; traffic_used_mb: number; status: string; created_at: string }
const toUser = (u: RawUser): User => ({
  id: u.id, email: u.email, username: u.username, role: u.role as User['role'],
  inviteCode: u.invite_code, invitedBy: u.invited_by ?? undefined,
  balance: u.balance_mb, trafficUsed: u.traffic_used_mb, createdAt: u.created_at, status: u.status as User['status'],
});
interface RawNode { id: string; name: string; region: string; host: string; port: number; protocol: string; tls: boolean; network: string; path: string; sni: string; flow: string; security: string; reality_pbk: string; reality_sid: string; traffic_in_mb: number; traffic_out_mb: number; status: string; note: string | null; added_at: string }
const toNode = (n: RawNode): ProxyNode => ({
  id: n.id, name: n.name, region: n.region, host: n.host, port: n.port,
  protocol: n.protocol as ProxyNode['protocol'], tls: n.tls,
  network: (n.network || 'tcp') as ProxyNode['network'],
  path: n.path ?? '', sni: n.sni ?? '', flow: n.flow ?? '',
  security: (n.security || 'tls') as ProxyNode['security'],
  realityPbk: n.reality_pbk ?? '', realitySid: n.reality_sid ?? '',
  trafficIn: n.traffic_in_mb, trafficOut: n.traffic_out_mb,
  status: n.status as ProxyNode['status'], note: n.note ?? undefined, addedAt: n.added_at,
});
interface RawCdk { id: string; code: string; traffic_mb: number; status: string; used_by: string | null; used_at: string | null; expires_at: string | null; batch: string | null; created_at: string }
const toCdk = (c: RawCdk): Cdk => ({
  id: c.id, code: c.code, traffic: c.traffic_mb, status: c.status as Cdk['status'],
  usedBy: c.used_by ?? undefined, usedAt: c.used_at ?? undefined, expiresAt: c.expires_at ?? undefined,
  batch: c.batch ?? undefined, createdAt: c.created_at,
});
interface RawShop { id: string; name: string; url: string; enabled: boolean; description: string | null }
const toShop = (s: RawShop): ShopEntry => ({ id: s.id, name: s.name, url: s.url, enabled: s.enabled, description: s.description ?? undefined });
interface RawTg { enabled: boolean; bot_token_masked: string; bot_username: string; chat_id: string; widget_title: string; welcome_message: string; placeholder: string }
const toTg = (t: RawTg): TelegramConfig => ({
  enabled: t.enabled, botToken: t.bot_token_masked, botUsername: t.bot_username, chatId: t.chat_id,
  widgetTitle: t.widget_title, welcomeMessage: t.welcome_message, placeholder: t.placeholder,
});
interface RawKey { id: string; name: string; key: string; scopes: string[]; enabled: boolean; created_at: string; last_used_at: string | null }
const toKey = (k: RawKey): ApiKey => ({
  id: k.id, name: k.name, key: k.key, scopes: k.scopes, enabled: k.enabled,
  createdAt: k.created_at, lastUsed: k.last_used_at ?? undefined,
});

/* ============================ auth ============================ */
export async function apiLogin(email: string, password: string): Promise<ApiResult<Session>> {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 420));
    const u = mock.MOCK_USERS.find(x => x.email === email);
    if (!u || password.length < 6) return { data: null, error: '邮箱或密码不正确' };
    const s: Session = { user: u, token: `hz_mock_${u.id}` };
    saveSession(s);
    return { data: s, error: null };
  }
  const r = await http<{ token: string; user: RawUser }>('POST', '/auth/login', { email, password });
  if (r.error || !r.data) return { data: null, error: r.error };
  const s: Session = { token: r.data.token, user: toUser(r.data.user) };
  saveSession(s);
  return { data: s, error: null };
}

export async function apiRegister(payload: { email: string; username: string; password: string; inviteCode: string }): Promise<ApiResult<Session>> {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 520));
    if (mock.MOCK_USERS.some(x => x.email === payload.email)) return { data: null, error: '该邮箱已被注册' };
    if (payload.inviteCode && payload.inviteCode !== 'HZ-8F2A1C') return { data: null, error: '邀请码无效' };
    const u: User = {
      id: `u${Date.now()}`, email: payload.email, username: payload.username || payload.email.split('@')[0],
      role: 'user', inviteCode: 'HZ-' + Math.random().toString(16).slice(2, 8).toUpperCase(),
      invitedBy: payload.inviteCode || undefined, balance: payload.inviteCode ? 1024 : 0, trafficUsed: 0,
      createdAt: new Date().toISOString(), status: 'active',
    };
    const s: Session = { user: u, token: `hz_mock_${u.id}` };
    saveSession(s);
    return { data: s, error: null };
  }
  const r = await http<{ token: string; user: RawUser }>('POST', '/auth/register', {
    email: payload.email, username: payload.username, password: payload.password, invite_code: payload.inviteCode,
  });
  if (r.error || !r.data) return { data: null, error: r.error };
  const s: Session = { token: r.data.token, user: toUser(r.data.user) };
  saveSession(s);
  return { data: s, error: null };
}

/* ============================ console ============================ */
export async function apiUsage(): Promise<ApiResult<UsageSummary>> {
  if (DEMO) return { data: mock.MOCK_USAGE, error: null };
  const r = await http<any>('GET', '/console/usage');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: {
    balance: r.data.balance, used: r.data.used, total: r.data.total,
    activeNodes: r.data.active_nodes, todayIn: r.data.today_in, todayOut: r.data.today_out,
    series: r.data.series.map((p: any) => ({ ts: p.ts, in: p.in, out: p.out })),
  }, error: null };
}

export async function apiInvite(): Promise<ApiResult<InviteStats>> {
  if (DEMO) return { data: mock.MOCK_INVITE, error: null };
  const r = await http<any>('GET', '/console/invite');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: { code: r.data.code, total: r.data.total, active: r.data.active, bonusPerInvite: r.data.bonus_per_invite }, error: null };
}

export async function apiRedeem(code: string): Promise<ApiResult<{ added: number; balance: number }>> {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 600));
    if (!/^HZ-/.test(code.trim().toUpperCase())) return { data: null, error: '卡密格式不正确（应以 HZ- 开头）' };
    return { data: { added: 10240, balance: mock.MOCK_USAGE.balance + 10240 }, error: null };
  }
  const r = await http<any>('POST', '/console/redeem', { code });
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: { added: r.data.added, balance: r.data.balance }, error: null };
}

export async function apiMyNodes(): Promise<ApiResult<ConsoleNodesData>> {
  if (DEMO) return { data: {
    nodes: mock.MOCK_NODES.filter(n => n.status !== 'offline'),
    subUrl: 'https://sub.haizhu.dev/api/v1/client/subscribe?token=DEMO',
    clashUrl: 'https://sub.haizhu.dev/api/v1/client/subscribe?token=DEMO&flag=clash',
  }, error: null };
  const r = await http<any>('GET', '/console/nodes');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: { nodes: r.data.nodes.map(toNode), subUrl: r.data.sub_url, clashUrl: r.data.clash_url }, error: null };
}

export async function apiUpdateProfile(p: Partial<User> & { password?: string }): Promise<ApiResult<User>> {
  if (DEMO) { await new Promise(r => setTimeout(r, 400)); return { data: { ...mock.MOCK_USERS[1], ...p }, error: null }; }
  const r = await http<RawUser>('PATCH', '/console/profile', { username: p.username, password: p.password ?? undefined });
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: toUser(r.data), error: null };
}

/* ============================ admin ============================ */
export async function apiDashboard(): Promise<ApiResult<DashboardStats>> {
  if (DEMO) return { data: mock.MOCK_DASHBOARD, error: null };
  const r = await http<any>('GET', '/admin/dashboard');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: {
    users: r.data.users, nodes: r.data.nodes, onlineNodes: r.data.online_nodes,
    cdksIssued: r.data.cdks_issued, cdksUsed: r.data.cdks_used,
    trafficToday: r.data.traffic_today_mb, revenueRef: r.data.revenue_ref,
  }, error: null };
}

export async function apiAllNodes(): Promise<ApiResult<ProxyNode[]>> {
  if (DEMO) return { data: mock.MOCK_NODES, error: null };
  const r = await http<RawNode[]>('GET', '/admin/nodes');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: r.data.map(toNode), error: null };
}

export async function apiCreateNode(n: Partial<ProxyNode>): Promise<ApiResult<ProxyNode>> {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 500));
    return { data: { id: `n${Date.now()}`, addedAt: new Date().toISOString(), trafficIn: 0, trafficOut: 0, status: 'online', ...n } as ProxyNode, error: null };
  }
  const r = await http<RawNode>('POST', '/admin/nodes', {
    name: n.name, region: n.region, host: n.host, port: n.port, protocol: n.protocol, tls: n.tls, note: n.note,
  });
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: toNode(r.data), error: null };
}

export async function apiAllCdks(): Promise<ApiResult<Cdk[]>> {
  if (DEMO) return { data: mock.MOCK_CDKS, error: null };
  const r = await http<RawCdk[]>('GET', '/admin/cdks');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: r.data.map(toCdk), error: null };
}

export async function apiGenerateCdks(count: number, traffic: number, expiresInDays?: number, sendToEmail?: boolean, recipientEmail?: string): Promise<ApiResult<Cdk[]>> {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 700));
    return { data: mock.genCdkCodes(count).map((code, i) => ({
      id: `c${Date.now()}-${i}`, code, traffic, status: 'unused' as const,
      batch: `B-${new Date().toISOString().slice(0, 7)}`, createdAt: new Date().toISOString(),
    })), error: null };
  }
  const r = await http<RawCdk[]>('POST', '/admin/cdks/generate', {
    count, traffic_mb: traffic, expires_days: expiresInDays ?? 0,
    send_to_email: sendToEmail ?? false, recipient_email: recipientEmail ?? null,
  });
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: r.data.map(toCdk), error: null };
}

export async function apiRevokeCdk(id: string): Promise<ApiResult<Cdk>> {
  if (DEMO) { await new Promise(r => setTimeout(r, 300)); return { data: null, error: '演示模式' }; }
  const r = await http<RawCdk>('POST', `/admin/cdks/${id}/revoke`);
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: toCdk(r.data), error: null };
}

export async function apiShops(): Promise<ApiResult<ShopEntry[]>> {
  if (DEMO) return { data: mock.MOCK_SHOPS, error: null };
  const r = await http<RawShop[]>('GET', '/admin/shops');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: r.data.map(toShop), error: null };
}

export async function apiPublicShops(): Promise<ApiResult<ShopEntry[]>> {
  if (DEMO) return { data: mock.MOCK_SHOPS.filter(s => s.enabled), error: null };
  const r = await http<RawShop[]>('GET', '/public/shops', undefined, false);
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: r.data.map(toShop), error: null };
}

export async function apiCreateShop(shop: { name: string; url: string; description?: string }): Promise<ApiResult<ShopEntry>> {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 400));
    return { data: { id: `s${Date.now()}`, name: shop.name, url: shop.url, description: shop.description, enabled: true }, error: null };
  }
  const r = await http<RawShop>('POST', '/admin/shops', { name: shop.name, url: shop.url, enabled: true, description: shop.description ?? null });
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: toShop(r.data), error: null };
}

export async function apiUpdateShop(id: string, patch: Partial<ShopEntry>): Promise<ApiResult<ShopEntry>> {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 300));
    return { data: { id, name: patch.name ?? '', url: patch.url ?? '', description: patch.description, enabled: patch.enabled ?? false }, error: null };
  }
  const r = await http<RawShop>('PATCH', `/admin/shops/${id}`, { name: patch.name, url: patch.url, enabled: patch.enabled, description: patch.description ?? null });
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: toShop(r.data), error: null };
}

export async function apiDeleteShop(id: string): Promise<ApiResult<null>> {
  if (DEMO) { await new Promise(r => setTimeout(r, 300)); return { data: null, error: null }; }
  return http<null>('DELETE', `/admin/shops/${id}`);
}

export async function apiTelegram(): Promise<ApiResult<TelegramConfig>> {
  if (DEMO) return { data: mock.MOCK_TG, error: null };
  const r = await http<RawTg>('GET', '/admin/telegram');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: toTg(r.data), error: null };
}

export async function apiSaveTelegram(cfg: TelegramConfig): Promise<ApiResult<TelegramConfig>> {
  if (DEMO) { await new Promise(r => setTimeout(r, 450)); return { data: cfg, error: null }; }
  const r = await http<RawTg>('POST', '/admin/telegram', {
    enabled: cfg.enabled, bot_token: cfg.botToken, bot_username: cfg.botUsername, chat_id: cfg.chatId,
    widget_title: cfg.widgetTitle, welcome_message: cfg.welcomeMessage, placeholder: cfg.placeholder,
  });
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: toTg(r.data), error: null };
}

export async function apiTestBot(): Promise<ApiResult<{ delivered: boolean; message: string }>> {
  if (DEMO) { await new Promise(r => setTimeout(r, 800)); return { data: { delivered: true, message: '测试消息已发送（演示）' }, error: null }; }
  const r = await http<any>('POST', '/admin/telegram/test');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: { delivered: r.data.delivered, message: r.data.message }, error: null };
}

export async function apiApiKeys(): Promise<ApiResult<ApiKey[]>> {
  if (DEMO) return { data: mock.MOCK_API_KEYS, error: null };
  const r = await http<RawKey[]>('GET', '/admin/api-keys');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: r.data.map(toKey), error: null };
}

export async function apiCreateApiKey(name: string, scopes: string[]): Promise<ApiResult<{ key: string }>> {
  if (DEMO) { await new Promise(r => setTimeout(r, 400)); return { data: { key: `hz_demo_${Math.random().toString(36).slice(2)}` }, error: null }; }
  const r = await http<any>('POST', '/admin/api-keys', { name, scopes });
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: { key: r.data.key }, error: null };
}

/* ============================ demo seeding (DEV only) ============================ */
export function ensureDemoSession(): Session {
  const existing = loadSession();
  if (existing.user) return existing;
  if (import.meta.env.DEV && DEMO) {
    const s: Session = { user: mock.MOCK_USERS[0], token: `hz_mock_${mock.MOCK_USERS[0].id}` };
    saveSession(s);
    return s;
  }
  return existing;
}

/* ============================ smtp ============================ */
interface RawSmtp { enabled: boolean; host: string; port: number; username: string; password_masked: string; sender: string; use_tls: boolean; use_ssl: boolean }
const toSmtp = (t: RawSmtp): SmtpConfig => ({
  enabled: t.enabled, host: t.host, port: t.port, username: t.username,
  password: t.password_masked, passwordMasked: t.password_masked, sender: t.sender,
  useTls: t.use_tls, useSsl: t.use_ssl,
});

export async function apiSmtpGet(): Promise<ApiResult<SmtpConfig>> {
  if (DEMO) return { data: {
    enabled: true, host: 'smtp.example.com', port: 587, username: 'noreply@haizhu.dev',
    password: '**********', passwordMasked: '**********', sender: 'noreply@haizhu.dev',
    useTls: true, useSsl: false,
  }, error: null };
  const r = await http<RawSmtp>('GET', '/admin/smtp');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: toSmtp(r.data), error: null };
}

export async function apiSmtpSave(cfg: SmtpConfig): Promise<ApiResult<SmtpConfig>> {
  if (DEMO) { await new Promise(r => setTimeout(r, 500)); return { data: cfg, error: null }; }
  const r = await http<RawSmtp>('POST', '/admin/smtp', {
    enabled: cfg.enabled, host: cfg.host, port: cfg.port, username: cfg.username,
    password: cfg.password, sender: cfg.sender, use_tls: cfg.useTls, use_ssl: cfg.useSsl,
  });
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: toSmtp(r.data), error: null };
}

export async function apiSmtpTest(): Promise<ApiResult<{ delivered: boolean; message: string }>> {
  if (DEMO) { await new Promise(r => setTimeout(r, 900)); return { data: { delivered: true, message: '测试邮件已发送（演示模式）' }, error: null }; }
  return http<{ delivered: boolean; message: string }>('POST', '/admin/smtp/test');
}

/* ============================ probe / export ============================ */
export async function apiProbeNode(nodeId: string): Promise<ApiResult<ProbeResult>> {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 500 + Math.random() * 900));
    const ok = Math.random() > 0.25;
    return { data: { nodeId, name: 'demo', host: 'demo', port: 443, latencyMs: ok ? Math.round(40 + Math.random() * 220) : null, reachable: ok }, error: null };
  }
  return http<ProbeResult>('POST', `/console/probe/${nodeId}`, undefined);
}

export async function apiExportCdks(): Promise<ApiResult<string>> {
  if (DEMO) {
    const rows = ['code,traffic_mb,status,used_by,used_at,expires_at,batch,created_at'];
    mock.MOCK_CDKS.forEach(c => rows.push([c.code, c.traffic, c.status, '', '', '', c.batch ?? '', c.createdAt].join(',')));
    return { data: rows.join('\n'), error: null };
  }
  try {
    const session = loadSession();
    const res = await fetch('/api/admin/cdks/export.csv', { headers: session.token ? { Authorization: `Bearer ${session.token}` } : {} });
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
    return { data: await res.text(), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : '导出失败' };
  }
}

/* ============================ bulk import / traffic ============================ */
export async function apiImportNodes(text: string, regionDefault = 'HK'): Promise<ApiResult<ImportResult>> {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 800));
    const created: ProxyNode[] = text.split('\n').filter(x => x.trim()).slice(0, 3).map((_l, i) => ({
      id: `n${Date.now()}-${i}`, name: `IMPORT-${i + 1}`, region: regionDefault, host: 'import.demo.dev',
      port: 443, protocol: 'vless', tls: true, network: 'tcp', path: '', sni: '', flow: '',
      security: 'tls', realityPbk: '', realitySid: '', trafficIn: 0, trafficOut: 0,
      status: 'online' as const, addedAt: new Date().toISOString(),
    }));
    return { data: { created, failed: [] }, error: null };
  }
  const r = await http<any>('POST', '/admin/nodes/import', { text, region_default: regionDefault });
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: { created: (r.data.created as RawNode[]).map(toNode), failed: r.data.failed }, error: null };
}

export async function apiMyTraffic(page = 1, pageSize = 20): Promise<ApiResult<TrafficPage>> {
  if (DEMO) {
    await new Promise(r => setTimeout(r, 500));
    const items = Array.from({ length: 20 }, (_, i) => ({
      ts: new Date(Date.now() - i * 3600e3).toISOString(),
      nodeName: ['HK-01 · BGP', 'JP-01 · IGP', 'US-01 · LAX'][i % 3],
      bytesIn: (40 + i * 7) * 1024 * 1024, bytesOut: (46 + i * 9) * 1024 * 1024,
    }));
    const start = (page - 1) * pageSize;
    return { data: { total: 128, items: items.slice(start, start + pageSize) }, error: null };
  }
  const r = await http<any>('GET', `/console/traffic?page=${page}&page_size=${pageSize}`);
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: {
    total: r.data.total,
    items: r.data.items.map((it: any) => ({
      ts: it.ts, nodeName: it.node_name, bytesIn: it.bytes_in, bytesOut: it.bytes_out,
    })),
  }, error: null };
}
