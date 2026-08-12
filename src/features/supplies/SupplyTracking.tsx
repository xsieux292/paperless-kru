import { useEffect, useMemo, useState } from 'react';
import { Check, Circle, Clock3, PackageSearch, RotateCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useCancelSupplyRequest, useSupplyCatalog, useSupplyRequest } from '@/hooks/useSupplyRequisition';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/toastContext';
import type { SupplyRoute } from '@/routes';
import { formatThaiDate, getErrorMessage, LoadingSkeleton, RequestStatusBadge, StatePanel, SupplyPageHeading } from './SupplyShared';

const TIMELINE = [
  { title: 'ส่งคำขอแล้ว', detail: 'ระบบบันทึกคำขอเรียบร้อย' },
  { title: 'เจ้าหน้าที่กำลังตรวจของ', detail: 'กำลังตรวจสอบจำนวนพัสดุจริง' },
  { title: 'รอคุณครูยืนยัน', detail: 'ตรวจจำนวนและยืนยันด้วย OTP' },
  { title: 'พร้อมรับของ', detail: 'นำ QR ไปรับที่ห้องพัสดุ' },
] as const;

export function SupplyTracking({ token, onNavigate }: { token: string; onNavigate: (route: SupplyRoute) => void }) {
  const request = useSupplyRequest(token);
  const catalog = useSupplyCatalog();
  const cancelRequest = useCancelSupplyRequest(token);
  const [cancelOpen, setCancelOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (request.data?.status === 'awaiting_confirmation') {
      onNavigate({ name: 'supply-confirmation', token });
    } else if (request.data?.status === 'ready_for_pickup') {
      onNavigate({ name: 'supply-pickup', token });
    }
  }, [onNavigate, request.data?.status, token]);

  const suppliesById = useMemo(
    () => new Map((catalog.data ?? []).map((item) => [item.id, item])),
    [catalog.data],
  );

  if (request.isLoading) return <LoadingSkeleton cards={2} />;
  if (request.isError || !request.data) {
    return (
      <StatePanel
        tone="danger"
        title="ไม่พบข้อมูลคำขอ"
        description="ลิงก์นี้อาจไม่ถูกต้อง หรือข้อมูลคำขอยังโหลดไม่สำเร็จ"
        actionLabel="ลองโหลดอีกครั้ง"
        onAction={() => void request.refetch()}
      />
    );
  }

  const requisition = request.data;
  const isPending = requisition.status === 'pending_stock_check';
  const isTerminal = ['rejected', 'cancelled', 'expired'].includes(requisition.status);

  const handleCancel = async () => {
    try {
      await cancelRequest.mutateAsync();
      setCancelOpen(false);
      toast.success('ยกเลิกคำขอแล้ว', `เลขคำขอ ${requisition.requestNumber}`);
    } catch (error) {
      toast.error('ยกเลิกไม่สำเร็จ', getErrorMessage(error, 'กรุณาลองใหม่อีกครั้ง'));
    }
  };

  return (
    <>
      <SupplyPageHeading
        eyebrow={`คำขอเลขที่ ${requisition.requestNumber}`}
        title={isPending ? 'กำลังรอเจ้าหน้าที่ตรวจของ' : 'ติดตามคำขอ'}
        description={
          isPending
            ? 'เจ้าหน้าที่กำลังตรวจสอบว่ามีพัสดุตามรายการหรือไม่ หน้านี้จะอัปเดตให้อัตโนมัติ'
            : 'ตรวจสอบสถานะและรายละเอียดคำขอของคุณครูได้ที่หน้านี้'
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className={cn('card p-5 sm:p-6', isPending && 'border-attention-300 bg-attention-50/40')} aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-ink-light">สถานะปัจจุบัน</p>
                <div className="mt-2"><RequestStatusBadge status={requisition.status} /></div>
              </div>
              {isPending && (
                <span className="inline-flex items-center gap-2 text-base font-semibold text-attention-800">
                  <RotateCw className="h-5 w-5 animate-spin" aria-hidden /> อัปเดตอัตโนมัติ
                </span>
              )}
            </div>
            {requisition.status === 'rejected' && (
              <p className="mt-4 rounded-xl bg-danger-50 p-4 text-base text-danger-800">
                เจ้าหน้าที่ตรวจแล้วไม่พบพัสดุที่สามารถจ่ายได้ หากต้องการรายการอื่น กรุณาสร้างคำขอใหม่
              </p>
            )}
            {requisition.status === 'cancelled' && (
              <p className="mt-4 rounded-xl bg-slate-100 p-4 text-base text-ink-light">คำขอนี้ถูกยกเลิกแล้ว และจะไม่มีการตรวจของต่อ</p>
            )}
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="request-details-title">
            <h2 id="request-details-title" className="font-display text-xl font-bold text-ink">รายละเอียดคำขอ</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail label="ชื่อผู้เบิก" value={requisition.requesterName} />
              <Detail label="กลุ่มสาระ/ฝ่าย" value={requisition.department} />
              <Detail label="วันที่และเวลาที่ส่ง" value={formatThaiDate(requisition.createdAt, true)} />
              <Detail label="วันที่ต้องการรับ" value={formatThaiDate(requisition.requestedPickupDate)} />
            </dl>
            <h3 className="mt-6 text-base font-bold text-ink">รายการที่ขอ</h3>
            <ul className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200 px-4">
              {requisition.items.map((item) => {
                const supply = suppliesById.get(item.supplyId);
                return (
                  <li key={item.supplyId} className="flex items-center justify-between gap-4 py-3 text-base">
                    <span className="font-semibold text-ink">{supply?.name ?? item.supplyId}</span>
                    <span className="shrink-0 text-ink-light">ขอ {item.requestedQuantity} {supply?.unit ?? 'ชิ้น'}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <section className="card p-5" aria-labelledby="timeline-title">
            <h2 id="timeline-title" className="font-display text-xl font-bold text-ink">ลำดับการดำเนินการ</h2>
            <ol className="mt-5">
              {TIMELINE.map((step, index) => {
                const activeIndex = requisition.status === 'pending_stock_check' ? 1 : requisition.status === 'awaiting_confirmation' ? 2 : requisition.status === 'ready_for_pickup' ? 3 : 1;
                const completed = !isTerminal && index < activeIndex;
                const active = !isTerminal && index === activeIndex;
                const Icon = completed ? Check : active ? Clock3 : Circle;
                return (
                  <li key={step.title} className="relative flex gap-3 pb-6 last:pb-0">
                    {index < TIMELINE.length - 1 && (
                      <span className={cn('absolute left-[0.6875rem] top-6 h-[calc(100%-1.25rem)] w-0.5', completed ? 'bg-primary-500' : 'bg-slate-200')} aria-hidden />
                    )}
                    <span className={cn('relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white', completed ? 'border-primary-600 text-primary-700' : active ? 'border-attention-600 text-attention-700' : isTerminal && index === 1 ? 'border-danger-500 text-danger-600' : 'border-slate-300 text-ink-mute')}>
                      {isTerminal && index === 1 ? <XCircle className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                    </span>
                    <div>
                      <p className={cn('text-base font-bold', active ? 'text-attention-800' : completed ? 'text-primary-800' : 'text-ink-light')}>{step.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-light">{step.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
          {!isTerminal && (
            <Button variant="danger" fullWidth leftIcon={<XCircle className="h-5 w-5" aria-hidden />} onClick={() => setCancelOpen(true)}>
              ยกเลิกคำขอ
            </Button>
          )}
          {isTerminal && (
            <Button fullWidth leftIcon={<PackageSearch className="h-5 w-5" aria-hidden />} onClick={() => onNavigate({ name: 'supply-catalog' })}>
              สร้างคำขอใหม่
            </Button>
          )}
        </aside>
      </div>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} dismissible={!cancelRequest.isPending} labelledBy="cancel-request-title">
        <XCircle className="h-11 w-11 text-danger-600" aria-hidden />
        <h2 id="cancel-request-title" className="mt-3 font-display text-2xl font-bold text-ink">ยืนยันยกเลิกคำขอ?</h2>
        <p className="mt-2 text-base leading-relaxed text-ink-light">
          คำขอ {requisition.requestNumber} จะหยุดดำเนินการ หากต้องการอีกครั้งต้องสร้างคำขอใหม่
        </p>
        {cancelRequest.isError && <p role="alert" className="mt-4 rounded-xl bg-danger-50 p-3 text-base text-danger-800">{getErrorMessage(cancelRequest.error, 'ยกเลิกไม่สำเร็จ')}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" disabled={cancelRequest.isPending} onClick={() => setCancelOpen(false)}>กลับไปติดตาม</Button>
          <Button variant="danger" isLoading={cancelRequest.isPending} loadingText="กำลังยกเลิก…" onClick={() => void handleCancel()}>ยืนยันยกเลิกคำขอ</Button>
        </div>
      </Modal>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-ink-light">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-ink">{value}</dd>
    </div>
  );
}

