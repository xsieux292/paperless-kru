import { useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, Mic, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  FormField,
  NumberFieldWithUnit,
  inputClass,
  textareaClass,
} from '@/components/ui/FormField';
import type { ActivityPlanForm } from '@/types';

const baht = (value: number) => value.toLocaleString('th-TH');

const EXAMPLES = [
  'ค่ายวิชาการคณิตศาสตร์ นักเรียน 120 คน จัดที่หอประชุม ทั้งวัน',
  'กิจกรรมวันวิทยาศาสตร์ 5 ฐาน นักเรียน 200 คน งบ 15,000',
  'อบรมครูเรื่อง Active Learning 1 วัน ครู 40 คน',
];

/**
 * ขั้นที่ 1 — ข้อมูลกิจกรรม
 *
 * ลำดับบนหน้าจอ: ฟอร์มกรอกเองอยู่บนสุด แล้วค่อยเป็นกล่อง "ให้ AI ช่วยกรอก" ด้านล่าง
 * ครูที่รู้ข้อมูลอยู่แล้วจะได้กรอกได้เลยโดยไม่ต้องเลื่อนผ่าน AI ก่อน
 * ส่วนครูที่ยังไม่อยากพิมพ์ทีละช่อง ก็เลื่อนลงไปให้ AI เติมให้ได้
 */
