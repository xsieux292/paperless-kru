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
 * ปรับจาก HTML เดิม: เพิ่มปุ่มคำสั่งสำเร็จรูปตามโหมด — คุณครูกดเลือกได้เลยโดยไม่ต้องคิดคำเอง
 */
export function NotesField({ value, onChange, mode, disabled = false }: NotesFieldProps) {
  const appendSuggestion = (suggestion: string) => {
    const next = value.trim() ? `${value.trim()}\n${suggestion}` : suggestion;
    onChange(next.slice(0, MAX_LENGTH));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {mode.noteSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled || value.includes(suggestion)}
            onClick={() => appendSuggestion(suggestion)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
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
          className="w-full rounded-2xl border border-slate-300 p-4 text-base text-slate-700 transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50"
        />
        <p className="mt-1 text-right text-xs text-slate-400">
          {value.length}/{MAX_LENGTH} ตัวอักษร
        </p>
      </div>
    </div>
  );
}
