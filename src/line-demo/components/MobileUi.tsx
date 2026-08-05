import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * ชิ้นส่วน UI ขนาดเล็กที่ใช้ซ้ำในหน้าจอ LIFF
 * ย่อขนาดจากเวอร์ชันเว็บให้พอดีจอ 375px แต่คงกฎเดิมทุกข้อ
 * (สีมีความหมายเดียว · พื้นที่แตะใหญ่ · สถานะ = สี + ไอคอน + ข้อความ)
 */

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="font-display text-[17px] font-bold leading-snug text-ink">{children}</h2>
      {hint && <p className="mt-0.5 text-[13px] text-ink-light">{hint}</p>}
    </div>
  );
}

/** แถวที่เลือกได้ 1 อัน — ใช้แทน dropdown เพราะบนมือถือกดง่ายกว่าและเห็นครบ */
export function SelectableRow({
  selected,
  onSelect,
  disabled = false,
  icon: Icon,
  title,
  subtitle,
  meta,
  warning,
}: {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  /** ข้อความเตือนสีส้ม — ใช้เฉพาะเรื่องที่ครูควรรู้ก่อนตัดสินใจ */
  warning?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl border-2 p-3 text-left transition-all active:scale-[0.99] disabled:opacity-60',
        selected ? 'border-primary-600 bg-primary-50' : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex items-start gap-2.5">
        {Icon && (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              selected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-ink-light',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block font-display text-[14px] font-bold leading-snug text-ink">
            {title}
          </span>
          {subtitle && <span className="mt-0.5 block text-[12px] text-ink-light">{subtitle}</span>}
          {meta && <span className="mt-0.5 block text-[12px] text-ink-light">{meta}</span>}
          {warning && (
            <span className="mt-1 block text-[12px] font-semibold text-attention-800">
              {warning}
            </span>
          )}
        </span>

        <span
          aria-hidden
          className={cn(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
            selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300',
          )}
        >
          {selected && <Check className="h-4 w-4" strokeWidth={3} />}
        </span>
      </div>
    </button>
  );
}

/** ชิปเลือกได้ ใช้กับตัวเลือกสั้น ๆ เช่น ประเภทใบเสร็จ */
export function Chip({
  selected,
  onSelect,
  children,
  disabled = false,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'inline-flex min-h-[40px] items-center gap-1.5 rounded-btn border-2 px-3 text-[13px] font-semibold transition-all disabled:opacity-60',
        selected
          ? 'border-primary-600 bg-primary-50 text-primary-800'
          : 'border-slate-300 bg-white text-ink',
      )}
    >
      {selected && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />}
      {children}
    </button>
  );
}

/** กล่องว่าง — plan กำหนดว่าทุกหน้าต้องมี ไม่ปล่อยจอโล่ง */
export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center">
      <Icon className="mx-auto mb-2 h-8 w-8 text-ink-mute" aria-hidden />
      <p className="text-[14px] font-semibold text-ink">{title}</p>
      {hint && <p className="mt-0.5 text-[12px] text-ink-light">{hint}</p>}
    </div>
  );
}

/** โครงกระดูกตอนโหลด */
export function RowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

/** ป้ายสถานะ — สี + ไอคอน + ข้อความ ครบเสมอ */
export function StatusPill({
  icon: Icon,
  children,
  tone,
}: {
  icon: LucideIcon;
  children: ReactNode;
  tone: 'done' | 'waiting' | 'progress' | 'problem';
}) {
  const styles = {
    done: 'bg-primary-50 text-primary-800 ring-primary-300',
    waiting: 'bg-attention-50 text-attention-800 ring-attention-300',
    progress: 'bg-white text-ink ring-slate-300',
    problem: 'bg-danger-50 text-danger-700 ring-danger-300',
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1',
        styles,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

/** ช่องกรอกข้อความ */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-ink-light">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'h-12 w-full rounded-btn border border-slate-300 px-3 text-[14px] text-ink placeholder:text-ink-mute focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500';

export const textareaClass =
  'w-full rounded-xl border border-slate-300 p-3 text-[14px] text-ink placeholder:text-ink-mute focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500';
