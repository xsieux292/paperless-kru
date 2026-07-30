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
 * เลือกโหมดการทำงาน 3 แบบ
 * ปรับจาก HTML เดิม: ใช้ radio จริง (ไม่ซ่อน) เพื่อให้เลื่อนด้วยลูกศรและอ่านออกเสียงได้
 * และเพิ่มแถบสีเข้มด้านบนของการ์ดที่เลือก เพื่อให้เห็นชัดแม้สายตาไม่ดี
 */
export function ModeSelector({ value, onChange, disabled = false }: ModeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="เลือกบริการที่ต้องการให้ AI ช่วย"
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
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
              'group relative flex h-full flex-col rounded-2xl border-2 p-5 text-left transition-all',
              'hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
              selected
                ? cn('shadow-lg ring-4', mode.accent.selectedCard)
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <div className="mb-3 flex items-start justify-between">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                  mode.accent.iconWrapper,
                )}
              >
                <Icon className="h-6 w-6" aria-hidden />
              </div>

              <span
                aria-hidden
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
                  selected
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white',
                )}
              >
                {selected && <Check className="h-4 w-4" strokeWidth={3} />}
              </span>
            </div>

            <h4 className="mb-1 font-prompt text-base font-bold text-slate-900">
              <span className={cn('mr-1.5 rounded-md px-1.5 py-0.5 text-xs', mode.accent.badge)}>
                {mode.step}
              </span>
              {mode.title}
            </h4>
            <p className="text-xs leading-relaxed text-slate-500">{mode.description}</p>

            {selected && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                เลือกอยู่
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
