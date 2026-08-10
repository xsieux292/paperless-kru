import { useCallback, useRef, useState, type DragEvent } from 'react';
import { Camera, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { DocumentModeConfig } from '@/constants/documentModes';
import { env } from '@/config/env';
import { cn } from '@/lib/cn';

export interface DropzoneProps {
  /**
   * ป้ายปุ่มแบบเจาะจง — ใช้ตอนที่ไฟล์ที่แนบไม่ใช่ "แบบฟอร์ม" แล้ว
   * (เลือกแบบฟอร์มจากระบบไปแล้ว ไฟล์ที่แนบคือข้อมูลประกอบ)
   */
  labelOverride?: { cameraLabel: string; fileLabel: string };
  mode: DocumentModeConfig;
  onFilesSelected: (files: File[]) => void;
  /**
   * ยังไม่ได้เลือกไฟล์เลยหรือไม่
   * ถ้ายัง ปุ่มส่งไฟล์คือ "ปุ่มหลักของจอนี้" จึงเป็นปุ่มทึบ
   * ถ้าเลือกแล้ว ปุ่มหลักย้ายไปเป็นปุ่มส่งด้านล่าง ตาม plan ข้อ ① (จอละ 1 ปุ่มทึบ)
   */
  isPrimaryAction: boolean;
  disabled?: boolean;
}

/**
 * พื้นที่ส่งไฟล์
 * ป้ายปุ่มเขียนเป็น "กริยา + สิ่งของ" ตามบริการที่เลือก เช่น "ถ่ายรูปใบเสร็จ"
 * และบอกข้อจำกัดไฟล์ไว้ล่วงหน้า เพื่อไม่ให้เจอปัญหาทีหลัง
 */
export function Dropzone({
  mode,
  labelOverride,
  onFilesSelected,
  isPrimaryAction,
  disabled = false,
}: DropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onFilesSelected(Array.from(fileList));
    },
    [onFilesSelected],
  );

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  const stopAndSet = (event: DragEvent<HTMLDivElement>, dragging: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setIsDragging(dragging);
  };

  const cameraButton = (
    <Button
      type="button"
      variant={isPrimaryAction && mode.upload.preferCamera ? 'primary' : 'outline'}
      size="lg"
      fullWidth
      disabled={disabled}
      leftIcon={<Camera className="h-5 w-5" aria-hidden />}
      onClick={() => cameraInputRef.current?.click()}
    >
      {(labelOverride?.cameraLabel ?? mode.upload.cameraLabel)}
    </Button>
  );

  const fileButton = (
    <Button
      type="button"
      variant={isPrimaryAction && !mode.upload.preferCamera ? 'primary' : 'outline'}
      size="lg"
      fullWidth
      disabled={disabled}
      leftIcon={<FolderOpen className="h-5 w-5" aria-hidden />}
      onClick={() => fileInputRef.current?.click()}
    >
      {(labelOverride?.fileLabel ?? mode.upload.fileLabel)}
    </Button>
  );

  return (
    <div
      onDragEnter={(event) => stopAndSet(event, true)}
      onDragOver={(event) => stopAndSet(event, true)}
      onDragLeave={(event) => stopAndSet(event, false)}
      onDrop={onDrop}
      className={cn(
        'rounded-2xl border-2 border-dashed p-5 transition-all sm:p-6',
        disabled && 'pointer-events-none opacity-60',
        isDragging ? 'border-primary-600 bg-primary-50' : 'border-slate-300 bg-white',
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={mode.accept}
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <div className="mx-auto max-w-md space-y-3">
        {mode.upload.preferCamera ? (
          <>
            {cameraButton}
            {fileButton}
          </>
        ) : (
          <>
            {fileButton}
            {cameraButton}
          </>
        )}

        <p className="pt-1 text-center text-sm text-ink-light">
          หรือจะลากไฟล์มาวางในกรอบนี้ก็ได้ค่ะ
        </p>
        <p className="text-center text-sm text-ink-mute">
          รับไฟล์รูปภาพ, PDF และ Word · ไม่เกิน {env.maxFileSizeMb} MB ต่อไฟล์ · ครั้งละไม่เกิน{' '}
          {env.maxFileCount} ไฟล์
        </p>
      </div>
    </div>
  );
}
