import { AlertCircle, FileWarning, Mic, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ActivityPlanForm, BudgetPlanItem, PlanningQuestion } from '@/types';
import { Field, SectionTitle, StatusPill, inputClass, textareaClass } from '../components/MobileUi';

const baht = (value: number) => value.toLocaleString('th-TH');

const EXAMPLES = [
  'ค่ายวิชาการคณิต นักเรียน 120 คน ทั้งวัน',
  'วันวิทยาศาสตร์ 5 ฐาน 200 คน งบ 15,000',
  'อบรมครู 1 วัน ครู 40 คน',
];

/* ------------------------------------------------------------------ */
/* ขั้นที่ 1 — กรอกข้อมูลกิจกรรม (มี AI ช่วยกรอกอยู่ล่างฟอร์ม)          */
/* ------------------------------------------------------------------ */

/**
 * ลำดับบนจอ: ฟอร์มกรอกเองอยู่บน แล้วค่อยเป็นกล่อง "ให้ AI ช่วยกรอก" ด้านล่าง
 * ครูที่รู้ข้อมูลอยู่แล้วกรอกได้เลย ไม่ต้องเลื่อนผ่าน AI ก่อน
 */
export function PlanningInfoScreen({
  form,
  onFormChange,
  prefilled,
  description,
  onDescriptionChange,
  onAiPrefill,
  isPrefilling,
}: {
  form: ActivityPlanForm;
  onFormChange: (field: keyof ActivityPlanForm, value: string) => void;
  /** AI เติมให้แล้วหรือกรอกเอง — ใช้เลือกข้อความหัวเรื่อง */
  prefilled: boolean;
  description: string;
  onDescriptionChange: (value: string) => void;
  onAiPrefill: () => void;
  isPrefilling: boolean;
}) {
  const attendees = [form.students, form.parents, form.teachers, form.guests]
    .map((value) => Number(value) || 0)
    .reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-4">
      {prefilled && (
        <div className="flex items-start gap-2.5 rounded-xl border-2 border-primary-500 bg-primary-50 p-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden />
          <p className="text-[12px] leading-relaxed text-ink">
            <strong className="block font-bold text-primary-800">AI เติมให้แล้วค่ะ</strong>
            ตรวจดูแล้วแก้เฉพาะช่องที่ไม่ตรงได้เลย
          </p>
        </div>
      )}

      <SectionTitle hint="กรอกเท่าที่รู้ก็พอ AI จะช่วยต่อเรื่องอุปกรณ์ ราคาอ้างอิง และเอกสาร">
        ข้อมูลกิจกรรม
      </SectionTitle>

      <Field label="ชื่อกิจกรรม">
        <input
          id="p-name"
          value={form.eventName}
          onChange={(event) => onFormChange('eventName', event.target.value)}
          placeholder="เช่น ค่ายวิชาการคณิตศาสตร์"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="วันที่">
          <input
            id="p-date"
            type="date"
            value={form.eventDate}
            onChange={(event) => onFormChange('eventDate', event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="วงเงิน (บาท)">
          <input
            id="p-budget"
            type="number"
            inputMode="numeric"
            min="0"
            value={form.budget}
            onChange={(event) => onFormChange('budget', event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="สถานที่">
        <input
          id="p-venue"
          value={form.venue}
          onChange={(event) => onFormChange('venue', event.target.value)}
          placeholder="เช่น หอประชุมโรงเรียน"
          className={inputClass}
        />
      </Field>

      <fieldset className="rounded-xl border border-slate-200 bg-white p-3">
        <legend className="flex items-center gap-1.5 px-1 text-[13px] font-semibold text-ink">
          <Users className="h-4 w-4 shrink-0 text-primary-700" aria-hidden />
          จำนวนผู้เข้าร่วม
        </legend>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ['students', 'นักเรียน'],
              ['parents', 'ผู้ปกครอง'],
              ['teachers', 'ครู'],
              ['guests', 'แขก'],
            ] as [keyof ActivityPlanForm, string][]
          ).map(([field, label]) => (
            <div key={field}>
              <label htmlFor={`p-${field}`} className="mb-1 block text-[12px] text-ink-light">
                {label}
              </label>
              <input
                id={`p-${field}`}
                type="number"
                inputMode="numeric"
                min="0"
                value={form[field]}
                onChange={(event) => onFormChange(field, event.target.value)}
                className={inputClass}
              />
            </div>
          ))}
        </div>

        <p className="mt-2.5 rounded-btn bg-primary-50 px-3 py-2 text-center text-[13px] font-bold text-primary-800">
          รวม {baht(attendees)} คน
        </p>
      </fieldset>

      {/* ---------- ทางลัด: ให้ AI กรอกให้แทน — อยู่ล่างฟอร์ม ---------- */}
      <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-3">
        <div className="mb-2 flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-display text-[14px] font-bold text-ink">
              เริ่มจากประโยคเดียว ให้ AI ช่วยตั้งต้นค่ะ
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-light">
              เล่าสั้น ๆ 1 บรรทัด แล้ว AI จะเติมข้อมูลกิจกรรมด้านบนให้
            </p>
          </div>
        </div>

        <label htmlFor="p-describe" className="sr-only">
          เล่าเกี่ยวกับกิจกรรม
        </label>
        <textarea
          id="p-describe"
          rows={2}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="เช่น ค่ายวิชาการคณิต นักเรียน 120 คน ทั้งวัน"
          className={textareaClass}
        />

        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-light">
          <Mic className="h-3.5 w-3.5 shrink-0" aria-hidden />
          พิมพ์ไม่สะดวก ใช้ปุ่มไมค์บนแป้นพิมพ์พูดใส่ได้เลยค่ะ
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onDescriptionChange(example)}
              className="min-h-[36px] rounded-btn border border-slate-300 bg-white px-2.5 text-[11px] text-ink"
            >
              {example}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onAiPrefill}
          disabled={!description.trim() || isPrefilling}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-primary-600 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:bg-ink-mute"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          {isPrefilling ? 'AI กำลังเติมข้อมูลให้…' : 'ให้ AI เติมข้อมูลให้'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ขั้นที่ 3 — AI ถามเพิ่มทีละข้อ                                       */
