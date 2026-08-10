import type { FormContentDraft, FormTemplateSpec } from '@/types';

/**
 * โครงของแต่ละแบบฟอร์ม และการร่างเนื้อหาลงช่อง
 *
 * ปัญหาที่แก้: เดิมครูเลือกแบบฟอร์มแล้วกดส่งได้เลยโดยไม่ต้องบอกเนื้อหาอะไร
 * AI จึงได้แค่ชื่อแบบฟอร์มแล้วต้องเดาเรื่อง/ผู้รับ/เนื้อหาเองทั้งหมด
 *
 * ตอนนี้ระบบจะบอกก่อนว่าแบบฟอร์มนี้มีช่องอะไรบ้าง แล้วให้ AI ร่างให้จากประโยคเดียว
 * ครูเห็นทุกช่องและแก้เฉพาะที่ผิด — pattern เดียวกับหน้าเบิกงบ
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** ช่องมาตรฐานของหนังสือราชการไทย */
const MEMO_FIELDS: FormTemplateSpec['fields'] = [
  { id: 'to', label: 'เรียน', required: true, hint: 'เช่น ผู้อำนวยการโรงเรียน' },
  { id: 'subject', label: 'เรื่อง', required: true, hint: 'สรุปสั้น ๆ ว่าเรื่องอะไร' },
  {
    id: 'body',
    label: 'เนื้อหา',
    required: true,
    multiline: true,
    hint: 'เล่าเหตุผลและสิ่งที่ต้องการ',
  },
  { id: 'attachment', label: 'สิ่งที่ส่งมาด้วย', required: false, hint: 'ถ้าไม่มีเว้นว่างได้' },
];

const TEMPLATE_SPECS: Record<string, FormTemplateSpec['fields']> = {
  'tpl-001': MEMO_FIELDS,
  'tpl-002': [
    { id: 'projectName', label: 'ชื่อโครงการ/กิจกรรม', required: true },
    { id: 'objective', label: 'วัตถุประสงค์', required: true, multiline: true },
    { id: 'period', label: 'ระยะเวลาดำเนินการ', required: true, hint: 'เช่น 18–19 ส.ค. 2569' },
    { id: 'target', label: 'กลุ่มเป้าหมาย', required: true, hint: 'เช่น นักเรียน ม.2 จำนวน 120 คน' },
    { id: 'budget', label: 'งบประมาณที่ขอ', required: true, hint: 'ระบุเป็นบาท' },
  ],
  'tpl-003': [
    { id: 'subjectName', label: 'รายวิชา/ชั้นที่สอน', required: true },
    { id: 'unit', label: 'หน่วยการเรียนรู้', required: true },
    { id: 'result', label: 'ผลการจัดการเรียนรู้', required: true, multiline: true },
    { id: 'problem', label: 'ปัญหาและแนวทางแก้ไข', required: false, multiline: true },
  ],
  'tpl-004': [
    { id: 'purpose', label: 'เบิกไปใช้ทำอะไร', required: true },
    { id: 'items', label: 'รายการวัสดุที่ขอเบิก', required: true, multiline: true },
    { id: 'neededBy', label: 'วันที่ต้องใช้', required: true },
  ],
  'tpl-005': [
    { id: 'assetName', label: 'พัสดุ/ครุภัณฑ์ที่ขอยืม', required: true },
    { id: 'purpose', label: 'ยืมไปใช้ทำอะไร', required: true },
    { id: 'period', label: 'ยืมตั้งแต่วันที่ถึงวันที่', required: true },
  ],
};

