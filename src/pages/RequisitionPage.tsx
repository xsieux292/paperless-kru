import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { HelpCard } from '@/components/layout/HelpCard';
import { MockModeBanner } from '@/components/layout/MockModeBanner';
import { HowToUseModal } from '@/features/help/HowToUseModal';
import { RequisitionForm } from '@/features/requisition/RequisitionForm';
import { RequisitionList } from '@/features/requisition/RequisitionList';
import type { AppRoute } from '@/routes';

/** หน้าเบิกงบ / ยืมพัสดุ — อยู่ในกลุ่ม Doc Done เดียวกับหน้าส่งเอกสาร */
export function RequisitionPage({
  route,
  onNavigate,
}: {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  // ใช้บังคับให้รายการรีเฟรชหลังส่งใบเบิกใหม่ (query invalidate ทำให้อยู่แล้ว แต่เลื่อนจอให้ด้วย)
  const [, setSubmitCount] = useState(0);

  return (
    <div className="min-h-screen bg-surface pb-12">
      <MockModeBanner />
      <AppHeader route={route} onNavigate={onNavigate} onOpenHelp={() => setHelpOpen(true)} />

      <main className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-2xl bg-primary-600 px-5 py-5 text-white sm:px-6">
          <h2 className="font-display text-xl font-bold sm:text-2xl">เบิกงบ / ยืมพัสดุ</h2>
          <p className="mt-1 text-base text-primary-50">
            กรอก 3 ขั้นตอน ระบบสร้างใบเบิกและส่งให้ผู้อนุมัติเซ็นให้เอง
            ไม่ต้องเดินเอกสารเองค่ะ
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RequisitionForm
              onSubmitted={() => {
                setSubmitCount((count) => count + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <RequisitionList />
            <HelpCard onOpenHelp={() => setHelpOpen(true)} />
          </aside>
        </div>
      </main>

      <HowToUseModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
