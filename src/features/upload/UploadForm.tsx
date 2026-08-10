import { useCallback, useMemo, useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StepHeader } from '@/components/ui/StepHeader';
import { DEFAULT_MODE, DOCUMENT_MODES } from '@/constants/documentModes';
import { useCreateJob } from '@/hooks/useCreateJob';
import { useFormTemplates } from '@/hooks/useCatalog';
import { useDetectDocument } from '@/hooks/useAiAssist';
import { validateFiles } from '@/lib/fileValidation';
import { formatFileSize } from '@/lib/format';
import { toFriendlyMessage } from '@/api/http';
import { useToast } from '@/providers/toastContext';
import type { DocumentDetection, DocumentMode, ReceiptCategoryId } from '@/types';
import { AiDetectionBanner } from './AiDetectionBanner';
import { ConfirmSubmitDialog } from './ConfirmSubmitDialog';
import { Dropzone } from './Dropzone';
import { ModeSelector } from './ModeSelector';
import { NotesField } from './NotesField';
import { ModeNote, RequirementBox } from './RequirementBox';
import { ReceiptScopePicker } from './ReceiptScopePicker';
import { SavedFormatPicker, type FormatSource } from './SavedFormatPicker';
import { TemplateContentEditor } from './TemplateContentEditor';
import { SelectedFileList } from './SelectedFileList';
import { SuccessDialog } from './SuccessDialog';

/**
 * ฟอร์มหลัก 3 ขั้นตอน
 *
 * ยึดตาม design plan:
 *   ① จอนี้มีปุ่มทึบได้ปุ่มเดียว — ก่อนเลือกไฟล์ปุ่มทึบคือปุ่มถ่ายรูป/เลือกไฟล์
 *      พอเลือกไฟล์แล้วปุ่มทึบย้ายมาที่ปุ่มส่งด้านล่าง
 *   ② ปุ่มหลักติดล่างจอเสมอ กว้างเต็มขอบ สูง 56px
 *   ③ ป้ายปุ่มเป็น "กริยา + สิ่งของ" เปลี่ยนตามบริการที่เลือก
 *   ⑦ ไม่มีทางตัน — บอกเหตุผลทุกครั้งที่ยังกดส่งไม่ได้
 */
