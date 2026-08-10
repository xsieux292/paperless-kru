import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * ช่องกรอกข้อมูลมาตรฐานของฝั่งเว็บ
 *
 * มีไว้เพื่อไม่ให้แต่ละหน้าไปประดิษฐ์สไตล์ช่องกรอกเอง
 * (หน้าวางแผนงบเคยใช้คลาส `input-default` ที่ไม่มีอยู่จริง ทำให้ช่องกรอกไม่มีกรอบเลย)
 *
 * ยึดตาม design system เดียวกับฝั่ง LINE (MobileUi.tsx):
 *   ตัวหนังสือ ≥16px · สูง 48px · มุมโค้ง 12px · โฟกัสเป็นวงแหวนสีเขียว
 */

export const inputClass =
  'h-12 w-full rounded-btn border border-slate-300 bg-white px-3 text-base text-ink ' +
  'placeholder:text-ink-mute focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 ' +
  'disabled:bg-slate-50 disabled:text-ink-light';

export const textareaClass =
  'w-full rounded-btn border border-slate-300 bg-white p-3 text-base text-ink ' +
  'placeholder:text-ink-mute focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  /** คำอธิบายใต้ช่อง ช่วยให้ครูรู้ว่าต้องกรอกอะไร */
  hint?: ReactNode;
  /** ระบุว่าไม่บังคับ เพื่อลดความกังวลว่าต้องกรอกให้ครบทุกช่อง */
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  hint,
  optional = false,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-base font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 text-sm font-normal text-ink-light">(ไม่บังคับ)</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-sm leading-relaxed text-ink-light">{hint}</p>}
    </div>
  );
}

/** ช่องกรอกตัวเลขพร้อมหน่วยต่อท้าย เช่น "คน" "ชั่วโมง" "บาท" */
export function NumberFieldWithUnit({
  id,
  label,
  unit,
  value,
  onChange,
  min = 0,
  optional = false,
  hint,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  optional?: boolean;
  hint?: ReactNode;
}) {
  return (
    <FormField label={label} htmlFor={id} optional={optional} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(inputClass, 'flex-1')}
        />
        <span className="shrink-0 text-base text-ink-light">{unit}</span>
      </div>
    </FormField>
  );
}
