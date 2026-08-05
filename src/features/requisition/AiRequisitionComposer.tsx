import { useMemo, useState } from 'react';
import { Mic, PencilLine, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AiDraftHeader, DraftField } from '@/components/ui/AiDraftBadge';
import { toFriendlyMessage } from '@/api/http';
import { useApprovers, useProjects } from '@/hooks/useCatalog';
import { useDraftRequisition } from '@/hooks/useAiAssist';
import { useCreateRequisition } from '@/hooks/useRequisitions';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/toastContext';
import type { RequisitionDraft, RequisitionItem } from '@/types';

const baht = (value: number) => value.toLocaleString('th-TH');

const EXAMPLES = [
  'ซื้อของจัดกิจกรรมวันวิทยาศาสตร์ ใช้สัปดาห์หน้า',
  'ยืมโปรเจกเตอร์ไปสอนเสริมคณิต พรุ่งนี้',
  'จัดอบรมครู 50 คน ต้องใช้เดือนหน้า',
];

/**
 * เขียนใบเบิกด้วยประโยคเดียว
 *
 * ปัญหาเดิม: ฟอร์ม 3 ขั้นบังคับให้ครูกรอกเอง ~8 ช่อง ซึ่งไม่ต่างจากเขียนใบเบิกกระดาษ
 * วิธีแก้: ให้ครูพิมพ์แบบที่พูดได้เลย 1 บรรทัด แล้ว AI เดาให้ทั้งใบ
 *   — ประเภท / เรื่อง / โครงการ / วันที่ต้องใช้ / ผู้อนุมัติ / รายการของ
 * ครูเห็นผลทันทีและแก้เฉพาะช่องที่ผิด ซึ่งเร็วกว่าเริ่มจากหน้าว่างมาก
 */
