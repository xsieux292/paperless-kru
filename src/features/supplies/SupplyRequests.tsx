import { ClipboardList, Download, PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMySupplyRequests } from '@/hooks/useSupplyRequisition';
import type { SupplyRoute } from '@/routes';
import type { Requisition } from '@/types/supply';
import { formatThaiDate, LoadingSkeleton, RequestStatusBadge, StatePanel, SupplyPageHeading } from './SupplyShared';

export function SupplyRequests({ onNavigate }: { onNavigate: (route: SupplyRoute) => void }) {
  const requests = useMySupplyRequests();

  if (requests.isLoading) return <LoadingSkeleton cards={3} />;
  if (requests.isError) {
    return (
      <StatePanel
        tone="danger"
        title="โหลดคำขอของฉันไม่สำเร็จ"
        description="กรุณาลองโหลดรายการจากอุปกรณ์เครื่องนี้อีกครั้ง"
        actionLabel="โหลดคำขออีกครั้ง"
        onAction={() => void requests.refetch()}
      />
    );
  }

  const sorted = [...(requests.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const groups = [
    {
      title: 'คำขอที่กำลังดำเนินการ',
      description: 'รอตรวจของหรือรอคุณครูยืนยัน',
      items: sorted.filter((item) => ['draft', 'pending_stock_check', 'awaiting_confirmation'].includes(item.status)),
    },
    {
      title: 'คำขอที่พร้อมรับ',
      description: 'เปิด QR เพื่อนำไปรับพัสดุ',
      items: sorted.filter((item) => item.status === 'ready_for_pickup'),
    },
    {
      title: 'คำขอที่ยกเลิกหรือสิ้นสุด',
      description: 'คำขอที่ยกเลิก ไม่มีพัสดุ หรือหมดเวลารับ',
      items: sorted.filter((item) => ['rejected', 'cancelled', 'expired'].includes(item.status)),
    },
  ];

  return (
    <>
      <SupplyPageHeading
        title="คำขอของฉัน"
        description="โหลดคำขอตามบัญชีครูที่เข้าสู่ระบบ จึงเปิดติดตามได้โดยไม่ผูกกับเบราว์เซอร์เครื่องเดียว"
        action={
          <Button
            className="border-2 border-white bg-white text-primary-800 hover:bg-primary-50"
            leftIcon={<PackagePlus className="h-5 w-5" aria-hidden />}
            onClick={() => onNavigate({ name: 'supply-catalog' })}
          >
            สร้างคำขอใหม่
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <StatePanel
          icon={ClipboardList}
          title="ยังไม่มีคำขอของคุณครู"
          description="เมื่อส่งคำขอเบิกวัสดุแล้ว ระบบจะแสดงรายการและสถานะให้ติดตามที่นี่"
          actionLabel="เลือกพัสดุ"
          onAction={() => onNavigate({ name: 'supply-catalog' })}
        />
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <section key={group.title} aria-labelledby={`group-${group.title}`}>
              <div className="mb-3">
                <h2 id={`group-${group.title}`} className="font-display text-xl font-bold text-ink">{group.title}</h2>
                <p className="mt-1 text-base text-ink-light">{group.description}</p>
              </div>
              {group.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center text-base text-ink-light">ไม่มีคำขอในกลุ่มนี้</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((requisition) => (
                    <RequestCard key={requisition.id} requisition={requisition} onOpen={() => onNavigate(routeForRequest(requisition))} onDocument={() => onNavigate({ name: 'supply-document', token: requisition.publicToken })} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function RequestCard({ requisition, onOpen, onDocument }: { requisition: Requisition; onOpen: () => void; onDocument: () => void }) {
  const pieces = requisition.items.reduce(
    (sum, item) => sum + (requisition.status === 'ready_for_pickup' ? item.confirmedQuantity ?? 0 : item.requestedQuantity),
    0,
  );
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-light">เลขคำขอ</p>
          <h3 className="mt-0.5 font-mono text-lg font-bold text-ink">{requisition.requestNumber}</h3>
        </div>
        <RequestStatusBadge status={requisition.status} />
      </div>
      <dl className="mt-4 space-y-2 text-base">
        <div className="flex justify-between gap-4"><dt className="text-ink-light">วันที่สร้าง</dt><dd className="text-right font-semibold text-ink">{formatThaiDate(requisition.createdAt)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-ink-light">วัตถุประสงค์</dt><dd className="max-w-[65%] text-right font-semibold text-ink">{requisition.purpose}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-ink-light">รายการ</dt><dd className="font-semibold text-ink">{requisition.items.length} รายการ</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-ink-light">จำนวนรวม</dt><dd className="font-semibold text-ink">{pieces} ชิ้น</dd></div>
      </dl>
      <div className="mt-5 grid gap-2">
        <Button variant="outline" fullWidth onClick={onOpen}>เปิดรายละเอียด</Button>
        <Button variant="ghost" fullWidth leftIcon={<Download className="h-5 w-5" aria-hidden />} onClick={onDocument}>ดาวน์โหลดเอกสาร</Button>
      </div>
    </article>
  );
}

function routeForRequest(requisition: Requisition): SupplyRoute {
  if (requisition.status === 'awaiting_confirmation') {
    return { name: 'supply-confirmation', token: requisition.publicToken };
  }
  if (requisition.status === 'ready_for_pickup') {
    return { name: 'supply-pickup', token: requisition.publicToken };
  }
  return { name: 'supply-tracking', token: requisition.publicToken };
}
