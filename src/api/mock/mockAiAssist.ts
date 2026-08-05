import type {
  DocumentDetection,
  DocumentMode,
  ReceiptCategoryId,
  RequisitionDraft,
  RequisitionKind,
} from '@/types';
import { mockProjects, suggestItemsFor } from './mockCatalog';

/**
 * AI ที่ "เดาให้ก่อน" — หัวใจของการลดภาระครู
 *
 * แนวคิด: ครูไม่ควรต้องนั่งกรอกฟอร์มทีละช่อง ถ้าระบบพอเดาได้ก็ควรเดาไปเลย
 * แล้วให้ครูเห็นผลและแก้เฉพาะจุดที่ผิด ซึ่งเร็วกว่าการเริ่มจากหน้าว่างมาก
 *
 * ใน mock ใช้การจับคำง่าย ๆ ส่วน API จริงจะเป็นผลจากโมเดลภาษา
 * แต่รูปแบบข้อมูลที่คืนกลับ (DraftField + confidence + reason) เหมือนกัน
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const has = (text: string, words: string[]) =>
  words.some((word) => text.toLowerCase().includes(word.toLowerCase()));

/** แปลงวันที่เป็นรูปแบบไทยที่ครูอ่านคุ้น */
function formatThaiDate(date: Date): string {
  const months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

/** เดาโครงการจากคำในประโยค — ถ้าไม่เจอให้ใช้โครงการที่ครูใช้ล่าสุด */
function guessProject(text: string): { id: string; confidence: 'high' | 'low'; reason: string } {
  const rules: { keywords: string[]; id: string }[] = [
    { keywords: ['วิทยาศาสตร์', 'ทดลอง', 'แล็บ', 'สะเต็ม'], id: 'prj-003' },
    { keywords: ['กีฬา', 'กรีฑา', 'กีฬาสี'], id: 'prj-002' },
    { keywords: ['คณิต', 'ยกระดับ', 'ผลสัมฤทธิ์', 'ติว', 'สอนเสริม'], id: 'prj-001' },
    { keywords: ['พัสดุ', 'สำนักงาน', 'ห้องเรียน'], id: 'prj-004' },
  ];

  const matched = rules.find((rule) => has(text, rule.keywords));
  if (matched) {
    const project = mockProjects.find((item) => item.id === matched.id);
    return {
      id: matched.id,
      confidence: 'high',
      reason: `จับคำในเรื่องได้ตรงกับ “${project?.name ?? ''}”`,
    };
  }

  return {
    id: mockProjects[0]?.id ?? '',
    confidence: 'low',
    reason: 'ไม่แน่ใจ — เดาจากโครงการที่คุณครูใช้บ่อยที่สุด กรุณาตรวจอีกครั้ง',
  };
}

/** ยืมของ กับ ซื้อของ ใช้คำต่างกันชัดเจน จับได้ค่อนข้างแม่น */
function guessKind(text: string): { value: RequisitionKind; confidence: 'high' | 'low' } {
  if (has(text, ['ยืม', 'ขอใช้', 'คืน'])) return { value: 'borrow', confidence: 'high' };
  if (has(text, ['ซื้อ', 'จัดซื้อ', 'เบิก', 'จัดหา'])) return { value: 'budget', confidence: 'high' };
  return { value: 'budget', confidence: 'low' };
}

/** เดาวันที่ต้องใช้จากคำบอกเวลา ถ้าไม่มีให้ตั้งเป็นอีก 7 วัน */
function guessNeededBy(text: string): { value: string; confidence: 'high' | 'low'; reason: string } {
  const today = new Date();
  const plus = (days: number) => {
    const date = new Date(today);
    date.setDate(today.getDate() + days);
    return formatThaiDate(date);
  };

  if (has(text, ['พรุ่งนี้'])) return { value: plus(1), confidence: 'high', reason: 'จากคำว่า “พรุ่งนี้”' };
  if (has(text, ['สัปดาห์หน้า', 'อาทิตย์หน้า'])) {
    return { value: plus(7), confidence: 'high', reason: 'จากคำว่า “สัปดาห์หน้า”' };
  }
  if (has(text, ['เดือนหน้า'])) return { value: plus(30), confidence: 'high', reason: 'จากคำว่า “เดือนหน้า”' };

  return {
    value: plus(7),
    confidence: 'low',
    reason: 'ไม่ได้ระบุวันมา — ตั้งให้เป็นอีก 7 วัน แก้ได้ตามสะดวก',
  };
}

/** ผู้อนุมัติเลือกตามวงเงิน ตามระเบียบพัสดุที่โรงเรียนมักใช้ */
function guessApprover(total: number): { id: string; confidence: 'high' | 'low'; reason: string } {
  if (total === 0) {
    return {
      id: 'apv-003',
      confidence: 'high',
      reason: 'ยืมพัสดุ ส่งหัวหน้าเจ้าหน้าที่พัสดุตามระเบียบ',
    };
  }
  if (total > 5000) {
    return { id: 'apv-001', confidence: 'high', reason: 'ยอดเกิน 5,000 บาท ต้องให้ ผอ. อนุมัติ' };
  }
  return {
    id: 'apv-002',
    confidence: 'high',
    reason: 'ยอดไม่เกิน 5,000 บาท รองผู้อำนวยการฝ่ายงบประมาณอนุมัติได้',
  };
}

/** เรียบเรียงประโยคที่ครูพูดสั้น ๆ ให้เป็นภาษาราชการ */
function draftPurpose(text: string, kind: RequisitionKind): string {
  let cleaned = text.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';

  // ถ้าครูพิมพ์เป็นประโยคทางการอยู่แล้วก็ใช้ตามนั้น ไม่ต้องเติมหัวซ้ำ
  if (/^(ขอ|จัดซื้อ|จัดหา|ยืม)/.test(cleaned)) return cleaned;

  // ตัดคำกริยาซื้อ/ยืมที่ครูพิมพ์นำหน้าออกก่อน ไม่งั้นจะได้ประโยคซ้ำความ
  // เช่น "ซื้อของจัดกิจกรรม" + หัว "ขอจัดซื้อวัสดุอุปกรณ์สำหรับ" = "…สำหรับซื้อของจัดกิจกรรม"
  cleaned = cleaned.replace(/^(ซื้อของ|ซื้อ|เบิกของ|เบิก|ยืมของ|ยืม)\s*/, '');

  // ตัดคำบอกเวลาท้ายประโยคออก เพราะแยกไปอยู่ช่อง "วันที่ต้องใช้" แล้ว
  cleaned = cleaned.replace(/\s*(ใช้)?(พรุ่งนี้|สัปดาห์หน้า|อาทิตย์หน้า|เดือนหน้า)\s*$/, '').trim();

  const verb = kind === 'borrow' ? 'ขอยืมพัสดุเพื่อใช้ใน' : 'ขอจัดซื้อวัสดุอุปกรณ์สำหรับ';
  return `${verb}${cleaned}`;
}

export const mockAiAssist = {
  /**
   * ครูพิมพ์ประโยคเดียว → ได้ใบเบิกทั้งใบ
   * เป็นการแทนที่การกรอกฟอร์ม 3 หน้าด้วยการพิมพ์ 1 บรรทัด
   */
  async draftRequisition(description: string): Promise<RequisitionDraft> {
    await delay(1600);

    const kind = guessKind(description);
    const project = guessProject(description);
    const neededBy = guessNeededBy(description);

    const suggested = suggestItemsFor(description);
    const items = suggested.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: kind.value === 'borrow' ? 0 : item.unitPrice,
    }));

    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const approver = guessApprover(total);

    const fields = [kind.confidence, project.confidence, neededBy.confidence, approver.confidence];

    return {
      kind: { value: kind.value, confidence: kind.confidence },
      purpose: {
        value: draftPurpose(description, kind.value),
        confidence: 'high',
        reason: 'เรียบเรียงจากที่คุณครูพิมพ์มา',
      },
      projectId: { value: project.id, confidence: project.confidence, reason: project.reason },
      neededBy: { value: neededBy.value, confidence: neededBy.confidence, reason: neededBy.reason },
      approverId: { value: approver.id, confidence: approver.confidence, reason: approver.reason },
      items,
      summary: {
        confidentCount: fields.filter((item) => item === 'high').length + 1, // +1 = เรื่อง
        totalCount: fields.length + 1,
      },
    };
  },

  /**
   * ดูจากไฟล์ที่ครูส่งมาแล้วเดาว่าเป็นงานแบบไหน
   * เพื่อให้ครูไม่ต้องมานั่งเลือกบริการ/โครงการ/หมวดเองทุกครั้ง
   */
  async detectDocument(fileNames: string[]): Promise<DocumentDetection> {
    await delay(1300);

    const joined = fileNames.join(' ').toLowerCase();
    const isImage = /\.(jpg|jpeg|png|heic|webp)$/i.test(joined) || joined.includes('รูป');
    const looksLikeReceipt = has(joined, ['ใบเสร็จ', 'receipt', 'สลิป', 'บิล', 'ใบกำกับ']);
    const looksLikeForm = /\.(doc|docx|pdf)$/i.test(joined) || has(joined, ['แบบฟอร์ม', 'ฟอร์ม', 'บันทึกข้อความ']);

    let mode: DocumentMode = 'ocr';
    let modeConfidence: 'high' | 'low' = 'low';
    let modeReason = 'เดาจากชนิดไฟล์ ถ้าไม่ใช่กดเปลี่ยนได้เลย';

    if (looksLikeReceipt) {
      mode = 'accounting';
      modeConfidence = 'high';
      modeReason = 'ชื่อไฟล์บอกว่าเป็นใบเสร็จหรือสลิป';
    } else if (looksLikeForm) {
      mode = 'template';
      modeConfidence = 'high';
      modeReason = 'เป็นไฟล์เอกสาร (Word/PDF) น่าจะเป็นแบบฟอร์มที่ต้องกรอก';
    } else if (isImage) {
      mode = 'ocr';
      modeConfidence = 'high';
      modeReason = 'เป็นไฟล์รูป น่าจะอยากให้อ่านตัวหนังสือออกมา';
    }

    if (mode !== 'accounting') {
      return {
        mode: { value: mode, confidence: modeConfidence, reason: modeReason },
        summary: { confidentCount: modeConfidence === 'high' ? 1 : 0, totalCount: 1 },
      };
    }

    // โหมดบัญชี — อ่านรายละเอียดใบเสร็จให้ครบ ครูจะได้ไม่ต้องกรอกเอง
    const total = 1250;
    const vat = Math.round((total - total / 1.07) * 100) / 100;
    const category: ReceiptCategoryId = 'supplies';

    return {
      mode: { value: mode, confidence: modeConfidence, reason: modeReason },
      projectId: {
        value: 'prj-004',
        confidence: 'low',
        reason: 'เดาจากโครงการที่ใช้ล่าสุด — กรุณาตรวจว่าถูกโครงการไหม',
      },
      receiptCategory: {
        value: category,
        confidence: 'high',
        reason: 'รายการในใบเสร็จเป็นวัสดุอุปกรณ์',
      },
      vendor: { value: 'ร้านสหกรณ์โรงเรียน', confidence: 'high' },
      totalAmount: { value: total, confidence: 'high' },
      issuedDate: { value: formatThaiDate(new Date()), confidence: 'high' },
      vatAmount: vat,
      summary: { confidentCount: 4, totalCount: 5 },
    };
  },

  /** ตัวเลขสรุปประจำวัน สำหรับการ์ด "สรุปวันนี้" */
  async getDailySummary(pendingSignatures: number, activeJobs: number) {
    await delay(300);
    const budgetUsed = mockProjects.reduce((sum, project) => sum + project.budgetUsed, 0);
    const budgetTotal = mockProjects.reduce((sum, project) => sum + project.budgetTotal, 0);
    return {
      pendingSignatures,
      budgetUsed,
      budgetTotal,
      portfolioPercent: 68,
      activeJobs,
    };
  },

  /** ให้ AI เรียบเรียงคำบรรยายผลงาน ว.PA จากที่ครูเล่าสั้น ๆ */
  async writePortfolioCaption(shortText: string): Promise<string> {
    await delay(1400);
    const cleaned = shortText.trim() || 'กิจกรรมการเรียนการสอน';
    return (
      `ครูผู้สอนได้ดำเนินการ${cleaned} ` +
      'โดยออกแบบกิจกรรมให้สอดคล้องกับมาตรฐานการเรียนรู้และตัวชี้วัด ' +
      'ส่งผลให้ผู้เรียนเกิดสมรรถนะตามเป้าหมายอย่างเป็นรูปธรรม ' +
      'และสามารถนำผลการดำเนินงานไปพัฒนาการจัดการเรียนรู้ในครั้งต่อไปได้'
    );
  },
};

export const approverIdFor = (total: number) => guessApprover(total).id;
export { formatThaiDate };
