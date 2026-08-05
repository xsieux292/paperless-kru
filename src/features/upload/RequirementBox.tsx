import { Check, Info } from 'lucide-react';
import type { DocumentModeConfig } from '@/constants/documentModes';

/** กล่องอธิบายว่าระบบจะทำอะไรให้ (ต่อจากการเลือกบริการ) — สีกลาง ไม่แย่งความสนใจจากปุ่มหลัก */
export function ModeNote({ mode }: { mode: DocumentModeConfig }) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-ink-mute" aria-hidden />
      <p className="text-base leading-relaxed text-ink-light">{mode.note}</p>
    </div>
  );
}

/**
 * กล่อง "สิ่งที่คุณครูต้องเตรียม"
 * แสดงเป็นรายการเป็นข้อ ๆ เพื่อให้รู้ทันทีว่าต้องส่งอะไร โดยไม่ต้องอ่านย่อหน้ายาว
 */
export function RequirementBox({ mode }: { mode: DocumentModeConfig }) {
  const Icon = mode.requirement.icon;

  return (
    <div className="mb-4 flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
        <Icon className="h-6 w-6" aria-hidden />
      </div>

      <div className="min-w-0">
        <h4 className="mb-1 font-display text-heading text-ink">สิ่งที่คุณครูต้องเตรียม</h4>
        <p className="mb-3 text-base leading-relaxed text-ink-light">{mode.requirement.text}</p>

        <ul className="space-y-1.5">
          {mode.requirement.examples.map((example) => (
            <li key={example} className="flex items-start gap-2 text-base text-ink-light">
              <Check
                className="mt-1 h-4 w-4 shrink-0 text-primary-600"
                strokeWidth={3}
                aria-hidden
              />
              <span>{example}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
