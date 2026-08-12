import { useMemo, useState } from 'react';
import {
  Check,
  Circle,
  Clock3,
  Download,
  FileSearch,
  PackageSearch,
  RotateCw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useCancelSupplyRequest, useSupplyCatalog, useSupplyRequest } from '@/hooks/useSupplyRequisition';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/toastContext';
import type { SupplyRoute } from '@/routes';
import { SupplyAuditTimeline } from './SupplyAuditTimeline';
import { formatThaiDate, getErrorMessage, LoadingSkeleton, RequestStatusBadge, StatePanel, SupplyPageHeading } from './SupplyShared';

const TIMELINE = [
  { title: 'ส่งคำขอแล้ว', detail: 'ระบบบันทึกคำขอเรียบร้อย' },
  { title: 'เจ้าหน้าที่ตรวจรายการ', detail: 'ตรวจจำนวนและรายการที่แจ้งเพิ่มเติม' },
  { title: 'รอคุณครูยืนยัน', detail: 'ตรวจผลและยืนยันด้วย OTP' },
  { title: 'พร้อมรับพัสดุ', detail: 'นำ QR ไปรับที่ห้องพัสดุ' },
] as const;

export function SupplyTracking({ token, onNavigate }: { token: string; onNavigate: (route: SupplyRoute) => void }) {
  const request = useSupplyRequest(token);
  const catalog = useSupplyCatalog();
  const cancelRequest = useCancelSupplyRequest(token);
  const [cancelOpen, setCancelOpen] = useState(false);
  const toast = useToast();

  const suppliesById = useMemo(
    () => new Map((catalog.data ?? []).map((item) => [item.id, item])),
    [catalog.data],
  );

  if (request.isLoading || catalog.isLoading) return <LoadingSkeleton cards={2} />;
  if (request.isError || !request.data) {
    return <StatePanel tone="danger" title="ไม่พบข้อมูลคำขอ" description="ลิงก์นี้อาจไม่ถูกต้อง หรือข้อมูลยังโหลดไม่สำเร็จ" actionLabel="ลองโหลดอีกครั้ง" onAction={() => void request.refetch()} />;
  }

  const requisition = request.data;
  const isPending = requisition.status === 'pending_stock_check';
  const isTerminal = ['rejected', 'cancelled', 'expired'].includes(requisition.status);
  const activeIndex = requisition.status === 'pending_stock_check' ? 1 : requisition.status === 'awaiting_confirmation' ? 2 : requisition.status === 'ready_for_pickup' ? 3 : 1;

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
        title={isPending ? 'รอเจ้าหน้าที่ตรวจรายการ' : 'ติดตามคำขอ'}
        description={isPending ? 'ระบบจำลองกำลังตรวจวัสดุและรายการเพิ่มเติม ผลจะอัปเดตภายใน 5-8 วินาที' : 'ตรวจสอบสถานะและรายละเอียดคำขอได้ที่หน้านี้'}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className={cn('card p-5 sm:p-6', isPending && 'border-attention-300 bg-attention-50/40')} aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-base font-semibold text-ink-light">สถานะปัจจุบัน</p><div className="mt-2"><RequestStatusBadge status={requisition.status} /></div></div>
              {isPending && <span className="inline-flex items-center gap-2 text-base font-semibold text-attention-800"><RotateCw className="h-5 w-5 animate-spin" aria-hidden /> อัปเดตอัตโนมัติ</span>}
            </div>
            {requisition.status === 'awaiting_confirmation' && <div className="mt-4 flex gap-3 rounded-xl bg-primary-50 p-4 text-base text-primary-900"><FileSearch className="h-6 w-6 shrink-0" aria-hidden /><p>เจ้าหน้าที่ตรวจเสร็จแล้ว กรุณาเปิดดูผลและยืนยันรายการ</p></div>}
            {requisition.status === 'cancelled' && <p className="mt-4 rounded-xl bg-slate-100 p-4 text-base text-ink-light">คำขอนี้ถูกยกเลิกแล้ว</p>}
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="request-details-title">
            <h2 id="request-details-title" className="font-display text-xl font-bold text-ink">รายละเอียดคำขอ</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail label="ข้อมูลผู้ขอ" value={requisition.teacherProfile.fullName} />
              <Detail label="กลุ่มสาระ/ฝ่าย" value={requisition.teacherProfile.department} />
              <Detail label="วันที่ส่ง" value={formatThaiDate(requisition.submittedAt, true)} />
              <Detail label="วันที่ต้องการรับ" value={formatThaiDate(requisition.requestedPickupDate)} />
              <Detail label="วัตถุประสงค์" value={requisition.purpose} />
              <Detail label="งานหรือกิจกรรม" value={requisition.activityName} />
            </dl>
            <h3 className="mt-6 text-base font-bold text-ink">รายการและจำนวนที่ขอ</h3>
            <ul className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200 px-4">
              {requisition.items.map((item) => {
                const supply = item.source === 'catalog' ? suppliesById.get(item.supplyId) : undefined;
                const name = item.source === 'custom' ? item.customSupply.name : supply?.name ?? item.supplyId;
                const unit = item.source === 'custom' ? item.customSupply.unit : supply?.unit ?? 'ชิ้น';
                return (
                  <li key={item.id} className="py-3 text-base">
                    <div className="flex items-center justify-between gap-4"><span className="font-semibold text-ink">{name}</span><span className="shrink-0 text-ink-light">ขอ {item.requestedQuantity} {unit}</span></div>
                    {item.source === 'custom' && <div className="mt-2"><span className="rounded-full bg-attention-100 px-2.5 py-1 text-sm font-bold text-attention-900">รายการที่แจ้งเพิ่มเติม</span><p className="mt-2 text-sm text-ink-light">{item.customSupply.description}</p><p className={cn('mt-1 text-sm font-bold', item.reviewStatus === 'rejected' ? 'text-danger-700' : 'text-attention-800')}>{isPending || item.reviewStatus === 'pending' ? 'รอเจ้าหน้าที่ตรวจสอบรายการ' : item.reviewStatus === 'confirmed' ? 'เจ้าหน้าที่ยืนยันรายการได้' : item.reviewStatus === 'rejected' ? 'ปฏิเสธรายการ' : 'เจ้าหน้าที่เสนอรายการทดแทน'}</p></div>}
                  </li>
                );
              })}
            </ul>
          </section>

          <SupplyAuditTimeline token={token} poll={isPending} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <section className="card p-5" aria-labelledby="timeline-title">
            <h2 id="timeline-title" className="font-display text-xl font-bold text-ink">ลำดับการดำเนินการ</h2>
            <ol className="mt-5">
              {TIMELINE.map((step, index) => {
                const completed = !isTerminal && index < activeIndex;
                const active = !isTerminal && index === activeIndex;
                const Icon = completed ? Check : active ? Clock3 : Circle;
                return <li key={step.title} className="relative flex gap-3 pb-6 last:pb-0">{index < TIMELINE.length - 1 && <span className={cn('absolute left-[0.6875rem] top-6 h-[calc(100%-1.25rem)] w-0.5', completed ? 'bg-primary-500' : 'bg-slate-200')} aria-hidden />}<span className={cn('relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white', completed ? 'border-primary-600 text-primary-700' : active ? 'border-attention-600 text-attention-700' : 'border-slate-300 text-ink-mute')}><Icon className="h-4 w-4" aria-hidden /></span><div><p className={cn('text-base font-bold', active ? 'text-attention-800' : completed ? 'text-primary-800' : 'text-ink-light')}>{step.title}</p><p className="mt-0.5 text-sm leading-relaxed text-ink-light">{step.detail}</p></div></li>;
              })}
            </ol>
          </section>

          {requisition.status === 'awaiting_confirmation' && <Button fullWidth size="lg" leftIcon={<FileSearch className="h-5 w-5" aria-hidden />} onClick={() => onNavigate({ name: 'supply-confirmation', token })}>เปิดดูผลตรวจ</Button>}
          {requisition.status === 'ready_for_pickup' && <Button fullWidth size="lg" onClick={() => onNavigate({ name: 'supply-pickup', token })}>เปิด QR รับพัสดุ</Button>}
          {!isTerminal && <Button variant="outline" fullWidth leftIcon={<Download className="h-5 w-5" aria-hidden />} onClick={() => onNavigate({ name: 'supply-document', token })}>ดาวน์โหลดใบคำขอเบิกฉบับรอตรวจ</Button>}
          {!isTerminal && requisition.status !== 'ready_for_pickup' && <Button variant="danger" fullWidth leftIcon={<XCircle className="h-5 w-5" aria-hidden />} onClick={() => setCancelOpen(true)}>ยกเลิกคำขอ</Button>}
          {isTerminal && <Button fullWidth leftIcon={<PackageSearch className="h-5 w-5" aria-hidden />} onClick={() => onNavigate({ name: 'supply-catalog' })}>สร้างคำขอใหม่</Button>}
        </aside>
      </div>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} dismissible={!cancelRequest.isPending} labelledBy="cancel-request-title">
        <XCircle className="h-11 w-11 text-danger-600" aria-hidden />
        <h2 id="cancel-request-title" className="mt-3 font-display text-2xl font-bold text-ink">ยืนยันยกเลิกคำขอ?</h2>
        <p className="mt-2 text-base leading-relaxed text-ink-light">คำขอ {requisition.requestNumber} จะหยุดดำเนินการ</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="ghost" disabled={cancelRequest.isPending} onClick={() => setCancelOpen(false)}>กลับไปติดตาม</Button><Button variant="danger" isLoading={cancelRequest.isPending} loadingText="กำลังยกเลิก…" onClick={() => void handleCancel()}>ยืนยันยกเลิกคำขอ</Button></div>
      </Modal>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-sm font-semibold text-ink-light">{label}</dt><dd className="mt-1 text-base font-semibold text-ink">{value}</dd></div>;
}
