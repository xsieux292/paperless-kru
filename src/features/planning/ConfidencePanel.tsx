import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PlanConfidence } from '@/types';

const DIMENSION_LABELS = [
  ['รายการครอบคลุม', 'coverage'],
  ['จำนวนผู้เข้าร่วม', 'people'],
  ['ราคาอ้างอิง', 'prices'],
  ['ของที่โรงเรียนมี', 'assets'],
] as const;

/**
 * แผงความมั่นใจของ AI
 *
 * ใช้ภาษาภาพเดียวกับป้าย "4/5 ชัดเจน" ที่ใช้ทั้งระบบ:
 *   เขียว = พร้อมแล้ว · ส้ม = ยังรอข้อมูลจากครู
 * ไม่ใช้ gradient เพราะกฎ ⑤ กำหนดว่าสีต้องมีความหมายเดียว
 */
export function ConfidencePanel({
  confidence,
  dimensions,
  ready,
  pending,
}: {
  confidence: number;
  dimensions: PlanConfidence;
  ready: boolean;
  pending: string[];
}) {
  return (
    <aside className="card space-y-4 p-5" aria-label="ระดับความมั่นใจของ AI">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-base font-bold text-ink">ความมั่นใจของ AI</span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold ring-1',
            ready
              ? 'bg-primary-50 text-primary-800 ring-primary-300'
              : 'bg-attention-50 text-attention-800 ring-attention-300',
          )}
        >
          {ready ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Loader2 className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {ready ? 'พร้อมสร้างร่าง' : 'กำลังเก็บข้อมูล'}
        </span>
      </div>

      <div>
        <strong
          className={cn(
            'block font-display text-4xl leading-none',
            ready ? 'text-primary-700' : 'text-ink',
          )}
        >
          {confidence}%
        </strong>

        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={confidence}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`ความมั่นใจรวม ${confidence}%`}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              ready ? 'bg-primary-600' : 'bg-attention-500',
            )}
            style={{ width: `${confidence}%` }}
          />
        </div>

        <p className="mt-2 text-sm leading-relaxed text-ink-light">
          วัดจากความครบถ้วนของข้อมูล ไม่ใช่การอนุมัติราคา
        </p>
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-4">
        {DIMENSION_LABELS.map(([label, key]) => {
          const value = Math.round(dimensions[key]);
          return (
            <div key={key}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink-light">{label}</span>
                <strong className="text-ink">{value}%</strong>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    value >= 70 ? 'bg-primary-600' : 'bg-attention-500',
                  )}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {pending.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <h3 className="mb-2 text-base font-bold text-ink">สิ่งที่ยังต้องยืนยัน</h3>
          <ul className="space-y-1.5">
            {pending.slice(0, 4).map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-ink-light">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-attention-500"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* human-in-the-loop — ย้ำว่า AI ไม่ได้ตัดสินใจแทนครู */}
      <div className="flex items-start gap-2.5 rounded-xl bg-primary-50 p-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" aria-hidden />
        <p className="text-sm leading-relaxed text-primary-900">
          <strong className="block font-bold">คนเป็นผู้ตัดสินใจสุดท้าย</strong>
          รายการ ราคา และระเบียบทุกข้อยังไม่ผ่าน จนกว่าผู้รับผิดชอบจะยืนยัน
        </p>
      </div>
    </aside>
  );
}
