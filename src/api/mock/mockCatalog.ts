import type {
  Approver,
  FormTemplate,
  Project,
  ReceiptCategory,
  Requisition,
  SuggestedItem,
} from '@/types';

/** ข้อมูลจำลองของ "ของที่มีอยู่แล้วในระบบ" — แบบฟอร์ม โครงการ ผู้อนุมัติ */

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

/** แบบฟอร์มที่โรงเรียนใช้ซ้ำทั้งปี */
export const mockFormTemplates: FormTemplate[] = [
  {
    id: 'tpl-001',
    name: 'บันทึกข้อความ (แบบมาตรฐานโรงเรียน)',
    fileType: 'docx',
    category: 'หนังสือราชการ',
    sizeBytes: 28_400,
    uploadedAt: daysAgo(120),
    usageCount: 24,
    lastUsedAt: daysAgo(2),
  },
  {
    id: 'tpl-002',
    name: 'แบบขออนุมัติจัดกิจกรรม/โครงการ',
    fileType: 'docx',
    category: 'หนังสือราชการ',
    sizeBytes: 41_200,
    uploadedAt: daysAgo(98),
    usageCount: 12,
    lastUsedAt: daysAgo(9),
  },
  {
    id: 'tpl-003',
    name: 'แบบรายงานผลการจัดการเรียนรู้',
    fileType: 'docx',
    category: 'งานวิชาการ',
    sizeBytes: 36_800,
    uploadedAt: daysAgo(75),
    usageCount: 8,
    lastUsedAt: daysAgo(21),
  },
  {
    id: 'tpl-004',
    name: 'ใบเบิกวัสดุ บก.01',
    fileType: 'pdf',
    category: 'การเงิน/พัสดุ',
    sizeBytes: 52_100,
    uploadedAt: daysAgo(60),
    usageCount: 15,
    lastUsedAt: daysAgo(5),
  },
  {
    id: 'tpl-005',
    name: 'แบบฟอร์มยืมพัสดุ-ครุภัณฑ์',
    fileType: 'pdf',
    category: 'การเงิน/พัสดุ',
    sizeBytes: 33_500,
    uploadedAt: daysAgo(45),
    usageCount: 6,
    lastUsedAt: daysAgo(30),
  },
];

/** โครงการที่ครูคนนี้รับผิดชอบอยู่ในปีงบประมาณนี้ */
export const mockProjects: Project[] = [
  {
    id: 'prj-001',
    name: 'โครงการยกระดับผลสัมฤทธิ์คณิตศาสตร์',
    code: 'AC-2569-012',
    budgetSource: 'เรียนฟรี 15 ปี',
    fiscalYear: '2569',
    budgetTotal: 45_000,
    budgetUsed: 28_400,
    active: true,
  },
  {
    id: 'prj-002',
    name: 'โครงการกีฬาสีภายในโรงเรียน',
    code: 'AT-2569-004',
    budgetSource: 'งบกิจกรรมโรงเรียน',
    fiscalYear: '2569',
    budgetTotal: 80_000,
    budgetUsed: 71_500,
    active: true,
  },
  {
    id: 'prj-003',
    name: 'โครงการวันวิทยาศาสตร์',
    code: 'SC-2569-009',
    budgetSource: 'งบกิจกรรมโรงเรียน',
    fiscalYear: '2569',
    budgetTotal: 25_000,
    budgetUsed: 4_200,
    active: true,
  },
  {
    id: 'prj-004',
    name: 'งานพัสดุกลุ่มสาระวิทยาศาสตร์',
    code: 'SP-2569-021',
    budgetSource: 'งบพัสดุหมวดวิชา',
    fiscalYear: '2569',
    budgetTotal: 60_000,
    budgetUsed: 12_800,
    active: true,
  },
];

