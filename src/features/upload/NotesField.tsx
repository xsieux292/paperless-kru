import { Plus } from 'lucide-react';
import type { DocumentModeConfig } from '@/constants/documentModes';

export interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
  mode: DocumentModeConfig;
  disabled?: boolean;
}

const MAX_LENGTH = 500;

/**
 * ช่องคำสั่งเพิ่มเติมถึง AI
 * มีปุ่มคำสั่งสำเร็จรูปตามบริการที่เลือก — ครูกดใส่ได้เลยโดยไม่ต้องคิดคำเอง
 * (ครูหลายคนพิมพ์ช้า ตาม plan ข้อ 6 "Voice input" ช่องนี้ใช้แป้นพิมพ์เสียงของเครื่องได้ตามปกติ)
 */
export function NotesField({ value, onChange, mode, disabled = false }: NotesFieldProps) {
  const appendSuggestion = (suggestion: string) => {
    const next = value.trim() ? `${value.trim()}\n${suggestion}` : suggestion;
    onChange(next.slice(0, MAX_LENGTH));
  };

  return (
    <div className="space-y-3">
      <p className="text-base text-ink-light">แตะเลือกคำสั่งที่ใช้บ่อยได้เลยค่ะ</p>

      <div className="flex flex-wrap gap-2">
        {mode.noteSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled || value.includes(suggestion)}
            onClick={() => appendSuggestion(suggestion)}
            className="tap-target inline-flex items-center gap-1.5 rounded-btn border border-slate-300 bg-white px-3 text-base text-ink transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            {suggestion}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="userNotes" className="sr-only">
          คำสั่งเพิ่มเติมถึง AI
        </label>
        <textarea
          id="userNotes"
          rows={3}
          maxLength={MAX_LENGTH}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="พิมพ์เพิ่มเองก็ได้ค่ะ เช่น สรุปเป็นยอดรวมรายเดือนให้ด้วย…"
          className="w-full rounded-xl border border-slate-300 p-4 text-base text-ink transition placeholder:text-ink-mute focus:border-primary-600 focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50"
        />
        <p className="mt-1 text-right text-sm text-ink-mute">
          {value.length}/{MAX_LENGTH} ตัวอักษร
        </p>
      </div>
    </div>
  );
}
