import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ============ Button ============ */
type BtnVariant = 'primary' | 'ghost' | 'outline' | 'danger';
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  icon?: React.ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, BtnProps>(({ variant = 'primary', size = 'md', block, icon, className, children, ...rest }, ref) => (
  <button ref={ref} className={cn('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', block && 'btn-block', className)} {...rest}>
    {icon}{children}
  </button>
));
Button.displayName = 'Button';

/* ============ Card ============ */
export function Card({ className, hover, children, ...rest }: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return <div className={cn('panel', hover && 'panel-hover', className)} {...rest}>{children}</div>;
}
export function CardBody({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...rest}>{children}</div>;
}
export function CardHead({ title, sub, right, className }: { title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex-between p-5 pb-4', className)} style={{ borderBottom: '1px solid var(--line-subtle)' }}>
      <div className="flex-col" style={{ gap: 2 }}>
        <div className="card-title">{title}</div>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* ============ Chip ============ */
export function Chip({ tone = 'default', dot, children, className, style }: { tone?: 'default' | 'accent' | 'ok' | 'warn' | 'danger' | 'info'; dot?: boolean; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <span className={cn('chip', tone !== 'default' && `chip-${tone}`, className)} style={style}>{dot && <span className="dot" />}{children}</span>;
}

/* ============ Inputs ============ */
export function Field({ label, hint, error, children, className }: { label?: React.ReactNode; hint?: React.ReactNode; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('field', className)}>
      {label && <span className="field-label">{label}</span>}
      {children}
      {error ? <span style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => <input ref={ref} className={cn('input', props.className)} {...props} />);
Input.displayName = 'Input';
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>((props, ref) => <select ref={ref} className={cn('select', props.className)} {...props} />);
Select.displayName = 'Select';
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => <textarea ref={ref} className={cn('textarea', props.className)} {...props} />);
Textarea.displayName = 'Textarea';

/* ============ Switch ============ */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex-center" style={{ gap: 10, background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', padding: 0 }}>
      <span style={{
        width: 42, height: 24, borderRadius: 99, padding: 3, display: 'inline-flex', alignItems: 'center',
        background: checked ? 'var(--accent)' : 'var(--hz-black-600)',
        transition: 'background var(--dur-fast) var(--ease)', opacity: disabled ? .4 : 1,
      }}>
        <span style={{
          width: 18, height: 18, borderRadius: 99, background: '#fff',
          transform: checked ? 'translateX(18px)' : 'none',
          transition: 'transform var(--dur-fast) var(--ease-spring)',
        }} />
      </span>
      {label && <span style={{ fontSize: 13.5, color: 'var(--fg-mid)' }}>{label}</span>}
    </button>
  );
}

/* ============ Tabs ============ */
export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: React.ReactNode }[]; active: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="flex" style={{ gap: 4, borderBottom: '1px solid var(--line-subtle)', overflowX: 'auto' }}>
      {tabs.map(t => (
        <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => onChange(t.id)}
          style={{
            appearance: 'none', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
            fontSize: 13.5, fontWeight: 600, color: active === t.id ? 'var(--fg-hi)' : 'var(--fg-low)',
            padding: '10px 14px', borderBottom: `2px solid ${active === t.id ? 'var(--accent)' : 'transparent'}`,
            transition: 'color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease)', whiteSpace: 'nowrap',
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ============ Modal ============ */
export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={cn('modal', wide && 'modal-lg')} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'dialog'}>
        <div className="flex-between" style={{ marginBottom: 18 }}>
          <div className="card-title" style={{ fontSize: 17 }}>{title}</div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} aria-label="关闭"><X size={16} /></button>
        </div>
        {children}
        {footer && <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ============ CopyButton ============ */
export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard unavailable */ }
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  }, [text]);
  return (
    <button className="btn btn-ghost btn-sm" onClick={copy} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
      {done ? <Check size={13} style={{ color: 'var(--ok)' }} /> : <Copy size={13} />}
      {done ? '已复制' : label ?? '复制'}
    </button>
  );
}

/* ============ Progress ============ */
export function Progress({ value, tone = 'accent', height = 6 }: { value: number; tone?: 'accent' | 'warn' | 'danger'; height?: number }) {
  const color = tone === 'warn' ? 'var(--warn)' : tone === 'danger' ? 'var(--danger)' : 'var(--accent)';
  return (
    <div style={{ width: '100%', height, borderRadius: 99, background: 'var(--hz-black-600)', overflow: 'hidden' }} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', borderRadius: 99, background: color, transition: 'width var(--dur-med) var(--ease)' }} />
    </div>
  );
}

/* ============ Spinner ============ */
export function Spinner({ size = 18 }: { size?: number }) {
  return <span aria-label="loading" style={{ width: size, height: size, borderRadius: '50%', border: `2px solid var(--hz-black-600)`, borderTopColor: 'var(--accent)', display: 'inline-block', animation: 'spin .7s linear infinite' }} />;
}

/* ============ StatCard ============ */
export function StatCard({ label, value, sub, icon, tone = 'default' }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode; tone?: 'default' | 'accent' | 'warn' | 'danger' }) {
  const color = tone === 'accent' ? 'var(--accent)' : tone === 'warn' ? 'var(--warn)' : tone === 'danger' ? 'var(--danger)' : 'var(--fg-hi)';
  return (
    <Card hover style={{ padding: 18 }}>
      <div className="flex-between" style={{ marginBottom: 10 }}>
        <span className="stat-label">{label}</span>
        {icon && <span style={{ color: 'var(--fg-low)' }}>{icon}</span>}
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="card-sub" style={{ marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

/* ============ EmptyState ============ */
export function EmptyState({ icon, title, hint }: { icon?: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex-center" style={{ flexDirection: 'column', padding: '48px 20px', color: 'var(--fg-low)', textAlign: 'center' }}>
      {icon && <div style={{ marginBottom: 12, opacity: .5 }}>{icon}</div>}
      <div style={{ fontWeight: 600, color: 'var(--fg-mid)' }}>{title}</div>
      {hint && <div style={{ fontSize: 13, marginTop: 4, maxWidth: 380 }}>{hint}</div>}
    </div>
  );
}

/* ============ Pagination-ish pager ============ */
export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex-center" style={{ marginTop: 18, gap: 6 }}>
      <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>上一页</Button>
      <span className="mono" style={{ fontSize: 12, color: 'var(--fg-low)' }}>{page} / {pages}</span>
      <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>下一页</Button>
    </div>
  );
}

/* ============ usePaged hook ============ */
export function usePaged<T>(items: T[], pageSize = 8) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const safe = Math.min(page, pages);
  return { page: safe, pages, setPage, slice: items.slice((safe - 1) * pageSize, safe * pageSize) };
}

/* ============ Reveal on scroll ============ */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={cn('reveal', className)} style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}

/* ============ Dropdown (lightweight) ============ */
export function Dropdown({ trigger, items }: { trigger: React.ReactNode; items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 60, minWidth: 160, background: 'var(--bg-elevated)', border: '1px solid var(--line-strong)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-pop)', padding: 6, animation: 'popIn var(--dur-fast) var(--ease-spring)' }}>
          {items.map((it, i) => (
            <button key={i} onClick={() => { setOpen(false); it.onClick(); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 6, fontSize: 13, color: it.danger ? 'var(--danger)' : 'var(--fg-mid)', fontFamily: 'var(--font-body)' }}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
