import { Calculator, Camera, FileSignature, type LucideIcon } from 'lucide-react';
import type { DocumentMode } from '@/types';

/**
 * ข้อความของแต่ละโหมด รวมไว้ที่เดียว
 *
 * หมายเหตุด้านสี: ตาม design plan ข้อ ⑤ "สีมีความหมายเดียวตลอดระบบ"
 * การ์ดทั้ง 3 ใบจึงใช้สีเดียวกันหมด และแยกความต่างด้วย "ไอคอน + ข้อความ" แทน
 * สีเขียวสงวนไว้บอกว่า "อันนี้เลือกอยู่/เรียบร้อย" เท่านั้น
 */
export interface DocumentModeConfig {
  id: DocumentMode;
  /** ลำดับที่แสดงในการ์ด */
  step: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;

  /** คำอธิบายสิ่งที่ระบบจะทำให้ */
  note: string;

  /** สิ่งที่คุณครูต้องเตรียมมา */
  requirement: {
    icon: LucideIcon;
    text: string;
    /** ตัวอย่างแบบเป็นข้อ ๆ เพื่อให้เข้าใจง่ายกว่าอ่านเป็นย่อหน้า */
    examples: string[];
  };

  /** ประเภทไฟล์ที่รับ (ใช้กับ input accept) */
  accept: string;

  /** ป้ายบนปุ่มหลัก — เขียนเป็น "กริยา + สิ่งของ" ตาม plan ข้อ ③ */
  submitLabel: string;

  /** ป้ายปุ่มส่งไฟล์ เขียนให้ตรงกับของที่ครูถืออยู่จริงในโหมดนั้น */
  upload: {
    cameraLabel: string;
    fileLabel: string;
    /** โหมดนี้ครูมักถ่ายรูปมากกว่าเลือกไฟล์หรือไม่ — ตัวที่ใช่จะเป็นปุ่มทึบ */
    preferCamera: boolean;
  };

  /** ตัวอย่างคำสั่งเพิ่มเติมที่กดใส่ได้เลย ไม่ต้องพิมพ์เอง */
  noteSuggestions: string[];
}

export const DOCUMENT_MODES: Record<DocumentMode, DocumentModeConfig> = {
  template: {
    id: 'template',
    step: 1,
    title: 'เติมข้อมูลลงแบบฟอร์ม',
    shortTitle: 'เติมแบบฟอร์ม',
    description: 'ส่งแบบฟอร์มเปล่า (Word/PDF) แล้วให้ AI กรอกข้อมูลให้ครบ',
    icon: FileSignature,
    note: 'ระบบจะนำไฟล์แบบฟอร์มของคุณครูมาวิเคราะห์ และกรอกข้อมูลที่จำเป็นให้อย่างถูกต้องตามโครงสร้าง',
    requirement: {
      icon: FileSignature,
      text: 'ไฟล์แบบฟอร์ม (Word หรือ PDF) ที่เป็นแบบฟอร์มเปล่า หรือกรอกไว้บางส่วนแล้ว',
      examples: [
        'แบบฟอร์มบันทึกข้อความของโรงเรียน',
        'แบบฟอร์มขออนุมัติโครงการ',
        'แบบรายงานผลการสอนที่ยังไม่ได้กรอก',
      ],
    },
    accept: '.pdf,.doc,.docx',
    submitLabel: 'ส่งแบบฟอร์มให้ AI กรอกให้',
    upload: {
      cameraLabel: 'ถ่ายรูปแบบฟอร์ม',
      fileLabel: 'เลือกไฟล์แบบฟอร์มในเครื่อง',
      preferCamera: false,
    },
    noteSuggestions: [
      'กรอกข้อมูลให้ครบทุกช่อง โดยใช้ข้อมูลจากไฟล์แนบ',
      'ใช้ภาษาราชการให้ถูกต้องตามระเบียบหนังสือราชการ',
      'ใส่วันที่เป็นปี พ.ศ. ทั้งหมด',
    ],
  },

  ocr: {
    id: 'ocr',
    step: 2,
    title: 'แปลงรูปถ่ายเป็นเอกสาร',
    shortTitle: 'รูปเป็นเอกสาร',
    description: 'ถ่ายรูปกระดาษ โน้ตสั่งงาน หรือกระดาน ให้ AI พิมพ์ให้เป็นไฟล์',
    icon: Camera,
    note: 'ระบบจะอ่านข้อความจากรูปถ่ายกระดาษ หรือข้อความลายมือบนกระดาน แล้วแปลงเป็นไฟล์พิมพ์ให้อย่างเป็นระเบียบ',
    requirement: {
      icon: Camera,
      text: 'รูปถ่ายที่มีตัวหนังสือชัดเจน',
      examples: [
        'รูปถ่ายหน้าหนังสือหรือเอกสาร',
        'รูปกระดาษที่จดงานไว้ด้วยลายมือ',
        'รูปถ่ายข้อความบนกระดานดำหรือไวท์บอร์ด',
      ],
    },
    accept: 'image/*,.pdf',
    submitLabel: 'ส่งรูปให้ AI พิมพ์เป็นเอกสาร',
    upload: {
      cameraLabel: 'ถ่ายรูปเอกสาร',
      fileLabel: 'เลือกรูปในเครื่อง',
      preferCamera: true,
    },
    noteSuggestions: [
      'พิมพ์ตามต้นฉบับ ไม่ต้องเรียบเรียงใหม่',
      'จัดเป็นหัวข้อและข้อย่อยให้อ่านง่าย',
      'ช่วยตรวจคำผิดให้ด้วย',
    ],
  },

  accounting: {
    id: 'accounting',
    step: 3,
    title: 'ทำบัญชีจากใบเสร็จ',
    shortTitle: 'ทำบัญชี',
    description: 'ส่งใบเสร็จ สลิป หรือบิลเงินสด ให้ AI สรุปยอดและทำตารางให้',
    icon: Calculator,
    note: 'ระบบจะดึงข้อมูล ยอดเงิน วันที่ และรายการ จากใบเสร็จ เพื่อสรุปเป็นรายงานบัญชีให้คุณครูทันที',
    requirement: {
      icon: Calculator,
      text: 'รูปถ่ายหลักฐานการเงิน',
      examples: [
        'รูปถ่ายใบเสร็จรับเงิน',
        'สลิปโอนเงินจากแอปธนาคาร',
        'บิลเงินสดหรือใบกำกับภาษี',
      ],
    },
    accept: 'image/*,.pdf',
    submitLabel: 'ส่งใบเสร็จให้ AI ทำบัญชี',
    upload: {
      cameraLabel: 'ถ่ายรูปใบเสร็จ',
      fileLabel: 'เลือกรูปใบเสร็จในเครื่อง',
      preferCamera: true,
    },
    noteSuggestions: [
      'สรุปเป็นยอดรวมรายเดือนให้ด้วย',
      'แยกหมวดหมู่ค่าใช้จ่ายตามโครงการ',
      'สรุปให้กระชับสำหรับรายงานผู้บริหาร',
    ],
  },
};

/** เรียงลำดับการ์ดให้ตรงกับ HTML ต้นฉบับ */
export const DOCUMENT_MODE_LIST: DocumentModeConfig[] = [
  DOCUMENT_MODES.template,
  DOCUMENT_MODES.ocr,
  DOCUMENT_MODES.accounting,
];

export const DEFAULT_MODE: DocumentMode = 'template';