export function AiRequisitionComposer({
  onSubmitted,
  onSwitchToManual,
}: {
  onSubmitted: () => void;
  onSwitchToManual: () => void;
}) {
  const [description, setDescription] = useState('');
  const [draft, setDraft] = useState<RequisitionDraft | null>(null);

  // ค่าที่ครูแก้ทับของ AI — เก็บแยกเพื่อให้รู้ว่าอะไรถูกแก้ไปแล้วบ้าง
  const [purpose, setPurpose] = useState('');
  const [projectId, setProjectId] = useState('');
  const [neededBy, setNeededBy] = useState('');
  const [approverId, setApproverId] = useState('');
  const [items, setItems] = useState<RequisitionItem[]>([]);

  const toast = useToast();
  const projects = useProjects();
  const approvers = useApprovers();
  const drafting = useDraftRequisition();
  const create = useCreateRequisition();

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );

  const handleDraft = () => {
    drafting.mutate(description, {
      onSuccess: (result) => {
        setDraft(result);
        setPurpose(result.purpose.value);
        setProjectId(result.projectId.value);
        setNeededBy(result.neededBy.value);
        setApproverId(result.approverId.value);
        setItems(
          result.items.map((item, index) => ({ ...item, id: `draft-${index}` })),
        );
      },
      onError: (error) => toast.error('ยังร่างให้ไม่ได้', toFriendlyMessage(error)),
    });
  };

  const handleSubmit = async () => {
    if (!draft) return;
    try {
      const created = await create.mutateAsync({
        kind: draft.kind.value,
        purpose: purpose.trim(),
        projectId,
        neededBy: neededBy.trim(),
        approverId,
        items: items
          .filter((item) => item.name.trim())
          .map(({ id: _id, ...rest }) => {
            void _id;
            return rest;
          }),
      });

      toast.success(
        'ส่งใบเบิกเรียบร้อยแล้วค่ะ',
        `เลขที่ ${created.docNo} — ส่งให้ ${created.approverName} เซ็นอนุมัติแล้ว`,
      );

      setDescription('');
      setDraft(null);
      setItems([]);
      onSubmitted();
    } catch (error) {
      toast.error('ส่งใบเบิกไม่สำเร็จ', toFriendlyMessage(error));
    }
  };

  const selectedProject = projects.data?.find((item) => item.id === projectId);
  const remaining = selectedProject
    ? selectedProject.budgetTotal - selectedProject.budgetUsed
    : null;

  /* ---------- ขั้นแรก: พิมพ์ประโยคเดียว ---------- */
  if (!draft) {
    return (
      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <Sparkles className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-heading text-ink">เล่าให้ AI ฟังสั้น ๆ พอค่ะ</h2>
            <p className="mt-0.5 text-base text-ink-light">
              พิมพ์แบบที่คุณครูพูดได้เลย ไม่ต้องเป็นภาษาราชการ — AI จะร่างใบเบิกให้ทั้งใบ
              แล้วคุณครูค่อยตรวจ
            </p>
          </div>
        </div>

        <label htmlFor="req-desc" className="sr-only">
          จะเบิกอะไร
        </label>
        <textarea
          id="req-desc"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="เช่น ซื้อของจัดกิจกรรมวันวิทยาศาสตร์ ใช้สัปดาห์หน้า"
          className="w-full rounded-xl border border-slate-300 p-4 text-base text-ink placeholder:text-ink-mute focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
        />

        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-light">
          <Mic className="h-4 w-4 shrink-0" aria-hidden />
          พิมพ์ไม่สะดวก ใช้ปุ่มไมค์บนแป้นพิมพ์พูดใส่ได้เลยค่ะ
        </p>

        <div className="mt-3">
          <p className="mb-2 text-sm font-semibold text-ink-light">หรือแตะตัวอย่างนี้ก็ได้ค่ะ</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setDescription(example)}
                className="tap-target rounded-btn border border-slate-300 bg-white px-3 text-base text-ink transition hover:border-primary-500 hover:bg-primary-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          className="mt-5"
          disabled={!description.trim()}
          isLoading={drafting.isPending}
          loadingText="AI กำลังร่างใบเบิกให้…"
          leftIcon={<Sparkles className="h-5 w-5" aria-hidden />}
          onClick={handleDraft}
        >
          ให้ AI ร่างใบเบิกให้
        </Button>

        <button
          type="button"
          onClick={onSwitchToManual}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-btn py-3 text-base font-bold text-ink-light transition hover:bg-slate-50"
        >
          <PencilLine className="h-5 w-5" aria-hidden />
          หรือกรอกเองทีละขั้น
        </button>
      </div>
    );
  }

  /* ---------- ขั้นสอง: ตรวจของที่ AI ร่างมา ---------- */
  return (
    <div className="card p-5 sm:p-6">
      <AiDraftHeader summary={draft.summary} title="AI ร่างใบเบิกให้แล้ว" />

      <div className="space-y-3">
        <DraftField label="ประเภท" confidence={draft.kind.confidence}>
          <p className="text-base font-bold text-ink">
            {draft.kind.value === 'budget' ? 'เบิกงบซื้อของ' : 'ยืมพัสดุของโรงเรียน'}
          </p>
        </DraftField>

        <DraftField
          label="เรื่อง"
          confidence={draft.purpose.confidence}
          reason={draft.purpose.reason}
        >
          <textarea
            rows={2}
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            aria-label="เรื่องที่ขอเบิก"
            className="w-full rounded-btn border border-slate-300 bg-white p-2.5 text-base text-ink focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
          />
        </DraftField>

        <DraftField
          label="โครงการ"
          confidence={draft.projectId.confidence}
          reason={draft.projectId.reason}
        >
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            aria-label="โครงการ"
            className="tap-target w-full rounded-btn border border-slate-300 bg-white px-2.5 text-base text-ink focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
          >
            {projects.data?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {remaining !== null && (
            <p className="mt-1 text-sm text-ink-light">งบคงเหลือ {baht(remaining)} บาท</p>
          )}
        </DraftField>

        <DraftField
          label="วันที่ต้องใช้"
          confidence={draft.neededBy.confidence}
          reason={draft.neededBy.reason}
        >
          <input
            value={neededBy}
            onChange={(event) => setNeededBy(event.target.value)}
            aria-label="วันที่ต้องใช้"
            className="tap-target w-full rounded-btn border border-slate-300 bg-white px-2.5 text-base text-ink focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
          />
        </DraftField>

        <DraftField
          label="ผู้อนุมัติ"
          confidence={draft.approverId.confidence}
          reason={draft.approverId.reason}
        >
          <select
            value={approverId}
            onChange={(event) => setApproverId(event.target.value)}
            aria-label="ผู้อนุมัติ"
            className="tap-target w-full rounded-btn border border-slate-300 bg-white px-2.5 text-base text-ink focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
          >
            {approvers.data?.map((approver) => (
              <option key={approver.id} value={approver.id}>
                {approver.name} — {approver.role}
              </option>
            ))}
          </select>
        </DraftField>

        {/* รายการของ — แก้ในตารางได้เลย ไม่ต้องเปิดหน้าใหม่ */}
        <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink-light">
              รายการที่ AI คิดให้ ({items.length} รายการ)
            </span>
            <span className="text-sm text-ink-light">แตะแก้ได้ทุกช่อง</span>
          </div>

          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={item.id} className="rounded-btn bg-slate-50 p-2.5">
                <div className="flex items-center gap-2">
                  <input
                    value={item.name}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.id === item.id ? { ...entry, name: event.target.value } : entry,
                        ),
                      )
                    }
                    aria-label={`ชื่อรายการที่ ${index + 1}`}
                    className="h-11 min-w-0 flex-1 rounded-btn border border-slate-300 bg-white px-2 text-base text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => setItems((current) => current.filter((e) => e.id !== item.id))}
                    aria-label={`ลบ ${item.name}`}
                    className="tap-target flex shrink-0 items-center justify-center rounded-btn px-2 text-ink-light transition hover:bg-danger-50 hover:text-danger-600"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) }
                            : entry,
                        ),
                      )
                    }
                    aria-label="จำนวน"
                    className="h-11 w-20 rounded-btn border border-slate-300 bg-white px-2 text-base text-ink"
                  />
                  <span className="text-base text-ink-light">{item.unit}</span>
                  {draft.kind.value === 'budget' && (
                    <>
                      <span className="text-base text-ink-light">×</span>
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(event) =>
                          setItems((current) =>
                            current.map((entry) =>
                              entry.id === item.id
                                ? {
                                    ...entry,
                                    unitPrice: Math.max(0, Number(event.target.value) || 0),
                                  }
                                : entry,
                            ),
                          )
                        }
                        aria-label="ราคาต่อหน่วย"
                        className="h-11 w-24 rounded-btn border border-slate-300 bg-white px-2 text-base text-ink"
                      />
                      <span className="ml-auto shrink-0 text-base font-bold text-ink">
                        {baht(item.quantity * item.unitPrice)} บาท
                      </span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {draft.kind.value === 'budget' && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="font-display text-base font-bold text-ink">ยอดรวมทั้งใบ</span>
              <span className="font-display text-money text-primary-700">{baht(total)} บาท</span>
            </div>
          )}
        </div>

        {/* เตือนงบก่อนส่ง ดีกว่าถูกตีกลับ */}
        {remaining !== null && draft.kind.value === 'budget' && total > remaining && (
          <div className="rounded-xl border-2 border-attention-500 bg-attention-50 p-3">
            <p className="text-base font-bold text-attention-800">ยอดนี้เกินงบคงเหลือของโครงการ</p>
            <p className="mt-0.5 text-base text-ink">
              เกินอยู่ {baht(total - remaining)} บาท — ส่งได้ แต่ผู้อนุมัติอาจตีกลับ
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={create.isPending}
          loadingText="กำลังส่งใบเบิก…"
          leftIcon={<Send className="h-5 w-5" aria-hidden />}
          onClick={() => void handleSubmit()}
          disabled={!purpose.trim() || items.length === 0}
        >
          ถูกต้องแล้ว — ส่งให้เซ็นอนุมัติ
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="md"
          fullWidth
          disabled={create.isPending}
          onClick={() => setDraft(null)}
        >
          เล่าใหม่อีกครั้ง
        </Button>
      </div>

      <p className={cn('mt-3 text-center text-sm text-ink-light')}>
        ระบบจะออกเลขที่เอกสารและส่งให้ผู้อนุมัติเซ็นให้เอง คุณครูไม่ต้องเดินเอกสาร
      </p>
    </div>
  );
}
