import { AlertCircle, Check, Pencil, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Confidence, DraftSummary } from '@/types';

/**
 * ชุด UI ของแนวคิด "AI เดาให้ก่อน ครูแก้ทีหลัง"
 *
 * กฎที่ใช้:
 *   - ช่องที่ AI มั่นใจ → พื้นเรียบ ไม่ดึงความสนใจ ครูข้ามได้เลย
 *   - ช่องที่ AI ไม่มั่นใจ → ส้ม + บอกเหตุผลว่าทำไมถึงไม่มั่นใจ (⑤ ส้ม = ตรงนี้รอคุณอยู่)
 *   - ทุกช่องต้องแก้ได้ทันทีโดยไม่ต้องกดเข้าโหมดแก้ไข
 */

/** แถบหัวเรื่องบอกว่า AI ร่างให้แล้ว และมั่นใจกี่ช่อง */
export function AiDraftHeader({
  summary,
  title = 'AI ร่างให้แล้ว',
  hint = 'ตรวจอีกครั้งแล้วแก้เฉพาะจุดที่ไม่ตรงได้เลยค่ะ',
}: {
  summary: DraftSummary;
  title?: string;
  hint?: string;
}) {
  const allConfident = summary.confidentCount >= summary.totalCount;

  return (
    <div
      className={cn(
        'mb-4 flex items-start gap-3 rounded-xl border-2 p-4',
        allConfident ? 'border-primary-500 bg-primary-50' : 'border-attention-500 bg-attention-50',
      )}
    >
      <Sparkles
        className={cn(
          'mt-0.5 h-5 w-5 shrink-0',
          allConfident ? 'text-primary-600' : 'text-attention-600',
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              'font-display text-base font-bold',
              allConfident ? 'text-primary-800' : 'text-attention-800',
            )}
          >
            {title}
          </p>
          {/* ป้ายบอกความมั่นใจ ครูจะได้รู้ว่าต้องตรวจหนักแค่ไหน */}
          <span className="rounded-full bg-white px-2.5 py-0.5 text-sm font-bold text-ink ring-1 ring-slate-300">
            {summary.confidentCount}/{summary.totalCount} ชัดเจน
          </span>
        </div>
        <p className="mt-0.5 text-base leading-relaxed text-ink">
          {allConfident ? 'AI มั่นใจทุกช่อง ตรวจแล้วกดต่อได้เลยค่ะ' : hint}
        </p>
      </div>
    </div>
  );
}

/**
 * กรอบของช่องที่ AI เดามาให้
 * ครูแก้ได้ทันทีโดยไม่ต้องกดปุ่ม "แก้ไข" ก่อน
 */
export function DraftField({
  label,
  confidence,
  reason,
  children,
  onEdit,
  editLabel = 'เปลี่ยน',
}: {
  label: string;
  confidence: Confidence;
  reason?: string;
  children: ReactNode;
  /** ถ้าส่งมา จะมีปุ่มเล็ก ๆ ให้กดเปลี่ยนค่า (ใช้กับช่องที่ต้องเลือกจากรายการ) */
  onEdit?: () => void;
  editLabel?: string;
}) {
  const uncertain = confidence === 'low';

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-3 transition-colors',
        uncertain ? 'border-attention-500 bg-attention-50' : 'border-slate-200 bg-white',
      )}
    >
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-light">
          {label}
          {uncertain ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-attention-500 px-2 py-0.5 text-xs font-bold text-white">
              <AlertCircle className="h-3 w-3" aria-hidden />
              AI ไม่แน่ใจ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-700">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              AI มั่นใจ
            </span>
          )}
        </span>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-[32px] items-center gap-1 rounded-btn px-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {editLabel}
          </button>
        )}
      </div>

      {children}

      {reason && (
        <p
          className={cn(
            'mt-1.5 text-sm leading-relaxed',
            uncertain ? 'text-attention-800' : 'text-ink-light',
          )}
        >
          {reason}
        </p>
      )}
    </div>
  );
}
