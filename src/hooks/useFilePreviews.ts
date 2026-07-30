import { useEffect, useState } from 'react';
import { isImageFile } from '@/lib/fileValidation';

/**
 * สร้างรูปตัวอย่าง (thumbnail) ของไฟล์รูปที่เลือกไว้
 * ช่วยให้คุณครูเห็นทันทีว่าถ่ายรูปถูกใบหรือไม่ ก่อนกดส่ง
 * คืน object URL และเก็บกวาดให้เองเมื่อไฟล์ถูกลบ (กัน memory leak)
 */
export function useFilePreviews(files: File[]): Map<File, string> {
  const [previews, setPreviews] = useState<Map<File, string>>(new Map());

  useEffect(() => {
    const next = new Map<File, string>();
    for (const file of files) {
      if (isImageFile(file)) next.set(file, URL.createObjectURL(file));
    }
    setPreviews(next);

    return () => {
      for (const url of next.values()) URL.revokeObjectURL(url);
    };
  }, [files]);

  return previews;
}
