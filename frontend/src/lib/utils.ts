export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function fmtBytes(mb: number): string {
  if (mb >= 1024 * 1024) return `${(mb / 1024 / 1024).toFixed(2)} TB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${Math.round(mb)} MB`;
}

export function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`;
}

export function pct(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, (used / total) * 100);
}

export function maskToken(t: string): string {
  if (t.length <= 8) return '*'.repeat(t.length);
  return `${t.slice(0, 4)}${'*'.repeat(10)}${t.slice(-4)}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
