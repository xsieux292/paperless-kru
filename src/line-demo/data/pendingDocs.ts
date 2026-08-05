/**
 * เอกสารที่รอลายเซ็นครู
 * แยกไฟล์จาก component เพื่อให้ไฟล์ screen export เฉพาะ component (hot reload ทำงานถูกต้อง)
 *
 * ใน prototype ใช้ข้อมูลจำลอง — ระบบจริงจะดึงจาก endpoint คิวลายเซ็นของ backend
 */
export interface PendingDoc {
  id: string;
  docNo: string;
  title: string;
  /** ยอดเงิน (บาท) — ใบยืมพัสดุเป็น 0 */
  amount: number;
  /** คนที่ส่งเรื่องมาให้เซ็น */
  from: string;
  waitingDays: number;
}

export const PENDING_DOCS: PendingDoc[] = [
  {
    id: 'sign-1',
    docNo: 'บก.01-2569-0839',
    title: 'ใบเบิกค่าวัสดุอุปกรณ์วิทยาศาสตร์',
    amount: 1250,
    from: 'ครูมานี รักเรียน (หัวหน้ากลุ่มสาระ)',
    waitingDays: 1,
  },
  {
    id: 'sign-2',
    docNo: 'บก.01-2569-0836',
    title: 'ใบเบิกค่าอาหารว่างประชุมผู้ปกครอง',
    amount: 3400,
    from: 'ครูสมพร ดีงาม (ฝ่ายกิจการนักเรียน)',
    waitingDays: 2,
  },
  {
    id: 'sign-3',
    docNo: 'ยพ.02-2569-0121',
    title: 'ใบยืมเครื่องเสียงสำหรับกิจกรรมหน้าเสาธง',
    amount: 0,
    from: 'ครูวิไล ตั้งใจ (ฝ่ายวิชาการ)',
    waitingDays: 4,
  },
];
