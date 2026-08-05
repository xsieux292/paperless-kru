/**
 * Design tokens ตาม "KruAssist — UX/UI Design Plan บน LINE OA"
 * (archive/new UX,UI/plan.md ข้อ 6 Design System)
 *
 * กฎสีข้อ ⑤ — สีมีความหมายเดียวตลอดระบบ ห้ามใช้ผิดวัตถุประสงค์:
 *   เขียว  = Doc Done / เรียบร้อยแล้ว / ปุ่มหลัก
 *   น้ำเงิน = Teach & Grow
 *   ส้ม    = "ตรงนี้รอคุณอยู่" — ช่องที่ต้องแก้ / งานที่รอครูทำ (ห้ามใช้ตกแต่ง)
 *   แดง    = มีปัญหา ต้องแก้
 *   เทา    = อ่านอย่างเดียว / ยังไม่ถึงตา
 */
export const TOKENS = {
  color: {
    docDone: '#2E7D5B',
    teachGrow: '#2C6BB0',
    attention: '#F5A623',
    danger: '#D64545',
    mute: '#9E9E9E',
    surface: '#F5F7FA',
    textMain: '#333333',
    textLight: '#666666',
  },
  /** ปุ่มหลักสูง 56px ปุ่มรอง 48px มุมโค้ง 12px (plan ข้อ 6) */
  button: {
    primaryHeight: 56,
    secondaryHeight: 48,
    radius: 12,
  },
  /** เนื้อหา ≥16px · หัวเรื่อง 20px · ตัวเลขเงิน 24px */
  fontSize: {
    body: 16,
    heading: 20,
    money: 24,
  },
  /** พื้นที่กดได้ ≥48×48px ทุกจุด */
  minTapTarget: 48,
} as const;
