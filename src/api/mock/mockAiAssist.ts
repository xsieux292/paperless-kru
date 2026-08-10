import type {
  ActivityBudgetPlan,
  ActivityPlanForm,
  BudgetPlanItem,
  DocumentDetection,
  DocumentMode,
  PlanConfidence,
  PlanningQuestion,
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

  /**
   * คำถามเพิ่มเติมที่ AI ถามครูเพื่อสร้างรายการงบที่แม่นยำขึ้น
   * ย้ายมาจาก inspiration/App.tsx — ชุดเดียวกันไม่ว่าจะใช้บนเว็บหรือ LINE
   */
  /**
   * เดาข้อมูลกิจกรรมจากประโยคเดียวที่ครูเล่ามา
   * เพื่อไม่ให้ครูต้องเจอช่องว่าง 11 ช่องตอนเปิดหน้ามา
   */
  async draftActivityPlan(description: string): Promise<Partial<ActivityPlanForm>> {
    await delay(1500);

    const text = description.trim();
    const draft: Partial<ActivityPlanForm> = {};

    // ชื่อกิจกรรม — ตัดคำบอกจำนวน/สถานที่/เวลาออกให้เหลือแต่ชื่อ
    draft.eventName = text
      .replace(/\s*(นักเรียน|ครู|ผู้ปกครอง|แขก)\s*\d+\s*คน.*/, '')
      .replace(/\s*(จัดที่|ที่)\s*\S+.*/, '')
      .replace(/\s*งบ\s*[\d,]+.*/, '')
      .trim()
      .slice(0, 80);

    // จำนวนคนแต่ละกลุ่ม
    const pick = (label: string) => {
      const match = text.match(new RegExp(`${label}\\s*([\\d,]+)\\s*คน`));
      return match?.[1]?.replace(/,/g, '');
    };
    draft.students = pick('นักเรียน') ?? '';
    draft.teachers = pick('ครู') ?? '';
    draft.parents = pick('ผู้ปกครอง') ?? '';
    draft.guests = pick('แขก') ?? '';

    // ถ้าไม่ได้บอกกลุ่มไหนเลย แต่บอก "N คน" ลอย ๆ ให้ถือว่าเป็นนักเรียน
    if (!draft.students && !draft.teachers && !draft.parents && !draft.guests) {
      const loose = text.match(/([\d,]+)\s*คน/);
      if (loose?.[1]) draft.students = loose[1].replace(/,/g, '');
    }

    // วงเงิน
    const budget = text.match(/งบ\s*([\d,]+)/);
    if (budget?.[1]) draft.budget = budget[1].replace(/,/g, '');

    // สถานที่
    const venue = text.match(/(?:จัดที่|ที่)\s*([^\s,]+)/);
    if (venue?.[1]) draft.venue = venue[1];

    // ระยะเวลา
    if (has(text, ['ทั้งวัน', 'เต็มวัน'])) draft.durationHours = '6';
    else if (has(text, ['ครึ่งวัน'])) draft.durationHours = '3';
    else {
      const hours = text.match(/([\d]+)\s*ชั่วโมง/);
      if (hours?.[1]) draft.durationHours = hours[1];
    }

    // วันที่ — ถ้าไม่ได้บอก ตั้งเป็นอีก 14 วันให้พอมีเวลาเตรียม
    const target = new Date();
    target.setDate(target.getDate() + (has(text, ['พรุ่งนี้']) ? 1 : 14));
    draft.eventDate = target.toISOString().split('T')[0] ?? '';

    draft.objective = `เพื่อจัด${draft.eventName || 'กิจกรรม'}ให้บรรลุตามเป้าหมายของโรงเรียน`;

    return draft;
  },

  async getActivityPlanningQuestions(): Promise<PlanningQuestion[]> {
    await delay(400);
    return ACTIVITY_PLANNING_QUESTIONS;
  },

  /**
   * สร้างรายการงบเบื้องต้นจากข้อมูลกิจกรรม + คำตอบเพิ่มเติม
   * Logic ย้ายมาจาก inspiration/App.tsx — คำนวณจาก attendees, answers, ราคาอ้างอิง
   */
  async generateActivityBudget(
    form: ActivityPlanForm,
    answers: Record<string, string>,
  ): Promise<ActivityBudgetPlan> {
    await delay(1200);

    const attendees = [form.students, form.parents, form.teachers, form.guests]
      .map((value) => Number(value) || 0)
      .reduce((sum, value) => sum + value, 0);

    const snackCount = Math.max(0, Number(answers.snacks) || attendees);
    const audioText = (answers.audio || '').toLowerCase();
    const hasAudio =
      audioText.includes('มีเครื่องเสียง') && !audioText.includes('ไม่มีเครื่องเสียง');
    const hasProjector =
      audioText.includes('โปรเจกเตอร์') && !audioText.includes('ไม่มีโปรเจกเตอร์');
    const needsExtraChairs = Number(answers.elderly || 0) > 0;

    const fmt = (n: number) => n.toLocaleString('th-TH');

    const items: BudgetPlanItem[] = [
      {
        availability: 'โรงเรียนไม่มี',
        item: 'อาหารว่าง',
        quantity: `${fmt(snackCount)} ชุด`,
        reference: '35 บาท/ชุด',
        amount: snackCount * 35,
        source: 'ราคา AI เบื้องต้น • ต้องแนบใบเสนอราคา',
        owner: 'ฝ่ายโภชนาการ',
      },
      {
        availability: 'โรงเรียนไม่มี',
        item: 'น้ำดื่ม',
        quantity: `${fmt(attendees)} ขวด`,
        reference: '8 บาท/ขวด',
        amount: attendees * 8,
        source: 'ราคา AI เบื้องต้น • ต้องแนบใบเสนอราคา',
        owner: 'ฝ่ายพัสดุ',
      },
      {
        availability: 'โรงเรียนไม่มี',
        item: 'พวงมาลัยสำหรับตัวแทนแม่',
        quantity: '10 พวง',
        reference: '250 บาท/พวง',
        amount: 2500,
        source: 'ราคา AI เบื้องต้น • ต้องสำรวจร้านค้า',
        owner: 'ฝ่ายพิธีการ',
      },
      {
        availability: 'อาจจะมี',
        item: 'วัสดุตกแต่งเวทีและฉากหลัง',
        quantity: '1 งาน',
        reference: '4,500 บาท/งาน',
        amount: 4500,
        source: 'รอตรวจคลังและเปรียบเทียบราคา',
        owner: 'ฝ่ายอาคารสถานที่',
      },
      {
        availability: hasAudio ? 'มีแน่นอน' : 'อาจจะมี',
        item: 'ชุดเครื่องเสียงและไมโครโฟน',
        quantity: '1 ชุด',
        reference: 'ค่าเช่าทดแทน 8,500 บาท',
        amount: hasAudio ? 0 : 8500,
        source: hasAudio ? 'ข้อมูลผู้ใช้ • รอทดสอบก่อนวันงาน' : 'รอฝ่ายโสตฯ ตรวจสอบ',
        owner: 'ฝ่ายโสตทัศนูปกรณ์',
      },
      {
        availability: hasProjector ? 'มีแน่นอน' : 'อาจจะมี',
        item: 'โปรเจกเตอร์และจอภาพ',
        quantity: '1 ชุด',
        reference: 'ค่าเช่าทดแทน 4,000 บาท',
        amount: hasProjector ? 0 : 4000,
        source: hasProjector ? 'ข้อมูลผู้ใช้ • รอยืนยันสภาพ' : 'รอฝ่ายโสตฯ ตรวจสอบ',
        owner: 'ฝ่ายโสตทัศนูปกรณ์',
      },
      {
        availability: 'อาจจะมี',
        item: needsExtraChairs ? 'ที่นั่งสำรองสำหรับผู้สูงอายุ' : 'โต๊ะและเก้าอี้',
        quantity: needsExtraChairs
          ? `${fmt(Number(answers.elderly))} ที่นั่ง`
          : `${fmt(attendees)} ที่นั่ง`,
        reference: 'ค่าเช่าทดแทน 20 บาท/ที่นั่ง',
        amount: 0,
        source: 'รอตรวจจำนวนในคลัง',
        owner: 'ฝ่ายอาคารสถานที่',
      },
      {
        availability: 'อาจจะมี',
        item: 'ชุดปฐมพยาบาลประจำจุด',
        quantity: '1 ชุด',
        reference: '1,000 บาท/ชุด',
        amount: 1000,
        source: 'รอตรวจของคงเหลือห้องพยาบาล',
        owner: 'ครูพยาบาล',
      },
    ];

    // คำนวณ confidence จาก quality ของคำตอบ
    const answeredQuestions = ACTIVITY_PLANNING_QUESTIONS.filter(
      (q) => answers[q.id] !== undefined,
    );
    const qualityPoints = answeredQuestions.reduce(
      (sum, q) => sum + answerQuality(answers[q.id] || '', q.type),
      0,
    );

    const overallConfidence = Math.min(94, Math.round(50 + qualityPoints * 6));
    const ready = overallConfidence >= 85;

    const confidence: PlanConfidence = {
      coverage: Math.min(96, Math.round(58 + qualityPoints * 5)),
      people: Math.min(98, 72 + (answers.snacks ? 14 : 0) + (answers.elderly ? 8 : 0)),
      prices: Math.min(66, 26 + answeredQuestions.length * 4),
      assets: Math.min(
        92,
        30 + (answers.audio ? answerQuality(answers.audio, 'text') * 50 : 0),
      ),
    };

    return { items, confidence, overallConfidence, ready };
  },
};

