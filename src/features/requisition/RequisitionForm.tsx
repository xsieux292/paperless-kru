import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, PackageOpen, Send, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toFriendlyMessage } from '@/api/http';
import { useApprovers, useProjects } from '@/hooks/useCatalog';
import { useCreateRequisition } from '@/hooks/useRequisitions';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/toastContext';
import type { RequisitionItem, RequisitionKind } from '@/types';
import { AiItemSuggestDialog } from './AiItemSuggestDialog';
import { RequisitionItemsEditor } from './RequisitionItemsEditor';

const TOTAL_STEPS = 3;
const formatBaht = (value: number) => value.toLocaleString('th-TH');

let seq = 0;

/**
 * ฟอร์มเบิกงบ / ยืมพัสดุ (Flow B ใน archive/new UX,UI/plan.md)
 *
 * ตาม plan:
 *   - แบ่งเป็น 3 ขั้น มี progress bar และบอก "ขั้นที่ x จาก 3" เสมอ
 *   - ช่องรายการอุปกรณ์มีปุ่ม "ให้ AI ช่วยคิด"
 *   - ส่งแล้วเข้าคิวรอผู้อนุมัติเซ็น
 *   - ปุ่มหลักติดล่าง กว้างเต็มขอบ และมีปุ่มทึบเดียวต่อจอ
 */
