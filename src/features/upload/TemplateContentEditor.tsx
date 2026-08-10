import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ListChecks, Loader2, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AiDraftHeader, DraftField } from '@/components/ui/AiDraftBadge';
import { inputClass, textareaClass } from '@/components/ui/FormField';
import { toFriendlyMessage } from '@/api/http';
import { useDraftFormContent, useFormTemplateSpec } from '@/hooks/useCatalog';
import { cn } from '@/lib/cn';
import type { Confidence, DraftSummary } from '@/types';

const EXAMPLES = [
  'ขออนุมัติพานักเรียนไปแข่งคณิตศาสตร์ที่เขตพื้นที่',
  'ขอซื้อกระดาษ A4 มาใช้พิมพ์ข้อสอบกลางภาค',
  'รายงานผลการสอนคณิต ม.2 หน่วยสมการเชิงเส้น',
];

export interface TemplateContentEditorProps {
  templateId: string;
  templateName: string;
  /** ค่าปัจจุบันของแต่ละช่อง — ยกไปเก็บที่ฟอร์มแม่เพื่อส่งตอน submit */
  values: Record<string, string>;
  onValuesChange: (values: Record<string, string>) => void;
  /** ช่องบังคับที่ยังว่างอยู่ ใช้บอกฟอร์มแม่ว่ายังส่งไม่ได้ */
  onMissingChange: (missingLabels: string[]) => void;
  disabled?: boolean;
}

/**
 * ตัวกรอกเนื้อหาลงแบบฟอร์ม
 *
 * ปัญหาเดิมของโหมด "เติมข้อมูลลงแบบฟอร์ม":
 *   ครูเลือกแบบฟอร์มแล้วกดส่งได้ทันที โดยไม่เคยถูกถามเลยว่าจะให้กรอกเนื้อหาว่าอะไร
 *   AI จึงได้แค่ชื่อแบบฟอร์ม แล้วต้องเดาเรื่อง/ผู้รับ/เนื้อหาเองทั้งหมด
 *
 * ที่แก้:
 *   1. บอกก่อนเลยว่าแบบฟอร์มนี้มีช่องอะไรบ้าง ครูจะได้รู้ว่าต้องเตรียมอะไร
 *   2. ให้เล่าสั้น ๆ 1 บรรทัด แล้ว AI ร่างลงทุกช่องให้
 *   3. ครูเห็นทุกช่องพร้อมระดับความมั่นใจ แล้วแก้เฉพาะที่ผิด
 */
