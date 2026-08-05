import { AlertCircle, Check, FolderKanban, Tags } from 'lucide-react';
import { getReceiptCategories } from '@/api/catalog.api';
import { toFriendlyMessage } from '@/api/http';
import { useProjects } from '@/hooks/useCatalog';
import { cn } from '@/lib/cn';
import type { ReceiptCategoryId } from '@/types';

export interface ReceiptScopePickerProps {
  projectId: string | null;
  onProjectChange: (projectId: string) => void;
  category: ReceiptCategoryId | null;
  onCategoryChange: (category: ReceiptCategoryId) => void;
  disabled?: boolean;
}

const formatBaht = (value: number) => value.toLocaleString('th-TH');

/**
 * บอกว่าใบเสร็จชุดนี้เป็นของ "โครงการไหน" และ "ค่าอะไร"
 *
 * เหตุผล: ครูคนเดียวดูหลายโครงการพร้อมกัน ถ้าไม่แยกตั้งแต่ตอนส่ง
 * รายงานบัญชีจะปนกันจนต้องมานั่งแยกทีหลัง ซึ่งเป็นงานที่เสียเวลาที่สุด
 */
export function ReceiptScopePicker({
  projectId,
  onProjectChange,
  category,
  onCategoryChange,
  disabled = false,
}: ReceiptScopePickerProps) {
  const { data: projects, isLoading, isError, error } = useProjects();
  const categories = getReceiptCategories();

  return (
    <div className="mb-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      {/* โครงการ */}
      <div>
        <h4 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-ink">
          <FolderKanban className="h-5 w-5 shrink-0 text-primary-700" aria-hidden />
          ใบเสร็จชุดนี้เป็นของโครงการไหนคะ?
        </h4>
        <p className="mb-3 text-sm text-ink-light">
          เลือกไว้เพื่อให้รายงานบัญชีแยกตามโครงการให้อัตโนมัติ ไม่ปนกัน
        </p>

        {isLoading && (
          <div className="space-y-2" aria-hidden>
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border-2 border-danger-300 bg-danger-50 p-3">
            <p className="text-base font-bold text-danger-700">ยังโหลดรายชื่อโครงการไม่ได้</p>
            <p className="mt-0.5 text-sm text-ink">{toFriendlyMessage(error)}</p>
          </div>
        )}

        {!isLoading && !isError && (
          <div role="radiogroup" aria-label="โครงการ" className="space-y-2">
            {projects?.map((project) => {
              const selected = projectId === project.id;
              const remaining = project.budgetTotal - project.budgetUsed;
              const usedRatio = project.budgetUsed / project.budgetTotal;
              const nearlyFull = usedRatio >= 0.85;

              return (
                <button
                  key={project.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onProjectChange(project.id)}
                  className={cn(
                    'w-full rounded-xl border-2 p-3 text-left transition-all disabled:opacity-60',
                    selected
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold text-ink">{project.name}</p>
                      <p className="text-sm text-ink-light">
                        {project.code} · {project.budgetSource}
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                        selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300',
                      )}
                    >
                      {selected && <Check className="h-4 w-4" strokeWidth={3} />}
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm text-ink-light">
                    งบคงเหลือ {formatBaht(remaining)} บาท จาก {formatBaht(project.budgetTotal)} บาท
                  </p>

                  {/* ส้ม = เรื่องที่ครูควรรู้ก่อนตัดสินใจ */}
                  {nearlyFull && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-attention-800">
                      <AlertCircle className="h-4 w-4 shrink-0 text-attention-600" aria-hidden />
                      งบโครงการนี้ใช้ไปแล้วกว่า {Math.round(usedRatio * 100)}%
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ประเภทใบเสร็จ */}
      <div className="border-t border-slate-200 pt-4">
        <h4 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-ink">
          <Tags className="h-5 w-5 shrink-0 text-primary-700" aria-hidden />
          เป็นใบเสร็จค่าอะไรคะ?
        </h4>
        <p className="mb-3 text-sm text-ink-light">
          เลือกหมวดไว้ AI จะจัดกลุ่มค่าใช้จ่ายในตารางให้ถูกตั้งแต่แรก
        </p>

        <div role="radiogroup" aria-label="ประเภทใบเสร็จ" className="flex flex-wrap gap-2">
          {categories.map((item) => {
            const selected = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                title={item.description}
                onClick={() => onCategoryChange(item.id)}
                className={cn(
                  'tap-target inline-flex items-center gap-1.5 rounded-btn border-2 px-3 text-base font-semibold transition-all disabled:opacity-60',
                  selected
                    ? 'border-primary-600 bg-primary-50 text-primary-800'
                    : 'border-slate-300 bg-white text-ink hover:border-slate-400',
                )}
              >
                {selected && <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden />}
                {item.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
