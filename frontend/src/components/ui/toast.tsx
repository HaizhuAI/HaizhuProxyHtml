import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastKind = 'success' | 'error' | 'warn' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string }

const ToastCtx = createContext<{ push: (kind: ToastKind, message: string) => void }>({ push: () => {} });

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setItems(s => [...s, { id, kind, message }]);
    setTimeout(() => setItems(s => s.filter(t => t.id !== id)), 4200);
  }, []);
  const icons = {
    success: <CheckCircle2 size={16} style={{ color: 'var(--ok)' }} />,
    error: <XCircle size={16} style={{ color: 'var(--danger)' }} />,
    warn: <AlertTriangle size={16} style={{ color: 'var(--warn)' }} />,
    info: <Info size={16} style={{ color: 'var(--info)' }} />,
  };
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-host" aria-live="polite">
        {items.map(t => (
          <div key={t.id} className={cn('toast', t.kind === 'error' && 'toast-error', t.kind === 'warn' && 'toast-warn')}>
            {icons[t.kind]}<span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
