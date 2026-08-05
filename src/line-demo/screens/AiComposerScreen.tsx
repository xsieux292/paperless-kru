import { AlertCircle, Check, Mic, Sparkles, Trash2 } from 'lucide-react';
import { useApprovers, useProjects } from '@/hooks/useCatalog';
import { cn } from '@/lib/cn';
import type { RequisitionDraft, RequisitionItem } from '@/types';
import { SectionTitle, inputClass, textareaClass } from '../components/MobileUi';

const baht = (value: number) => value.toLocaleString('th-TH');

const EXAMPLES = [
  'ซื้อของจัดกิจกรรมวันวิทยาศาสตร์ ใช้สัปดาห์หน้า',
  'ยืมโปรเจกเตอร์ไปสอนเสริม พรุ่งนี้',
  'จัดอบรมครู 50 คน เดือนหน้า',
];

/**
 * ขั้นแรก — ครูเล่าสั้น ๆ 1 บรรทัด
 * แทนที่ฟอร์ม 3 หน้าที่ต้องกรอกเองราว 8 ช่อง
 */
export function AiComposerInputScreen({
  description,
  onDescriptionChange,
}: {
  description: string;
  onDescriptionChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-[16px] font-bold leading-snug text-ink">
            เล่าให้ AI ฟังสั้น ๆ พอค่ะ
          </h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-light">
            พิมพ์แบบที่คุณครูพูดได้เลย ไม่ต้องเป็นภาษาราชการ — AI จะร่างใบเบิกให้ทั้งใบ
          </p>
        </div>
      </div>

      <textarea
        rows={3}
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        placeholder="เช่น ซื้อของจัดกิจกรรมวันวิทยาศาสตร์ ใช้สัปดาห์หน้า"
        className={textareaClass}
        aria-label="จะเบิกอะไร"
      />

      <p className="flex items-center gap-1.5 text-[12px] text-ink-light">
        <Mic className="h-4 w-4 shrink-0" aria-hidden />
        พิมพ์ไม่สะดวก ใช้ปุ่มไมค์บนแป้นพิมพ์พูดใส่ได้เลยค่ะ
      </p>

      <div>
        <p className="mb-1.5 text-[12px] font-semibold text-ink-light">หรือแตะตัวอย่างนี้ก็ได้</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onDescriptionChange(example)}
              className="min-h-[40px] rounded-btn border border-slate-300 bg-white px-3 text-[12px] text-ink"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** ขั้นสอง — ตรวจของที่ AI ร่างมา แก้ได้ทุกช่องทันที */
export function AiComposerReviewScreen({
  draft,
  purpose,
  onPurposeChange,
  projectId,
  onProjectChange,
  neededBy,
  onNeededByChange,
  approverId,
  onApproverChange,
  items,
  onItemsChange,
}: {
  draft: RequisitionDraft;
  purpose: string;
  onPurposeChange: (value: string) => void;
  projectId: string;
  onProjectChange: (value: string) => void;
  neededBy: string;
  onNeededByChange: (value: string) => void;
  approverId: string;
  onApproverChange: (value: string) => void;
  items: RequisitionItem[];
  onItemsChange: (items: RequisitionItem[]) => void;
}) {
  const projects = useProjects();
  const approvers = useApprovers();

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const project = projects.data?.find((item) => item.id === projectId);
  const remaining = project ? project.budgetTotal - project.budgetUsed : null;
  const allConfident = draft.summary.confidentCount >= draft.summary.totalCount;

  return (
    <div className="space-y-3">
      {/* ป้ายบอกความมั่นใจ — ครูจะได้รู้ว่าต้องตรวจหนักแค่ไหน */}
      <div
        className={cn(
          'flex items-start gap-2.5 rounded-xl border-2 p-3',
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
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'font-display text-[14px] font-bold',
                allConfident ? 'text-primary-800' : 'text-attention-800',
              )}
            >
              AI ร่างใบเบิกให้แล้ว
            </p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-ink ring-1 ring-slate-300">
              {draft.summary.confidentCount}/{draft.summary.totalCount} ชัดเจน
            </span>
          </div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink">
            ตรวจแล้วแก้เฉพาะช่องที่ไม่ตรงได้เลยค่ะ
          </p>
        </div>
      </div>

      <MobileDraftField label="ประเภท" confidence={draft.kind.confidence}>
        <p className="text-[14px] font-bold text-ink">
          {draft.kind.value === 'budget' ? 'เบิกงบซื้อของ' : 'ยืมพัสดุของโรงเรียน'}
        </p>
      </MobileDraftField>

      <MobileDraftField
        label="เรื่อง"
        confidence={draft.purpose.confidence}
        reason={draft.purpose.reason}
      >
        <textarea
          rows={2}
          value={purpose}
          onChange={(event) => onPurposeChange(event.target.value)}
          className={textareaClass}
          aria-label="เรื่องที่ขอเบิก"
        />
      </MobileDraftField>

      <MobileDraftField
        label="โครงการ"
        confidence={draft.projectId.confidence}
        reason={draft.projectId.reason}
      >
        <select
          value={projectId}
          onChange={(event) => onProjectChange(event.target.value)}
          className={inputClass}
          aria-label="โครงการ"
        >
          {projects.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {remaining !== null && (
          <p className="mt-1 text-[11px] text-ink-light">งบคงเหลือ {baht(remaining)} บาท</p>
        )}
      </MobileDraftField>

      <MobileDraftField
        label="วันที่ต้องใช้"
        confidence={draft.neededBy.confidence}
        reason={draft.neededBy.reason}
      >
        <input
          value={neededBy}
          onChange={(event) => onNeededByChange(event.target.value)}
          className={inputClass}
          aria-label="วันที่ต้องใช้"
        />
      </MobileDraftField>

      <MobileDraftField
        label="ผู้อนุมัติ"
        confidence={draft.approverId.confidence}
        reason={draft.approverId.reason}
      >
        <select
          value={approverId}
          onChange={(event) => onApproverChange(event.target.value)}
          className={inputClass}
          aria-label="ผู้อนุมัติ"
        >
          {approvers.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </MobileDraftField>

      {/* รายการของ — แก้ในที่เดียว ไม่ต้องเปิดหน้าใหม่ */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
        <SectionTitle hint="แตะแก้ได้ทุกช่อง">
          รายการที่ AI คิดให้ ({items.length} รายการ)
        </SectionTitle>

        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={item.id} className="rounded-btn bg-slate-50 p-2.5">
              <div className="flex items-center gap-2">
                <input
                  value={item.name}
                  onChange={(event) =>
                    onItemsChange(
                      items.map((entry) =>
                        entry.id === item.id ? { ...entry, name: event.target.value } : entry,
                      ),
                    )
                  }
                  aria-label={`ชื่อรายการที่ ${index + 1}`}
                  className="h-10 min-w-0 flex-1 rounded-btn border border-slate-300 bg-white px-2 text-[13px] text-ink"
                />
                <button
                  type="button"
                  onClick={() => onItemsChange(items.filter((entry) => entry.id !== item.id))}
                  aria-label={`ลบ ${item.name}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn text-ink-light"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    onItemsChange(
                      items.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) }
                          : entry,
                      ),
                    )
                  }
                  aria-label="จำนวน"
                  className="h-10 w-16 rounded-btn border border-slate-300 bg-white px-2 text-[13px] text-ink"
                />
                <span className="text-[12px] text-ink-light">{item.unit}</span>
                {draft.kind.value === 'budget' && (
                  <span className="ml-auto text-[13px] font-bold text-ink">
                    {baht(item.quantity * item.unitPrice)} บาท
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {draft.kind.value === 'budget' && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2.5">
            <span className="font-display text-[13px] font-bold text-ink">ยอดรวมทั้งใบ</span>
            <span className="font-display text-[20px] font-bold text-primary-700">
              {baht(total)} บาท
            </span>
          </div>
        )}
      </div>

      {remaining !== null && draft.kind.value === 'budget' && total > remaining && (
        <div className="rounded-xl border-2 border-attention-500 bg-attention-50 p-3">
          <p className="text-[13px] font-bold text-attention-800">ยอดนี้เกินงบคงเหลือของโครงการ</p>
          <p className="mt-0.5 text-[12px] text-ink">
            เกินอยู่ {baht(total - remaining)} บาท — ส่งได้ แต่ผู้อนุมัติอาจตีกลับ
          </p>
        </div>
      )}
    </div>
  );
}

function MobileDraftField({
  label,
  confidence,
  reason,
  children,
}: {
  label: string;
  confidence: 'high' | 'low';
  reason?: string;
  children: React.ReactNode;
}) {
  const uncertain = confidence === 'low';

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-3',
        uncertain ? 'border-attention-500 bg-attention-50' : 'border-slate-200 bg-white',
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[12px] font-semibold text-ink-light">{label}</span>
        {uncertain ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-attention-500 px-2 py-0.5 text-[10px] font-bold text-white">
            <AlertCircle className="h-3 w-3" aria-hidden />
            AI ไม่แน่ใจ
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary-700">
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            AI มั่นใจ
          </span>
        )}
      </div>

      {children}

      {reason && (
        <p
          className={cn(
            'mt-1.5 text-[11px] leading-relaxed',
            uncertain ? 'text-attention-800' : 'text-ink-light',
          )}
        >
          {reason}
        </p>
      )}
    </div>
  );
}
