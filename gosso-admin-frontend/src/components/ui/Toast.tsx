import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { IconButton } from './Button';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const showSuccess = useCallback((message: string) => addToast('success', message), [addToast]);
  const showError = useCallback((message: string) => addToast('error', message), [addToast]);
  const showInfo = useCallback((message: string) => addToast('info', message), [addToast]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const iconMap = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />,
    error: <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-400 shrink-0" />,
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center justify-between gap-3 rounded-lg border border-border bg-card/95 p-4 text-sm text-card-foreground shadow-xl backdrop-blur-md transition-all duration-300 transform',
        visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95',
        toast.type === 'error' && 'border-red-500/30 bg-red-950/40 text-red-100',
        toast.type === 'success' && 'border-emerald-500/30 bg-emerald-950/40 text-emerald-100',
        toast.type === 'info' && 'border-sky-500/30 bg-sky-950/40 text-sky-100'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {iconMap[toast.type]}
        <span className="font-medium break-words">{toast.message}</span>
      </div>
      <IconButton
        label="Close notification"
        icon={<X className="h-4 w-4" />}
        variant="ghost"
        size="sm"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={onClose}
      />
    </div>
  );
}
