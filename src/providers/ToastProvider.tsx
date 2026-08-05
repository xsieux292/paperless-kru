import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  ToastContext,
  type Toast,
  type ToastContextValue,
  type ToastVariant,
} from './toastContext';

/**
 * แจ้งเตือนแบบ toast
 * ใช้ aria-live เพื่อให้โปรแกรมอ่านหน้าจออ่านออกเสียงข้อความให้ผู้ใช้ที่มองไม่ชัด
 */

const VARIANT_STYLES: Record<ToastVariant, { box: string; icon: typeof Info; iconColor: string }> = {
  success: {
    box: 'bg-primary-50 border-primary-500 text-ink',
    icon: CheckCircle2,
    iconColor: 'text-primary-600',
  },
  error: {
    box: 'bg-danger-50 border-danger-500 text-ink',
    icon: XCircle,
    iconColor: 'text-danger-600',
  },
  /** ส้ม = ตรงนี้รอคุณอยู่ / ต้องแก้ */
  warning: {
    box: 'bg-attention-50 border-attention-500 text-ink',
    icon: AlertTriangle,
    iconColor: 'text-attention-600',
  },
  info: { box: 'bg-white border-slate-300 text-ink', icon: Info, iconColor: 'text-ink-light' },
};

const AUTO_DISMISS_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (title, description) => showToast({ variant: 'success', title, description }),
      error: (title, description) => showToast({ variant: 'error', title, description }),
      warning: (title, description) => showToast({ variant: 'warning', title, description }),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-3 px-4 sm:bottom-6"
      >
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-lg animate-slide-up items-start gap-3 rounded-xl border-2 p-4 shadow-lg',
                style.box,
              )}
            >
              <Icon className={cn('mt-0.5 h-6 w-6 shrink-0', style.iconColor)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-sm leading-relaxed opacity-90">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="ปิดข้อความแจ้งเตือน"
                className="tap-target -m-1 flex items-center justify-center rounded-xl p-1 opacity-60 transition hover:opacity-100"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
