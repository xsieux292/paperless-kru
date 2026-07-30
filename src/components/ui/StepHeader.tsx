import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface StepHeaderProps {
  step: number;
  title: string;
  hint?: ReactNode;
  /** ทำขั้นตอนนี้เสร็จแล้วหรือยัง — แสดงเครื่องหมายถูกให้เห็นความคืบหน้าชัด ๆ */
  complete?: boolean;
  /** id ของหัวข้อ ใช้ผูกกับ aria-labelledby ของ section */
  titleId?: string;
}

/** หัวข้อของแต่ละขั้นตอน พร้อมตัวเลขวงกลมและเครื่องหมายถูกเมื่อทำเสร็จ */
export function StepHeader({ step, title, hint, complete = false, titleId }: StepHeaderProps) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span
        aria-hidden
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-colors',
          complete ? 'bg-emerald-500 text-white' : 'bg-primary-100 text-primary-700',
        )}
      >
        {complete ? <Check className="h-5 w-5" strokeWidth={3} /> : step}
      </span>
      <div className="min-w-0 pt-0.5">
        <h3 id={titleId} className="font-prompt text-xl font-bold text-slate-900">
          <span className="sr-only">ขั้นตอนที่ {step}: </span>
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
