import type { CreateJobInput, CreateJobResponse, Job, JobOutputFile, TeacherProfile } from '@/types';
import { ApiError } from '@/api/http';
import {
  initialMockJobs,
  makeMockDownloadUrl,
  mockProfile,
  mockProgressSteps,
} from './mockData';

/**
 * Backend จำลองที่ทำงานอยู่ในหน่วยความจำของเบราว์เซอร์
 * - งานที่สร้างใหม่จะเดินหน้า progress ตามเวลาจริง แล้วจบเป็น succeeded
 * - พฤติกรรมเหมือน API จริงมากพอที่จะสลับไปใช้ของจริงได้โดยไม่ต้องแก้ UI
 */

const MOCK_LATENCY_MS = 450;
/** ระยะเวลาที่งานจำลอง 1 งานใช้จนเสร็จ */
const MOCK_JOB_DURATION_MS = 24_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface MockJobRecord extends Job {
  /** เวลาที่เริ่มประมวลผล ใช้คำนวณ progress ตามเวลาจริง */
  _startedAt: number;
  _durationMs: number;
}

const jobs = new Map<string, MockJobRecord>();

// เติมข้อมูลตั้งต้น
for (const job of initialMockJobs) {
  jobs.set(job.id, {
    ...job,
    outputs: job.outputs.map((output) => ({
      ...output,
      downloadUrl: output.downloadUrl || makeMockDownloadUrl(output.fileName),
    })),
    _startedAt: Date.now(),
    // งานตั้งต้นที่กำลังทำอยู่ ให้เดินต่อจาก 75% ไปจนจบภายใน ~12 วินาที
    _durationMs: MOCK_JOB_DURATION_MS,
  });
}

let jobCounter = 2000;

/** คำนวณสถานะล่าสุดของงานที่กำลังประมวลผลตามเวลาที่ผ่านไป */
function advance(job: MockJobRecord): MockJobRecord {
  if (job.status !== 'processing' && job.status !== 'queued') return job;

  const elapsed = Date.now() - job._startedAt;
  const ratio = Math.min(elapsed / job._durationMs, 1);
  // เริ่มจาก progress เดิม แล้วไต่ขึ้นไปหา 100
  const startProgress = job.status === 'queued' ? 0 : job.progress;
  const progress = Math.min(99, Math.round(startProgress + (100 - startProgress) * ratio));

  const steps = mockProgressSteps[job.mode];
  const stepIndex = Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length));

  if (ratio >= 1) {
    const outputName = buildOutputName(job);
    const output: JobOutputFile = {
      id: `out-${job.id}`,
      fileName: outputName.fileName,
      fileType: outputName.fileType,
      sizeBytes: 30_000 + Math.round(Math.random() * 90_000),
      downloadUrl: makeMockDownloadUrl(outputName.fileName),
    };
    const done: MockJobRecord = {
      ...job,
      status: 'succeeded',
      progress: 100,
      progressMessage: undefined,
      completedAt: new Date().toISOString(),
      outputs: [output],
    };
    jobs.set(job.id, done);
    return done;
  }

  const updated: MockJobRecord = {
    ...job,
    status: 'processing',
    progress,
    progressMessage: steps[stepIndex],
  };
  jobs.set(job.id, updated);
  return updated;
}

function buildOutputName(job: Job): { fileName: string; fileType: JobOutputFile['fileType'] } {
  const base = job.title.replace(/\.[^.]+$/, '');
  switch (job.mode) {
    case 'accounting':
      return { fileName: `สรุปบัญชี_${base}.xlsx`, fileType: 'xlsx' };
    case 'ocr':
      return { fileName: `ข้อความจากรูป_${base}.docx`, fileType: 'docx' };
    case 'template':
    default:
      return { fileName: `เอกสารสมบูรณ์_${base}.docx`, fileType: 'docx' };
  }
}

function toPublicJob(record: MockJobRecord): Job {
  const { _startedAt: _s, _durationMs: _d, ...job } = record;
  return job;
}

export const mockServer = {
  async getProfile(): Promise<TeacherProfile> {
    await delay(MOCK_LATENCY_MS);
    return mockProfile;
  },

  async listJobs(): Promise<Job[]> {
    await delay(MOCK_LATENCY_MS);
    return [...jobs.values()]
      .map(advance)
      .map(toPublicJob)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getJob(jobId: string): Promise<Job> {
    await delay(MOCK_LATENCY_MS / 2);
    const record = jobs.get(jobId);
    if (!record) {
      throw new ApiError({ status: 404, code: 'JOB_NOT_FOUND', message: `Job ${jobId} not found` });
    }
    return toPublicJob(advance(record));
  },

  async createJob(
    input: CreateJobInput,
    onProgress?: (percent: number) => void,
  ): Promise<CreateJobResponse> {
    // จำลองการอัปโหลดไฟล์แบบมี progress
    for (let percent = 0; percent <= 100; percent += 20) {
      onProgress?.(percent);
      await delay(160);
    }

    const id = `job-${++jobCounter}`;
    const firstFile = input.files[0];
    const record: MockJobRecord = {
      id,
      mode: input.mode,
      status: 'processing',
      title: firstFile?.name ?? 'เอกสารใหม่',
      progress: 1,
      progressMessage: mockProgressSteps[input.mode][0],
      notes: input.notes,
      fileCount: input.files.length,
      createdAt: new Date().toISOString(),
      outputs: [],
      _startedAt: Date.now(),
      _durationMs: MOCK_JOB_DURATION_MS,
    };
    jobs.set(id, record);

    return { jobId: id, status: 'processing', estimatedSeconds: MOCK_JOB_DURATION_MS / 1000 };
  },

  async retryJob(jobId: string): Promise<Job> {
    await delay(MOCK_LATENCY_MS);
    const record = jobs.get(jobId);
    if (!record) {
      throw new ApiError({ status: 404, code: 'JOB_NOT_FOUND', message: `Job ${jobId} not found` });
    }
    const restarted: MockJobRecord = {
      ...record,
      status: 'processing',
      progress: 1,
      progressMessage: mockProgressSteps[record.mode][0],
      errorMessage: undefined,
      completedAt: undefined,
      outputs: [],
      _startedAt: Date.now(),
      _durationMs: MOCK_JOB_DURATION_MS,
    };
    jobs.set(jobId, restarted);
    return toPublicJob(restarted);
  },

  async cancelJob(jobId: string): Promise<void> {
    await delay(MOCK_LATENCY_MS);
    jobs.delete(jobId);
  },
};
