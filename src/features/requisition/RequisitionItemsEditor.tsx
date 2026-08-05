import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { RequisitionItem } from '@/types';

export interface RequisitionItemsEditorProps {
  items: RequisitionItem[];
  /** โหมดยืมพัสดุไม่ต้องกรอกราคา */
  showPrice: boolean;
  onChange: (items: RequisitionItem[]) => void;
  onOpenAiSuggest: () => void;
  disabled?: boolean;
}

const formatBaht = (value: number) => value.toLocaleString('th-TH');

let itemSeq = 0;
const newItem = (): RequisitionItem => ({
  id: `new-${++itemSeq}`,
  name: '',
  quantity: 1,
  unit: 'ชิ้น',
  unitPrice: 0,
});

/** ตารางรายการอุปกรณ์ — กรอกเองก็ได้ หรือให้ AI ช่วยคิดให้ก็ได้ */
export function RequisitionItemsEditor({
  items,
  showPrice,
  onChange,
  onOpenAiSuggest,
  disabled = false,
}: RequisitionItemsEditorProps) {
  const update = (id: string, patch: Partial<RequisitionItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="space-y-3">
      {/* ปุ่ม AI เป็นทางลัดที่แนะนำ จึงเด่นกว่าปุ่มเพิ่มเองเล็กน้อย */}
      <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-4">
        <h4 className="font-display text-base font-bold text-ink">ไม่รู้จะเบิกอะไรบ้าง?</h4>
        <p className="mb-3 mt-0.5 text-base text-ink-light">
          บอก AI สั้น ๆ ว่าจะจัดกิจกรรมอะไร แล้วให้ช่วยคิดรายการกับราคาให้ก่อนได้ค่ะ
        </p>
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth
          disabled={disabled}
          leftIcon={<Sparkles className="h-5 w-5" aria-hidden />}
          onClick={onOpenAiSuggest}
        >
          ให้ AI ช่วยคิดรายการอุปกรณ์
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
          <p className="text-base font-semibold text-ink">ยังไม่มีรายการในใบเบิกค่ะ</p>
          <p className="mt-0.5 text-sm text-ink-light">
            ให้ AI ช่วยคิด หรือกดเพิ่มรายการเองด้านล่างก็ได้
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink-mute">รายการที่ {index + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  disabled={disabled}
                  aria-label={`ลบรายการที่ ${index + 1}`}
                  className="tap-target flex items-center gap-1.5 rounded-btn px-2 text-sm font-bold text-ink-light transition hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  <span aria-hidden>ลบ</span>
                </button>
              </div>

              <label className="mb-1 block text-sm font-semibold text-ink-light">
                ชื่อรายการ
                <input
                  value={item.name}
                  disabled={disabled}
                  onChange={(event) => update(item.id, { name: event.target.value })}
                  placeholder="เช่น กระดาษ A4 80 แกรม"
                  className="mt-1 h-12 w-full rounded-btn border border-slate-300 px-3 text-base font-normal text-ink placeholder:text-ink-mute focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
                />
              </label>

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <label className="block text-sm font-semibold text-ink-light">
                  จำนวน
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={item.quantity}
                    disabled={disabled}
                    onChange={(event) =>
                      update(item.id, { quantity: Math.max(1, Number(event.target.value) || 1) })
                    }
                    className="mt-1 h-12 w-full rounded-btn border border-slate-300 px-3 text-base font-normal text-ink focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
                  />
                </label>

                <label className="block text-sm font-semibold text-ink-light">
                  หน่วย
                  <input
                    value={item.unit}
                    disabled={disabled}
                    onChange={(event) => update(item.id, { unit: event.target.value })}
                    placeholder="รีม / อัน / กล่อง"
                    className="mt-1 h-12 w-full rounded-btn border border-slate-300 px-3 text-base font-normal text-ink placeholder:text-ink-mute focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
                  />
                </label>

                {showPrice && (
                  <label className="block text-sm font-semibold text-ink-light">
                    ราคาต่อหน่วย (บาท)
                    <input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={item.unitPrice}
                      disabled={disabled}
                      onChange={(event) =>
                        update(item.id, { unitPrice: Math.max(0, Number(event.target.value) || 0) })
                      }
                      className="mt-1 h-12 w-full rounded-btn border border-slate-300 px-3 text-base font-normal text-ink focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
                    />
                  </label>
                )}
              </div>

              {showPrice && (
                <p className="mt-2 text-right text-base text-ink-light">
                  รวมรายการนี้{' '}
                  <span className="font-bold text-ink">
                    {formatBaht(item.quantity * item.unitPrice)} บาท
                  </span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="md"
        fullWidth
        disabled={disabled}
        leftIcon={<Plus className="h-5 w-5" aria-hidden />}
        onClick={() => onChange([...items, newItem()])}
      >
        เพิ่มรายการเอง
      </Button>

      {showPrice && items.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="font-display text-base font-bold text-ink">ยอดรวมทั้งใบเบิก</span>
          {/* ตัวเลขเงิน 24px ตาม design system */}
          <span className="font-display text-money text-primary-700">{formatBaht(total)} บาท</span>
        </div>
      )}
    </div>
  );
}
