import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { HelpCard } from '@/components/layout/HelpCard';
import { MockModeBanner } from '@/components/layout/MockModeBanner';
import { WelcomeBanner } from '@/components/layout/WelcomeBanner';
import { HowToUseModal } from '@/features/help/HowToUseModal';
import { JobStatusPanel } from '@/features/jobs/JobStatusPanel';
import { UploadForm } from '@/features/upload/UploadForm';
import type { AppRoute } from '@/routes';

/** หน้าหลักของระบบ — โครงเหมือน HTML เดิม: ฟอร์ม 2 คอลัมน์ + แผงสถานะด้านขวา */
export function UploadPortalPage({
  route,
  onNavigate,
}: {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface pb-28 lg:pb-12">
      <MockModeBanner />
      <AppHeader route={route} onNavigate={onNavigate} onOpenHelp={() => setHelpOpen(true)} />

      <main className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <WelcomeBanner />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <UploadForm />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <JobStatusPanel />
            <HelpCard onOpenHelp={() => setHelpOpen(true)} />
          </aside>
        </div>
      </main>

      <HowToUseModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
