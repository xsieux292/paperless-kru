import { useEffect, useMemo } from 'react';
import { Building2, CheckCircle2, Clock3, Info, ListChecks, MapPin } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/Button';
import { useSupplyCatalog, useSupplyRequest } from '@/hooks/useSupplyRequisition';
import type { SupplyRoute } from '@/routes';
import { formatThaiDate, LoadingSkeleton, StatePanel, SupplyPageHeading } from './SupplyShared';

export function SupplyPickup({ token, onNavigate }: { token: string; onNavigate: (route: SupplyRoute) => void }) {
  const request = useSupplyRequest(token);
  const catalog = useSupplyCatalog();

  useEffect(() => {
    if (request.data?.status === 'pending_stock_check') onNavigate({ name: 'supply-tracking', token });
    if (request.data?.status === 'awaiting_confirmation') onNavigate({ name: 'supply-confirmation', token });
  }, [onNavigate, request.data?.status, token]);

  const suppliesById = useMemo(
    () => new Map((catalog.data ?? []).map((item) => [item.id, item])),
    [catalog.data],
  );

  if (request.isLoading || catalog.isLoading) return <LoadingSkeleton cards={2} />;
  if (request.isError || !request.data) {
    return (
      <StatePanel
        tone="danger"
        title="เปิด QR สำหรับรับของไม่สำเร็จ"
        description="กรุณาตรวจสอบลิงก์ แล้วลองโหลดข้อมูลอีกครั้ง"
        actionLabel="โหลด QR อีกครั้ง"
        onAction={() => void request.refetch()}
      />
    );
  }

  const requisition = request.data;
  if (requisition.status !== 'ready_for_pickup' || !requisition.pickupToken || !requisition.pickupExpiresAt) {
    return (
      <StatePanel
        tone={requisition.status === 'expired' || requisition.status === 'cancelled' ? 'danger' : 'neutral'}
        title={requisition.status === 'expired' ? 'QR หมดอายุแล้ว' : requisition.status === 'cancelled' ? 'คำขอนี้ถูกยกเลิกแล้ว' : 'QR ยังไม่พร้อมใช้งาน'}
        description="ดูสถานะล่าสุดของคำขอได้จากหน้าคำขอของฉัน"
        actionLabel="ดูคำขอของฉัน"
        onAction={() => onNavigate({ name: 'supply-requests' })}
      />
    );
  }

  const qrValue = `https://example.school/pickup/${encodeURIComponent(requisition.pickupToken)}`;

  return (
    <>
      <SupplyPageHeading
        eyebrow={`คำขอเลขที่ ${requisition.requestNumber}`}
        title="พร้อมรับพัสดุ"
        description="นำ QR นี้ไปแสดงต่อเจ้าหน้าที่ห้องพัสดุ ไม่ต้องบันทึกหรือส่งข้อมูลส่วนตัวเพิ่มเติม"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.2fr)]">
        <section className="card overflow-hidden text-center" aria-labelledby="pickup-qr-title">
          <div className="bg-primary-50 px-5 py-4">
            <span className="inline-flex items-center gap-2 text-lg font-bold text-primary-800">
              <CheckCircle2 className="h-6 w-6" aria-hidden /> พร้อมรับพัสดุ
            </span>
          </div>
          <div className="p-6 sm:p-8">
            <h2 id="pickup-qr-title" className="sr-only">QR Code สำหรับรับพัสดุ</h2>
            <div className="mx-auto w-fit rounded-2xl border-4 border-white bg-white p-4 shadow-lg">
              <QRCode value={qrValue} size={220} level="M" aria-label="QR Code สำหรับรับพัสดุ" />
            </div>
            <p className="mt-5 font-mono text-xl font-bold tracking-wide text-ink">{requisition.requestNumber}</p>
            <p className="mt-1 text-base text-ink-light">ชื่อผู้เบิก {requisition.requesterName}</p>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6" aria-labelledby="pickup-list-title">
            <h2 id="pickup-list-title" className="flex items-center gap-2 font-display text-xl font-bold text-ink">
              <ListChecks className="h-6 w-6 text-primary-600" aria-hidden /> รายการที่รับได้
            </h2>
            <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 px-4">
              {requisition.items.filter((item) => (item.confirmedQuantity ?? 0) > 0).map((item) => {
                const supply = suppliesById.get(item.supplyId);
                return (
                  <li key={item.supplyId} className="flex items-center justify-between gap-4 py-3 text-base">
                    <span className="font-semibold text-ink">{supply?.name ?? item.supplyId}</span>
                    <strong className="shrink-0 text-primary-800">{item.confirmedQuantity} {supply?.unit ?? 'ชิ้น'}</strong>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="pickup-place-title">
            <h2 id="pickup-place-title" className="font-display text-xl font-bold text-ink">ข้อมูลการรับของ</h2>
            <dl className="mt-4 space-y-4">
              <PickupDetail icon={MapPin} label="สถานที่รับ" value="ห้องพัสดุ อาคารอำนวยการ" />
              <PickupDetail icon={Building2} label="วันที่รับได้" value={`${formatThaiDate(requisition.requestedPickupDate)} เวลา 08:30–16:30 น.`} />
              <PickupDetail icon={Clock3} label="QR หมดอายุ" value={formatThaiDate(requisition.pickupExpiresAt, true)} />
            </dl>
            <div className="mt-5 flex gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 text-base leading-relaxed text-primary-900">
              <Info className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
              <p>เปิด QR หน้านี้ให้เจ้าหน้าที่ดูเมื่อถึงห้องพัสดุ QR บรรจุเฉพาะรหัสรับของ ไม่มีชื่อ เบอร์โทร หรือรายการพัสดุ</p>
            </div>
          </section>

          <Button fullWidth size="lg" leftIcon={<ListChecks className="h-5 w-5" aria-hidden />} onClick={() => onNavigate({ name: 'supply-requests' })}>
            ดูคำขอของฉัน
          </Button>
        </div>
      </div>
    </>
  );
}

function PickupDetail({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-6 w-6 shrink-0 text-primary-600" aria-hidden />
      <div>
        <dt className="text-sm font-semibold text-ink-light">{label}</dt>
        <dd className="mt-0.5 text-base font-semibold text-ink">{value}</dd>
      </div>
    </div>
  );
}

