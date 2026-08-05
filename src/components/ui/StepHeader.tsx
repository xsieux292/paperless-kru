import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface StepHeaderProps {
  step: number;
  title: string;
  hint?: ReactNode;
  /** ทำขั้นตอนนี้เสร็จแล้วหรือยัง — เขียว + เครื่องหมายถูก */
  complete?: boolean;
  /** ขั้นตอนนี้กำลังรอครูลงมือ — ส้ม ตามกฎสีข้อ ⑤ */
  waiting?: boolean;
  /** id ของหัวข้อ ใช้ผูกกับ aria-labelledby ของ section */
  titleId?: string;
}

/**
 * หัวข้อของแต่ละขั้นตอน
 * สถานะไม่พึ่งสีอย่างเดียว — มีทั้งสี + ไอคอน/ตัวเลข + ข้อความกำกับ
 */
export function StepHeader({
  step,
  title,
  hint,
  complete = false,
  waiting = false,
  titleId,
}: StepHeaderProps) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span
        aria-hidden
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold transition-colors',
          complete && 'bg-primary-600 text-white',
          !complete && waiting && 'bg-attention-500 text-white',
          !complete && !waiting && 'bg-slate-200 text-ink-light',
        )}
      >
        {complete ? <Check className="h-5 w-5" strokeWidth={3} /> : step}
      </span>

      <div className="min-w-0 pt-1">
        <h3 id={titleId} className="font-display text-heading text-ink">
          <span className="sr-only">ขั้นตอนที่ {step}: </span>
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-sm text-ink-light">{hint}</p>}
        {waiting && !hint && (
          <p className="mt-0.5 text-sm font-semibold text-attention-700">ขั้นตอนนี้รอคุณครูอยู่ค่ะ</p>
        )}
      </div>
    </div>
  );
}