export function TemplateContentEditor({
  templateId,
  templateName,
  values,
  onValuesChange,
  onMissingChange,
  disabled = false,
}: TemplateContentEditorProps) {
  const [description, setDescription] = useState('');
  const [confidences, setConfidences] = useState<Record<string, Confidence>>({});
  const [reasons, setReasons] = useState<Record<string, string | undefined>>({});
  const [summary, setSummary] = useState<DraftSummary | null>(null);

  const spec = useFormTemplateSpec(templateId, templateName);
  const draft = useDraftFormContent();

  const fields = useMemo(() => spec.data?.fields ?? [], [spec.data]);

  // บอกฟอร์มแม่ว่ายังมีช่องบังคับไหนว่างอยู่บ้าง
  useEffect(() => {
    const missing = fields
      .filter((field) => field.required && !values[field.id]?.trim())
      .map((field) => field.label);
    onMissingChange(missing);
    // onMissingChange มาจาก useCallback ของฟอร์มแม่ จึงไม่ทำให้ loop
  }, [fields, values, onMissingChange]);

  const handleDraft = () => {
    draft.mutate(
      { templateId, description },
      {
        onSuccess: (result) => {
          const nextValues: Record<string, string> = { ...values };
          const nextConfidence: Record<string, Confidence> = {};
          const nextReasons: Record<string, string | undefined> = {};

          for (const [fieldId, field] of Object.entries(result.values)) {
            nextValues[fieldId] = field.value;
            nextConfidence[fieldId] = field.confidence;
            nextReasons[fieldId] = field.reason;
          }

          onValuesChange(nextValues);
          setConfidences(nextConfidence);
          setReasons(nextReasons);
          setSummary(result.summary);
        },
      },
    );
  };

  if (spec.isLoading) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary-600" aria-hidden />
        <p className="text-base text-ink-light">กำลังอ่านแบบฟอร์มว่าต้องกรอกอะไรบ้าง…</p>
      </div>
    );
  }

  if (spec.isError) {
    return (
      <div className="mb-4 rounded-xl border-2 border-danger-300 bg-danger-50 p-4">
        <p className="text-base font-bold text-danger-700">อ่านโครงแบบฟอร์มไม่ได้</p>
        <p className="mt-0.5 text-base text-ink">{toFriendlyMessage(spec.error)}</p>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-4">
      {/* 1. บอกก่อนว่าแบบฟอร์มนี้ต้องกรอกอะไรบ้าง */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-ink">
          <ListChecks className="h-5 w-5 shrink-0 text-primary-700" aria-hidden />
          แบบฟอร์มนี้ต้องกรอก {fields.length} ช่อง
        </h4>
        <p className="mb-3 text-sm text-ink-light">
          ช่องที่มีดอกจัน (*) จำเป็นต้องมี ที่เหลือเว้นว่างได้
        </p>

        <ul className="flex flex-wrap gap-2">
          {fields.map((field) => (
            <li
              key={field.id}
              className={cn(
                'rounded-full px-3 py-1 text-sm',
                values[field.id]?.trim()
                  ? 'bg-primary-50 text-primary-800'
                  : field.required
                    ? 'bg-attention-50 text-attention-800'
                    : 'bg-slate-100 text-ink-light',
              )}
            >
              {field.label}
              {field.required && ' *'}
            </li>
          ))}
        </ul>
      </div>

      {/* 2. เล่าสั้น ๆ แล้วให้ AI ร่างให้ */}
      <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-4">
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h4 className="font-display text-base font-bold text-ink">
              จะเขียนเรื่องอะไรคะ? เล่าสั้น ๆ พอ
            </h4>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-light">
              พิมพ์แบบที่คุณครูพูดได้เลย AI จะเรียบเรียงเป็นภาษาราชการลงทุกช่องให้
            </p>
          </div>
        </div>

        <label htmlFor="tpl-describe" className="sr-only">
          จะเขียนเรื่องอะไร
        </label>
        <textarea
          id="tpl-describe"
          rows={2}
          value={description}
          disabled={disabled}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="เช่น ขออนุมัติพานักเรียนไปแข่งคณิตศาสตร์ที่เขตพื้นที่"
          className={textareaClass}
        />

        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-light">
          <Mic className="h-4 w-4 shrink-0" aria-hidden />
          พิมพ์ไม่สะดวก ใช้ปุ่มไมค์บนแป้นพิมพ์พูดใส่ได้เลยค่ะ
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={disabled}
              onClick={() => setDescription(example)}
              className="tap-target rounded-btn border border-slate-300 bg-white px-3 text-base text-ink transition hover:border-primary-500"
            >
              {example}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          className="mt-3"
          disabled={disabled || !description.trim()}
          isLoading={draft.isPending}
          loadingText="AI กำลังร่างให้…"
          leftIcon={<Sparkles className="h-5 w-5" aria-hidden />}
          onClick={handleDraft}
        >
          ให้ AI ร่างเนื้อหาให้
        </Button>

        {draft.isError && (
          <p className="mt-2 rounded-btn border border-danger-300 bg-danger-50 p-2.5 text-sm text-danger-700">
            {toFriendlyMessage(draft.error)}
          </p>
        )}
      </div>

      {/* 3. ทุกช่องพร้อมให้ตรวจและแก้ */}
      {summary && <AiDraftHeader summary={summary} title="AI ร่างเนื้อหาให้แล้ว" />}

      <div className="space-y-3">
        {fields.map((field) => {
          const value = values[field.id] ?? '';
          const confidence: Confidence = confidences[field.id] ?? 'low';
          const isEmptyRequired = field.required && !value.trim();

          return (
            <DraftField
              key={field.id}
              label={`${field.label}${field.required ? ' *' : ''}`}
              confidence={summary ? confidence : 'low'}
              reason={
                summary
                  ? reasons[field.id]
                  : isEmptyRequired
                    ? 'ยังว่างอยู่ — พิมพ์เองหรือให้ AI ร่างให้ก็ได้ค่ะ'
                    : field.hint
              }
            >
              {field.multiline ? (
                <textarea
                  rows={3}
                  value={value}
                  disabled={disabled}
                  aria-label={field.label}
                  onChange={(event) =>
                    onValuesChange({ ...values, [field.id]: event.target.value })
                  }
                  placeholder={field.hint}
                  className={textareaClass}
                />
              ) : (
                <input
                  value={value}
                  disabled={disabled}
                  aria-label={field.label}
                  onChange={(event) =>
                    onValuesChange({ ...values, [field.id]: event.target.value })
                  }
                  placeholder={field.hint}
                  className={inputClass}
                />
              )}
            </DraftField>
          );
        })}
      </div>

      {/* ⑦ ไม่มีทางตัน — บอกชัดว่ายังขาดอะไร */}
      {fields.some((field) => field.required && !values[field.id]?.trim()) && (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-ink-mute" aria-hidden />
          <p className="text-base leading-relaxed text-ink-light">
            ยังมีช่องที่จำเป็นว่างอยู่ — กรอกเองหรือให้ AI ร่างให้ก่อนก็ได้ค่ะ
          </p>
        </div>
      )}
    </div>
  );
}
