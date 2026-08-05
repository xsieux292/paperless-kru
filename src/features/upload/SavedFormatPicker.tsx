import { Check, FileText, FolderOpen, Upload } from 'lucide-react';
import { useFormTemplates } from '@/hooks/useCatalog';
import { cn } from '@/lib/cn';
import { formatRelativeThai } from '@/lib/format';
import { toFriendlyMessage } from '@/api/http';
import type { FormTemplate } from '@/types';

export type FormatSource = 'saved' | 'new';

export interface SavedFormatPickerProps {
  source: FormatSource;
  onSourceChange: (source: FormatSource) => void;
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  disabled?: boolean;
}

/**
 * เลือกแบบฟอร์มที่เคยอัปโหลดไว้แล้ว แทนการอัปโหลดไฟล์เดิมซ้ำทุกครั้ง
 *
 * เหตุผล: โรงเรียนใช้แบบฟอร์มชุดเดิมทั้งปี การให้ครูไปหาไฟล์เดิมในเครื่องทุกครั้ง
 * คือขั้นตอนที่ครูติดบ่อยที่สุด — ระบบจึงจำให้ และเรียงตัวที่ใช้บ่อยขึ้นก่อน
 */
export function SavedFormatPicker({
  source,
  onSourceChange,
  selectedTemplateId,
  onSelectTemplate,
  disabled = false,
}: SavedFormatPickerProps) {
  const { data: templates, isLoading, isError, error } = useFormTemplates();

  return (
    <div className="mb-4">
      {/* สลับระหว่าง "ใช้ของเดิม" กับ "อัปโหลดใหม่" */}
      <div
        role="radiogroup"
        aria-label="เลือกที่มาของแบบฟอร์ม"
        className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        <SourceButton
          active={source === 'saved'}
          disabled={disabled}
          icon={FolderOpen}
          title="ใช้แบบฟอร์มที่เคยส่งไว้"
          subtitle="ไม่ต้องหาไฟล์เดิมในเครื่องอีก"
          onClick={() => onSourceChange('saved')}
        />
        <SourceButton
          active={source === 'new'}
          disabled={disabled}
          icon={Upload}
          title="อัปโหลดแบบฟอร์มใหม่"
          subtitle="ใช้เมื่อเป็นแบบฟอร์มที่ยังไม่เคยส่ง"
          onClick={() => onSourceChange('new')}
        />
      </div>

      {source === 'saved' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h4 className="mb-1 font-display text-base font-bold text-ink">
            แบบฟอร์มที่บันทึกไว้ในระบบ
          </h4>
          <p className="mb-3 text-sm text-ink-light">
            เรียงตามที่คุณครูใช้บ่อยที่สุด แตะเลือก 1 แบบฟอร์ม
          </p>

          {isLoading && (
            <div className="space-y-2" aria-hidden>
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            </div>
          )}

          {isError && (
            <div className="rounded-xl border-2 border-danger-300 bg-danger-50 p-3">
              <p className="text-base font-bold text-danger-700">ยังโหลดรายการแบบฟอร์มไม่ได้</p>
              <p className="mt-0.5 text-sm text-ink">{toFriendlyMessage(error)}</p>
              <p className="mt-2 text-sm text-ink-light">
                ระหว่างนี้เลือก “อัปโหลดแบบฟอร์มใหม่” ไปก่อนได้ค่ะ
              </p>
            </div>
          )}

          {!isLoading && !isError && templates && templates.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-ink-mute" aria-hidden />
              <p className="text-base font-semibold text-ink">ยังไม่มีแบบฟอร์มที่บันทึกไว้ค่ะ</p>
              <p className="mt-0.5 text-sm text-ink-light">
                อัปโหลดครั้งแรก แล้วครั้งต่อไประบบจะจำให้เอง
              </p>
            </div>
          )}

          {!isLoading && !isError && templates && templates.length > 0 && (
            <div
              role="radiogroup"
              aria-label="แบบฟอร์มที่บันทึกไว้"
              className="max-h-72 space-y-2 overflow-y-auto pr-1"
            >
              {templates.map((template) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  selected={selectedTemplateId === template.id}
                  disabled={disabled}
                  onSelect={() => onSelectTemplate(template.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SourceButton({
  active,
  disabled,
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  icon: typeof FolderOpen;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all disabled:opacity-60',
        active ? 'border-primary-600 bg-primary-50' : 'border-slate-200 bg-white hover:border-slate-300',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          active ? 'bg-primary-600 text-white' : 'bg-slate-100 text-ink-light',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-base font-bold text-ink">{title}</span>
        <span className="block text-sm text-ink-light">{subtitle}</span>
      </span>
    </button>
  );
}

function TemplateRow({
  template,
  selected,
  disabled,
  onSelect,
}: {
  template: FormTemplate;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all disabled:opacity-60',
        selected ? 'border-primary-600 bg-primary-50' : 'border-slate-200 bg-white hover:border-slate-300',
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-ink-light">
        <FileText className="h-5 w-5" aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-base font-bold text-ink">
          {template.name}
        </span>
        <span className="block text-sm text-ink-light">
          {template.category} · .{template.fileType} · ใช้ไปแล้ว {template.usageCount} ครั้ง
          {template.lastUsedAt && ` · ล่าสุด ${formatRelativeThai(template.lastUsedAt)}`}
        </span>
      </span>

      <span
        aria-hidden
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300',
        )}
      >
        {selected && <Check className="h-4 w-4" strokeWidth={3} />}
      </span>
    </button>
  );
}
