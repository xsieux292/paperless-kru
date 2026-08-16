import { PackageOpen, Plus, Sparkles, Trash2, Wallet } from 'lucide-react';
import { toFriendlyMessage } from '@/api/http';
import { useApprovers, useProjects } from '@/hooks/useCatalog';
import type { Project, RequisitionItem, RequisitionKind, SuggestedItem } from '@/types';
import {
  Field,
  RowSkeleton,
  SectionTitle,
  SelectableRow,
  inputClass,
  textareaClass,
} from '../components/MobileUi';

/**
 * "เลือก เบิก จบ" เวอร์ชัน LIFF — Flow B ในแผน UX
 * ใช้ hooks และ mock API ชุดเดียวกับหน้าเว็บ ใบเบิกที่สร้างจึงเป็นใบเดียวกัน
 */

const baht = (value: number) => value.toLocaleString('th-TH');

/** ขั้นที่ 1 — ข้อมูลคำขอ */
export function RequisitionInfoScreen({
  kind,
  onKindChange,
  purpose,
  onPurposeChange,
  projectId,
  onProjectChange,
  neededBy,
  onNeededByChange,
}: {
  kind: RequisitionKind;
  onKindChange: (kind: RequisitionKind) => void;
  purpose: string;
  onPurposeChange: (value: string) => void;
  projectId: string;
  onProjectChange: (id: string) => void;
  neededBy: string;
  onNeededByChange: (value: string) => void;
}) {
  const projects = useProjects();

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle hint="เลือกของ ส่งตรวจ และติดตามสถานะได้ในเส้นทางเดียว">
          จะทำเรื่องอะไรคะ?
        </SectionTitle>
        <div role="radiogroup" aria-label="ประเภทคำขอ" className="space-y-2">
          <SelectableRow
            selected={kind === 'budget'}
            onSelect={() => onKindChange('budget')}
            icon={Wallet}
            title="เบิกงบซื้อของ"
            subtitle="ซื้อวัสดุอุปกรณ์ด้วยงบโครงการ"
          />
          <SelectableRow
            selected={kind === 'borrow'}
            onSelect={() => onKindChange('borrow')}
            icon={PackageOpen}
            title="ยืมพัสดุของโรงเรียน"
            subtitle="ยืมของที่มีอยู่แล้วไปใช้ชั่วคราว"
          />
        </div>
      </div>

      <Field label="เบิกไปใช้ทำอะไรคะ?">
        <textarea
          rows={2}
          value={purpose}
          onChange={(event) => onPurposeChange(event.target.value)}
          placeholder="เช่น จัดซื้อวัสดุสำหรับกิจกรรมวันวิทยาศาสตร์"
          className={textareaClass}
        />
      </Field>

      <div>
        <SectionTitle hint="เห็นงบคงเหลือได้เลย ไม่ต้องไปเปิดดูที่อื่น">
          เบิกจากโครงการไหน?
        </SectionTitle>

        {projects.isLoading && <RowSkeleton count={2} />}

        <div role="radiogroup" aria-label="โครงการ" className="space-y-2">
          {projects.data?.map((project: Project) => (
            <SelectableRow
              key={project.id}
              selected={projectId === project.id}
              onSelect={() => onProjectChange(project.id)}
              title={project.name}
              subtitle={project.code}
              meta={`คงเหลือ ${baht(project.budgetTotal - project.budgetUsed)} บาท`}
            />
          ))}
        </div>
      </div>

      <Field label="ต้องใช้ของวันไหน?" hint="ระบุเป็น พ.ศ. ได้เลยค่ะ">
        <input
          value={neededBy}
          onChange={(event) => onNeededByChange(event.target.value)}
          placeholder="เช่น 18 ส.ค. 2569"
          className={inputClass}
        />
      </Field>
    </div>
  );
}