/** ประเภทใบเสร็จ ใช้จำแนกหมวดค่าใช้จ่ายในรายงาน */
export const RECEIPT_CATEGORIES: ReceiptCategory[] = [
  { id: 'supplies', name: 'ค่าวัสดุ/อุปกรณ์', description: 'กระดาษ เครื่องเขียน อุปกรณ์การสอน' },
  { id: 'food', name: 'ค่าอาหาร/เครื่องดื่ม', description: 'อาหารกลางวัน อาหารว่างในกิจกรรม' },
  { id: 'travel', name: 'ค่าเดินทาง', description: 'ค่าน้ำมัน ค่ารถ ค่าที่พักไปราชการ' },
  { id: 'service', name: 'ค่าจ้าง/ค่าบริการ', description: 'ค่าจ้างวิทยากร ค่าถ่ายเอกสาร ค่าซ่อม' },
  { id: 'utility', name: 'ค่าสาธารณูปโภค', description: 'ค่าไฟ ค่าน้ำ ค่าอินเทอร์เน็ต' },
  { id: 'other', name: 'อื่น ๆ', description: 'ค่าใช้จ่ายที่ไม่เข้าหมวดข้างต้น' },
];

/** ผู้มีอำนาจอนุมัติในโรงเรียน */
export const mockApprovers: Approver[] = [
  { id: 'apv-001', name: 'นายวิชัย มั่นคง', role: 'ผู้อำนวยการโรงเรียน' },
  { id: 'apv-002', name: 'นางสาวพรทิพย์ ศรีสุข', role: 'รองผู้อำนวยการฝ่ายบริหารงบประมาณ' },
  { id: 'apv-003', name: 'นายสมชาย ทองดี', role: 'หัวหน้าเจ้าหน้าที่พัสดุ' },
];

/** ใบเบิกที่เคยส่งไปแล้ว ใช้โชว์ในรายการ "ใบเบิกของฉัน" */
export const initialMockRequisitions: Requisition[] = [
  {
    id: 'req-1002',
    docNo: 'บก.01-2569-0841',
    kind: 'budget',
    status: 'pending',
    purpose: 'จัดซื้อวัสดุสำหรับกิจกรรมวันวิทยาศาสตร์',
    projectId: 'prj-003',
    projectName: 'โครงการวันวิทยาศาสตร์',
    neededBy: '18 ส.ค. 2569',
    items: [
      { id: 'it-1', name: 'ฟิวเจอร์บอร์ด', quantity: 20, unit: 'แผ่น', unitPrice: 45 },
      { id: 'it-2', name: 'สีโปสเตอร์', quantity: 12, unit: 'ขวด', unitPrice: 35 },
      { id: 'it-3', name: 'เทปกาวสองหน้า', quantity: 10, unit: 'ม้วน', unitPrice: 25 },
    ],
    totalAmount: 1_570,
    approverId: 'apv-002',
    approverName: 'นางสาวพรทิพย์ ศรีสุข',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'req-1001',
    docNo: 'ยพ.02-2569-0117',
    kind: 'borrow',
    status: 'approved',
    purpose: 'ยืมโปรเจกเตอร์สำหรับสอนเสริมช่วงเย็น',
    projectId: 'prj-001',
    projectName: 'โครงการยกระดับผลสัมฤทธิ์คณิตศาสตร์',
    neededBy: '8 ส.ค. 2569',
    items: [{ id: 'it-4', name: 'เครื่องฉายโปรเจกเตอร์', quantity: 1, unit: 'เครื่อง', unitPrice: 0 }],
    totalAmount: 0,
    approverId: 'apv-003',
    approverName: 'นายสมชาย ทองดี',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(6),
  },
  {
    id: 'req-1000',
    docNo: 'บก.01-2569-0798',
    kind: 'budget',
    status: 'returned',
    purpose: 'จัดซื้อกระดาษสำหรับพิมพ์ข้อสอบกลางภาค',
    projectId: 'prj-001',
    projectName: 'โครงการยกระดับผลสัมฤทธิ์คณิตศาสตร์',
    neededBy: '1 ส.ค. 2569',
    items: [{ id: 'it-5', name: 'กระดาษ A4 80 แกรม', quantity: 30, unit: 'รีม', unitPrice: 130 }],
    totalAmount: 3_900,
    approverId: 'apv-002',
    approverName: 'นางสาวพรทิพย์ ศรีสุข',
    returnedReason: 'ยอดเกินวงเงินที่เหลือของโครงการ กรุณาลดจำนวนลงหรือเปลี่ยนแหล่งงบค่ะ',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(10),
  },
];

