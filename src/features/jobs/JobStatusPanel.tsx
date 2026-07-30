import { useState } from 'react';
import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Inbox,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { DOCUMENT_MODES } from '@/constants/documentModes';
import { downloadOutput } from '@/api/jobs.api';
import { toFriendlyMessage } from '@/api/http';
import { splitJobs, useJobs, useRetryJob } from '@/hooks/useJobs';
import { formatRelativeThai, formatRemaining, truncateFileName } from '@/lib/format';
import { useToast } from '@/providers/toastContext';
import type { Job, JobOutputFile } from '@/types';

/**
 * แผงสถานะงาน
 * ปรับจาก HTML เดิม: ข้อมูลมาจาก API (หรือ mock) และรีเฟรชเองอัตโนมัติขณะมีงานค้างอยู่
 * พร้อมบอกเวลาที่เหลือโดยประมาณ เพื่อให้คุณครูรู้ว่าควรรอหรือปิดหน้าไปก่อน
 */
export function JobStatusPanel() {
  const { data: jobs, isLoading, isError, error, refetch, isFetching } = useJobs();
  const { active, finished } = splitJobs(jobs);

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-prompt text-lg font-bold text-slate-900">
          <History className="h-5 w-5 text-primary-600" aria-hidden />
          สถานะการทำงานของ AI
        </h3>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="รีเฟรชสถานะ"
          title="รีเฟรชสถานะ"
          className="tap-target flex items-center justify-center rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-primary-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
        </button>
      </div>

      {isLoading && <PanelSkeleton />}

      {isError && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-rose-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold">โหลดสถานะไม่สำเร็จ</p>
            <p className="mt-0.5 text-sm">{toFriendlyMessage(error)}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void refetch()}
            >
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-5">
          {active.length > 0 ? (
            <div className="space-y-3">
              {active.map((job) => (
                <ActiveJobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-400" aria-hidden />
              <p className="text-sm font-medium text-slate-600">ตอนนี้ยังไม่มีงานที่กำลังทำอยู่ค่ะ</p>
              <p className="mt-0.5 text-xs text-slate-500">ส่งเอกสารทางด้านซ้ายได้เลยค่ะ</p>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-prompt text-xs font-semibold uppercase tracking-wider text-slate-400">
              งานที่เสร็จแล้ว ({finished.length})
            </h4>

            {finished.length === 0 ? (
              <p className="text-sm text-slate-500">ยังไม่มีงานที่เสร็จค่ะ</p>
            ) : (
              finished.map((job) => <FinishedJobItem key={job.id} job={job} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

function ActiveJobCard({ job }: { job: Job }) {
  const modeConfig = DOCUMENT_MODES[job.mode];

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-2.5 py-1 text-xs font-bold text-amber-900">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          กำลังดำเนินการ
        </span>
        <span className="text-xs text-slate-500">{formatRelativeThai(job.createdAt)}</span>
      </div>

      <h4 className="mb-1 truncate text-sm font-bold text-slate-800" title={job.title}>
        {truncateFileName(job.title, 34)}
      </h4>
      <p className="mb-3 text-xs text-slate-600">
        โหมด: {modeConfig.title}
        {job.fileCount > 1 && ` · ${job.fileCount} ไฟล์`}
      </p>

      <ProgressBar value={job.progress} label={`ความคืบหน้า ${job.progress}%`} />

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-amber-800">
          {job.progressMessage ?? 'กำลังประมวลผล…'} {job.progress}%
        </span>
        <span className="shrink-0 text-xs text-amber-700">{formatRemaining(job.progress)}</span>
      </div>

      <p className="mt-2 text-xs text-slate-500">คุณครูปิดหน้านี้ไปก่อนได้ค่ะ ระบบทำงานต่อให้เอง</p>
    </div>
  );
}

const OUTPUT_ICON: Record<JobOutputFile['fileType'], typeof FileText> = {
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  docx: FileText,
  pdf: FileText,
  txt: FileText,
};

const OUTPUT_COLOR: Record<JobOutputFile['fileType'], string> = {
  xlsx: 'bg-emerald-100 text-emerald-600',
  csv: 'bg-emerald-100 text-emerald-600',
  docx: 'bg-blue-100 text-blue-600',
  pdf: 'bg-rose-100 text-rose-600',
  txt: 'bg-slate-100 text-slate-600',
};

function FinishedJobItem({ job }: { job: Job }) {
  const toast = useToast();
  const retry = useRetryJob();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (job.status === 'failed') {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{job.title}</p>
            <p className="mt-0.5 text-xs text-rose-700">
              {job.errorMessage ?? 'ทำงานไม่สำเร็จ กรุณาลองส่งใหม่อีกครั้งค่ะ'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          isLoading={retry.isPending}
          onClick={() => retry.mutate(job.id)}
        >
          ลองทำใหม่
        </Button>
      </div>
    );
  }

  const handleDownload = async (output: JobOutputFile) => {
    setDownloadingId(output.id);
    try {
      await downloadOutput(job.id, output);
      toast.success('เริ่มดาวน์โหลดแล้วค่ะ', `ไฟล์ ${output.fileName} จะอยู่ในโฟลเดอร์ดาวน์โหลด`);
    } catch (error) {
      toast.error('ดาวน์โหลดไม่สำเร็จ', toFriendlyMessage(error));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {job.outputs.map((output) => {
        const Icon = OUTPUT_ICON[output.fileType];
        return (
          <div
            key={output.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors hover:bg-slate-100"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${OUTPUT_COLOR[output.fileType]}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800" title={output.fileName}>
                  {truncateFileName(output.fileName, 24)}
                </p>
                <p className="text-xs text-slate-500">
                  {job.completedAt ? formatRelativeThai(job.completedAt) : ''}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              isLoading={downloadingId === output.id}
              loadingText="กำลังโหลด"
              leftIcon={<Download className="h-4 w-4" aria-hidden />}
              onClick={() => void handleDownload(output)}
            >
              ดาวน์โหลด
            </Button>
          </div>
        );
      })}
    </div>
  );
}
