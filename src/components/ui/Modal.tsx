import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * กล่องข้อความกลางจอ
 * - ปิดด้วยปุ่ม Esc และคลิกพื้นหลัง
 * - ล็อกโฟกัสไว้ในกล่อง เพื่อไม่ให้ผู้ใช้คีย์บอร์ดหลุดไปหลังกล่อง
 * - คืนโฟกัสกลับที่เดิมเมื่อปิด
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** ปิดโดยคลิกพื้นหลังได้หรือไม่ (ปิดไว้เมื่อกำลังประมวลผล) */
  dismissible?: boolean;
  labelledBy: string;
  children: ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  dismissible = true,
  labelledBy,
  children,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('button, [href], input, textarea, select')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const focusables = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
