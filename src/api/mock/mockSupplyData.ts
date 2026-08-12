import type { SchoolDocumentTemplate, SupplyItem } from '@/types/supply';

/**
 * ภาพประกอบแบบ data URL ทำให้ prototype ใช้งานได้แม้ไม่มีอินเทอร์เน็ต
 * และไม่ผูก catalog เข้ากับ asset ของหน้าจอใดหน้าจอหนึ่ง
 */
function makeSupplyImage(symbol: string, background: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" role="img">
    <rect width="320" height="220" rx="28" fill="${background}"/>
    <circle cx="160" cy="110" r="76" fill="white" fill-opacity=".72"/>
    <text x="160" y="137" text-anchor="middle" font-size="78" font-family="Arial, sans-serif">${symbol}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** รายการพัสดุจำลอง 12 รายการตาม brief */
export const mockSupplyItems: readonly SupplyItem[] = [
  {
    id: 'supply-scissors',
    code: 'SUP-001',
    name: 'กรรไกร',
    category: 'เครื่องเขียน',
    imageUrl: makeSupplyImage('✂', '#DCFCE7'),
    unit: 'อัน',
    availabilityLabel: 'available',
    active: true,
  },
  {
    id: 'supply-blue-pen',
    code: 'SUP-002',
    name: 'ปากกาน้ำเงิน',
    category: 'เครื่องเขียน',
    imageUrl: makeSupplyImage('🖊', '#DBEAFE'),
    unit: 'ด้าม',
    availabilityLabel: 'low',
    active: true,
  },
  {
    id: 'supply-red-pen',
    code: 'SUP-003',
    name: 'ปากกาแดง',
    category: 'เครื่องเขียน',
    imageUrl: makeSupplyImage('🖊', '#FEE2E2'),
    unit: 'ด้าม',
    availabilityLabel: 'available',
    active: true,
  },
  {
    id: 'supply-pencil',
    code: 'SUP-004',
    name: 'ดินสอ',
    category: 'เครื่องเขียน',
    imageUrl: makeSupplyImage('✎', '#FEF3C7'),
    unit: 'แท่ง',
    availabilityLabel: 'available',
    active: true,
  },
  {
    id: 'supply-eraser',
    code: 'SUP-005',
    name: 'ยางลบ',
    category: 'เครื่องเขียน',
    imageUrl: makeSupplyImage('▰', '#FCE7F3'),
    unit: 'ก้อน',
    availabilityLabel: 'available',
    active: true,
  },
  {
    id: 'supply-ruler',
    code: 'SUP-006',
    name: 'ไม้บรรทัด',
    category: 'เครื่องเขียน',
    imageUrl: makeSupplyImage('📏', '#E0E7FF'),
    unit: 'อัน',
    availabilityLabel: 'available',
    active: true,
  },
  {
    id: 'supply-a4-paper',
    code: 'SUP-007',
    name: 'กระดาษ A4',
    category: 'กระดาษ',
    imageUrl: makeSupplyImage('A4', '#F1F5F9'),
    unit: 'รีม',
    availabilityLabel: 'available',
    active: true,
  },
  {
    id: 'supply-colored-paper',
    code: 'SUP-008',
    name: 'กระดาษสี',
    category: 'กระดาษ',
    imageUrl: makeSupplyImage('▤', '#FAE8FF'),
    unit: 'แพ็ก',
    availabilityLabel: 'low',
    active: true,
  },
  {
    id: 'supply-clear-tape',
    code: 'SUP-009',
    name: 'เทปใส',
    category: 'วัสดุสำนักงาน',
    imageUrl: makeSupplyImage('◉', '#CFFAFE'),
    unit: 'ม้วน',
    availabilityLabel: 'available',
    active: true,
  },
  {
    id: 'supply-glue-stick',
    code: 'SUP-010',
    name: 'กาวแท่ง',
    category: 'วัสดุสำนักงาน',
    imageUrl: makeSupplyImage('▮', '#FFEDD5'),
    unit: 'แท่ง',
    availabilityLabel: 'available',
    active: true,
  },
  {
    id: 'supply-staples',
    code: 'SUP-011',
    name: 'ลวดเย็บกระดาษ',
    category: 'วัสดุสำนักงาน',
    imageUrl: makeSupplyImage('⌁', '#E2E8F0'),
    unit: 'กล่อง',
    availabilityLabel: 'available',
    active: true,
  },
  {
    id: 'supply-whiteboard-marker',
    code: 'SUP-012',
    name: 'ปากกาไวท์บอร์ด',
    category: 'เครื่องเขียน',
    imageUrl: makeSupplyImage('▰', '#EDE9FE'),
    unit: 'ด้าม',
    availabilityLabel: 'paused',
    active: true,
  },
] as const;

export function findMockSupply(supplyId: string): SupplyItem | undefined {
  return mockSupplyItems.find((item) => item.id === supplyId);
}

/** เปลี่ยนข้อมูลโรงเรียน/ตรา/ปีงบประมาณได้จาก template จุดเดียว */
export const mockSchoolDocumentTemplate: SchoolDocumentTemplate = {
  schoolName: 'โรงเรียนเรียนดีวิทยา',
  schoolAddress: '99 หมู่ 5 ตำบลเรียนดี อำเภอเมือง จังหวัดกรุงเทพมหานคร 10000',
  fiscalYear: String(new Date().getFullYear() + 543),
  documentTitle: 'ใบเบิกวัสดุ',
  verificationBaseUrl: 'https://example.school/documents/verify',
  version: '1.0',
};
