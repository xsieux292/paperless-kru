import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
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
 *
 * กฎสีที่ใช้ในแผงนี้ (plan ข้อ ⑤):
 *   เขียว = เสร็จแล้ว · เทา = ระบบกำลังทำ ครูยังไม่ต้องทำอะไร · แดง = มีปัญหาต้องแก้
 *   ไม่ใช้ส้มกับงานที่ AI กำลังทำ เพราะส้มแปลว่า "ตรงนี้รอคุณอยู่"
 * ทุกสถานะมี สี + ไอคอน + ข้อความ ครบ ไม่พึ่งสีอย่างเดียว
 */
export function JobStatusPanel() {
  const { data: jobs, isLoading, isError, error, refetch, isFetching } = useJobs();
  const { active, finished } = splitJobs(jobs);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
          <History className="h-5 w-5 shrink-0 text-primary-700" aria-hidden />
          สถานะการทำงานของ AI
        </h3>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="tap-target flex items-center gap-1.5 rounded-btn px-2 text-sm font-bold text-ink-light transition hover:bg-slate-100 hover:text-primary-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
          รีเฟรช
        </button>
      </div>

      {isLoading && <PanelSkeleton />}

      {isError && (
        <div className="rounded-xl border-2 border-danger-300 bg-danger-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" aria-hidden />
            <div>
              <p className="text-base font-bold text-danger-700">ยังโหลดสถานะไม่ได้</p>
              <p className="mt-0.5 text-base text-ink">{toFriendlyMessage(error)}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            className="mt-3"
            onClick={() => void refetch()}
          >
            ลองโหลดใหม่อีกครั้ง
          </Button>
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
            /* Empty state — ต้องมีทุกหน้า ตาม plan ข้อ 6 */
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <Inbox className="mx-auto mb-2 h-8 w-8 text-ink-mute" aria-hidden />
              <p className="text-base font-semibold text-ink">ตอนนี้ไม่มีงานค้างเลยค่ะ 🎉</p>
              <p className="mt-0.5 text-sm text-ink-light">ส่งเอกสารทางด้านซ้ายได้เลย</p>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wide text-ink-mute">
              งานที่เสร็จแล้ว ({finished.length})
            </h4>

            {finished.length === 0 ? (
              <p className="text-base text-ink-light">ยังไม่มีงานที่เสร็จค่ะ</p>
            ) : (
              finished.map((job) => <FinishedJobItem key={job.id} job={job} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** ป้ายกำกับงาน — โครงการ / ประเภทใบเสร็จ / แบบฟอร์มที่ใช้ ช่วยแยกงานที่ปนกัน */
function JobTags({ job }: { job: Job }) {
  const tags = [job.projectName, job.receiptCategoryName, job.formTemplateName].filter(
    (value): value is string => Boolean(value),
  );
  if (tags.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="max-w-full truncate rounded-full bg-white px-2 py-0.5 text-sm text-ink-light ring-1 ring-slate-200"
          title={tag}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

function ActiveJobCard({ job }: { job: Job }) {
  const modeConfig = DOCUMENT_MODES[job.mode];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-sm font-bold text-ink">
          <Loader2 className="h-4 w-4 animate-spin text-primary-600" aria-hidden />
          AI กำลังทำให้อยู่
        </span>
        <span className="shrink-0 text-sm text-ink-light">{formatRelativeThai(job.createdAt)}</span>
      </div>

      <h4 className="mb-1 truncate text-base font-bold text-ink" title={job.title}>
        {truncateFileName(job.title, 34)}
      </h4>
      <p className="text-sm text-ink-light">
        {modeConfig.title}
        {job.fileCount > 1 && ` · ${job.fileCount} ไฟล์`}
      </p>
      <div className="mb-3">
        <JobTags job={job} />
      </div>

      <ProgressBar value={job.progress} label={`ความคืบหน้า ${job.progress}%`} tone="progress" />

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-sm text-ink">
          {job.progressMessage ?? 'กำลังประมวลผล…'} {job.progress}%
        </span>
        <span className="shrink-0 text-sm text-ink-light">{formatRemaining(job.progress)}</span>
      </div>

      <p className="mt-2 text-sm text-ink-light">คุณครูปิดหน้านี้ไปก่อนได้ค่ะ ระบบทำงานต่อให้เอง</p>
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

function FinishedJobItem({ job }: { job: Job }) {
  const toast = useToast();
  const retry = useRetryJob();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (job.status === 'failed') {
    return (
      <div className="rounded-xl border-2 border-danger-300 bg-danger-50 p-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-ink">{job.title}</p>
            <p className="mt-0.5 text-sm text-danger-700">
              {job.errorMessage ?? 'ยังทำไม่สำเร็จค่ะ ลองส่งใหม่อีกครั้งได้เลย'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          fullWidth
          className="mt-3"
          isLoading={retry.isPending}
          loadingText="กำลังส่งใหม่…"
          onClick={() => retry.mutate(job.id)}
        >
          ส่งงานนี้ให้ AI ทำใหม่
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
      toast.error('ยังดาวน์โหลดไม่ได้', toFriendlyMessage(error));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {job.outputs.map((output) => {
        const Icon = OUTPUT_ICON[output.fileType];
        return (
          <div key={output.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-ink" title={output.fileName}>
                  {truncateFileName(output.fileName, 26)}
                </p>
                <p className="flex items-center gap-1 text-sm text-primary-700">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  เสร็จแล้ว · {job.completedAt ? formatRelativeThai(job.completedAt) : ''}
                </p>
              </div>
            </div>

            <JobTags job={job} />
            <div className="mb-2" />

            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              isLoading={downloadingId === output.id}
              loadingText="กำลังดาวน์โหลด…"
              leftIcon={<Download className="h-4 w-4" aria-hidden />}
              onClick={() => void handleDownload(output)}
            >
              ดาวน์โหลดไฟล์นี้
            </Button>
          </div>
        );
      })}
    </div>
  );
}
