import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'success' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white shadow-md hover:bg-primary-700 active:bg-primary-800',
  success: 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 active:bg-emerald-800',
  secondary: 'bg-slate-800 text-white shadow-md hover:bg-slate-900 active:bg-black',
  outline:
    'border-2 border-primary-500 bg-white text-primary-700 shadow-sm hover:bg-primary-50 active:bg-primary-100',
  ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  danger: 'bg-rose-600 text-white shadow-md hover:bg-rose-700 active:bg-rose-800',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm rounded-xl gap-1.5',
  md: 'px-5 py-3 text-base rounded-2xl gap-2',
  lg: 'px-6 py-4 text-lg rounded-2xl gap-3',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
}

/** ปุ่มมาตรฐาน — พื้นที่แตะใหญ่ ตัวอักษรหนา และมีสถานะกำลังทำงานในตัว */
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
        'tap-target inline-flex items-center justify-center font-prompt font-bold transition-all',
        'disabled:cursor-not-allowed disabled:opacity-60',
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
