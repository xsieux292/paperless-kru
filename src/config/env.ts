/**
 * ศูนย์รวมการอ่านค่า environment
 * ทุกที่ในระบบต้องอ่านค่าจากไฟล์นี้ ห้ามอ่าน import.meta.env ตรง ๆ
 */

const raw = import.meta.env;

const toBool = (value: unknown, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1' || value === true;
};

const apiBaseUrl = (raw.VITE_API_BASE_URL ?? '').toString().replace(/\/$/, '');

export const env = {
  /** URL ของ backend เช่น https://api.school.ac.th/v1 (ว่าง = ยังไม่ได้ต่อ API) */
  apiBaseUrl,

  /**
   * ใช้ข้อมูลจำลอง (mock) หรือไม่
   * ค่าเริ่มต้น: ใช้ mock เมื่อยังไม่ได้ตั้ง VITE_API_BASE_URL
   * ตั้ง VITE_USE_MOCK=false เพื่อบังคับยิง API จริง
   */
  useMock: toBool(raw.VITE_USE_MOCK, apiBaseUrl === ''),

  /** timeout ของ request (ms) */
  apiTimeoutMs: Number(raw.VITE_API_TIMEOUT_MS ?? 30000),

  /** ความถี่ในการถามสถานะงานจาก backend (ms) */
  jobPollIntervalMs: Number(raw.VITE_JOB_POLL_INTERVAL_MS ?? 3000),

  /** ขนาดไฟล์สูงสุดต่อไฟล์ (MB) */
  maxFileSizeMb: Number(raw.VITE_MAX_FILE_SIZE_MB ?? 25),

  /** จำนวนไฟล์สูงสุดต่อการส่ง 1 ครั้ง */
  maxFileCount: Number(raw.VITE_MAX_FILE_COUNT ?? 10),

  /** เบอร์สายด่วนฝ่ายไอที แสดงในกล่องช่วยเหลือ */
  supportPhone: (raw.VITE_SUPPORT_PHONE ?? '02-123-4567').toString(),

  /** เบอร์สำหรับ tel: link */
  supportPhoneHref: (raw.VITE_SUPPORT_PHONE_HREF ?? '021234567').toString(),

  isDev: raw.DEV,
} as const;
