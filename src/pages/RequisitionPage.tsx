import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { HelpCard } from '@/components/layout/HelpCard';
import { MockModeBanner } from '@/components/layout/MockModeBanner';
import { HowToUseModal } from '@/features/help/HowToUseModal';
import { AiRequisitionComposer } from '@/features/requisition/AiRequisitionComposer';
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
  /**
   * ค่าเริ่มต้นคือให้ AI ร่างให้ก่อน — ครูพิมพ์ประโยคเดียวจบ
   * ส่วนฟอร์ม 3 ขั้นแบบกรอกเองเก็บไว้เป็นทางเลือก สำหรับคนที่อยากคุมเองทุกช่อง
   */
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  return (
    <div className="min-h-screen bg-surface pb-12">
      <MockModeBanner />
      <AppHeader route={route} onNavigate={onNavigate} onOpenHelp={() => setHelpOpen(true)} />

      <main className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-2xl bg-primary-600 px-5 py-5 text-white sm:px-6">
          <h2 className="font-display text-xl font-bold sm:text-2xl">เบิกงบ / ยืมพัสดุ</h2>
          <p className="mt-1 text-base text-primary-50">
            เล่าให้ AI ฟังสั้น ๆ 1 บรรทัด แล้วให้ AI ร่างใบเบิกให้ทั้งใบ
            คุณครูแค่ตรวจแล้วกดส่งค่ะ
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {mode === 'ai' ? (
              <AiRequisitionComposer
                onSubmitted={() => {
                  setSubmitCount((count) => count + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSwitchToManual={() => setMode('manual')}
              />
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setMode('ai')}
                  className="tap-target flex w-full items-center justify-center gap-2 rounded-btn border-2 border-primary-600 bg-white px-4 font-display text-base font-bold text-primary-700 transition hover:bg-primary-50"
                >
                  ← กลับไปให้ AI ร่างให้ (เร็วกว่า)
                </button>
                <RequisitionForm
                  onSubmitted={() => {
                    setSubmitCount((count) => count + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            )}
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