export const mockFormTemplateSpecs = {
  /** อ่านโครงของแบบฟอร์มว่ามีช่องอะไรบ้าง */
  async inspect(templateId: string, templateName: string): Promise<FormTemplateSpec> {
    await delay(700);
    return {
      templateId,
      templateName,
      fields: TEMPLATE_SPECS[templateId] ?? MEMO_FIELDS,
    };
  },

  /** ร่างเนื้อหาลงทุกช่องจากประโยคเดียวที่ครูเล่ามา */
  async draftContent(
    templateId: string,
    description: string,
  ): Promise<FormContentDraft> {
    await delay(1500);

    const fields = TEMPLATE_SPECS[templateId] ?? MEMO_FIELDS;
    const text = description.trim().replace(/\s+/g, ' ');
    const values: FormContentDraft['values'] = {};

    for (const field of fields) {
      const drafted = draftValue(field.id, text);
      values[field.id] = drafted;
    }

    const confident = Object.values(values).filter(
      (item) => item.confidence === 'high',
    ).length;

    return {
      values,
      summary: { confidentCount: confident, totalCount: fields.length },
    };
  },
};

/** เดาค่าของแต่ละช่องจากสิ่งที่ครูเล่ามา */
function draftValue(fieldId: string, text: string): FormContentDraft['values'][string] {
  const low = (value: string, reason: string) =>
    ({ value, confidence: 'low' as const, reason });
  const high = (value: string, reason?: string) =>
    ({ value, confidence: 'high' as const, reason });

  switch (fieldId) {
    case 'to':
      return high('ผู้อำนวยการโรงเรียนเรียนดีวิทยา', 'ผู้รับที่ใช้บ่อยที่สุดของหนังสือภายใน');

    case 'subject':
    case 'projectName':
    case 'assetName':
      return text
        ? high(capitalizeThai(text), 'สรุปจากที่คุณครูเล่ามา')
        : low('', 'ยังไม่ได้เล่ามาว่าเรื่องอะไร');

    case 'body':
    case 'objective':
    case 'result':
      return text
        ? high(
            `ด้วยข้าพเจ้ามีความประสงค์จะ${text} ` +
              'จึงขอเรียนมาเพื่อโปรดพิจารณาอนุมัติ และขอขอบพระคุณมา ณ โอกาสนี้',
            'เรียบเรียงเป็นภาษาราชการจากที่คุณครูเล่า',
          )
        : low('', 'ยังไม่มีข้อมูลพอจะเรียบเรียง');

    case 'period':
    case 'neededBy': {
      const target = new Date();
      target.setDate(target.getDate() + 14);
      const months = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
      ];
      const formatted = `${target.getDate()} ${months[target.getMonth()]} ${target.getFullYear() + 543}`;
      return low(formatted, 'ไม่ได้ระบุวันมา — ตั้งให้เป็นอีก 14 วัน กรุณาตรวจ');
    }

    case 'target':
      return low('นักเรียนโรงเรียนเรียนดีวิทยา', 'เดาจากค่าที่ใช้บ่อย กรุณาระบุจำนวนให้ชัด');

    case 'budget': {
      const matched = text.match(/([\d,]+)\s*บาท/);
      return matched?.[1]
        ? high(`${matched[1]} บาท`, 'จับตัวเลขจากที่คุณครูเล่ามา')
        : low('', 'ยังไม่ได้บอกวงเงินมา');
    }

    case 'items':
      return low('', 'กรุณาระบุรายการและจำนวนให้ชัดเจน');

    case 'purpose':
      return text ? high(text, 'จากที่คุณครูเล่ามา') : low('', 'ยังไม่ได้เล่ามา');

    case 'attachment':
      return high('—', 'ไม่มีเอกสารแนบ');

    default:
      return low('', 'ยังไม่มีข้อมูลสำหรับช่องนี้');
  }
}

/** ตัดคำนำหน้าที่ไม่จำเป็นออก ให้เหลือเป็นหัวเรื่องสั้น ๆ */
function capitalizeThai(text: string): string {
  return text
    .replace(/^(ขอ|อยาก|ต้องการ|จะ)\s*/, '')
    .replace(/\s*(ครับ|ค่ะ|นะคะ|นะครับ)\s*$/, '')
    .slice(0, 120);
}