/**
 * คลังคำแนะนำของ "AI ช่วยคิดรายการอุปกรณ์"
 * ใน mock ใช้จับคำจากข้อความที่ครูพิมพ์ ส่วน API จริงจะเป็นผลจากโมเดลภาษา
 */
const SUGGESTION_RULES: { keywords: string[]; items: SuggestedItem[] }[] = [
  {
    keywords: ['วิทยาศาสตร์', 'ทดลอง', 'แล็บ', 'สะเต็ม', 'stem'],
    items: [
      { name: 'บีกเกอร์แก้ว 250 ml', quantity: 10, unit: 'ใบ', unitPrice: 85, reason: 'ใช้ประจำในการทดลองพื้นฐาน' },
      { name: 'ถุงมือยางแบบใช้แล้วทิ้ง', quantity: 2, unit: 'กล่อง', unitPrice: 150, reason: 'ความปลอดภัยของนักเรียน' },
      { name: 'แว่นตานิรภัย', quantity: 20, unit: 'อัน', unitPrice: 65, reason: 'จำเป็นเมื่อมีสารเคมี' },
      { name: 'ฟิวเจอร์บอร์ดทำป้ายนิทรรศการ', quantity: 15, unit: 'แผ่น', unitPrice: 45, reason: 'ใช้จัดบอร์ดแสดงผลงาน' },
    ],
  },
  {
    keywords: ['กีฬา', 'กรีฑา', 'แข่งขัน', 'กีฬาสี'],
    items: [
      { name: 'ลูกฟุตบอลหนังเย็บ', quantity: 4, unit: 'ลูก', unitPrice: 450, reason: 'อุปกรณ์หลักของการแข่งขัน' },
      { name: 'กรวยฝึกซ้อม', quantity: 20, unit: 'อัน', unitPrice: 35, reason: 'ใช้จัดสนามและซ้อม' },
      { name: 'นกหวีดพร้อมสาย', quantity: 6, unit: 'อัน', unitPrice: 60, reason: 'สำหรับกรรมการแต่ละสนาม' },
      { name: 'น้ำดื่มบรรจุขวด', quantity: 20, unit: 'แพ็ก', unitPrice: 55, reason: 'จัดให้นักกีฬาระหว่างแข่ง' },
    ],
  },
  {
    keywords: ['อบรม', 'ประชุม', 'สัมมนา', 'วิทยากร'],
    items: [
      { name: 'กระดาษ A4 80 แกรม', quantity: 10, unit: 'รีม', unitPrice: 130, reason: 'พิมพ์เอกสารประกอบการอบรม' },
      { name: 'แฟ้มใส่เอกสารผู้เข้าอบรม', quantity: 50, unit: 'แฟ้ม', unitPrice: 25, reason: 'แจกผู้เข้าร่วม' },
      { name: 'ปากกาลูกลื่น', quantity: 50, unit: 'ด้าม', unitPrice: 8, reason: 'แจกพร้อมแฟ้ม' },
      { name: 'อาหารว่างและเครื่องดื่ม', quantity: 50, unit: 'ชุด', unitPrice: 35, reason: 'ตามระเบียบการจัดอบรม' },
    ],
  },
];

/** รายการพื้นฐานที่ใช้เมื่อไม่ตรงกับคำสำคัญใด ๆ */
const FALLBACK_ITEMS: SuggestedItem[] = [
  { name: 'กระดาษ A4 80 แกรม', quantity: 5, unit: 'รีม', unitPrice: 130, reason: 'ใช้ได้กับเกือบทุกกิจกรรม' },
  { name: 'ปากกาเคมีหัวใหญ่', quantity: 12, unit: 'ด้าม', unitPrice: 25, reason: 'ใช้เขียนป้ายและบอร์ด' },
  { name: 'เทปกาวสองหน้า', quantity: 10, unit: 'ม้วน', unitPrice: 25, reason: 'ติดป้ายและจัดสถานที่' },
  { name: 'ฟิวเจอร์บอร์ด', quantity: 10, unit: 'แผ่น', unitPrice: 45, reason: 'ทำป้ายและฉากกิจกรรม' },
];

export function suggestItemsFor(description: string): SuggestedItem[] {
  const text = description.toLowerCase();
  const matched = SUGGESTION_RULES.find((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword.toLowerCase())),
  );
  return matched ? matched.items : FALLBACK_ITEMS;
}