/** ขั้นที่ 2 — รายการอุปกรณ์ + ปุ่มให้ AI ช่วยคิด */
export function RequisitionItemsScreen({
  items,
  showPrice,
  onChange,
  onOpenAi,
  aiPending,
}: {
  items: RequisitionItem[];
  showPrice: boolean;
  onChange: (items: RequisitionItem[]) => void;
  onOpenAi: () => void;
  aiPending: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const update = (id: string, patch: Partial<RequisitionItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-3">
      <SectionTitle hint="ให้ AI ตั้งต้นรายการและราคาอ้างอิง แล้วคุณครูตรวจก่อนส่ง">
        {showPrice ? 'จะซื้ออะไรบ้างคะ?' : 'จะยืมอะไรบ้างคะ?'}
      </SectionTitle>

      {/* จุดขายของ flow นี้ — ปุ่ม AI เด่นกว่าปุ่มเพิ่มเอง */}
      <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-3">
        <p className="font-display text-[14px] font-bold text-ink">ไม่รู้ต้องใช้ของอะไรบ้าง?</p>
        <p className="mb-2 mt-0.5 text-[12px] text-ink-light">
          บอก AI สั้น ๆ ว่าจะจัดกิจกรรมอะไร แล้วให้ช่วยคิดรายการ ราคาอ้างอิง และเหตุผลให้
        </p>
        <button
          type="button"
          onClick={onOpenAi}
          disabled={aiPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-primary-600 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          {aiPending ? 'AI กำลังคิดให้…' : 'ให้ AI ช่วยคิดรายการอุปกรณ์'}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center">
          <p className="text-[13px] font-semibold text-ink">ยังไม่มีรายการในใบเบิก</p>
          <p className="mt-0.5 text-[12px] text-ink-light">ให้ AI ช่วยคิด หรือเพิ่มเองด้านล่าง</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-ink-mute">รายการที่ {index + 1}</span>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
                  aria-label={`ลบรายการที่ ${index + 1}`}
                  className="flex min-h-[36px] items-center gap-1 rounded-btn px-2 text-[12px] font-bold text-ink-light"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  <span aria-hidden>ลบ</span>
                </button>
              </div>

              <input
                value={item.name}
                onChange={(event) => update(item.id, { name: event.target.value })}
                placeholder="ชื่อรายการ"
                className={inputClass}
                aria-label={`ชื่อรายการที่ ${index + 1}`}
              />

              <div className={`mt-2 grid gap-2 ${showPrice ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    update(item.id, { quantity: Math.max(1, Number(event.target.value) || 1) })
                  }
                  className={inputClass}
                  aria-label="จำนวน"
                />
                <input
                  value={item.unit}
                  onChange={(event) => update(item.id, { unit: event.target.value })}
                  placeholder="หน่วย"
                  className={inputClass}
                  aria-label="หน่วย"
                />
                {showPrice && (
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(event) =>
                      update(item.id, { unitPrice: Math.max(0, Number(event.target.value) || 0) })
                    }
                    className={inputClass}
                    aria-label="ราคาต่อหน่วย"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() =>
          onChange([
            ...items,
            { id: `manual-${Date.now()}`, name: '', quantity: 1, unit: 'ชิ้น', unitPrice: 0 },
          ])
        }
        className="flex h-12 w-full items-center justify-center gap-2 rounded-btn border-2 border-dashed border-slate-300 bg-white text-[13px] font-bold text-ink-light"
      >
        <Plus className="h-5 w-5" aria-hidden />
        เพิ่มรายการเอง
      </button>

      {showPrice && items.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
          <span className="font-display text-[13px] font-bold text-ink">ยอดรวมทั้งใบ</span>
          <span className="font-display text-[20px] font-bold text-primary-700">
            {baht(total)} บาท
          </span>
        </div>
      )}
    </div>
  );
}

/** ขั้นที่ 3 — ผู้อนุมัติ + ตรวจทาน */
export function RequisitionApproverScreen({
  approverId,
  onApproverChange,
  summary,
}: {
  approverId: string;
  onApproverChange: (id: string) => void;
  summary: {
    kindLabel: string;
    purpose: string;
    projectName: string;
    neededBy: string;
    itemCount: number;
    total: number;
    showPrice: boolean;
    overBudgetBy: number | null;
  };
}) {
  const approvers = useApprovers();

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle hint="ระบบส่งให้เอง ครูไม่ต้องเดินเอกสาร">
          ส่งให้ใครเซ็นอนุมัติคะ?
        </SectionTitle>

        {approvers.isLoading && <RowSkeleton count={3} />}
        {approvers.isError && (
          <p className="text-[12px] text-danger-700">{toFriendlyMessage(approvers.error)}</p>
        )}

        <div role="radiogroup" aria-label="ผู้อนุมัติ" className="space-y-2">
          {approvers.data?.map((approver) => (
            <SelectableRow
              key={approver.id}
              selected={approverId === approver.id}
              onSelect={() => onApproverChange(approver.id)}
              title={approver.name}
              subtitle={approver.role}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>ตรวจทานก่อนส่ง</SectionTitle>
        <dl className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-[13px]">
          <Row label="ประเภท" value={summary.kindLabel} />
          <Row label="เรื่อง" value={summary.purpose || '—'} />
          <Row label="โครงการ" value={summary.projectName || '—'} />
          <Row label="ต้องใช้วันที่" value={summary.neededBy || '—'} />
          <Row label="จำนวนรายการ" value={`${summary.itemCount} รายการ`} />

          {summary.showPrice && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-2">
              <dt className="text-ink-light">ยอดรวม</dt>
              <dd className="font-display text-[20px] font-bold text-primary-700">
                {baht(summary.total)} บาท
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* เตือนก่อนส่ง ดีกว่าให้ถูกตีกลับแล้วทำใหม่ทั้งใบ */}
      {summary.overBudgetBy !== null && summary.overBudgetBy > 0 && (
        <div className="rounded-xl border-2 border-attention-500 bg-attention-50 p-3">
          <p className="text-[13px] font-bold text-attention-800">ยอดนี้เกินงบคงเหลือของโครงการ</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink">
            เกินอยู่ {baht(summary.overBudgetBy)} บาท — ส่งได้ แต่ผู้อนุมัติอาจตีกลับ
            ลองลดจำนวนหรือเปลี่ยนโครงการดูนะคะ
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-ink-light">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}

/** แผ่นเลือกรายการที่ AI เสนอ — เปิดทับหน้า LIFF อีกที */
export function AiSuggestSheet({
  open,
  description,
  onDescriptionChange,
  items,
  selected,
  onToggle,
  onAsk,
  onAdd,
  onClose,
  pending,
  error,
}: {
  open: boolean;
  description: string;
  onDescriptionChange: (value: string) => void;
  items: SuggestedItem[];
  selected: Set<number>;
  onToggle: (index: number) => void;
  onAsk: () => void;
  onAdd: () => void;
  onClose: () => void;
  pending: boolean;
  error: unknown;
}) {
  if (!open) return null;

  const examples = [
    'จัดกิจกรรมวันวิทยาศาสตร์ มีฐานทดลอง 5 ฐาน',
    'จัดกีฬาสีภายใน 4 สี ใช้เวลา 2 วัน',
    'อบรมครู 1 วัน ผู้เข้าอบรม 50 คน',
  ];

  const total = items.reduce(
    (sum, item, index) => (selected.has(index) ? sum + item.quantity * item.unitPrice : sum),
    0,
  );

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-slate-900/50">
      <div className="max-h-[85%] animate-sheet-up overflow-y-auto rounded-t-2xl bg-white p-4">
        <div className="mb-3 flex items-start gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-display text-[15px] font-bold text-ink">
              ให้ AI ช่วยคิดรายการอุปกรณ์
            </h3>
            <p className="text-[12px] text-ink-light">
              พิมพ์สั้น ๆ ว่าจะจัดกิจกรรมอะไร AI จะเสนอรายการพร้อมราคาให้
            </p>
          </div>
        </div>

        <textarea
          rows={2}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="เช่น จัดกิจกรรมวันวิทยาศาสตร์ มีฐานทดลอง 5 ฐาน"
          className={textareaClass}
          aria-label="คำอธิบายกิจกรรม"
        />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onDescriptionChange(example)}
              className="rounded-full border border-slate-300 px-2.5 py-1.5 text-[11px] text-ink-light"
            >
              {example}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onAsk}
          disabled={pending || !description.trim()}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-primary-600 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:bg-ink-mute"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          {pending ? 'AI กำลังคิดรายการให้…' : 'ให้ AI คิดรายการให้'}
        </button>

        {Boolean(error) && (
          <p className="mt-2 rounded-lg border border-danger-300 bg-danger-50 p-2 text-[12px] text-danger-700">
            {toFriendlyMessage(error)}
          </p>
        )}

        {items.length > 0 && (
          <>
            <div className="mt-4 flex items-center justify-between">
              <p className="font-display text-[13px] font-bold text-ink">
                AI เสนอมา {items.length} รายการ
              </p>
              <p className="text-[12px] text-ink-light">
                เลือก {selected.size} · {baht(total)} บาท
              </p>
            </div>
            <p className="mb-2 mt-0.5 text-[11px] text-ink-light">
              เลือกไว้ให้หมดแล้ว แตะเอาออกได้ถ้าไม่ต้องการ
            </p>

            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <SelectableRow
                    selected={selected.has(index)}
                    onSelect={() => onToggle(index)}
                    title={item.name}
                    subtitle={`${item.quantity} ${item.unit} × ${baht(item.unitPrice)} บาท = ${baht(
                      item.quantity * item.unitPrice,
                    )} บาท`}
                    meta={item.reason}
                  />
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={onAdd}
              disabled={selected.size === 0}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-primary-600 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:bg-ink-mute"
            >
              <Plus className="h-5 w-5" aria-hidden />
              ใส่ {selected.size} รายการลงในใบเบิก
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-2 h-11 w-full rounded-btn text-[13px] font-bold text-ink-light"
        >
          ปิดหน้าต่างนี้
        </button>
      </div>
    </div>
  );
}