export function RequisitionForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<RequisitionKind>('budget');
  const [purpose, setPurpose] = useState('');
  const [projectId, setProjectId] = useState('');
  const [neededBy, setNeededBy] = useState('');
  const [approverId, setApproverId] = useState('');
  const [items, setItems] = useState<RequisitionItem[]>([]);
  const [aiOpen, setAiOpen] = useState(false);

  const toast = useToast();
  const { data: projects } = useProjects();
  const { data: approvers } = useApprovers();
  const create = useCreateRequisition();

  const showPrice = kind === 'budget';
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );

  const validItems = items.filter((item) => item.name.trim().length > 0);

  const stepBlocked: Record<number, string | null> = {
    1: !purpose.trim()
      ? 'กรุณากรอกว่าจะเบิกไปใช้ทำอะไรค่ะ'
      : !projectId
        ? 'กรุณาเลือกโครงการที่จะเบิกค่ะ'
        : !neededBy.trim()
          ? 'กรุณาระบุวันที่ต้องใช้ของค่ะ'
          : null,
    2:
      validItems.length === 0
        ? 'ต้องมีรายการอย่างน้อย 1 รายการ และต้องใส่ชื่อรายการด้วยค่ะ'
        : null,
    3: !approverId ? 'กรุณาเลือกผู้อนุมัติค่ะ' : null,
  };

  const blocked = stepBlocked[step] ?? null;

  const goNext = () => {
    if (blocked) {
      toast.error('ยังไปต่อไม่ได้ค่ะ', blocked);
      return;
    }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const handleSubmit = async () => {
    if (blocked) {
      toast.error('ยังส่งไม่ได้ค่ะ', blocked);
      return;
    }
    try {
      const created = await create.mutateAsync({
        kind,
        purpose: purpose.trim(),
        projectId,
        neededBy: neededBy.trim(),
        approverId,
        items: validItems.map(({ id: _id, ...rest }) => {
          void _id;
          return rest;
        }),
      });

      toast.success(
        'ส่งใบเบิกเรียบร้อยแล้วค่ะ',
        `เลขที่ ${created.docNo} — ส่งให้ ${created.approverName} เซ็นอนุมัติแล้ว รอผลภายใน 2 วันทำการ`,
      );

      setStep(1);
      setPurpose('');
      setProjectId('');
      setNeededBy('');
      setApproverId('');
      setItems([]);
      onSubmitted();
    } catch (error) {
      toast.error('ส่งใบเบิกไม่สำเร็จ', toFriendlyMessage(error));
    }
  };

  const selectedProject = projects?.find((item) => item.id === projectId);
  const selectedApprover = approvers?.find((item) => item.id === approverId);

  return (
    <>
      <div className="card p-5 sm:p-6">
        {/* ตัวบอกความคืบหน้า — ต้องรู้เสมอว่าอยู่ขั้นไหนจากทั้งหมดกี่ขั้น */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-base font-bold text-ink">
              ขั้นที่ {step} จาก {TOTAL_STEPS}
            </span>
            <span className="text-base text-ink-light">
              {step === 1 ? 'ข้อมูลคำขอ' : step === 2 ? 'รายการที่ต้องการ' : 'ผู้อนุมัติและตรวจทาน'}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, index) => (
              <div
                key={index}
                className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  index + 1 <= step ? 'bg-primary-600' : 'bg-slate-200',
                )}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 font-display text-heading text-ink">จะทำเรื่องอะไรคะ?</h3>
              <div role="radiogroup" aria-label="ประเภทคำขอ" className="grid gap-2 sm:grid-cols-2">
                <KindButton
                  active={kind === 'budget'}
                  icon={Wallet}
                  title="เบิกงบซื้อของ"
                  subtitle="ซื้อวัสดุอุปกรณ์ด้วยงบโครงการ"
                  onClick={() => setKind('budget')}
                />
                <KindButton
                  active={kind === 'borrow'}
                  icon={PackageOpen}
                  title="ยืมพัสดุของโรงเรียน"
                  subtitle="ยืมของที่มีอยู่แล้วไปใช้ชั่วคราว"
                  onClick={() => setKind('borrow')}
                />
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-base font-semibold text-ink">
                เบิกไปใช้ทำอะไรคะ?
              </span>
              <textarea
                rows={2}
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                placeholder="เช่น จัดซื้อวัสดุสำหรับกิจกรรมวันวิทยาศาสตร์"
                className="w-full rounded-xl border border-slate-300 p-3 text-base text-ink placeholder:text-ink-mute focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-base font-semibold text-ink">
                เบิกจากโครงการไหน?
              </span>
              <div role="radiogroup" aria-label="โครงการ" className="space-y-2">
                {projects?.map((project) => {
                  const selected = projectId === project.id;
                  const remaining = project.budgetTotal - project.budgetUsed;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setProjectId(project.id)}
                      className={cn(
                        'w-full rounded-xl border-2 p-3 text-left transition-all',
                        selected
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-base font-bold text-ink">{project.name}</p>
                          <p className="text-sm text-ink-light">
                            {project.code} · คงเหลือ {formatBaht(remaining)} บาท
                          </p>
                        </div>
                        <span
                          aria-hidden
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                            selected
                              ? 'border-primary-600 bg-primary-600 text-white'
                              : 'border-slate-300',
                          )}
                        >
                          {selected && <Check className="h-4 w-4" strokeWidth={3} />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-base font-semibold text-ink">
                ต้องใช้ของวันไหน?
              </span>
              <input
                value={neededBy}
                onChange={(event) => setNeededBy(event.target.value)}
                placeholder="เช่น 18 ส.ค. 2569"
                className="h-12 w-full rounded-btn border border-slate-300 px-3 text-base text-ink placeholder:text-ink-mute focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
              />
              <span className="mt-1 block text-sm text-ink-light">
                ระบุเป็น พ.ศ. ได้เลยค่ะ เจ้าหน้าที่พัสดุจะใช้วันนี้จัดคิวให้
              </span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-display text-heading text-ink">
              {showPrice ? 'จะซื้ออะไรบ้างคะ?' : 'จะยืมอะไรบ้างคะ?'}
            </h3>
            <RequisitionItemsEditor
              items={items}
              showPrice={showPrice}
              onChange={setItems}
              onOpenAiSuggest={() => setAiOpen(true)}
              disabled={create.isPending}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 font-display text-heading text-ink">ส่งให้ใครเซ็นอนุมัติคะ?</h3>
              <div role="radiogroup" aria-label="ผู้อนุมัติ" className="space-y-2">
                {approvers?.map((approver) => {
                  const selected = approverId === approver.id;
                  return (
                    <button
                      key={approver.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setApproverId(approver.id)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-xl border-2 p-3 text-left transition-all',
                        selected
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block font-display text-base font-bold text-ink">
                          {approver.name}
                        </span>
                        <span className="block text-sm text-ink-light">{approver.role}</span>
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                          selected
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-slate-300',
                        )}
                      >
                        {selected && <Check className="h-4 w-4" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ตรวจทานก่อนส่ง */}
            <dl className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-display text-base font-bold text-ink">ตรวจทานก่อนส่ง</h4>

              <Row label="ประเภท" value={showPrice ? 'เบิกงบซื้อของ' : 'ยืมพัสดุของโรงเรียน'} />
              <Row label="เรื่อง" value={purpose.trim() || '—'} />
              <Row label="โครงการ" value={selectedProject?.name ?? '—'} />
              <Row label="ต้องใช้วันที่" value={neededBy.trim() || '—'} />
              <Row label="จำนวนรายการ" value={`${validItems.length} รายการ`} />
              <Row label="ผู้อนุมัติ" value={selectedApprover?.name ?? '—'} />

              {showPrice && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                  <dt className="text-base text-ink-light">ยอดรวม</dt>
                  <dd className="font-display text-money text-primary-700">
                    {formatBaht(total)} บาท
                  </dd>
                </div>
              )}
            </dl>

            {selectedProject && showPrice && total > selectedProject.budgetTotal - selectedProject.budgetUsed && (
              <div className="rounded-xl border-2 border-attention-500 bg-attention-50 p-3">
                <p className="text-base font-bold text-attention-800">
                  ยอดนี้เกินงบคงเหลือของโครงการ
                </p>
                <p className="mt-0.5 text-base text-ink">
                  คงเหลือ {formatBaht(selectedProject.budgetTotal - selectedProject.budgetUsed)} บาท
                  — ส่งได้ แต่ผู้อนุมัติอาจตีกลับ ลองลดจำนวนหรือเปลี่ยนโครงการดูนะคะ
                </p>
              </div>
            )}
          </div>
        )}

        {blocked && (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-base text-ink-light">
            {blocked}
          </p>
        )}

        {/* ปุ่มหลักอยู่ล่างสุดเสมอ ตำแหน่งเดิมทุกขั้น */}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {step > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={create.isPending}
              leftIcon={<ArrowLeft className="h-5 w-5" aria-hidden />}
              onClick={() => setStep((current) => current - 1)}
              className="sm:w-auto"
              fullWidth
            >
              ย้อนกลับ
            </Button>
          )}

          <div className="flex-1">
            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                disabled={Boolean(blocked)}
                onClick={goNext}
              >
                <span className="inline-flex items-center gap-2">
                  {step === 1 ? 'ไปกรอกรายการที่ต้องการ' : 'ไปเลือกผู้อนุมัติ'}
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={create.isPending}
                loadingText="กำลังส่งใบเบิก…"
                disabled={Boolean(blocked)}
                leftIcon={<Send className="h-5 w-5" aria-hidden />}
                onClick={() => void handleSubmit()}
              >
                ส่งใบเบิกให้ {selectedApprover?.name ?? 'ผู้อนุมัติ'} เซ็น
              </Button>
            )}
          </div>
        </div>
      </div>

      <AiItemSuggestDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onAdd={(suggested) =>
          setItems((current) => [
            ...current,
            ...suggested.map((item) => ({
              id: `ai-${++seq}`,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: showPrice ? item.unitPrice : 0,
            })),
          ])
        }
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-base text-ink-light">{label}</dt>
      <dd className="text-right text-base font-semibold text-ink">{value}</dd>
    </div>
  );
}

function KindButton({
  active,
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: typeof Wallet;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all',
        active ? 'border-primary-600 bg-primary-50' : 'border-slate-200 bg-white hover:border-slate-300',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          active ? 'bg-primary-600 text-white' : 'bg-slate-100 text-ink-light',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-base font-bold text-ink">{title}</span>
        <span className="block text-sm text-ink-light">{subtitle}</span>
      </span>
    </button>
  );
}
