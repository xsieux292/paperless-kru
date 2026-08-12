import type { Job, TeacherProfile } from '@/types';

/** ข้อมูลผู้ใช้จำลอง — ตรงกับที่แสดงบนแถบด้านบนของ HTML ต้นฉบับ */
export const mockProfile: TeacherProfile = {
  id: 'teacher-001',
  fullName: 'คุณครูสมศรี ใจดี',
  initial: 'ส',
  schoolName: 'โรงเรียนเรียนดีวิทยา',
  email: 'somsri@learnwell.ac.th',
  avatarUrl: null,
  personnelId: 'T-00142',
  position: 'ครูชำนาญการ',
  department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
  phone: '081-234-5678',
};

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** สร้างไฟล์ผลลัพธ์จำลองที่ดาวน์โหลดได้จริง (เป็นไฟล์ข้อความอธิบาย) */
export function makeMockDownloadUrl(fileName: string): string {
  const content = [
    'ไฟล์ตัวอย่างจากระบบ AI ช่วยงานครู (ข้อมูลจำลอง)',
    '',
    `ชื่อไฟล์: ${fileName}`,
    `สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}`,
    '',
    'เมื่อเชื่อมต่อ API จริงแล้ว ไฟล์นี้จะถูกแทนที่ด้วยเอกสารที่ AI ประมวลผลให้จริง',
  ].join('\n');
  return URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
}

/** รายการงานตั้งต้น — 1 งานกำลังทำ + 2 งานเสร็จแล้ว (ตาม HTML ต้นฉบับ) */
export const initialMockJobs: Job[] = [
  {
    id: 'job-1003',
    mode: 'accounting',
    status: 'processing',
    title: 'บิลซื้ออุปกรณ์วิทย์_ต.ค.pdf',
    progress: 75,
    progressMessage: 'กำลังอ่านยอดเงินและจำแนกหมวดหมู่...',
    fileCount: 3,
    projectId: 'prj-003',
    projectName: 'โครงการวันวิทยาศาสตร์',
    receiptCategory: 'supplies',
    receiptCategoryName: 'ค่าวัสดุ/อุปกรณ์',
    createdAt: minutesAgo(2),
    outputs: [],
  },
  {
    id: 'job-1002',
    mode: 'accounting',
    status: 'succeeded',
    title: 'สรุปบัญชีโครงการสอน.xlsx',
    progress: 100,
    fileCount: 5,
    projectId: 'prj-001',
    projectName: 'โครงการยกระดับผลสัมฤทธิ์คณิตศาสตร์',
    receiptCategory: 'service',
    receiptCategoryName: 'ค่าจ้าง/ค่าบริการ',
    createdAt: minutesAgo(60 * 5),
    completedAt: minutesAgo(60 * 4),
    outputs: [
      {
        id: 'out-2001',
        fileName: 'สรุปบัญชีโครงการสอน.xlsx',
        fileType: 'xlsx',
        sizeBytes: 48_512,
        downloadUrl: '',
      },
    ],
  },
  {
    id: 'job-1001',
    mode: 'template',
    status: 'succeeded',
    title: 'บันทึกข้อความ_อนุมัติ.docx',
    progress: 100,
    fileCount: 1,
    formTemplateId: 'tpl-001',
    formTemplateName: 'บันทึกข้อความ (แบบมาตรฐานโรงเรียน)',
    createdAt: minutesAgo(60 * 26),
    completedAt: minutesAgo(60 * 25),
    outputs: [
      {
        id: 'out-1001',
        fileName: 'บันทึกข้อความ_อนุมัติ.docx',
        fileType: 'docx',
        sizeBytes: 22_140,
        downloadUrl: '',
      },
    ],
  },
];

/** ข้อความบอกความคืบหน้าตามโหมด ใช้ให้ progress ดูมีชีวิตและเข้าใจง่าย */
export const mockProgressSteps: Record<Job['mode'], string[]> = {
  template: [
    'กำลังเปิดไฟล์แบบฟอร์ม...',
    'กำลังอ่านโครงสร้างหัวข้อในเอกสาร...',
    'กำลังเติมข้อมูลลงในช่องที่ว่าง...',
    'กำลังจัดหน้าและตรวจทานความถูกต้อง...',
    'กำลังบันทึกเป็นไฟล์เอกสาร...',
  ],
  ocr: [
    'กำลังปรับความคมชัดของรูปภาพ...',
    'กำลังอ่านตัวหนังสือจากรูป...',
    'กำลังเรียบเรียงข้อความให้เป็นระเบียบ...',
    'กำลังตรวจคำผิดและจัดย่อหน้า...',
    'กำลังบันทึกเป็นไฟล์พิมพ์...',
  ],
  accounting: [
    'กำลังอ่านใบเสร็จและสลิป...',
    'กำลังดึงวันที่ ร้านค้า และยอดเงิน...',
    'กำลังจำแนกหมวดหมู่ค่าใช้จ่าย...',
    'กำลังรวมยอดและตรวจสอบความถูกต้อง...',
    'กำลังจัดทำตารางรายงานบัญชี...',
  ],
};
