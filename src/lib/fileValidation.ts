import { env } from '@/config/env';
import { formatFileSize } from './format';

/**
 * ตรวจไฟล์ก่อนส่ง แล้วคืน "เหตุผลที่รับไม่ได้" เป็นภาษาไทยที่บอกวิธีแก้
 * ตรวจฝั่ง client ก่อน เพื่อไม่ให้คุณครูรออัปโหลดเสียเที่ยว
 */

export interface RejectedFile {
  file: File;
  reason: string;
}

export interface ValidationResult {
  accepted: File[];
  rejected: RejectedFile[];
}

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'heic', 'webp'];

const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

export function validateFiles(
  incoming: File[],
  alreadySelected: File[] = [],
): ValidationResult {
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];
  const maxBytes = env.maxFileSizeMb * 1024 * 1024;

  const seen = new Set(alreadySelected.map((file) => `${file.name}:${file.size}`));

  for (const file of incoming) {
    const key = `${file.name}:${file.size}`;
    const ext = extensionOf(file.name);

    if (seen.has(key)) {
      rejected.push({ file, reason: 'ไฟล์นี้ถูกเลือกไว้แล้ว จึงไม่ได้เพิ่มซ้ำค่ะ' });
      continue;
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      rejected.push({
        file,
        reason: `ระบบรองรับเฉพาะไฟล์รูปภาพ, PDF และ Word เท่านั้นค่ะ (ไฟล์นี้เป็น .${ext || 'ไม่ทราบชนิด'})`,
      });
      continue;
    }

    if (file.size > maxBytes) {
      rejected.push({
        file,
        reason: `ไฟล์ใหญ่เกินไป (${formatFileSize(file.size)}) ระบบรับได้ไม่เกิน ${env.maxFileSizeMb} MB ต่อไฟล์ค่ะ`,
      });
      continue;
    }

    if (file.size === 0) {
      rejected.push({ file, reason: 'ไฟล์นี้ว่างเปล่า กรุณาตรวจสอบแล้วเลือกใหม่ค่ะ' });
      continue;
    }

    if (accepted.length + alreadySelected.length >= env.maxFileCount) {
      rejected.push({
        file,
        reason: `ส่งได้ครั้งละไม่เกิน ${env.maxFileCount} ไฟล์ค่ะ กรุณาแบ่งส่งเป็นหลายรอบ`,
      });
      continue;
    }

    seen.add(key);
    accepted.push(file);
  }

  return { accepted, rejected };
}

export const isImageFile = (file: File): boolean => file.type.startsWith('image/');
