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

/**
 * แบบฟอร์มที่เคยอัปโหลดไว้แล้ว — ครูเลือกใช้ซ้ำได้โดยไม่ต้องอัปโหลดใหม่
 * เป็นปัญหาที่เจอบ่อย เพราะโรงเรียนใช้แบบฟอร์มชุดเดิมทั้งปี
 */
export interface FormTemplate {
  id: string;
  name: string;
  fileType: 'docx' | 'pdf' | 'xlsx';
  /** หมวดของแบบฟอร์ม ใช้จัดกลุ่มในรายการ */
  category: 'หนังสือราชการ' | 'งานวิชาการ' | 'การเงิน/พัสดุ' | 'อื่น ๆ';
  sizeBytes: number;
  uploadedAt: string;
  /** เคยใช้ไปกี่ครั้ง — เรียงตัวที่ใช้บ่อยขึ้นก่อน */
  usageCount: number;
  lastUsedAt?: string;
}

/** โครงการ/งบประมาณที่ผูกกับเอกสาร ใช้แยกงานไม่ให้ปนกัน */
export interface Project {
  id: string;
  name: string;
  /** รหัสโครงการตามระบบของโรงเรียน */
  code: string;
  /** แหล่งงบ เช่น เรียนฟรี 15 ปี */
  budgetSource: string;
  fiscalYear: string;
  /** งบที่ตั้งไว้และใช้ไปแล้ว (บาท) — ใช้เตือนเมื่อใกล้เต็ม */
  budgetTotal: number;
  budgetUsed: number;
  active: boolean;
}

/** ประเภทของใบเสร็จ ใช้จำแนกหมวดค่าใช้จ่ายในรายงานบัญชี */
export type ReceiptCategoryId =
  | 'supplies'
  | 'food'
  | 'travel'
  | 'service'
  | 'utility'
  | 'other';

export interface ReceiptCategory {
  id: ReceiptCategoryId;
  name: string;
  description: string;
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

  /** แบบฟอร์มที่เลือกใช้ซ้ำ (โหมดเติมแบบฟอร์ม) */
  formTemplateId?: string;
  formTemplateName?: string;

  /** โครงการที่เอกสารนี้สังกัด (โหมดทำบัญชี) */
  projectId?: string;
  projectName?: string;
  /** ประเภทใบเสร็จ (โหมดทำบัญชี) */
  receiptCategory?: ReceiptCategoryId;
  receiptCategoryName?: string;

  createdAt: string;
  completedAt?: string;
  outputs: JobOutputFile[];
}

/** payload ที่ส่งไปสร้างงานใหม่ */
export interface CreateJobInput {
  mode: DocumentMode;
  files: File[];
  notes?: string;
  /** ใช้แบบฟอร์มที่เคยอัปโหลดไว้แทนการอัปโหลดใหม่ */
  formTemplateId?: string;
  /** โหมดทำบัญชี: เอกสารนี้เป็นของโครงการไหน */
  projectId?: string;
  /** โหมดทำบัญชี: ใบเสร็จของอะไร */
  receiptCategory?: ReceiptCategoryId;
  /** โหมดเติมแบบฟอร์ม: เนื้อหาที่จะกรอกลงแต่ละช่อง */
  formValues?: Record<string, string>;
}

/** ผลลัพธ์ทันทีหลังสร้างงาน (backend ควรตอบกลับแบบนี้) */
export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
  estimatedSeconds?: number;
}

/* ------------------------------------------------------------------ */
/* ระบบเบิกงบ / ยืมพัสดุ (Flow B ใน archive/new UX,UI/plan.md)          */
/* ------------------------------------------------------------------ */

export type RequisitionKind = 'budget' | 'borrow';

export type RequisitionStatus = 'draft' | 'pending' | 'approved' | 'returned';

export interface RequisitionItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  /** ราคาต่อหน่วย (บาท) — โหมดยืมพัสดุปล่อยเป็น 0 ได้ */
  unitPrice: number;
}

export interface Approver {
  id: string;
  name: string;
  role: string;
}

export interface Requisition {
  id: string;
  /** เลขที่เอกสารตามระบบโรงเรียน */
  docNo: string;
  kind: RequisitionKind;
  status: RequisitionStatus;
  /** เรื่อง/วัตถุประสงค์ */
  purpose: string;
  projectId: string;
  projectName: string;
  /** วันที่ต้องใช้ของ */
  neededBy: string;
  items: RequisitionItem[];
  totalAmount: number;
  approverId: string;
  approverName: string;
  /** เหตุผลเมื่อถูกตีกลับ */
  returnedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequisitionInput {
  kind: RequisitionKind;
  purpose: string;
  projectId: string;
  neededBy: string;
  items: Omit<RequisitionItem, 'id'>[];
  approverId: string;
}

/** รายการที่ AI แนะนำจากคำอธิบายกิจกรรม */
export interface SuggestedItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  /** เหตุผลสั้น ๆ ว่าทำไมถึงแนะนำ */
  reason: string;
}

/* ------------------------------------------------------------------ */
/* AI ช่วยร่างให้ก่อน — ลดการพิมพ์ของครูให้เหลือน้อยที่สุด               */
/* ------------------------------------------------------------------ */

/** ระดับความมั่นใจของ AI ต่อค่าที่เดามาให้ */
export type Confidence = 'high' | 'low';