export function ActivityInfoForm({
  form,
  onFormChange,
  onSubmit,
  onAiPrefill,
  isPrefilling,
  prefilled,
  error,
}: {
  form: ActivityPlanForm;
  onFormChange: (field: keyof ActivityPlanForm, value: string) => void;
  onSubmit: () => void;
  /** ให้ AI เติมข้อมูลจากประโยคที่ครูเล่ามา */
  onAiPrefill: (description: string) => void;
  isPrefilling: boolean;
  /** AI เติมให้แล้วหรือยัง — ใช้เปลี่ยนข้อความหัวฟอร์ม */
  prefilled: boolean;
  error: string;
}) {
  const [description, setDescription] = useState('');

  const attendees = [form.students, form.parents, form.teachers, form.guests]
    .map((value) => Number(value) || 0)
    .reduce((sum, value) => sum + value, 0);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ---------- ฟอร์มกรอกข้อมูล — อยู่บนสุด กางไว้ตลอด ---------- */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-heading text-ink">ข้อมูลกิจกรรม</h2>
          <p className="mt-0.5 text-base text-ink-light">
            {prefilled
              ? 'AI เติมให้แล้ว — ตรวจและแก้ได้ทุกช่องเลยค่ะ'
              : 'กรอกเท่าที่รู้ก็พอ ไม่ต้องครบทุกช่อง'}
          </p>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <FormField label="ชื่อกิจกรรม" htmlFor="plan-eventName">
            <input
              id="plan-eventName"
              value={form.eventName}
              onChange={(event) => onFormChange('eventName', event.target.value)}
              placeholder="เช่น ค่ายวิชาการคณิตศาสตร์"
              className={inputClass}
            />
          </FormField>

          <FormField label="วัตถุประสงค์" htmlFor="plan-objective" optional>
            <textarea
              id="plan-objective"
              rows={2}
              value={form.objective}
              onChange={(event) => onFormChange('objective', event.target.value)}
              placeholder="จัดไปเพื่ออะไร"
              className={textareaClass}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="วันที่จัดงาน" htmlFor="plan-eventDate" optional>
              <input
                id="plan-eventDate"
                type="date"
                value={form.eventDate}
                onChange={(event) => onFormChange('eventDate', event.target.value)}
                className={inputClass}
              />
            </FormField>

            <FormField label="สถานที่" htmlFor="plan-venue" optional>
              <input
                id="plan-venue"
                value={form.venue}
                onChange={(event) => onFormChange('venue', event.target.value)}
                placeholder="เช่น หอประชุมโรงเรียน"
                className={inputClass}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberFieldWithUnit
              id="plan-duration"
              label="ระยะเวลางาน"
              unit="ชั่วโมง"
              min={1}
              optional
              value={form.durationHours}
              onChange={(value) => onFormChange('durationHours', value)}
            />
            <NumberFieldWithUnit
              id="plan-budget"
              label="วงเงินสูงสุด"
              unit="บาท"
              min={0}
              optional
              hint="ใส่ไว้เพื่อให้ AI เตือนเมื่อรายการเกินงบ"
              value={form.budget}
              onChange={(value) => onFormChange('budget', value)}
            />
          </div>

          {/* จำนวนผู้เข้าร่วม */}
          <fieldset className="rounded-xl border border-slate-200 p-4">
            <legend className="flex items-center gap-1.5 px-1 text-base font-semibold text-ink">
              <Users className="h-4 w-4 shrink-0 text-primary-700" aria-hidden />
              จำนวนผู้เข้าร่วม
            </legend>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ['students', 'นักเรียน'],
                  ['parents', 'ผู้ปกครอง'],
                  ['teachers', 'ครู/บุคลากร'],
                  ['guests', 'แขกรับเชิญ'],
                ] as [keyof ActivityPlanForm, string][]
              ).map(([field, label]) => (
                <NumberFieldWithUnit
                  key={field}
                  id={`plan-${field}`}
                  label={label}
                  unit="คน"
                  value={form[field]}
                  onChange={(value) => onFormChange(field, value)}
                />
              ))}
            </div>

            <p className="mt-3 rounded-btn bg-primary-50 px-3 py-2 text-base font-bold text-primary-800">
              รวม {baht(attendees)} คน
            </p>
          </fieldset>

          <FormField
            label="กำหนดการหรือกิจกรรมสำคัญ"
            htmlFor="plan-agenda"
            optional
            hint="ใส่คร่าว ๆ ได้ ยิ่งละเอียด AI ยิ่งคิดรายการได้ตรง"
          >
            <textarea
              id="plan-agenda"
              rows={4}
              value={form.agenda}
              onChange={(event) => onFormChange('agenda', event.target.value)}
              placeholder={'08:30 ลงทะเบียน\n09:00 พิธีเปิด\n12:00 พักกลางวัน'}
              className={textareaClass}
            />
          </FormField>
        </div>
      </div>

      {/* ---------- ทางลัด: ให้ AI กรอกให้แทน — วางไว้ล่างฟอร์ม ---------- */}
      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <Sparkles className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-heading text-ink">
              ไม่อยากกรอกเอง? ให้ AI ช่วยได้ค่ะ
            </h2>
            <p className="mt-0.5 text-base text-ink-light">
              เล่าสั้น ๆ 1 บรรทัด แล้ว AI จะเติมช่องด้านบนให้ คุณครูค่อยตรวจอีกที
            </p>
          </div>
        </div>

        <label htmlFor="plan-describe" className="sr-only">
          เล่าเกี่ยวกับกิจกรรม
        </label>
        <textarea
          id="plan-describe"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="เช่น ค่ายวิชาการคณิตศาสตร์ นักเรียน 120 คน จัดที่หอประชุม ทั้งวัน"
          className={textareaClass}
        />

        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-light">
          <Mic className="h-4 w-4 shrink-0" aria-hidden />
          พิมพ์ไม่สะดวก ใช้ปุ่มไมค์บนแป้นพิมพ์พูดใส่ได้เลยค่ะ
        </p>

        <div className="mt-3">
          <p className="mb-2 text-sm font-semibold text-ink-light">หรือแตะตัวอย่างนี้ก็ได้ค่ะ</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setDescription(example)}
                className="tap-target rounded-btn border border-slate-300 bg-white px-3 text-base text-ink transition hover:border-primary-500 hover:bg-primary-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          className="mt-4"
          disabled={!description.trim()}
          isLoading={isPrefilling}
          loadingText="AI กำลังเติมข้อมูลให้…"
          leftIcon={<Sparkles className="h-5 w-5" aria-hidden />}
          onClick={() => onAiPrefill(description)}
        >
          ให้ AI เติมข้อมูลให้
        </Button>
      </div>

      {/* ⑦ ไม่มีทางตัน — บอกเหตุผลเสมอเมื่อยังไปต่อไม่ได้ */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border-2 border-danger-300 bg-danger-50 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" aria-hidden />
          <p className="text-base text-ink">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        leftIcon={<ArrowRight className="h-5 w-5" aria-hidden />}
      >
        ไปให้ AI ถามรายละเอียดเพิ่ม
      </Button>
    </form>
  );
}
