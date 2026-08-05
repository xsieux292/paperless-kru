import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * เลือกหมวดงบ (Flow A ขั้นที่ 4)
 * ใช้การ์ดใหญ่แทน dropdown เพราะ dropdown บนมือถือกดยากและเห็นตัวเลือกไม่ครบ
 * ⑧ ใช้ภาษาโรงเรียนจริง ไม่ใช่ศัพท์ระบบ
 */

export const BUDGETS = [
  {
    id: 'free15',
    name: 'เรียนฟรี 15 ปี',
    desc: 'ค่าอุปกรณ์การเรียน กิจกรรมพัฒนาผู้เรียน',
  },
  {
    id: 'activity',
    name: 'งบกิจกรรมโรงเรียน',
    desc: 'กีฬาสี วันสำคัญ ทัศนศึกษา',
  },
  {
    id: 'supplies',
    name: 'งบพัสดุหมวดวิชา',
    desc: 'อุปกรณ์การสอนประจำกลุ่มสาระ',
  },
] as const;

export type BudgetId = (typeof BUDGETS)[number]['id'];

export function BudgetScreen({
  selected,
  onSelect,
}: {
  selected: BudgetId | null;
  onSelect: (id: BudgetId) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-heading text-ink">ใบเสร็จนี้เบิกจากงบไหนคะ?</h2>
        <p className="mt-0.5 text-[13px] text-ink-light">เลือก 1 หมวด แล้วกดปุ่มด้านล่างได้เลย</p>
      </div>

      <div role="radiogroup" aria-label="หมวดงบประมาณ" className="space-y-3">
        {BUDGETS.map((budget) => {
          const isSelected = selected === budget.id;
          return (
            <button
              key={budget.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(budget.id)}
              className={cn(
                'w-full rounded-xl border-2 p-4 text-left transition-all active:scale-[0.99]',
                isSelected
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-[15px] font-bold text-ink">{budget.name}</span>
                <span
                  aria-hidden
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                    isSelected ? 'border-primary-600 bg-primary-600' : 'border-slate-300',
                  )}
                >
                  {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-ink-light">{budget.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-[12px] leading-relaxed text-ink-light">
          ไม่แน่ใจว่าเข้าหมวดไหน? เลือกไว้ก่อนได้ค่ะ เจ้าหน้าที่พัสดุตรวจแล้วแก้ให้ได้ในขั้นตอนอนุมัติ
        </p>
      </div>
    </div>
  );
}
