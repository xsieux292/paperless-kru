import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, ListChecks, Loader2, Mic, Sparkles } from 'lucide-react';
import { toFriendlyMessage } from '@/api/http';
import { useDraftFormContent, useFormTemplateSpec } from '@/hooks/useCatalog';
import { cn } from '@/lib/cn';
import type { Confidence, DraftSummary } from '@/types';
import { SectionTitle, inputClass, textareaClass } from '../components/MobileUi';

const EXAMPLES = [
  'ขออนุมัติพานักเรียนไปแข่งคณิต',
  'ขอซื้อกระดาษ A4 พิมพ์ข้อสอบ',
  'รายงานผลการสอนคณิต ม.2',
];

/**
 * กรอกเนื้อหาลงแบบฟอร์ม (เวอร์ชัน LIFF)
 *
 * แก้ปัญหาเดียวกับฝั่งเว็บ: เดิมเลือกแบบฟอร์มแล้วส่งได้เลย
 * โดย AI ไม่เคยรู้ว่าจะกรอกเนื้อหาอะไรลงไป
 */
export function TemplateContentScreen({
  templateId,
  templateName,
  values,
  onValuesChange,
  onMissingChange,
}: {
  templateId: string;
  templateName: string;
  values: Record<string, string>;
  onValuesChange: (values: Record<string, string>) => void;
  onMissingChange: (missing: string[]) => void;
}) {
  const [description, setDescription] = useState('');
  const [confidences, setConfidences] = useState<Record<string, Confidence>>({});
  const [reasons, setReasons] = useState<Record<string, string | undefined>>({});
  const [summary, setSummary] = useState<DraftSummary | null>(null);

  const spec = useFormTemplateSpec(templateId, templateName);
  const draft = useDraftFormContent();
  const fields = useMemo(() => spec.data?.fields ?? [], [spec.data]);

  useEffect(() => {
    const missing = fields
      .filter((field) => field.required && !values[field.id]?.trim())
      .map((field) => field.label);
    onMissingChange(missing);
  }, [fields, values, onMissingChange]);

  const handleDraft = () => {
    draft.mutate(
      { templateId, description },
      {
        onSuccess: (result) => {
          const nextValues = { ...values };
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
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary-600" aria-hidden />
        <p className="text-[12px] text-ink-light">กำลังอ่านแบบฟอร์ม…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* บอกว่าแบบฟอร์มนี้ต้องกรอกอะไรบ้าง */}
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-1.5 flex items-center gap-1.5 font-display text-[13px] font-bold text-ink">
          <ListChecks className="h-4 w-4 shrink-0 text-primary-700" aria-hidden />
          แบบฟอร์มนี้ต้องกรอก {fields.length} ช่อง
        </p>
        <div className="flex flex-wrap gap-1.5">
          {fields.map((field) => (
            <span
              key={field.id}
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px]',
                values[field.id]?.trim()
                  ? 'bg-primary-50 text-primary-800'
                  : field.required
                    ? 'bg-attention-50 text-attention-800'
                    : 'bg-slate-100 text-ink-light',
              )}
            >
              {field.label}
              {field.required && ' *'}
            </span>
          ))}
        </div>
      </div>

      {/* เล่าสั้น ๆ ให้ AI ร่าง */}
      <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-3">
        <p className="font-display text-[13px] font-bold text-ink">จะเขียนเรื่องอะไรคะ?</p>
        <p className="mb-2 mt-0.5 text-[11px] leading-relaxed text-ink-light">
          เล่าสั้น ๆ AI จะเรียบเรียงเป็นภาษาราชการลงทุกช่องให้
        </p>

        <label htmlFor="tpl-desc" className="sr-only">
          จะเขียนเรื่องอะไร
        </label>
        <textarea
          id="tpl-desc"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="เช่น ขออนุมัติพานักเรียนไปแข่งคณิต"
          className={textareaClass}
        />

        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-light">
          <Mic className="h-3.5 w-3.5 shrink-0" aria-hidden />
          พิมพ์ไม่สะดวก กดไมค์บนแป้นพิมพ์พูดได้เลยค่ะ
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setDescription(example)}
              className="min-h-[36px] rounded-btn border border-slate-300 bg-white px-2.5 text-[11px] text-ink"
            >
              {example}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleDraft}
          disabled={!description.trim() || draft.isPending}
          className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-primary-600 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:bg-ink-mute"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          {draft.isPending ? 'AI กำลังร่างให้…' : 'ให้ AI ร่างเนื้อหาให้'}
        </button>

        {draft.isError && (
          <p className="mt-2 rounded-btn border border-danger-300 bg-danger-50 p-2 text-[11px] text-danger-700">
            {toFriendlyMessage(draft.error)}
          </p>
        )}
      </div>

      {summary && (
        <div className="flex items-center gap-2 rounded-xl border-2 border-primary-500 bg-primary-50 p-2.5">
          <Check className="h-4 w-4 shrink-0 text-primary-600" strokeWidth={3} aria-hidden />
          <p className="text-[12px] font-bold text-primary-800">
            AI ร่างให้แล้ว {summary.confidentCount}/{summary.totalCount} ชัดเจน — ตรวจแล้วแก้ได้เลย
          </p>
        </div>
      )}

      <SectionTitle hint="แตะแก้ได้ทุกช่อง">เนื้อหาที่จะกรอกลงแบบฟอร์ม</SectionTitle>

      {fields.map((field) => {
        const value = values[field.id] ?? '';
        const uncertain = summary ? (confidences[field.id] ?? 'low') === 'low' : !value.trim();

        return (
          <div
            key={field.id}
            className={cn(
              'rounded-xl border-2 p-3',
              uncertain && field.required
                ? 'border-attention-500 bg-attention-50'
                : 'border-slate-200 bg-white',
            )}
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="text-[12px] font-semibold text-ink-light">
                {field.label}
                {field.required && ' *'}
              </span>
              {summary &&
                (uncertain ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-attention-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    <AlertCircle className="h-3 w-3" aria-hidden />
                    AI ไม่แน่ใจ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary-700">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    AI มั่นใจ
                  </span>
                ))}
            </div>

            {field.multiline ? (
              <textarea
                rows={3}
                value={value}
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
                aria-label={field.label}
                onChange={(event) =>
                  onValuesChange({ ...values, [field.id]: event.target.value })
                }
                placeholder={field.hint}
                className={inputClass}
              />
            )}

            {(reasons[field.id] || field.hint) && (
              <p
                className={cn(
                  'mt-1.5 text-[11px] leading-relaxed',
                  uncertain ? 'text-attention-800' : 'text-ink-light',
                )}
              >
                {summary ? reasons[field.id] : field.hint}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
