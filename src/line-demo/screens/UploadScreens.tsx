import {
  AlertCircle,
  Camera,
  FileText,
  FolderKanban,
  FolderOpen,
  Plus,
  Tags,
  Upload,
} from 'lucide-react';
import { getReceiptCategories } from '@/api/catalog.api';
import { toFriendlyMessage } from '@/api/http';
import { DOCUMENT_MODE_LIST, DOCUMENT_MODES } from '@/constants/documentModes';
import { useFormTemplates, useProjects } from '@/hooks/useCatalog';
import { formatRelativeThai } from '@/lib/format';
import type { DocumentMode, ReceiptCategoryId } from '@/types';
import {
  Chip,
  EmptyState,
  RowSkeleton,
  SectionTitle,
  SelectableRow,
  textareaClass,
} from '../components/MobileUi';

/**
 * หน้าจอ "ส่งเอกสารให้ AI" เวอร์ชัน LIFF
 * ใช้ constants และ hooks ชุดเดียวกับเว็บ (DOCUMENT_MODES, useFormTemplates, useProjects)
 * ข้อความและพฤติกรรมจึงตรงกับเว็บทุกอย่าง ต่างแค่จัดวางให้พอดีจอมือถือ
 */

/** ขั้นที่ 1 — เลือกบริการ (ตรงกับ ModeSelector บนเว็บ) */
export function UploadModeScreen({
  value,
  onChange,
}: {
  value: DocumentMode;
  onChange: (mode: DocumentMode) => void;
}) {
  return (
    <div className="space-y-3">
      <SectionTitle hint="เลือกได้ 1 อย่างต่อการส่ง 1 ครั้ง">ให้ AI ช่วยทำอะไรดีคะ?</SectionTitle>

      <div role="radiogroup" aria-label="เลือกบริการ" className="space-y-2">
        {DOCUMENT_MODE_LIST.map((mode) => (
          <SelectableRow
            key={mode.id}
            selected={value === mode.id}
            onSelect={() => onChange(mode.id)}
            icon={mode.icon}
            title={mode.title}
            subtitle={mode.description}
          />
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute" aria-hidden />
        <p className="text-[12px] leading-relaxed text-ink-light">
          {DOCUMENT_MODES[value].note}
        </p>
      </div>
    </div>
  );
}

export type FormatSource = 'saved' | 'new';

/** ขั้นที่ 2 — เลือกที่มาของเอกสาร (+ โครงการ ถ้าเป็นโหมดบัญชี) */
export function UploadSourceScreen({
  mode,
  source,
  onSourceChange,
  templateId,
  onTemplateChange,
  projectId,
  onProjectChange,
  category,
  onCategoryChange,
  attachedCount,
  onAttach,
}: {
  mode: DocumentMode;
  source: FormatSource;
  onSourceChange: (source: FormatSource) => void;
  templateId: string | null;
  onTemplateChange: (id: string) => void;
  projectId: string | null;
  onProjectChange: (id: string) => void;
  category: ReceiptCategoryId | null;
  onCategoryChange: (id: ReceiptCategoryId) => void;
  attachedCount: number;
  onAttach: (kind: 'camera' | 'file') => void;
}) {
  const config = DOCUMENT_MODES[mode];
  const templates = useFormTemplates();
  const projects = useProjects();

  return (
    <div className="space-y-4">
      <SectionTitle hint={config.requirement.text}>สิ่งที่คุณครูต้องเตรียม</SectionTitle>

      <ul className="space-y-1 rounded-xl border border-slate-200 bg-white p-3">
        {config.requirement.examples.map((example) => (
          <li key={example} className="flex items-start gap-2 text-[12px] text-ink-light">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-mute" aria-hidden />
            {example}
          </li>
        ))}
      </ul>

      {/* โหมดเติมแบบฟอร์ม: ใช้ของเดิมได้ ไม่ต้องอัปโหลดซ้ำ */}
      {mode === 'template' && (
        <div>
          <SectionTitle hint="โรงเรียนใช้แบบฟอร์มชุดเดิมทั้งปี ระบบจึงจำไว้ให้">
            จะใช้แบบฟอร์มไหนคะ?
          </SectionTitle>

          <div role="radiogroup" aria-label="ที่มาของแบบฟอร์ม" className="mb-2 space-y-2">
            <SelectableRow
              selected={source === 'saved'}
              onSelect={() => onSourceChange('saved')}
              icon={FolderOpen}
              title="ใช้แบบฟอร์มที่เคยส่งไว้"
              subtitle="ไม่ต้องหาไฟล์เดิมในเครื่องอีก"
            />
            <SelectableRow
              selected={source === 'new'}
              onSelect={() => onSourceChange('new')}
              icon={Upload}
              title="ส่งแบบฟอร์มใหม่"
              subtitle="ใช้เมื่อเป็นแบบฟอร์มที่ยังไม่เคยส่ง"
            />
          </div>

          {source === 'saved' && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="mb-2 text-[12px] font-semibold text-ink-light">
                เรียงตามที่คุณครูใช้บ่อยที่สุด
              </p>

              {templates.isLoading && <RowSkeleton count={3} />}

              {templates.isError && (
                <p className="text-[12px] text-danger-700">
                  {toFriendlyMessage(templates.error)}
                </p>
              )}

              {templates.data && templates.data.length === 0 && (
                <EmptyState
                  icon={FileText}
                  title="ยังไม่มีแบบฟอร์มที่บันทึกไว้"
                  hint="ส่งครั้งแรก แล้วครั้งต่อไประบบจะจำให้เอง"
                />
              )}

              <div role="radiogroup" aria-label="แบบฟอร์มที่บันทึกไว้" className="space-y-2">
                {templates.data?.map((template) => (
                  <SelectableRow
                    key={template.id}
                    selected={templateId === template.id}
                    onSelect={() => onTemplateChange(template.id)}
                    icon={FileText}
                    title={template.name}
                    subtitle={`${template.category} · .${template.fileType}`}
                    meta={`ใช้ไปแล้ว ${template.usageCount} ครั้ง${
                      template.lastUsedAt ? ` · ล่าสุด ${formatRelativeThai(template.lastUsedAt)}` : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* โหมดทำบัญชี: ต้องระบุโครงการและประเภท เพื่อให้รายงานแยกกัน */}
      {mode === 'accounting' && (
        <>
          <div>
            <SectionTitle hint="เลือกไว้เพื่อให้รายงานบัญชีแยกตามโครงการ ไม่ปนกัน">
              <span className="inline-flex items-center gap-1.5">
                <FolderKanban className="h-4 w-4 shrink-0 text-primary-700" aria-hidden />
                ใบเสร็จนี้เป็นของโครงการไหน?
              </span>
            </SectionTitle>

            {projects.isLoading && <RowSkeleton count={2} />}

            <div role="radiogroup" aria-label="โครงการ" className="space-y-2">
              {projects.data?.map((project) => {
                const remaining = project.budgetTotal - project.budgetUsed;
                const usedRatio = project.budgetUsed / project.budgetTotal;
                return (
                  <SelectableRow
                    key={project.id}
                    selected={projectId === project.id}
                    onSelect={() => onProjectChange(project.id)}
                    title={project.name}
                    subtitle={`${project.code} · ${project.budgetSource}`}
                    meta={`งบคงเหลือ ${remaining.toLocaleString('th-TH')} บาท`}
                    warning={
                      usedRatio >= 0.85
                        ? `งบโครงการนี้ใช้ไปแล้วกว่า ${Math.round(usedRatio * 100)}%`
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </div>

          <div>
            <SectionTitle hint="AI จะจัดกลุ่มค่าใช้จ่ายในตารางให้ถูกตั้งแต่แรก">
              <span className="inline-flex items-center gap-1.5">
                <Tags className="h-4 w-4 shrink-0 text-primary-700" aria-hidden />
                เป็นใบเสร็จค่าอะไร?
              </span>
            </SectionTitle>

            <div role="radiogroup" aria-label="ประเภทใบเสร็จ" className="flex flex-wrap gap-2">
              {getReceiptCategories().map((item) => (
                <Chip
                  key={item.id}
                  selected={category === item.id}
                  onSelect={() => onCategoryChange(item.id)}
                >
                  {item.name}
                </Chip>
              ))}
            </div>
          </div>
        </>
      )}

      {/* แนบไฟล์ — โหมดที่ใช้แบบฟอร์มเดิมจะแนบหรือไม่แนบก็ได้ */}
      <div>
        <SectionTitle
          hint={
            mode === 'template' && source === 'saved'
              ? 'จะแนบไฟล์ข้อมูลเพิ่มให้ AI ใช้กรอกก็ได้ ไม่แนบก็ส่งได้เลย'
              : undefined
          }
        >
          ส่งไฟล์เข้ามา
        </SectionTitle>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onAttach('camera')}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-btn border-2 border-primary-600 bg-white text-[14px] font-bold text-primary-700 transition active:scale-[0.98]"
          >
            <Camera className="h-5 w-5" aria-hidden />
            {DOCUMENT_MODES[mode].upload.cameraLabel}
          </button>
          <button
            type="button"
            onClick={() => onAttach('file')}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-btn border-2 border-slate-300 bg-white text-[14px] font-bold text-ink transition active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" aria-hidden />
            {DOCUMENT_MODES[mode].upload.fileLabel}
          </button>
        </div>

        {attachedCount > 0 && (
          <p className="mt-2 rounded-xl bg-primary-50 p-2.5 text-center text-[12px] font-semibold text-primary-800">
            แนบไว้แล้ว {attachedCount} ไฟล์
          </p>
        )}
      </div>
    </div>
  );
}

/** ขั้นที่ 3 — คำสั่งเพิ่มเติม + ตรวจทาน (ตรงกับ ConfirmSubmitDialog บนเว็บ) */
export function UploadReviewScreen({
  mode,
  notes,
  onNotesChange,
  templateName,
  projectName,
  categoryName,
  attachedCount,
}: {
  mode: DocumentMode;
  notes: string;
  onNotesChange: (value: string) => void;
  templateName?: string;
  projectName?: string;
  categoryName?: string;
  attachedCount: number;
}) {
  const config = DOCUMENT_MODES[mode];

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle hint="ข้ามได้ ไม่ใส่ก็ทำงานได้ปกติ">อยากบอกอะไร AI เพิ่มไหมคะ?</SectionTitle>

        <div className="mb-2 flex flex-wrap gap-2">
          {config.noteSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={notes.includes(suggestion)}
              onClick={() =>
                onNotesChange(notes.trim() ? `${notes.trim()}\n${suggestion}` : suggestion)
              }
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-slate-300 bg-white px-3 text-[12px] text-ink transition disabled:opacity-50"
            >
              <Plus className="h-3 w-3 shrink-0" aria-hidden />
              {suggestion}
            </button>
          ))}
        </div>

        <textarea
          rows={2}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="พิมพ์เพิ่มเองก็ได้ค่ะ…"
          className={textareaClass}
          aria-label="คำสั่งเพิ่มเติมถึง AI"
        />
      </div>

      <div>
        <SectionTitle hint="ดูให้แน่ใจว่าถูกต้อง แล้วกดปุ่มเขียวด้านล่าง">ตรวจทานก่อนส่ง</SectionTitle>

        <dl className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-[13px]">
          <Row label="บริการที่เลือก" value={config.title} />
          {templateName && <Row label="แบบฟอร์มที่ใช้" value={templateName} />}
          {projectName && <Row label="โครงการ" value={projectName} />}
          {categoryName && <Row label="ประเภทใบเสร็จ" value={categoryName} />}
          <Row
            label="ไฟล์ที่แนบ"
            value={attachedCount > 0 ? `${attachedCount} ไฟล์` : 'ไม่ได้แนบไฟล์เพิ่ม'}
          />
          {notes.trim() && (
            <div className="border-t border-slate-200 pt-2">
              <dt className="mb-1 text-ink-light">คำสั่งเพิ่มเติม</dt>
              <dd className="whitespace-pre-line rounded-lg bg-slate-50 p-2 text-ink">
                {notes.trim()}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-ink-light">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
