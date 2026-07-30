import { Check, Info } from 'lucide-react';
import type { DocumentModeConfig } from '@/constants/documentModes';
import { cn } from '@/lib/cn';

/** กล่องอธิบายว่าระบบจะทำอะไรให้ (ต่อจากการเลือกโหมด) */
export function ModeNote({ mode }: { mode: DocumentModeConfig }) {
  return (
    <div
      className={cn(
        'mt-4 flex items-start gap-3 rounded-xl border p-4 transition-colors duration-300',
        mode.accent.noteBox,
      )}
    >
      <Info className={cn('mt-0.5 h-6 w-6 shrink-0', mode.accent.noteIcon)} aria-hidden />
      <p className="text-base font-medium leading-relaxed">{mode.note}</p>
    </div>
  );
}

/**
 * กล่อง "สิ่งที่คุณครูต้องเตรียม"
 * ปรับจาก HTML เดิม: เปลี่ยนจากย่อหน้ายาว เป็นรายการตัวอย่างเป็นข้อ ๆ อ่านแล้วเข้าใจทันทีว่าต้องส่งอะไร
 */
export function RequirementBox({ mode }: { mode: DocumentModeConfig }) {
  const Icon = mode.requirement.icon;

  return (
    <div
      className={cn(
        'mb-5 flex items-start gap-4 rounded-2xl border-2 p-5 transition-all duration-300',
        mode.accent.requirementBox,
      )}
    >
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
          mode.accent.requirementIcon,
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>

      <div className="min-w-0">
        <h4 className="mb-1 font-prompt text-lg font-bold text-slate-900">
          สิ่งที่คุณครูต้องเตรียมสำหรับโหมดนี้
        </h4>
        <p className="mb-3 text-base leading-relaxed text-slate-700">{mode.requirement.text}</p>

        <ul className="space-y-1.5">
          {mode.requirement.examples.map((example) => (
            <li key={example} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} aria-hidden />
              <span>{example}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
