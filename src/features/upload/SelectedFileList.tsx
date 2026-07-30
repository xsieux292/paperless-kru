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
 * รายการไฟล์ที่เลือกไว้
 * ปรับจาก HTML เดิม: เพิ่มรูปตัวอย่างของไฟล์รูป เพื่อให้เห็นทันทีว่าถ่ายรูปถูกใบไหม
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
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-prompt text-sm font-semibold text-slate-700">
          ไฟล์ที่จะส่ง ({files.length} ไฟล์)
        </h4>
        <button
          type="button"
          onClick={onClearAll}
          disabled={disabled}
          className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 disabled:opacity-50"
        >
          ล้างทั้งหมด
        </button>
      </div>

      <ul className="space-y-2">
        {files.map((file, index) => {
          const preview = previews.get(file);
          const isImage = isImageFile(file);

          return (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex animate-slide-up items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {preview ? (
                    <img
                      src={preview}
                      alt={`ตัวอย่างของ ${file.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : isImage ? (
                    <FileImage className="h-6 w-6 text-blue-500" aria-hidden />
                  ) : (
                    <FileText className="h-6 w-6 text-rose-500" aria-hidden />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800" title={file.name}>
                    {truncateFileName(file.name, 40)}
                  </p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                aria-label={`เอาไฟล์ ${file.name} ออกจากรายการ`}
                className="tap-target flex shrink-0 items-center justify-center rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