/* ------------------------------------------------------------------ */
/* Activity Planning — คำถามและ helper functions                       */
/* ------------------------------------------------------------------ */


const ACTIVITY_PLANNING_QUESTIONS: PlanningQuestion[] = [
  {
    id: 'performances',
    label: 'มีการแสดงบนเวทีกี่ชุด และแต่ละชุดใช้เวลาประมาณกี่นาที?',
    reason: 'ใช้ประเมินเวลาเวที ทีมควบคุมเสียง และอุปกรณ์ที่ต้องเตรียม',
    placeholder: 'เช่น 5 ชุด ชุดละประมาณ 8 นาที',
    type: 'text',
  },
  {
    id: 'audio',
    label: 'กรุณาอธิบายเครื่องเสียงและอุปกรณ์ภาพที่โรงเรียนมีอยู่ พร้อมสภาพการใช้งาน',
    reason: 'ช่วยแยกของที่มีแน่นอน อาจจะมี และของที่ต้องเช่าหรือซื้อ',
    placeholder: 'เช่น มีเครื่องเสียง 1 ชุด ไมค์ไร้สาย 2 ตัว ยังไม่ได้ทดสอบ โปรเจกเตอร์พร้อมใช้',
    type: 'text',
  },
  {
    id: 'snacks',
    label: 'ต้องเตรียมอาหารว่างจริงทั้งหมดกี่ชุด?',
    reason: 'AI จะใช้ตัวเลขนี้คำนวณงบอาหารโดยตรง',
    placeholder: '300',
    type: 'number',
    suffix: 'ชุด',
  },
  {
    id: 'foodNeeds',
    label: 'มีข้อจำกัดด้านอาหารหรือความต้องการพิเศษอะไรบ้าง?',
    reason: 'ใช้เพิ่มอาหารทางเลือกและป้องกันการตกหล่นของผู้เข้าร่วม',
    placeholder: 'เช่น มังสวิรัติ 8 ชุด แพ้นม 3 ชุด หรือพิมพ์ว่า ไม่มี',
    type: 'text',
  },
  {
    id: 'elderly',
    label: 'คาดว่าจะมีผู้สูงอายุหรือผู้ใช้รถเข็นกี่คน?',
    reason: 'ใช้ตรวจจำนวนที่นั่งพิเศษ ทางเข้า และจุดปฐมพยาบาล',
    placeholder: '40',
    type: 'number',
    suffix: 'คน',
  },
  {
    id: 'accessibility',
    label: 'สถานที่มีทางลาด จุดพัก และทางออกฉุกเฉินพร้อมหรือไม่? อธิบายสิ่งที่ยังขาด',
    reason: 'ช่วยให้รายการด้านสถานที่และความปลอดภัยครบถ้วน',
    placeholder: 'เช่น มีทางลาดและทางออกฉุกเฉิน แต่ต้องเพิ่มเก้าอี้บริเวณทางเข้า 12 ตัว',
    type: 'text',
  },
  {
    id: 'decoration',
    label: 'ต้องการรูปแบบเวที ฉากหลัง และการตกแต่งระดับใด?',
    reason: 'ใช้กำหนดปริมาณวัสดุและแยกสิ่งที่โรงเรียนทำเองได้',
    placeholder: 'เช่น เวทีแบบมาตรฐาน ใช้โครงฉากเดิมของโรงเรียน ซื้อเฉพาะดอกไม้และงานพิมพ์',
    type: 'text',
  },
];

function answerQuality(value: string, type: PlanningQuestion['type']): number {
  const clean = value.trim();
  if (!clean) return 0;
  if (type === 'number') return Number(clean) >= 0 ? 1 : 0;
  if (/ไม่รู้|ไม่แน่ใจ|ยังไม่ทราบ|ยังไม่สรุป/.test(clean)) return 0.35;
  if (clean.length < 8) return 0.6;
  return 1;
}

