import { useCallback, useMemo, useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StepHeader } from '@/components/ui/StepHeader';
import { DEFAULT_MODE, DOCUMENT_MODES } from '@/constants/documentModes';
import { useCreateJob } from '@/hooks/useCreateJob';
import { validateFiles } from '@/lib/fileValidation';
import { formatFileSize } from '@/lib/format';
import { toFriendlyMessage } from '@/api/http';
import { useToast } from '@/providers/toastContext';
import type { DocumentMode } from '@/types';
import { ConfirmSubmitDialog } from './ConfirmSubmitDialog';
import { Dropzone } from './Dropzone';
import { ModeSelector } from './ModeSelector';
import { NotesField } from './NotesField';
import { ModeNote, RequirementBox } from './RequirementBox';
import { SelectedFileList } from './SelectedFileList';
import { SuccessDialog } from './SuccessDialog';

/**
 * ฟอร์มหลักของระบบ — 3 ขั้นตอนตาม HTML เดิม
 * สิ่งที่เพิ่มเข้ามาเพื่อให้ใช้ง่ายขึ้น:
 *   - เครื่องหมายถูกบอกว่าขั้นตอนไหนทำเสร็จแล้ว
 *   - หน้าจอตรวจทานก่อนส่ง (กันส่งผิดโหมด/ผิดไฟล์)
 *   - แถบปุ่มส่งลอยอยู่ล่างจอบนมือถือ ไม่ต้องเลื่อนหา
 *   - ข้อความบอกเหตุผลเมื่อไฟล์ถูกปฏิเสธ พร้อมวิธีแก้
 */
export function UploadForm() {
  const [mode, setMode] = useState<DocumentMode>(DEFAULT_MODE);
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const toast = useToast();
  const { submit, uploadPercent, isSubmitting } = useCreateJob();

  const modeConfig = DOCUMENT_MODES[mode];
  const hasFiles = files.length > 0;

  const handleFilesSelected = useCallback(
    (incoming: File[]) => {
      const { accepted, rejected } = validateFiles(incoming, files);

      if (accepted.length > 0) {
        setFiles((current) => [...current, ...accepted]);
        toast.success(
          `เพิ่มไฟล์แล้ว ${accepted.length} ไฟล์`,
          'ตรวจดูรายการด้านล่างได้เลยค่ะ',
        );
      }

      for (const { file, reason } of rejected) {
        toast.warning(`ไม่ได้เพิ่มไฟล์ ${file.name}`, reason);
      }
    },
    [files, toast],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const clearFiles = useCallback(() => setFiles([]), []);

  const handleModeChange = useCallback(
    (nextMode: DocumentMode) => {
      setMode(nextMode);
      // เตือนเมื่อเปลี่ยนโหมดทั้งที่เลือกไฟล์ไว้แล้ว เพราะไฟล์ที่ต้องใช้อาจคนละแบบ
      if (files.length > 0) {
        toast.showToast({
          variant: 'info',
          title: 'เปลี่ยนบริการแล้วค่ะ',
          description: `ไฟล์ที่เลือกไว้ยังอยู่ครบ กรุณาตรวจว่าตรงกับ “${DOCUMENT_MODES[nextMode].title}” หรือไม่`,
        });
      }
    },
    [files.length, toast],
  );

  const openConfirm = () => {
    if (!hasFiles) {
      toast.error(
        'ยังไม่ได้เลือกไฟล์ค่ะ',
        'กรุณากดปุ่ม “เลือกไฟล์ในเครื่อง” หรือ “ถ่ายรูปใหม่” ก่อนส่งค่ะ',
      );
      document.getElementById('step-upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      await submit({ mode, files, notes: notes.trim() || undefined });
      setShowConfirm(false);
      setShowSuccess(true);
      setFiles([]);
      setNotes('');
    } catch (error) {
      setShowConfirm(false);
      toast.error('ส่งเอกสารไม่สำเร็จ', toFriendlyMessage(error));
    }
  };

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files],
  );

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          openConfirm();
        }}
        className="card space-y-8 p-6 sm:p-8"
      >
        {/* ขั้นตอนที่ 1 */}
        <section aria-labelledby="step-1-title">
          <StepHeader
            step={1}
            titleId="step-1-title"
            title="ให้ AI ช่วยทำอะไรดีคะ?"
            hint="เลือกได้ 1 อย่างต่อการส่ง 1 ครั้ง"
            complete
          />
          <ModeSelector value={mode} onChange={handleModeChange} disabled={isSubmitting} />
          <ModeNote mode={modeConfig} />
        </section>

        <hr className="border-slate-100" />

        {/* ขั้นตอนที่ 2 */}
        <section id="step-upload" aria-labelledby="step-2-title">
          <StepHeader
            step={2}
            titleId="step-2-title"
            title="ส่งเอกสารที่ต้องใช้"
            hint={
              hasFiles ? `เลือกไว้แล้ว ${files.length} ไฟล์ (${formatFileSize(totalSize)})` : undefined
            }
            complete={hasFiles}
          />
          <RequirementBox mode={modeConfig} />
          <Dropzone
            onFilesSelected={handleFilesSelected}
            accept={modeConfig.accept}
            disabled={isSubmitting}
          />
          <SelectedFileList
            files={files}
            onRemove={removeFile}
            onClearAll={clearFiles}
            disabled={isSubmitting}
          />
        </section>

        <hr className="border-slate-100" />

        {/* ขั้นตอนที่ 3 */}
        <section aria-labelledby="step-3-title">
          <StepHeader
            step={3}
            titleId="step-3-title"
            title="อยากบอกอะไร AI เพิ่มไหมคะ?"
            hint="ข้ามได้ ไม่ใส่ก็ทำงานได้ปกติค่ะ"
            complete={notes.trim().length > 0}
          />
          <NotesField
            value={notes}
            onChange={setNotes}
            mode={modeConfig}
            disabled={isSubmitting}
          />
        </section>

        {!hasFiles && (
          <div className="flex items-start gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <p className="text-sm leading-relaxed">
              ยังส่งไม่ได้ค่ะ — กรุณาเลือกไฟล์หรือถ่ายรูปในขั้นตอนที่ 2 ก่อนนะคะ
            </p>
          </div>
        )}

        <Button
          type="submit"
          variant="success"
          size="lg"
          fullWidth
          disabled={!hasFiles || isSubmitting}
          leftIcon={<Send className="h-6 w-6" aria-hidden />}
          className="text-xl"
        >
          ตรวจทานและส่งให้ AI ทำงาน
        </Button>
      </form>

      {/* แถบปุ่มลอยล่างจอบนมือถือ — คุณครูไม่ต้องเลื่อนหาปุ่มส่ง */}
      {hasFiles && !isSubmitting && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
          <Button
            type="button"
            variant="success"
            size="lg"
            fullWidth
            onClick={openConfirm}
            leftIcon={<Send className="h-5 w-5" aria-hidden />}
          >
            ส่ง {files.length} ไฟล์ให้ AI
          </Button>
        </div>
      )}

      <ConfirmSubmitDialog
        open={showConfirm}
        mode={modeConfig}
        files={files}
        notes={notes}
        isSubmitting={isSubmitting}
        uploadPercent={uploadPercent}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />

      <SuccessDialog open={showSuccess} onClose={() => setShowSuccess(false)} />
    </>
  );
}
