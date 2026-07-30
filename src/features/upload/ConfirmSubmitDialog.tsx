import { FileCheck2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { DocumentModeConfig } from '@/constants/documentModes';
import { formatFileSize, truncateFileName } from '@/lib/format';

export interface ConfirmSubmitDialogProps {
  open: boolean;
  mode: DocumentModeConfig;
  files: File[];
  notes: string;
  isSubmitting: boolean;
  uploadPercent: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * หน้าจอ "ตรวจทานก่อนส่ง" — เพิ่มใหม่จาก HTML เดิม
 * เหตุผล: การกดส่งผิดโหมดหรือผิดไฟล์ทำให้ต้องทำใหม่ทั้งรอบ
 * สรุปให้เห็นครบในหน้าเดียวก่อนยืนยัน ช่วยลดความผิดพลาดได้มากที่สุด
 */
export function ConfirmSubmitDialog({
  open,
  mode,
  files,
  notes,
  isSubmitting,
  uploadPercent,
  onConfirm,
  onCancel,
}: ConfirmSubmitDialogProps) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const ModeIcon = mode.icon;

  return (
    <Modal open={open} onClose={onCancel} dismissible={!isSubmitting} labelledBy="confirm-title">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
            <FileCheck2 className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h3 id="confirm-title" className="font-prompt text-xl font-bold text-slate-900">
              ตรวจทานก่อนส่งค่ะ
            </h3>
            <p className="text-sm text-slate-500">กรุณาดูให้แน่ใจว่าถูกต้อง แล้วกดยืนยัน</p>
          </div>
        </div>

        <dl className="space-y-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-sm text-slate-500">บริการที่เลือก</dt>
            <dd className="flex items-center gap-2 text-right font-prompt text-sm font-bold text-slate-900">
              <ModeIcon className="h-4 w-4 shrink-0" aria-hidden />
              {mode.title}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-sm text-slate-500">จำนวนไฟล์</dt>
            <dd className="text-right text-sm font-bold text-slate-900">
              {files.length} ไฟล์ ({formatFileSize(totalSize)})
            </dd>
          </div>

          <div>
            <dt className="mb-1.5 text-sm text-slate-500">รายชื่อไฟล์</dt>
            <dd>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-sm text-slate-700">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="truncate">
                    • {truncateFileName(file.name, 38)}
                  </li>
                ))}
              </ul>
            </dd>
          </div>

          {notes.trim() && (
            <div>
              <dt className="mb-1 text-sm text-slate-500">คำสั่งเพิ่มเติม</dt>
              <dd className="whitespace-pre-line rounded-xl bg-white p-3 text-sm text-slate-700">
                {notes.trim()}
              </dd>
            </div>
          )}
        </dl>

        {isSubmitting && (
          <div className="space-y-2 rounded-2xl border border-primary-200 bg-primary-50 p-4">
            <p className="text-sm font-semibold text-primary-800">
              กำลังส่งไฟล์… {uploadPercent}%
            </p>
            <ProgressBar
              value={uploadPercent}
              label={`กำลังส่งไฟล์ ${uploadPercent}%`}
              trackClassName="bg-primary-200"
              barClassName="bg-primary-600"
              animated={false}
            />
            <p className="text-xs text-primary-700">กรุณาอย่าปิดหน้านี้จนกว่าจะส่งเสร็จค่ะ</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Button
            type="button"
            variant="success"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            loadingText="กำลังส่ง…"
            leftIcon={<Send className="h-5 w-5" aria-hidden />}
            onClick={onConfirm}
          >
            ยืนยัน ส่งให้ AI ทำงาน
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            onClick={onCancel}
          >
            ย้อนกลับไปแก้ไข
          </Button>
        </div>
      </div>
    </Modal>
  );
}
