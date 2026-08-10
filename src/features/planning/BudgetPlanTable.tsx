import { AlertCircle, FileWarning, RotateCcw, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { BudgetPlanItem } from '@/types';

const baht = (value: number) => value.toLocaleString('th-TH');

/** สีของสถานะของในคลัง — ตามกฎ ⑤ สีมีความหมายเดียว */
function availabilityClass(availability: BudgetPlanItem['availability']) {
  switch (availability) {
    case 'โรงเรียนไม่มี':
      return 'bg-danger-50 text-danger-700 ring-danger-300';
    case 'อาจจะมี':
      return 'bg-attention-50 text-attention-800 ring-attention-300';
    case 'มีแน่นอน':
      return 'bg-primary-50 text-primary-800 ring-primary-300';
    default:
      return 'bg-slate-100 text-ink ring-slate-300';
  }
}

/**
 * ขั้นที่ 3 — รายการงบที่ AI สร้างให้
 *
 * บนมือถือแสดงเป็นการ์ดเรียงลง บนจอใหญ่แสดงเป็นตาราง
 * (ของเดิมบังคับตารางกว้าง 700px ทำให้ต้องเลื่อนซ้ายขวาบนมือถือ ซึ่งใช้ยากมาก)
 */
export function BudgetPlanTable({
  items,
  totalBudget,
  onReset,
  onCreateRequisition,
}: {
  items: BudgetPlanItem[];
  totalBudget: number;
  onReset: () => void;
  onCreateRequisition: () => void;
}) {
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const overBudget = totalBudget > 0 && totalAmount > totalBudget;

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="font-display text-heading text-ink">รายการงบที่ AI คิดให้</h2>
        <p className="mt-0.5 text-base text-ink-light">
          ตรวจดูให้ครบ แล้วค่อยสร้างใบเบิก — แก้ไขได้ในขั้นตอนถัดไป
        </p>
      </div>

      {/* ---------- มือถือ: การ์ดเรียงลง ---------- */}
      <ul className="space-y-3 lg:hidden">
        {items.map((item, index) => (
          <li key={`${item.item}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="min-w-0 font-display text-base font-bold text-ink">{item.item}</h3>
              <span className="shrink-0 font-display text-money text-primary-700">
                {item.amount > 0 ? baht(item.amount) : '—'}
              </span>
            </div>

            <div className="mb-2 flex flex-wrap gap-2">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-sm font-bold ring-1',
                  availabilityClass(item.availability),
                )}
              >
                {item.availability}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-ink-light">
                {item.quantity}
              </span>
            </div>

            <p className="text-base text-ink">{item.reference}</p>
            <p className="mt-0.5 text-sm text-ink-light">ที่มา: {item.source}</p>
            <p className="mt-1.5 text-sm text-ink-light">ผู้ตรวจสอบ: {item.owner}</p>
          </li>
        ))}
      </ul>

      {/* ---------- จอใหญ่: ตาราง ---------- */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left text-base">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-ink-light">
              <th className="px-4 py-3 font-display text-sm font-bold">สถานะของในคลัง</th>
              <th className="w-1/4 px-4 py-3 font-display text-sm font-bold">รายการ</th>
              <th className="px-4 py-3 font-display text-sm font-bold">จำนวน</th>
              <th className="w-1/4 px-4 py-3 font-display text-sm font-bold">ราคาอ้างอิงและที่มา</th>
              <th className="px-4 py-3 text-right font-display text-sm font-bold">ยอดเงิน (บาท)</th>
              <th className="px-4 py-3 font-display text-sm font-bold">ผู้ตรวจสอบ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={`${item.item}-${index}`} className="transition-colors hover:bg-slate-50">
                <td className="p-4">
                  <span
                    className={cn(
                      'inline-block rounded-full px-2.5 py-0.5 text-sm font-bold ring-1',
                      availabilityClass(item.availability),
                    )}
                  >
                    {item.availability}
                  </span>
                </td>
                <td className="p-4 font-bold text-ink">{item.item}</td>
                <td className="whitespace-nowrap p-4 text-ink-light">{item.quantity}</td>
                <td className="p-4">
                  <div className="leading-snug text-ink">{item.reference}</div>
                  <div className="mt-0.5 text-sm text-ink-light">ที่มา: {item.source}</div>
                </td>
                <td className="p-4 text-right font-display text-money">
                  {item.amount > 0 ? baht(item.amount) : '—'}
                </td>
                <td className="p-4">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm text-ink-light">
                    {item.owner}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ยอดรวม — ตัวเลขเงิน 24px ตาม design system */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <span className="font-display text-base font-bold text-ink">รวมงบที่ต้องใช้</span>
        <span className="font-display text-money text-primary-700">{baht(totalAmount)} บาท</span>
      </div>

      {overBudget && (
        <div className="mt-3 flex items-start gap-3 rounded-xl border-2 border-danger-300 bg-danger-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" aria-hidden />
          <p className="text-base leading-relaxed text-ink">
            <strong className="block font-bold text-danger-700">ยอดเกินวงเงินที่ตั้งไว้</strong>
            คิดได้ {baht(totalAmount)} บาท เกินวงเงิน {baht(totalBudget)} บาท อยู่{' '}
            {baht(totalAmount - totalBudget)} บาท — ลองตัดรายการที่โรงเรียนมีอยู่แล้วออกดูนะคะ
          </p>
        </div>
      )}

      {/* บอกว่ากดแล้วจะเกิดอะไรต่อ ตาม microcopy ข้อ 7 */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-ink-light" aria-hidden />
        <p className="text-base leading-relaxed text-ink-light">
          <strong className="block font-bold text-ink">กดแล้วจะเกิดอะไรต่อ</strong>
          ระบบจะส่งรายการนี้ไปหน้าเบิกงบ ให้คุณครูเลือกผู้อนุมัติแล้วส่งขออนุมัติได้เลย
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<Wallet className="h-5 w-5" aria-hidden />}
          onClick={onCreateRequisition}
        >
          สร้างใบเบิกจากแผนนี้
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="md"
          fullWidth
          leftIcon={<RotateCcw className="h-5 w-5" aria-hidden />}
          onClick={onReset}
        >
          เริ่มวางแผนใหม่
        </Button>
      </div>
    </section>
  );
}
