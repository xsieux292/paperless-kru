import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileWarning,
  Inbox,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { downloadOutput } from '@/api/jobs.api';
import { toFriendlyMessage } from '@/api/http';
import { DOCUMENT_MODES } from '@/constants/documentModes';
import { splitJobs, useJobs } from '@/hooks/useJobs';
import { useRequisitions } from '@/hooks/useRequisitions';
import { formatRelativeThai, formatRemaining, truncateFileName } from '@/lib/format';
import type { Job, JobOutputFile, Requisition, RequisitionStatus } from '@/types';
import { EmptyState, RowSkeleton, StatusPill } from '../components/MobileUi';

/**
 * "งานของฉัน" — รวมงาน AI + ใบเบิก ไว้ที่เดียว
 * ดึงจาก hooks ชุดเดียวกับเว็บ (useJobs / useRequisitions) ข้อมูลจึงตรงกันเป๊ะ
 * ส่งงานจาก LINE แล้วเปิดหน้าเว็บก็เห็นงานเดียวกัน
 */
export function JobsScreen({ onToast }: { onToast: (message: string) => void }) {
  const [tab, setTab] = useState<'jobs' | 'requisitions'>('jobs');

  const jobs = useJobs();
  const requisitions = useRequisitions();
  const { active, finished } = splitJobs(jobs.data);

  return (
    <div className="space-y-3">
      {/* สลับระหว่างงาน AI กับใบเบิก */}
      <div role="tablist" className="flex gap-1 rounded-btn bg-slate-100 p-1">
        <TabButton active={tab === 'jobs'} onClick={() => setTab('jobs')}>
          งานที่ส่งให้ AI
          {active.length > 0 && (
            <span className="ml-1 rounded-full bg-primary-600 px-1.5 text-[10px] text-white">
              {active.length}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === 'requisitions'} onClick={() => setTab('requisitions')}>
          ใบเบิกของฉัน
        </TabButton>
      </div>

      {tab === 'jobs' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-ink-light">รีเฟรชเองอัตโนมัติขณะมีงานค้าง</p>
            <button
              type="button"
              onClick={() => void jobs.refetch()}
              disabled={jobs.isFetching}
              className="flex min-h-[36px] items-center gap-1 rounded-btn px-2 text-[12px] font-bold text-ink-light disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${jobs.isFetching ? 'animate-spin' : ''}`}
                aria-hidden
              />
              รีเฟรช
            </button>
          </div>

          {jobs.isLoading && <RowSkeleton count={3} />}

          {jobs.isError && (
            <p className="rounded-xl border-2 border-danger-300 bg-danger-50 p-3 text-[12px] text-danger-700">
              {toFriendlyMessage(jobs.error)}
            </p>
          )}

          {!jobs.isLoading && !jobs.isError && (
            <div className="space-y-3">
              {active.length > 0 ? (
                active.map((job) => <ActiveJobCard key={job.id} job={job} />)
              ) : (
                <EmptyState
                  icon={Inbox}
                  title="ตอนนี้ไม่มีงานค้างเลยค่ะ 🎉"
                  hint="ส่งเอกสารจาก Rich Menu ได้เลย"
                />
              )}

              <p className="pt-1 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                งานที่เสร็จแล้ว ({finished.length})
              </p>

              {finished.map((job) => (
                <FinishedJobCard key={job.id} job={job} onToast={onToast} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'requisitions' && (
        <>
          {requisitions.isLoading && <RowSkeleton count={2} />}

          {requisitions.data && requisitions.data.length === 0 && (
            <EmptyState icon={ClipboardList} title="ยังไม่มีใบเบิกค่ะ" />
          )}

          <div className="space-y-2">
            {requisitions.data?.map((item) => (
              <RequisitionCard key={item.id} requisition={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-h-[38px] flex-1 items-center justify-center rounded-btn px-2 text-[13px] font-bold transition-colors ${
        active ? 'bg-white text-primary-800 shadow-sm' : 'text-ink-light'
      }`}
    >
      {children}
    </button>
  );
}

function ActiveJobCard({ job }: { job: Job }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <StatusPill icon={Loader2} tone="progress">
          AI กำลังทำให้อยู่
        </StatusPill>
        <span className="shrink-0 text-[11px] text-ink-light">
          {formatRelativeThai(job.createdAt)}
        </span>
      </div>

      <p className="truncate text-[14px] font-bold text-ink">{truncateFileName(job.title, 30)}</p>
      <p className="text-[12px] text-ink-light">{DOCUMENT_MODES[job.mode].title}</p>

      {(job.projectName || job.receiptCategoryName || job.formTemplateName) && (
        <div className="mt-1 flex flex-wrap gap-1">
          {[job.projectName, job.receiptCategoryName, job.formTemplateName]
            .filter((tag): tag is string => Boolean(tag))
            .map((tag) => (
              <span
                key={tag}
                className="max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-ink-light"
              >
                {tag}
              </span>
            ))}
        </div>
      )}

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-primary-100">
        <div
          className="h-full rounded-full bg-primary-600 transition-[width] duration-700"
          style={{ width: `${job.progress}%` }}
          role="progressbar"
          aria-valuenow={job.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-ink">
          {job.progressMessage ?? 'กำลังประมวลผล…'} {job.progress}%
        </span>
        <span className="shrink-0 text-[11px] text-ink-light">{formatRemaining(job.progress)}</span>
      </div>

      <p className="mt-1.5 text-[11px] text-ink-light">ปิดแชทไปพักได้เลยค่ะ ระบบทำต่อให้เอง</p>
    </div>
  );
}

function FinishedJobCard({ job, onToast }: { job: Job; onToast: (message: string) => void }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (output: JobOutputFile) => {
    setDownloadingId(output.id);
    try {
      await downloadOutput(job.id, output);
      onToast(`เริ่มดาวน์โหลด ${output.fileName} แล้วค่ะ`);
    } catch (error) {
      onToast(toFriendlyMessage(error));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {job.outputs.map((output) => (
        <div key={output.id} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2">
            <p className="truncate text-[14px] font-bold text-ink">
              {truncateFileName(output.fileName, 30)}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-primary-700">
              <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
              เสร็จแล้ว · {job.completedAt ? formatRelativeThai(job.completedAt) : ''}
            </p>
          </div>

          <button
            type="button"
            disabled={downloadingId === output.id}
            onClick={() => void handleDownload(output)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-btn border-2 border-primary-600 text-[13px] font-bold text-primary-700 transition active:scale-[0.98] disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden />
            {downloadingId === output.id ? 'กำลังดาวน์โหลด…' : 'ดาวน์โหลดไฟล์นี้'}
          </button>
        </div>
      ))}
    </div>
  );
}

const REQ_STATUS: Record<
  RequisitionStatus,
  { label: string; icon: typeof Clock; tone: 'done' | 'waiting' | 'progress' | 'problem' }
> = {
  draft: { label: 'ร่างไว้ ยังไม่ได้ส่ง', icon: ClipboardList, tone: 'waiting' },
  pending: { label: 'รอผู้อนุมัติเซ็น', icon: Clock, tone: 'progress' },
  approved: { label: 'อนุมัติแล้ว', icon: CheckCircle2, tone: 'done' },
  returned: { label: 'ถูกตีกลับ ต้องแก้', icon: FileWarning, tone: 'problem' },
};

function RequisitionCard({ requisition }: { requisition: Requisition }) {
  const meta = REQ_STATUS[requisition.status];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <StatusPill icon={meta.icon} tone={meta.tone}>
          {meta.label}
        </StatusPill>
        <span className="shrink-0 text-[11px] text-ink-light">
          {formatRelativeThai(requisition.createdAt)}
        </span>
      </div>

      <p className="text-[14px] font-bold leading-snug text-ink">{requisition.purpose}</p>
      <p className="mt-0.5 text-[11px] text-ink-light">
        {requisition.kind === 'budget' ? 'เบิกงบซื้อของ' : 'ยืมพัสดุ'} · {requisition.docNo}
      </p>

      <div className="mt-1.5 flex flex-wrap gap-1">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-ink-light">
          {requisition.projectName}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-ink-light">
          {requisition.items.length} รายการ
        </span>
      </div>

      {requisition.kind === 'budget' && (
        <p className="mt-2 border-t border-slate-200 pt-2 text-right font-display text-[18px] font-bold text-primary-700">
          {requisition.totalAmount.toLocaleString('th-TH')} บาท
        </p>
      )}

      {requisition.status === 'returned' && requisition.returnedReason && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-danger-300 bg-danger-50 p-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" aria-hidden />
          <p className="text-[11px] leading-relaxed text-ink">{requisition.returnedReason}</p>
        </div>
      )}
    </div>
  );
}
