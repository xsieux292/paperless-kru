import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * ปุ่มมาตรฐานตาม design plan ข้อ ①②③④:
 *   - ปุ่มหลัก (primary) สีทึบ ใช้ได้ปุ่มเดียวต่อจอ — ปุ่มอื่นเป็น outline หรือ ghost
 *   - ปุ่มหลักสูง 56px ปุ่มรอง 48px มุมโค้ง 12px
 *   - ไอคอนต้องมีข้อความคู่เสมอ (ห้ามไอคอนเดี่ยว)
 *   - ระหว่างโหลดต้องเปลี่ยนเป็นข้อความ เช่น "กำลังส่ง…" ไม่ใช่หมุนเปล่า
 */

type Variant = 'primary' | 'grow' | 'outline' | 'ghost' | 'danger';
type Size = 'lg' | 'md' | 'sm';

const VARIANTS: Record<Variant, string> = {
  /** ปุ่มหลักของ Doc Done */
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800',
  /** ปุ่มหลักของ Teach & Grow */
  grow: 'bg-grow-600 text-white shadow-sm hover:bg-grow-700 active:bg-grow-800',
  outline:
    'border-2 border-primary-600 bg-white text-primary-700 hover:bg-primary-50 active:bg-primary-100',
  ghost: 'text-ink-light hover:bg-slate-100 active:bg-slate-200',
  danger: 'bg-danger-500 text-white shadow-sm hover:bg-danger-600 active:bg-danger-700',
};

const SIZES: Record<Size, string> = {
  /** ปุ่มหลัก 56px */
  lg: 'h-btn px-6 text-base gap-2 rounded-btn',
  /** ปุ่มรอง 48px */
  md: 'h-btn-sm px-5 text-base gap-2 rounded-btn',
  /** ปุ่มเสริมในการ์ด — ยังคงพื้นที่แตะ 48px ผ่าน .tap-target */
  sm: 'px-3 py-2 text-sm gap-1.5 rounded-btn',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  /** ข้อความระหว่างโหลด — ควรเป็นกริยา เช่น "กำลังส่ง…" */
  loadingText?: string;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText,
    leftIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'tap-target inline-flex items-center justify-center font-display font-bold transition-all',
        // กดแล้วต้องรู้สึกทันที (< 100ms) ตาม microcopy plan ข้อ 7
        'active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:bg-ink-mute disabled:text-white disabled:shadow-none disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {leftIcon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
});