/** ค่าที่ AI เดาให้ พร้อมบอกว่ามั่นใจแค่ไหนและทำไม */
export interface DraftField<T> {
  value: T;
  confidence: Confidence;
  /** เหตุผลสั้น ๆ ว่าเดามาจากอะไร — ครูจะได้ตัดสินใจได้ว่าจะเชื่อไหม */
  reason?: string;
}

/** สรุปว่า AI มั่นใจกี่ช่องจากทั้งหมด ใช้ขึ้นป้าย "4/5 ชัดเจน" */
export interface DraftSummary {
  confidentCount: number;
  totalCount: number;
}

/** ใบเบิกที่ AI ร่างให้จากประโยคเดียวที่ครูพิมพ์ */
export interface RequisitionDraft {
  kind: DraftField<RequisitionKind>;
  purpose: DraftField<string>;
  projectId: DraftField<string>;
  neededBy: DraftField<string>;
  approverId: DraftField<string>;
  items: Omit<RequisitionItem, 'id'>[];
  summary: DraftSummary;
}

/** ผลที่ AI อ่านได้จากไฟล์ที่ครูส่งมา ใช้เดาบริการและโครงการให้อัตโนมัติ */
export interface DocumentDetection {
  mode: DraftField<DocumentMode>;
  /** เดาโครงการและประเภทให้เมื่อเป็นงานบัญชี */
  projectId?: DraftField<string>;
  receiptCategory?: DraftField<ReceiptCategoryId>;
  /** ข้อมูลที่อ่านได้จากใบเสร็จ */
  vendor?: DraftField<string>;
  totalAmount?: DraftField<number>;
  issuedDate?: DraftField<string>;
  /** VAT ที่ระบบคำนวณให้เอง ครูไม่ต้องกดเครื่องคิดเลข */
  vatAmount?: number;
  summary: DraftSummary;
}

/**
 * ช่องที่แบบฟอร์มหนึ่ง ๆ ต้องกรอก
 * ระบบอ่านจากตัวแบบฟอร์มแล้วบอกครูล่วงหน้าว่าต้องเตรียมข้อมูลอะไรบ้าง
 */
export interface FormFieldSpec {
  id: string;
  label: string;
  /** ต้องมีค่าถึงจะส่งได้ */
  required: boolean;
  /** คำใบ้/ตัวอย่างที่แสดงใต้ช่อง */
  hint?: string;
  /** ช่องเนื้อหายาว ใช้ textarea แทน input */
  multiline?: boolean;
}

/** โครงของแบบฟอร์ม — ใช้บอกครูว่าแบบฟอร์มนี้มีช่องอะไรบ้าง */
export interface FormTemplateSpec {
  templateId: string;
  templateName: string;
  fields: FormFieldSpec[];
}

/** เนื้อหาที่ AI ร่างลงในแต่ละช่องของแบบฟอร์ม */
export interface FormContentDraft {
  values: Record<string, DraftField<string>>;
  summary: DraftSummary;
}

/** ตัวเลขสรุปประจำวัน แสดงบนการ์ดใบเดียวให้เห็นภาพรวมทันที */
export interface DailySummary {
  pendingSignatures: number;
  budgetUsed: number;
  budgetTotal: number;
  portfolioPercent: number;
  activeJobs: number;
}

/* ------------------------------------------------------------------ */
/* วางแผนงบกิจกรรม (ฟังก์ชันจาก inspiration)                            */
/* ------------------------------------------------------------------ */

/** ข้อมูลกิจกรรมหลักที่ครูกรอกในขั้นแรก */
export interface ActivityPlanForm {
  eventName: string;
  objective: string;
  eventDate: string;
  venue: string;
  durationHours: string;
  students: string;
  parents: string;
  teachers: string;
  guests: string;
  budget: string;
  agenda: string;
}

/** คำถามที่ AI ถามเพิ่มเติมเพื่อเก็บรายละเอียดสำหรับสร้างรายการงบ */
export interface PlanningQuestion {
  id: string;
  label: string;
  reason: string;
  placeholder: string;
  type: 'number' | 'text';
  suffix?: string;
}

/** สถานะทรัพยากรของโรงเรียนต่อรายการงบ */
export type ResourceAvailability = 'โรงเรียนไม่มี' | 'อาจจะมี' | 'มีแน่นอน';

/** รายการงบเบื้องต้นที่ AI สร้างให้ พร้อมราคาอ้างอิงและผู้รับผิดชอบ */
export interface BudgetPlanItem {
  availability: ResourceAvailability;
  item: string;
  quantity: string;
  reference: string;
  amount: number;
  source: string;
  owner: string;
}

/** ระดับความมั่นใจ 4 มิติ ของ AI ในการสร้างรายการงบ */
export interface PlanConfidence {
  /** ความครอบคลุมของรายการ */
  coverage: number;
  /** ความถูกต้องของจำนวนผู้เข้าร่วม */
  people: number;
  /** ความน่าเชื่อถือของราคาอ้างอิง */
  prices: number;
  /** ความชัดเจนของทรัพย์สินที่โรงเรียนมี */
  assets: number;
}

/** ผลลัพธ์ทั้งหมดของการวางแผนงบกิจกรรม */
export interface ActivityBudgetPlan {
  items: BudgetPlanItem[];
  confidence: PlanConfidence;
  overallConfidence: number;
  ready: boolean;
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
