/**
 * โดเมนหลักของระบบ — ใช้ร่วมกันทั้งฝั่ง mock และ API จริง
 * ถ้า backend ใช้ชื่อฟิลด์ต่างจากนี้ ให้ map ที่ชั้น api/*.api.ts เท่านั้น
 */

/** โหมดการทำงานที่ให้ AI ช่วย (ตรงกับ 3 การ์ดในหน้าจอ) */
export type DocumentMode = 'template' | 'ocr' | 'accounting';

/** สถานะงานประมวลผล */
export type JobStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export interface TeacherProfile {
  id: string;
  fullName: string;
  /** ตัวอักษรย่อที่แสดงในวงกลม avatar */
  initial: string;
  schoolName: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface JobOutputFile {
  id: string;
  fileName: string;
  /** นามสกุลไฟล์ผลลัพธ์ ใช้เลือกไอคอน */
  fileType: 'xlsx' | 'docx' | 'pdf' | 'csv' | 'txt';
  sizeBytes: number;
  /** URL สำหรับดาวน์โหลด (mock จะเป็น blob/data URL) */
  downloadUrl: string;
}

export interface Job {
  id: string;
  mode: DocumentMode;
  status: JobStatus;
  /** ชื่อไฟล์หลักที่ผู้ใช้ส่งเข้ามา ใช้แสดงในรายการ */
  title: string;
  /** 0-100 */
  progress: number;
  /** ข้อความอธิบายขั้นตอนปัจจุบันแบบภาษาคนอ่านเข้าใจ */
  progressMessage?: string;
  /** ข้อความ error แบบเป็นมิตร (เมื่อ status = failed) */
  errorMessage?: string;
  notes?: string;
  fileCount: number;
  createdAt: string;
  completedAt?: string;
  outputs: JobOutputFile[];
}

/** payload ที่ส่งไปสร้างงานใหม่ */
export interface CreateJobInput {
  mode: DocumentMode;
  files: File[];
  notes?: string;
}

/** ผลลัพธ์ทันทีหลังสร้างงาน (backend ควรตอบกลับแบบนี้) */
export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
  estimatedSeconds?: number;
}

/** รูปแบบ response มาตรฐานที่ตกลงกับ backend */
export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
