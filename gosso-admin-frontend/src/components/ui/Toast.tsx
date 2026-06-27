import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

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
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '380px',
        }}
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
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const iconMap = {
    success: <CheckCircle style={{ width: '18px', height: '18px', color: 'var(--success-color)', flexShrink: 0 }} />,
    error: <AlertTriangle style={{ width: '18px', height: '18px', color: 'var(--danger-color)', flexShrink: 0 }} />,
    info: <Info style={{ width: '18px', height: '18px', color: 'var(--color-primary)', flexShrink: 0 }} />,
  };

  const bgMap = {
    success: 'rgba(34,197,94,0.12)',
    error: 'rgba(239,68,68,0.12)',
    info: 'rgba(59,130,246,0.12)',
  };

  const borderMap = {
    success: 'rgba(34,197,94,0.25)',
    error: 'rgba(239,68,68,0.25)',
    info: 'rgba(59,130,246,0.25)',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '8px',
        background: bgMap[toast.type],
        border: `1px solid ${borderMap[toast.type]}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s ease, opacity 0.25s ease',
      }}
    >
      {iconMap[toast.type]}
      <span style={{ flex: 1, fontSize: '13.5px', color: 'var(--color-text-main)', lineHeight: '1.4' }}>
        {toast.message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
      >
        <X style={{ width: '14px', height: '14px' }} />
      </button>
    </div>
  );
}
