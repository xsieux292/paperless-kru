import { Calculator, Camera, FileSignature, type LucideIcon } from 'lucide-react';
import type { DocumentMode } from '@/types';

/**
 * ข้อความและสีทั้งหมดของแต่ละโหมด รวมไว้ที่เดียว
 * (ใน HTML เดิมค่าพวกนี้กระจายอยู่ทั้งใน markup และใน object uiStates)
 */
export interface DocumentModeConfig {
  id: DocumentMode;
  /** ลำดับที่แสดงในการ์ด */
  step: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;

  /** สีของการ์ดและกล่องอธิบาย */
  accent: {
    iconWrapper: string;
    noteBox: string;
    noteIcon: string;
    requirementBox: string;
    requirementIcon: string;
    selectedCard: string;
    badge: string;
  };

  /** คำอธิบายสิ่งที่ระบบจะทำให้ */
  note: string;

  /** สิ่งที่คุณครูต้องเตรียมมา */
  requirement: {
    icon: LucideIcon;
    /** ข้อความหลัก */
    text: string;
    /** ตัวอย่างแบบเป็นข้อ ๆ เพื่อให้เข้าใจง่ายกว่าอ่านเป็นย่อหน้า */
    examples: string[];
  };

  /** ประเภทไฟล์ที่รับ (ใช้กับ input accept) */
  accept: string;

  /** ตัวอย่างคำสั่งเพิ่มเติมที่กดใส่ได้เลย ไม่ต้องพิมพ์เอง */
  noteSuggestions: string[];
}

export const DOCUMENT_MODES: Record<DocumentMode, DocumentModeConfig> = {
  template: {
    id: 'template',
    step: 1,
    title: 'เติมข้อมูลลงแบบฟอร์ม',
    shortTitle: 'เติมแบบฟอร์ม',
    description: 'อัปโหลดโครงเอกสาร (PDF/Word) แล้วให้ AI ช่วยกรอกข้อมูลให้สมบูรณ์',
    icon: FileSignature,
    accent: {
      iconWrapper: 'bg-blue-100 text-blue-600',
      noteBox: 'bg-sky-50 border-sky-200 text-sky-900',
      noteIcon: 'text-sky-600',
      requirementBox: 'bg-blue-50 border-blue-200',
      requirementIcon: 'bg-blue-100 text-blue-600',
      selectedCard: 'border-blue-500 bg-blue-50 ring-blue-500/20',
      badge: 'bg-blue-100 text-blue-700',
    },
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
    description: 'ถ่ายรูปกระดาษ โน้ตสั่งงาน หรือกระดาน ให้ AI เรียบเรียงเป็นไฟล์พิมพ์',
    icon: Camera,
    accent: {
      iconWrapper: 'bg-purple-100 text-purple-600',
      noteBox: 'bg-purple-50 border-purple-200 text-purple-900',
      noteIcon: 'text-purple-600',
      requirementBox: 'bg-purple-50 border-purple-200',
      requirementIcon: 'bg-purple-100 text-purple-600',
      selectedCard: 'border-purple-500 bg-purple-50 ring-purple-500/20',
      badge: 'bg-purple-100 text-purple-700',
    },
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
    noteSuggestions: [
      'พิมพ์ตามต้นฉบับ ไม่ต้องเรียบเรียงใหม่',
      'จัดเป็นหัวข้อและข้อย่อยให้อ่านง่าย',
      'ช่วยตรวจคำผิดให้ด้วย',
    ],
  },

  accounting: {
    id: 'accounting',
    step: 3,
    title: 'ให้ AI ช่วยทำบัญชี',
    shortTitle: 'ทำบัญชี',
    description: 'ส่งใบเสร็จ สลิป หรือบิลเงินสด AI จะช่วยสรุปยอดและทำตารางรายงานให้',
    icon: Calculator,
    accent: {
      iconWrapper: 'bg-emerald-100 text-emerald-600',
      noteBox: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      noteIcon: 'text-emerald-600',
      requirementBox: 'bg-emerald-50 border-emerald-200',
      requirementIcon: 'bg-emerald-100 text-emerald-600',
      selectedCard: 'border-emerald-500 bg-emerald-50 ring-emerald-500/20',
      badge: 'bg-emerald-100 text-emerald-700',
    },
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
