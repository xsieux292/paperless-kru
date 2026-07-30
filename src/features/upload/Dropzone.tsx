import { useCallback, useRef, useState, type DragEvent } from 'react';
import { Camera, FolderOpen, Hand } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { env } from '@/config/env';
import { cn } from '@/lib/cn';

export interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  /** ชนิดไฟล์ที่รับ เปลี่ยนตามโหมดที่เลือก */
  accept: string;
  disabled?: boolean;
}

/**
 * พื้นที่ส่งไฟล์
 * ปรับจาก HTML เดิม: แยกปุ่ม "เลือกไฟล์" กับ "ถ่ายรูป" ให้เด่นเท่ากัน
 * และเพิ่มข้อความบอกข้อจำกัดไฟล์ไว้ล่วงหน้า เพื่อไม่ให้เจอ error ทีหลัง
 */
export function Dropzone({ onFilesSelected, accept, disabled = false }: DropzoneProps) {
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

  return (
    <div
      onDragEnter={(event) => stopAndSet(event, true)}
      onDragOver={(event) => stopAndSet(event, true)}
      onDragLeave={(event) => stopAndSet(event, false)}
      onDrop={onDrop}
      className={cn(
        'rounded-3xl border-4 border-dashed p-6 text-center transition-all sm:p-10',
        disabled && 'pointer-events-none opacity-60',
        isDragging
          ? 'border-primary-500 bg-primary-50'
          : 'border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-primary-50/40',
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
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

      <div className="mx-auto max-w-md space-y-6">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white text-primary-600 shadow-md">
          <Hand className="h-10 w-10" aria-hidden />
        </div>

        <div>
          <p className="mb-2 font-prompt text-2xl font-bold text-slate-800">
            เลือกวิธีส่งเอกสารได้เลยค่ะ
          </p>
          <p className="text-base text-slate-500">
            กดปุ่มด้านล่าง หรือจะลากไฟล์มาวางตรงนี้ก็ได้ค่ะ
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            leftIcon={<FolderOpen className="h-6 w-6" aria-hidden />}
            onClick={() => fileInputRef.current?.click()}
          >
            เลือกไฟล์ในเครื่อง
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            leftIcon={<Camera className="h-6 w-6" aria-hidden />}
            onClick={() => cameraInputRef.current?.click()}
          >
            ถ่ายรูปใหม่
          </Button>
        </div>

        <p className="text-xs text-slate-400">
          รองรับไฟล์รูปภาพ, PDF และ Word · ขนาดไม่เกิน {env.maxFileSizeMb} MB ต่อไฟล์ ·
          ส่งได้ครั้งละไม่เกิน {env.maxFileCount} ไฟล์
        </p>
      </div>
    </div>
  );
}