/* ------------------------------------------------------------------ */
export function PlanningQuestionsScreen({
  questions,
  questionIndex,
  draftAnswer,
  onDraftAnswerChange,
}: {
  questions: PlanningQuestion[];
  questionIndex: number;
  draftAnswer: string;
  onDraftAnswerChange: (value: string) => void;
}) {
  const currentQuestion = questions[questionIndex];
  if (!currentQuestion) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-[16px] font-bold text-ink">AI ขอถามเพิ่มค่ะ</h2>
        <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-1 text-[12px] font-bold text-primary-800">
          ข้อ {questionIndex + 1} / {questions.length}
        </span>
      </div>

      <div className="rounded-xl border-2 border-primary-500 bg-primary-50 p-3">
        <div className="mb-3 flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-display text-[14px] font-bold leading-snug text-ink">
              {currentQuestion.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-light">
              ถามเพราะ: {currentQuestion.reason}
            </p>
          </div>
        </div>

        <label htmlFor="p-answer" className="sr-only">
          {currentQuestion.label}
        </label>

        {currentQuestion.type === 'number' ? (
          <div className="flex items-center gap-2">
            <input
              id="p-answer"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder={currentQuestion.placeholder}
              value={draftAnswer}
              onChange={(event) => onDraftAnswerChange(event.target.value)}
              className={inputClass}
            />
            <span className="shrink-0 text-[13px] text-ink-light">{currentQuestion.suffix}</span>
          </div>
        ) : (
          <textarea
            id="p-answer"
            rows={3}
            placeholder={currentQuestion.placeholder}
            value={draftAnswer}
            onChange={(event) => onDraftAnswerChange(event.target.value)}
            className={textareaClass}
          />
        )}
      </div>

      <p className="text-center text-[11px] text-ink-light">
        ตอบสั้น ๆ ได้เลย ยิ่งตรงกับของจริง AI ยิ่งคิดงบได้แม่น
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ขั้นที่ 4 — รายการงบที่ AI คิดให้                                    */
/* ------------------------------------------------------------------ */
function availabilityTone(availability: BudgetPlanItem['availability']) {
  switch (availability) {
    case 'โรงเรียนไม่มี':
      return 'problem' as const;
    case 'อาจจะมี':
      return 'waiting' as const;
    case 'มีแน่นอน':
      return 'done' as const;
    default:
      return 'progress' as const;
  }
}

export function PlanningBudgetScreen({
  items,
  totalBudget,
}: {
  items: BudgetPlanItem[];
  totalBudget: number;
}) {
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const overBudget = totalBudget > 0 && totalAmount > totalBudget;

  return (
    <div className="space-y-3">
      <SectionTitle hint="ตรวจอุปกรณ์ ราคาอ้างอิง และผู้รับผิดชอบ ก่อนส่งต่อไปทำใบเบิก">
        รายการงบที่ AI คิดให้
      </SectionTitle>

      {/* ยอดรวมอยู่บนสุด เพราะเป็นตัวเลขที่ครูอยากเห็นก่อน */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <span className="font-display text-[13px] font-bold text-ink">ยอดรวมที่ต้องใช้</span>
        <span className="font-display text-[20px] font-bold text-primary-700">
          {baht(totalAmount)} บาท
        </span>
      </div>

      {overBudget && (
        <div className="flex items-start gap-2 rounded-xl border-2 border-danger-300 bg-danger-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" aria-hidden />
          <p className="text-[12px] leading-relaxed text-ink">
            <strong className="block font-bold text-danger-700">ยอดเกินวงเงินที่ตั้งไว้</strong>
            เกินอยู่ {baht(totalAmount - totalBudget)} บาท จากวงเงิน {baht(totalBudget)} บาท
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item.item}-${index}`}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <span className="min-w-0 font-display text-[14px] font-bold leading-snug text-ink">
                {item.item}
              </span>
              <span className="shrink-0 font-display text-[15px] font-bold text-primary-700">
                {item.amount > 0 ? baht(item.amount) : '—'}
              </span>
            </div>

            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <StatusPill icon={AlertCircle} tone={availabilityTone(item.availability)}>
                {item.availability}
              </StatusPill>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-ink-light">
                {item.quantity}
              </span>
            </div>

            <p className="text-[12px] text-ink">{item.reference}</p>
            <p className="mt-0.5 text-[11px] text-ink-light">
              ที่มา: {item.source} · ผู้ตรวจสอบ: {item.owner}
            </p>
          </li>
        ))}
      </ul>

      {/* บอกว่ากดปุ่มล่างแล้วจะเกิดอะไรต่อ */}
      <div className={cn('flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3')}>
        <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-ink-light" aria-hidden />
        <p className="text-[11px] leading-relaxed text-ink-light">
          <strong className="block font-bold text-ink">กดแล้วจะเกิดอะไรต่อ</strong>
          ระบบจะส่งรายการนี้ไปหน้าเลือก เบิก จบ ให้คุณครูเลือกผู้อนุมัติแล้วส่งขออนุมัติได้เลย
        </p>
      </div>
    </div>
  );
}
