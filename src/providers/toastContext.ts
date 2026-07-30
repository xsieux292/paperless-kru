import { createContext, useContext } from 'react';

/** นิยามของระบบแจ้งเตือน แยกจากไฟล์ Provider เพื่อให้ hot reload ทำงานถูกต้อง */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

export interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast ต้องใช้ภายใน <ToastProvider>');
  return context;
}