export function UploadForm() {
  const [mode, setMode] = useState<DocumentMode>(DEFAULT_MODE);
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // โหมดเติมแบบฟอร์ม: ใช้แบบฟอร์มที่บันทึกไว้ หรืออัปโหลดใหม่
  const [formatSource, setFormatSource] = useState<FormatSource>('saved');
  const [templateId, setTemplateId] = useState<string | null>(null);

  // โหมดเติมแบบฟอร์ม: เนื้อหาที่จะกรอกลงแต่ละช่อง + ช่องบังคับที่ยังว่าง
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // โหมดทำบัญชี: ใบเสร็จชุดนี้เป็นของโครงการไหน / ค่าอะไร
  const [projectId, setProjectId] = useState<string | null>(null);
  const [receiptCategory, setReceiptCategory] = useState<ReceiptCategoryId | null>(null);

  // ผลที่ AI เดาให้จากไฟล์ที่แนบ — ใช้ตั้งค่าให้อัตโนมัติ ครูจะได้ไม่ต้องเลือกเอง
  const [detection, setDetection] = useState<DocumentDetection | null>(null);

  const templates = useFormTemplates();
  const templateName = templates.data?.find((item) => item.id === templateId)?.name;

  /**
   * ต้องเป็น useCallback เพราะลูกเรียกใน useEffect
   * ถ้าสร้างฟังก์ชันใหม่ทุก render จะกลายเป็น loop ไม่รู้จบ
   */
  const handleMissingChange = useCallback((missing: string[]) => {
    setMissingFields((current) =>
      current.length === missing.length && current.every((item, index) => item === missing[index])
        ? current
        : missing,
    );
  }, []);

  const toast = useToast();
  const detect = useDetectDocument();
  const { submit, uploadPercent, isSubmitting } = useCreateJob();

  const modeConfig = DOCUMENT_MODES[mode];
  const hasFiles = files.length > 0;

  const usesSavedTemplate = mode === 'template' && formatSource === 'saved';
  /** เลือกแบบฟอร์มที่บันทึกไว้แล้ว = ไม่ต้องอัปโหลดไฟล์แบบฟอร์มซ้ำ */
  const hasDocumentSource = hasFiles || (usesSavedTemplate && templateId !== null);
  /** โหมดบัญชีต้องระบุโครงการและประเภทก่อน เพื่อให้รายงานแยกกันได้ */
  const scopeComplete = mode !== 'accounting' || (projectId !== null && receiptCategory !== null);
  /**
   * โหมดเติมแบบฟอร์มต้องมีเนื้อหาในช่องบังคับครบก่อน
   * ของเดิมเลือกแบบฟอร์มแล้วกดส่งได้เลย ทั้งที่ AI ยังไม่รู้ว่าจะกรอกอะไรลงไป
   */
  const contentComplete = !usesSavedTemplate || missingFields.length === 0;
  const canSubmit = hasDocumentSource && scopeComplete && contentComplete;

  /** เหตุผลที่ยังกดส่งไม่ได้ — ต้องบอกเสมอ ไม่ปล่อยให้ครูเดา (plan ข้อ ⑦) */
  const blockedReason = !hasDocumentSource
    ? usesSavedTemplate
      ? 'ยังไม่ได้เลือกแบบฟอร์มค่ะ — เลือก 1 แบบฟอร์มจากรายการ หรือสลับไปอัปโหลดไฟล์ใหม่'
      : 'ปุ่มส่งจะกดได้เมื่อมีไฟล์อย่างน้อย 1 ไฟล์ค่ะ — กลับไปที่ขั้นตอนที่ 2 ได้เลย'
    : !scopeComplete
      ? 'ยังขาดอีกนิดเดียวค่ะ — เลือกโครงการและประเภทใบเสร็จในขั้นตอนที่ 2 ให้ครบก่อนนะคะ'
      : !contentComplete
        ? `ยังไม่ได้บอก AI ว่าจะกรอกอะไรลงไปค่ะ — ขาดช่อง ${missingFields.join(' · ')}`
        : null;

  const handleFilesSelected = useCallback(
    (incoming: File[]) => {
      const { accepted, rejected } = validateFiles(incoming, files);

      if (accepted.length > 0) {
        setFiles((current) => [...current, ...accepted]);

        // ให้ AI ดูไฟล์แล้วตั้งค่าให้เลย — ลดขั้นตอนที่ครูต้องเลือกเอง
        detect.mutate(accepted, {
          onSuccess: (result) => {
            setDetection(result);
            setMode(result.mode.value);
            if (result.projectId) setProjectId(result.projectId.value);
            if (result.receiptCategory) setReceiptCategory(result.receiptCategory.value);
            if (result.mode.value !== 'template') setFormatSource('new');
          },
          // ถ้าเดาไม่ได้ก็ไม่เป็นไร ครูเลือกเองได้ตามปกติ ไม่ต้องรบกวนด้วย error
          onError: () => setDetection(null),
        });
      }

      for (const { file, reason } of rejected) {
        toast.warning(`ยังไม่ได้เพิ่มไฟล์ ${file.name}`, reason);
      }
    },
    [files, toast, detect],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setDetection(null);
  }, []);

  const handleModeChange = useCallback(
    (nextMode: DocumentMode) => {
      setMode(nextMode);
      // เปลี่ยนบริการแล้วเนื้อหาแบบฟอร์มเดิมใช้ไม่ได้ ต้องล้างทิ้ง
      setFormValues({});
      // เตือนเมื่อเปลี่ยนบริการทั้งที่เลือกไฟล์ไว้แล้ว เพราะไฟล์ที่ต้องใช้อาจคนละแบบ
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
    if (blockedReason) {
      toast.error('ยังส่งไม่ได้ค่ะ', blockedReason);
      document
        .getElementById('step-upload')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      await submit({
        mode,
        files,
        notes: notes.trim() || undefined,
        formTemplateId: usesSavedTemplate && templateId ? templateId : undefined,
        projectId: mode === 'accounting' && projectId ? projectId : undefined,
        receiptCategory: mode === 'accounting' && receiptCategory ? receiptCategory : undefined,
        formValues: usesSavedTemplate && Object.keys(formValues).length > 0 ? formValues : undefined,
      });
      setShowConfirm(false);
      setShowSuccess(true);
      setFiles([]);
      setNotes('');
      setFormValues({});
    } catch (error) {
      setShowConfirm(false);
      toast.error('ส่งเอกสารไม่สำเร็จ', toFriendlyMessage(error));
    }
  };

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          openConfirm();
        }}
        className="card space-y-6 p-5 sm:p-6"
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

        <hr className="border-slate-200" />

        {/* ขั้นตอนที่ 2 */}
        <section id="step-upload" aria-labelledby="step-2-title">
          <StepHeader
            step={2}
            titleId="step-2-title"
            title="ส่งเอกสารที่ต้องใช้"
            hint={
              hasFiles
                ? `เลือกไว้แล้ว ${files.length} ไฟล์ (${formatFileSize(totalSize)})`
                : usesSavedTemplate && templateId
                  ? 'ใช้แบบฟอร์มที่บันทึกไว้ ไม่ต้องอัปโหลดใหม่'
                  : undefined
            }
            complete={hasDocumentSource && scopeComplete}
            waiting={!hasDocumentSource || !scopeComplete}
          />
          {/* AI เดาให้ก่อน แล้วครูค่อยแก้เฉพาะจุดที่ไม่ตรง */}
          <AiDetectionBanner
            detecting={detect.isPending}
            detection={detection}
            onUndo={() => setDetection(null)}
          />

          <RequirementBox mode={modeConfig} skip={usesSavedTemplate && templateId !== null} />

          {/* เลือกแบบฟอร์มที่เคยส่งไว้ แทนการอัปโหลดไฟล์เดิมซ้ำ */}
          {mode === 'template' && (
            <SavedFormatPicker
              source={formatSource}
              onSourceChange={setFormatSource}
              selectedTemplateId={templateId}
              onSelectTemplate={(id) => {
                // เปลี่ยนแบบฟอร์ม = คนละชุดช่อง ต้องล้างเนื้อหาเดิมทิ้ง
                if (id !== templateId) setFormValues({});
                setTemplateId(id);
              }}
              disabled={isSubmitting}
            />
          )}

          {/* เลือกแบบฟอร์มแล้ว → บอกว่าต้องกรอกช่องอะไร แล้วให้ AI ร่างให้ */}
          {usesSavedTemplate && templateId && (
            <TemplateContentEditor
              templateId={templateId}
              templateName={templateName ?? ''}
              values={formValues}
              onValuesChange={setFormValues}
              onMissingChange={handleMissingChange}
              disabled={isSubmitting}
            />
          )}

          {/* แยกงานตามโครงการและประเภทใบเสร็จ */}
          {mode === 'accounting' && (
            <ReceiptScopePicker
              projectId={projectId}
              onProjectChange={setProjectId}
              category={receiptCategory}
              onCategoryChange={setReceiptCategory}
              disabled={isSubmitting}
            />
          )}

          {usesSavedTemplate && (
            <p className="mb-2 text-base text-ink-light">
              ถ้ามีเอกสารอ้างอิง (เช่น รูปบันทึกที่จดไว้ หรือหนังสือฉบับเดิม)
              แนบเพิ่มให้ AI ใช้ประกอบได้ค่ะ — ไม่แนบก็ส่งได้เลย
            </p>
          )}
          <Dropzone
            mode={modeConfig}
            labelOverride={
              usesSavedTemplate
                ? {
                    cameraLabel: 'ถ่ายรูปข้อมูลประกอบ',
                    fileLabel: 'แนบไฟล์ข้อมูลประกอบ',
                  }
                : undefined
            }
            onFilesSelected={handleFilesSelected}
            isPrimaryAction={!hasDocumentSource}
            disabled={isSubmitting}
          />
          <SelectedFileList
            files={files}
            onRemove={removeFile}
            onClearAll={clearFiles}
            disabled={isSubmitting}
          />
        </section>

        <hr className="border-slate-200" />

        {/* ขั้นตอนที่ 3 */}
        <section aria-labelledby="step-3-title">
          <StepHeader
            step={3}
            titleId="step-3-title"
            title="อยากบอกอะไร AI เพิ่มไหมคะ?"
            hint="ข้ามได้ ไม่ใส่ก็ทำงานได้ปกติค่ะ"
            complete={notes.trim().length > 0}
          />
          <NotesField value={notes} onChange={setNotes} mode={modeConfig} disabled={isSubmitting} />
        </section>

        {blockedReason && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-ink-mute" aria-hidden />
            <p className="text-base leading-relaxed text-ink-light">{blockedReason}</p>
          </div>
        )}

        {/* ปุ่มหลักบนจอใหญ่ (จอเล็กใช้แถบล่างแทน) */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSubmit || isSubmitting}
          leftIcon={<Send className="h-5 w-5" aria-hidden />}
          className="hidden lg:flex"
        >
          {modeConfig.submitLabel}
        </Button>
      </form>

      {/* ② ปุ่มหลักติดล่างจอเสมอบนมือถือ ตำแหน่งเดิมทุกหน้าจอ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSubmit || isSubmitting}
          onClick={openConfirm}
          leftIcon={<Send className="h-5 w-5" aria-hidden />}
        >
          {canSubmit ? modeConfig.submitLabel : 'ยังกรอกไม่ครบ'}
        </Button>
      </div>

      <ConfirmSubmitDialog
        open={showConfirm}
        mode={modeConfig}
        files={files}
        notes={notes}
        templateId={usesSavedTemplate ? templateId : null}
        projectId={mode === 'accounting' ? projectId : null}
        receiptCategory={mode === 'accounting' ? receiptCategory : null}
        isSubmitting={isSubmitting}
        uploadPercent={uploadPercent}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />

      <SuccessDialog open={showSuccess} onClose={() => setShowSuccess(false)} mode={modeConfig} />
    </>
  );
}
