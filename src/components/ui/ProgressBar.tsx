import { cn } from '@/lib/cn';

/** โทนสีของแถบ — ผูกกับความหมายตามกฎสีข้อ ⑤ ไม่ให้เลือกสีเองตามใจ */
type Tone = 'progress' | 'done' | 'waiting';

const TONES: Record<Tone, { track: string; bar: string }> = {
  /** ระบบกำลังทำให้ ครูไม่ต้องทำอะไร */
  progress: { track: 'bg-primary-100', bar: 'bg-primary-600' },
  done: { track: 'bg-primary-100', bar: 'bg-primary-600' },
  /** รอครูลงมือ */
  waiting: { track: 'bg-attention-100', bar: 'bg-attention-500' },
};

export interface ProgressBarProps {
  /** 0-100 */
  value: number;
  label?: string;
  tone?: Tone;
  className?: string;
  animated?: boolean;
}

/** แถบความคืบหน้าที่อ่านออกเสียงได้ผ่านโปรแกรมอ่านหน้าจอ */
export function ProgressBar({
  value,
  label,
  tone = 'progress',
  className,
  animated = true,
}: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  const colors = TONES[tone];

  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full', colors.track, className)}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `ความคืบหน้า ${safeValue}%`}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          colors.bar,
          animated && safeValue < 100 && 'animate-pulse',
        )}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
