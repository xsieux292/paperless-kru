import { CheckCircle2, Clock3, History, ShieldCheck } from 'lucide-react';
import { useSupplyAuditEvents } from '@/hooks/useSupplyRequisition';
import type { RequisitionAuditEventType } from '@/types/supply';
import { formatThaiDate, LoadingSkeleton, StatePanel } from './SupplyShared';

const EVENT_LABEL: Record<RequisitionAuditEventType, string> = {
  created: 'สร้างคำขอ',
  submitted: 'ส่งคำขอให้เจ้าหน้าที่',
  stock_check_completed: 'ได้รับผลตรวจวัสดุ',
  items_changed: 'รายการหรือจำนวนเปลี่ยน',
  teacher_accepted: 'คุณครูยอมรับรายการ',
  otp_sent: 'ส่งรหัส OTP',
  otp_verified: 'ยืนยัน OTP สำเร็จ',
  pickup_qr_created: 'สร้าง QR สำหรับรับวัสดุ',
  cancelled: 'ยกเลิกคำขอ',
  document_generated: 'สร้างเอกสาร',
};

export function SupplyAuditTimeline({ token, poll = false }: { token: string; poll?: boolean }) {
  const audit = useSupplyAuditEvents(token, poll);

  if (audit.isLoading) return <LoadingSkeleton cards={1} />;
  if (audit.isError) {
    return <StatePanel tone="danger" title="โหลดหลักฐานการดำเนินการไม่สำเร็จ" description="กรุณาลองโหลด Audit Timeline อีกครั้ง" actionLabel="โหลดอีกครั้ง" onAction={() => void audit.refetch()} />;
  }

  const events = audit.data ?? [];
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="audit-timeline-title">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-ink"><History className="h-6 w-6" aria-hidden /></span>
        <div>
          <h2 id="audit-timeline-title" className="font-display text-xl font-bold text-ink">หลักฐานสำหรับตรวจสอบ</h2>
          <p className="mt-1 text-base text-ink-light">เหตุการณ์เพิ่มใหม่ได้เท่านั้น ไม่สามารถแก้ไขหรือลบจากหน้าจอนี้</p>
        </div>
      </div>
      {events.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-base text-ink-light">ยังไม่มีเหตุการณ์</p>
      ) : (
        <ol className="mt-6 space-y-0">
          {events.map((item, index) => {
            const Icon = item.event === 'otp_verified' || item.event === 'pickup_qr_created' ? ShieldCheck : item.actorType === 'system' ? Clock3 : CheckCircle2;
            return (
              <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
                {index < events.length - 1 && <span className="absolute left-[0.6875rem] top-6 h-[calc(100%-1.25rem)] w-0.5 bg-slate-200" aria-hidden />}
                <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary-600 bg-white text-primary-700"><Icon className="h-4 w-4" aria-hidden /></span>
                <div className="min-w-0">
                  <p className="text-base font-bold text-ink">{EVENT_LABEL[item.event]}</p>
                  <p className="mt-0.5 text-sm text-ink-light">{formatThaiDate(item.occurredAt, true)} · {item.actorName}</p>
                  {item.note && <p className="mt-1 text-base leading-relaxed text-ink-light">{item.note}</p>}
                  {(item.before !== undefined || item.after !== undefined) && (
                    <details className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-ink-light">
                      <summary className="tap-target cursor-pointer py-2 text-base font-bold text-primary-700">ดูข้อมูลก่อนและหลัง</summary>
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words pb-2 font-mono text-xs">{JSON.stringify({ before: item.before, after: item.after }, null, 2)}</pre>
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
