import { cn } from '@/lib/cn';

export interface ProgressBarProps {
  /** 0-100 */
  value: number;
  label?: string;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  animated?: boolean;
}

/** แถบความคืบหน้าที่อ่านออกเสียงได้ผ่านโปรแกรมอ่านหน้าจอ */
export function ProgressBar({
  value,
  label,
  className,
  trackClassName = 'bg-amber-200',
  barClassName = 'bg-amber-500',
  animated = true,
}: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full', trackClassName, className)}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `ความคืบหน้า ${safeValue}%`}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          barClassName,
          animated && safeValue < 100 && 'animate-pulse',
        )}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
