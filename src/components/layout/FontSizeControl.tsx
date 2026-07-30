import { Type } from 'lucide-react';
import { cn } from '@/lib/cn';
import { FONT_SCALE_OPTIONS, useAccessibility } from '@/providers/accessibilityContext';

/**
 * ปุ่มปรับขนาดตัวอักษรทั้งหน้าจอ
 * เพิ่มเข้ามาใหม่ (ไม่มีใน HTML เดิม) เพราะเป็นอุปสรรคอันดับต้น ๆ ของผู้ใช้สูงวัย
 */
export function FontSizeControl({ className }: { className?: string }) {
  const { fontScale, setFontScale } = useAccessibility();

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Type className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <div
        role="radiogroup"
        aria-label="ปรับขนาดตัวอักษร"
        className="flex items-center gap-1 rounded-xl bg-slate-100 p-1"
      >
        {FONT_SCALE_OPTIONS.map((option, index) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={fontScale === option.value}
            title={option.hint}
            onClick={() => setFontScale(option.value)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg font-prompt font-bold transition-all',
              fontScale === option.value
                ? 'bg-white text-primary-700 shadow-sm ring-2 ring-primary-500'
                : 'text-slate-500 hover:bg-white/70',
            )}
            style={{ fontSize: `${0.8 + index * 0.2}rem` }}
          >
            {option.label}
            <span className="sr-only"> — {option.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
