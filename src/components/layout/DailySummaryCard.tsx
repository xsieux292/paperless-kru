import { ArrowRight, Loader2, PenLine, TrendingUp, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDailySummary } from '@/hooks/useAiAssist';
import { splitJobs, useJobs } from '@/hooks/useJobs';
import { useRequisitions } from '@/hooks/useRequisitions';

/**
 * การ์ด "สรุปวันนี้" — เห็นตัวเลขสำคัญครบในใบเดียวโดยไม่ต้องกดเข้าไปดู
 * แนวคิดนี้หยิบมาจาก prototype อ้างอิง เพราะช่วยให้ครูรู้สถานะทั้งหมดใน 1 วินาที
 */
export function DailySummaryCard({ onOpenRequisition }: { onOpenRequisition: () => void }) {
  const jobs = useJobs();
  const requisitions = useRequisitions();

  const { active } = splitJobs(jobs.data);
  const pendingSignatures =
    requisitions.data?.filter((item) => item.status === 'pending').length ?? 0;

  const summary = useDailySummary(pendingSignatures, active.length);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl bg-primary-600 text-white">
      <div className="px-5 pb-4 pt-5 sm:px-6">
        <h2 className="font-display text-xl font-bold">สรุปวันนี้</h2>
        <p className="mt-0.5 text-base text-primary-50">
          ดูภาพรวมได้ในบรรทัดเดียว ไม่ต้องกดเข้าไปดูทีละหน้า
        </p>
      </div>

      <div className="grid grid-cols-3 gap-px bg-primary-500/40">
        <Tile
          icon={PenLine}
          value={summary.isLoading ? '—' : String(summary.data?.pendingSignatures ?? 0)}
          label="รอเซ็น"
        />
        <Tile
          icon={TrendingUp}
          value={
            summary.isLoading ? '—' : `฿${(summary.data?.budgetUsed ?? 0).toLocaleString('th-TH')}`
          }
          label="งบที่ใช้ไป"
        />
        <Tile
          icon={Trophy}
          value={summary.isLoading ? '—' : `${summary.data?.portfolioPercent ?? 0}%`}
          label="แฟ้ม ว.PA"
        />
      </div>

      <div className="flex items-center justify-between gap-3 bg-primary-700 px-5 py-3 sm:px-6">
        <span className="flex items-center gap-2 text-base text-primary-50">
          {active.length > 0 ? (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              AI กำลังทำงานให้ {active.length} งาน
            </>
          ) : (
            'ตอนนี้ไม่มีงานค้างเลยค่ะ 🎉'
          )}
        </span>

        <button
          type="button"
          onClick={onOpenRequisition}
          className="tap-target flex shrink-0 items-center gap-1.5 rounded-btn bg-white/15 px-3 text-base font-bold text-white transition hover:bg-white/25"
        >
          เบิกของ
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

function Tile({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="bg-primary-600 px-3 py-4 text-center">
      <Icon className="mx-auto mb-1 h-5 w-5 text-primary-100" aria-hidden />
      <p className="font-display text-2xl font-bold leading-tight">{value}</p>
      <p className="mt-0.5 text-sm text-primary-100">{label}</p>
    </div>
  );
}
