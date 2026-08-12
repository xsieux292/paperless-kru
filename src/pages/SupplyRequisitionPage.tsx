import { useState } from 'react';
import { CircleHelp, ClipboardCheck, PackageCheck, Search, ShieldCheck, ShoppingBasket } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { MockModeBanner } from '@/components/layout/MockModeBanner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SupplyCatalog } from '@/features/supplies/SupplyCatalog';
import { SupplyCartForm } from '@/features/supplies/SupplyCartForm';
import { SupplyConfirmation } from '@/features/supplies/SupplyConfirmation';
import { SupplyPickup } from '@/features/supplies/SupplyPickup';
import { SupplyRequests } from '@/features/supplies/SupplyRequests';
import { SupplyTracking } from '@/features/supplies/SupplyTracking';
import type { Navigate, SupplyRoute } from '@/routes';

export interface SupplyRequisitionPageProps {
  route: SupplyRoute;
  onNavigate: Navigate;
}

/** Flow เบิกวัสดุฝั่งครูเท่านั้น — ไม่มีหน้าจอหรือสิทธิ์ของเจ้าหน้าที่ */
export function SupplyRequisitionPage({ route, onNavigate }: SupplyRequisitionPageProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface pb-28 lg:pb-14">
      <MockModeBanner />
      <AppHeader route="requisition" onNavigate={onNavigate} onOpenHelp={() => setHelpOpen(true)} />

      <main className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        {route.name === 'supply-catalog' && <SupplyCatalog onNavigate={onNavigate} />}
        {route.name === 'supply-cart' && <SupplyCartForm onNavigate={onNavigate} />}
        {route.name === 'supply-tracking' && (
          <SupplyTracking token={route.token} onNavigate={onNavigate} />
        )}
        {route.name === 'supply-confirmation' && (
          <SupplyConfirmation token={route.token} onNavigate={onNavigate} />
        )}
        {route.name === 'supply-pickup' && (
          <SupplyPickup token={route.token} onNavigate={onNavigate} />
        )}
        {route.name === 'supply-requests' && <SupplyRequests onNavigate={onNavigate} />}
      </main>

      <SupplyHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

function SupplyHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps = [
    { icon: Search, title: '1. เลือกพัสดุ', detail: 'ค้นหารายการและระบุจำนวนที่ต้องการ' },
    { icon: ShoppingBasket, title: '2. ส่งคำขอ', detail: 'ตรวจตะกร้าและกรอกข้อมูลผู้เบิก' },
    { icon: ClipboardCheck, title: '3. รอผลตรวจ', detail: 'เจ้าหน้าที่จะตรวจของจริงและยืนยันจำนวน' },
    { icon: ShieldCheck, title: '4. ยืนยัน OTP', detail: 'ยอมรับจำนวนและยืนยันตัวตนด้วยรหัส 6 หลัก' },
    { icon: PackageCheck, title: '5. รับพัสดุ', detail: 'นำ QR ไปแสดงที่ห้องพัสดุ' },
  ];
  return (
    <Modal open={open} onClose={onClose} labelledBy="supply-help-title">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <CircleHelp className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 id="supply-help-title" className="font-display text-2xl font-bold text-ink">วิธีเบิกพัสดุ</h2>
          <p className="text-base text-ink-light">ทำครบ 5 ขั้นตอนง่าย ๆ</p>
        </div>
      </div>
      <ol className="mt-6 space-y-3">
        {steps.map(({ icon: Icon, title, detail }) => (
          <li key={title} className="flex gap-3 rounded-xl bg-slate-50 p-3">
            <Icon className="mt-0.5 h-6 w-6 shrink-0 text-primary-600" aria-hidden />
            <div>
              <p className="text-base font-bold text-ink">{title}</p>
              <p className="mt-0.5 text-base text-ink-light">{detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-xl bg-attention-50 p-4 text-base leading-relaxed text-attention-900">
        จำนวนที่เห็นในรายการเป็นสถานะเบื้องต้น เจ้าหน้าที่จะตรวจพัสดุจริงก่อนทุกครั้ง
      </p>
      <Button fullWidth className="mt-6" onClick={onClose}>เข้าใจแล้ว</Button>
    </Modal>
  );
}
