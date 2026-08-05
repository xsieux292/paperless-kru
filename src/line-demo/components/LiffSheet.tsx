import { ChevronLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * โครงหน้า LIFF ที่เด้งทับแชท
 * ทุกหน้ามีทางออกตาม plan ข้อ ⑦ "ไม่มีทางตัน": ปุ่มย้อนกลับซ้ายบน + ปุ่มปิด + ปุ่มถามเจ้าหน้าที่
 */
export interface LiffSheetProps {
  title: string;
  /** แสดง "ขั้นที่ x จาก y" + progress bar เมื่อหน้ายาวเกิน 1 จอ */
  step?: { current: number; total: number };
  onBack: () => void;
  onClose: () => void;
  /** แถบปุ่มหลักติดล่างจอ */
  footer?: ReactNode;
  children: ReactNode;
  /** หน้ากล้องใช้พื้นดำเต็มจอ ไม่ต้องมี header ปกติ */
  variant?: 'default' | 'camera';
}

export function LiffSheet({
  title,
  step,
  onBack,
  onClose,
  footer,
  children,
  variant = 'default',
}: LiffSheetProps) {
  if (variant === 'camera') {
    return (
      <div className="absolute inset-0 z-20 flex animate-sheet-up flex-col bg-black">
        <div className="flex shrink-0 items-center justify-between px-3 pb-2 pt-9 text-white">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 items-center gap-1 rounded-btn px-2 text-[13px] font-bold"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
            ย้อนกลับ
          </button>
          <span className="font-display text-[15px] font-bold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="flex h-11 w-11 items-center justify-center rounded-btn"
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
        </div>
        <div className="relative flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex animate-sheet-up flex-col bg-surface">
      <div className="shrink-0 border-b border-slate-200 bg-white pt-8">
        <div className="flex items-center justify-between px-2 py-1.5">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 items-center gap-1 rounded-btn px-2 text-[13px] font-bold text-ink-light"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
            ย้อนกลับ
          </button>
          <span className="font-display text-[15px] font-bold text-ink">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="flex h-11 w-11 items-center justify-center rounded-btn text-ink-light"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {step && (
          <div className="px-4 pb-2.5">
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-ink-light">
              <span>
                ขั้นที่ {step.current} จาก {step.total}
              </span>
              <span>{Math.round((step.current / step.total) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary-600 transition-[width] duration-500"
                style={{ width: `${(step.current / step.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

      {footer && <div className="shrink-0 border-t border-slate-200 bg-white p-3">{footer}</div>}
    </div>
  );
}

/** ปุ่มหลักของหน้า LIFF — สูง 56px กว้างเต็มขอบ ตาม plan ข้อ ② */
export function LiffPrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  loadingText = 'กำลังส่ง…',
  tone = 'primary',
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  tone?: 'primary' | 'grow';
  icon?: ReactNode;
}) {
  const bg =
    disabled || loading
      ? 'bg-ink-mute'
      : tone === 'primary'
        ? 'bg-primary-600 active:bg-primary-800'
        : 'bg-grow-600 active:bg-grow-800';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex h-btn w-full items-center justify-center gap-2 rounded-btn font-display text-[16px] font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed ${bg}`}
    >
      {loading ? loadingText : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
