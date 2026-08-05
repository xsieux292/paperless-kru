import { Check } from 'lucide-react';
import { DOCUMENT_MODE_LIST } from '@/constants/documentModes';
import { cn } from '@/lib/cn';
import type { DocumentMode } from '@/types';

export interface ModeSelectorProps {
  value: DocumentMode;
  onChange: (mode: DocumentMode) => void;
  disabled?: boolean;
}

/**
 * เลือกบริการที่ให้ AI ช่วย 3 แบบ
 *
 * ตาม design plan:
 *   ④ ไอคอนมีข้อความคู่เสมอ
 *   ⑤ สีเขียว = "อันนี้เลือกอยู่" เท่านั้น การ์ดที่ไม่ได้เลือกเป็นสีกลางหมด
 *   ไม่พึ่งสีอย่างเดียว — ที่เลือกอยู่มีทั้งสี + เครื่องหมายถูก + ข้อความ "เลือกอยู่"
 */
export function ModeSelector({ value, onChange, disabled = false }: ModeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="เลือกบริการที่ต้องการให้ AI ช่วย"
      className="grid grid-cols-1 gap-3 md:grid-cols-3"
    >
      {DOCUMENT_MODE_LIST.map((mode) => {
        const selected = value === mode.id;
        const Icon = mode.icon;

        return (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(mode.id)}
            className={cn(
              'group relative flex h-full flex-col rounded-2xl border-2 p-4 text-left transition-all',
              'hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60',
              selected
                ? 'border-primary-600 bg-primary-50 shadow-md'
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                  selected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-ink-light',
                )}
              >
                <Icon className="h-6 w-6" aria-hidden />
              </div>

              <span
                aria-hidden
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  selected
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-slate-300 bg-white',
                )}
              >
                {selected && <Check className="h-4 w-4" strokeWidth={3} />}
              </span>
            </div>

            <h4 className="mb-1 font-display text-base font-bold text-ink">{mode.title}</h4>
            <p className="text-sm leading-relaxed text-ink-light">{mode.description}</p>

            <span
              className={cn(
                'mt-3 inline-flex items-center gap-1 text-sm font-bold',
                selected ? 'text-primary-700' : 'text-transparent',
              )}
            >
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
              เลือกอยู่
            </span>
          </button>
        );
      })}
    </div>
  );
}
