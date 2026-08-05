import { env } from '@/config/env';
import type { CreateJobInput, CreateJobResponse, Job, JobOutputFile } from '@/types';
import { ApiError, http, uploadWithProgress } from './http';
import { endpoints } from './endpoints';
import { mockServer } from './mock/mockServer';

/**
 * งานประมวลผลเอกสารทั้งหมด
 *
 * วิธีต่อ API จริง:
 *   1. ตั้ง VITE_API_BASE_URL ใน .env
 *   2. ตั้ง VITE_USE_MOCK=false
 *   3. ถ้าชื่อฟิลด์จาก backend ไม่ตรงกับ type ในโปรเจกต์ ให้แก้ที่ normalizeJob() ที่เดียว
 */

export async function fetchJobs(): Promise<Job[]> {
  if (env.useMock) return mockServer.listJobs();

  const raw = await http.get<Job[]>(endpoints.jobs.list());
  return raw.map(normalizeJob);
}

export async function fetchJob(jobId: string): Promise<Job> {
  if (env.useMock) return mockServer.getJob(jobId);

  const raw = await http.get<Job>(endpoints.jobs.detail(jobId));
  return normalizeJob(raw);
}

export async function createJob(
  input: CreateJobInput,
  onUploadProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<CreateJobResponse> {
  if (env.useMock) return mockServer.createJob(input, onUploadProgress);

  const formData = new FormData();
  formData.append('mode', input.mode);
  if (input.notes) formData.append('notes', input.notes);
  if (input.formTemplateId) formData.append('formTemplateId', input.formTemplateId);
  if (input.projectId) formData.append('projectId', input.projectId);
  if (input.receiptCategory) formData.append('receiptCategory', input.receiptCategory);
  for (const file of input.files) {
    formData.append('files', file, file.name);
  }

  return uploadWithProgress<CreateJobResponse>(
    endpoints.jobs.create(),
    formData,
    onUploadProgress,
    signal,
  );
}

export async function retryJob(jobId: string): Promise<Job> {
  if (env.useMock) return mockServer.retryJob(jobId);
  return normalizeJob(await http.post<Job>(endpoints.jobs.retry(jobId)));
}

export async function cancelJob(jobId: string): Promise<void> {
  if (env.useMock) return mockServer.cancelJob(jobId);
  await http.post<void>(endpoints.jobs.cancel(jobId));
}

/**
 * ดาวน์โหลดไฟล์ผลลัพธ์
 * โหมด mock: ใช้ blob URL ที่สร้างไว้แล้ว
 * โหมดจริง: ดึงไฟล์พร้อม token แล้วค่อยสั่งบันทึก (กัน URL ที่ต้อง auth)
 */
export async function downloadOutput(jobId: string, output: JobOutputFile): Promise<void> {
  let href = output.downloadUrl;
  let shouldRevoke = false;

  if (!env.useMock) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(
      output.downloadUrl || `${env.apiBaseUrl}${endpoints.jobs.download(jobId, output.id)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!response.ok) {
      throw new ApiError({
        status: response.status,
        code: 'DOWNLOAD_FAILED',
        message: 'ดาวน์โหลดไฟล์ไม่สำเร็จ',
      });
    }
    href = URL.createObjectURL(await response.blob());
    shouldRevoke = true;
  }

  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = output.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  if (shouldRevoke) {
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  }
}

/** จุดเดียวสำหรับ map ข้อมูลจาก backend → โดเมนของ frontend */
function normalizeJob(raw: Job): Job {
  return {
    ...raw,
    progress: Math.max(0, Math.min(100, Number(raw.progress) || 0)),
    outputs: raw.outputs ?? [],
  };
}
