import { FileImage, FileText, Trash2 } from 'lucide-react';
import { useFilePreviews } from '@/hooks/useFilePreviews';
import { formatFileSize, truncateFileName } from '@/lib/format';
import { isImageFile } from '@/lib/fileValidation';

export interface SelectedFileListProps {
  files: File[];
  onRemove: (index: number) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

/**
 * รายการไฟล์ที่เลือกไว้ พร้อมรูปตัวอย่าง
 * ครูจะได้เห็นทันทีว่าถ่ายรูปถูกใบไหม ก่อนกดส่ง
 */
export function SelectedFileList({
  files,
  onRemove,
  onClearAll,
  disabled = false,
}: SelectedFileListProps) {
  const previews = useFilePreviews(files);

  if (files.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="font-display text-base font-bold text-ink">
          ไฟล์ที่จะส่ง {files.length} ไฟล์
        </h4>
        <button
          type="button"
          onClick={onClearAll}
          disabled={disabled}
          className="tap-target rounded-btn px-3 text-sm font-bold text-ink-light transition hover:bg-slate-100 hover:text-danger-600 disabled:opacity-50"
        >
          เอาไฟล์ออกทั้งหมด
        </button>
      </div>

      <ul className="space-y-2">
        {files.map((file, index) => {
          const preview = previews.get(file);
          const isImage = isImageFile(file);

          return (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex animate-slide-up items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {preview ? (
                    <img
                      src={preview}
                      alt={`ตัวอย่างของ ${file.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : isImage ? (
                    <FileImage className="h-6 w-6 text-ink-mute" aria-hidden />
                  ) : (
                    <FileText className="h-6 w-6 text-ink-mute" aria-hidden />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-ink" title={file.name}>
                    {truncateFileName(file.name, 40)}
                  </p>
                  <p className="text-sm text-ink-light">{formatFileSize(file.size)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                aria-label={`เอาไฟล์ ${file.name} ออกจากรายการ`}
                className="tap-target flex shrink-0 items-center justify-center gap-1.5 rounded-btn px-3 text-sm font-bold text-ink-light transition hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
              >
                {/* ④ ไอคอนต้องมีข้อความคู่เสมอ */}
                <Trash2 className="h-5 w-5" aria-hidden />
                <span aria-hidden>เอาออก</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
