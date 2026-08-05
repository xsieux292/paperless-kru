import { FileCheck2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { DocumentModeConfig } from '@/constants/documentModes';
import { getReceiptCategories } from '@/api/catalog.api';
import { useFormTemplates, useProjects } from '@/hooks/useCatalog';
import { formatFileSize, truncateFileName } from '@/lib/format';
import type { ReceiptCategoryId } from '@/types';

export interface ConfirmSubmitDialogProps {
  open: boolean;
  mode: DocumentModeConfig;
  files: File[];
  notes: string;
  isSubmitting: boolean;
  uploadPercent: number;
  /** แบบฟอร์มที่เลือกใช้ซ้ำ (โหมดเติมแบบฟอร์ม) */
  templateId?: string | null;
  /** โครงการและประเภทใบเสร็จ (โหมดทำบัญชี) */
  projectId?: string | null;
  receiptCategory?: ReceiptCategoryId | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * หน้าจอ "ตรวจทานก่อนส่ง"
 * ยึดแนวเดียวกับหน้าเซ็นเอกสารใน design plan (Flow C): สรุปให้เห็นครบก่อนลงมือ
 * และมีปุ่มทึบเพียงปุ่มเดียว ส่วน "ย้อนกลับไปแก้ไข" เป็นตัวอักษรธรรมดา
 */
export function ConfirmSubmitDialog({
  open,
  mode,
  files,
  notes,
  isSubmitting,
  uploadPercent,
  templateId = null,
  projectId = null,
  receiptCategory = null,
  onConfirm,
  onCancel,
}: ConfirmSubmitDialogProps) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const ModeIcon = mode.icon;

  // ข้อมูลถูก cache ไว้แล้วจากตอนเลือก จึงไม่มี loading ให้เห็นในทางปฏิบัติ
  const { data: templates } = useFormTemplates();
  const { data: projects } = useProjects();

  const templateName = templates?.find((item) => item.id === templateId)?.name;
  const projectName = projects?.find((item) => item.id === projectId)?.name;
  const categoryName = getReceiptCategories().find((item) => item.id === receiptCategory)?.name;

  return (
    <Modal open={open} onClose={onCancel} dismissible={!isSubmitting} labelledBy="confirm-title">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <FileCheck2 className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h3 id="confirm-title" className="font-display text-heading text-ink">
              ตรวจทานก่อนส่งค่ะ
            </h3>
            <p className="text-base text-ink-light">ดูให้แน่ใจว่าถูกต้อง แล้วกดยืนยัน</p>
          </div>
        </div>

        <dl className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-base text-ink-light">บริการที่เลือก</dt>
            <dd className="flex items-center gap-2 text-right font-display text-base font-bold text-ink">
              <ModeIcon className="h-5 w-5 shrink-0" aria-hidden />
              {mode.title}
            </dd>
          </div>

          {templateName && (
            <div className="flex items-start justify-between gap-4">
              <dt className="shrink-0 text-base text-ink-light">แบบฟอร์มที่ใช้</dt>
              <dd className="text-right text-base font-bold text-ink">{templateName}</dd>
            </div>
          )}

          {projectName && (
            <div className="flex items-start justify-between gap-4">
              <dt className="shrink-0 text-base text-ink-light">โครงการ</dt>
              <dd className="text-right text-base font-bold text-ink">{projectName}</dd>
            </div>
          )}

          {categoryName && (
            <div className="flex items-start justify-between gap-4">
              <dt className="shrink-0 text-base text-ink-light">ประเภทใบเสร็จ</dt>
              <dd className="text-right text-base font-bold text-ink">{categoryName}</dd>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-base text-ink-light">จำนวนไฟล์</dt>
            <dd className="text-right text-base font-bold text-ink">
              {files.length === 0
                ? 'ไม่ได้แนบไฟล์เพิ่ม'
                : `${files.length} ไฟล์ (${formatFileSize(totalSize)})`}
            </dd>
          </div>

          {files.length > 0 && (
            <div>
              <dt className="mb-1.5 text-base text-ink-light">รายชื่อไฟล์</dt>
              <dd>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-base text-ink">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="truncate">
                      • {truncateFileName(file.name, 38)}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}

          {notes.trim() && (
            <div>
              <dt className="mb-1 text-base text-ink-light">คำสั่งเพิ่มเติม</dt>
              <dd className="whitespace-pre-line rounded-xl bg-white p-3 text-base text-ink">
                {notes.trim()}
              </dd>
            </div>
          )}
        </dl>

        {isSubmitting && (
          <div className="space-y-2 rounded-xl border border-primary-200 bg-primary-50 p-4">
            <p className="text-base font-semibold text-primary-800">กำลังส่งไฟล์… {uploadPercent}%</p>
            <ProgressBar
              value={uploadPercent}
              label={`กำลังส่งไฟล์ ${uploadPercent}%`}
              tone="progress"
              animated={false}
            />
            <p className="text-sm text-primary-700">กรุณาอย่าปิดหน้านี้จนกว่าจะส่งเสร็จค่ะ</p>
          </div>
        )}

        <div className="space-y-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            loadingText="กำลังส่ง…"
            leftIcon={<Send className="h-5 w-5" aria-hidden />}
            onClick={onConfirm}
          >
            ยืนยัน {mode.submitLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
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
