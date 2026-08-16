import {
  Camera,
  CheckCircle2,
  Download,
  Inbox,
  MousePointerClick,
  PenLine,
  Phone,
  Send,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { env } from '@/config/env';
import { PENDING_DOCS, type PendingDoc } from '../data/pendingDocs';
import { EmptyState, SectionTitle, StatusPill } from '../components/MobileUi';

/** หน้ารายการรอเซ็น */
export function PendingSignScreen({
  onPick,
  signedIds,
}: {
  onPick: (doc: PendingDoc) => void;
  signedIds: string[];
}) {
  const remaining = PENDING_DOCS.filter((doc) => !signedIds.includes(doc.id));

  return (
    <div className="space-y-3">
      <SectionTitle hint="รวมงานที่รอลายเซ็นของคุณครูไว้ที่เดียว ไม่ต้องไล่หาในแชท">
        เอกสารที่รอฉันเซ็น
      </SectionTitle>

      {remaining.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="เซ็นครบทุกใบแล้วค่ะ 🎉"
          hint="ถ้ามีใบใหม่ ระบบจะแจ้งในแชททันที"
        />
      ) : (
        <ul className="space-y-2">
          {remaining.map((doc) => (
            <li key={doc.id}>
              <button
                type="button"
                onClick={() => onPick(doc)}
                className="w-full rounded-xl border-2 border-attention-500 bg-attention-50 p-3 text-left transition active:scale-[0.99]"
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <StatusPill icon={PenLine} tone="waiting">
                    รอคุณครูเซ็น
                  </StatusPill>
                  <span className="shrink-0 text-[11px] text-ink-light">
                    ค้างมา {doc.waitingDays} วัน
                  </span>
                </div>

                <p className="text-[14px] font-bold leading-snug text-ink">{doc.title}</p>
                <p className="mt-0.5 text-[11px] text-ink-light">
                  {doc.docNo} · จาก {doc.from}
                </p>

                {doc.amount > 0 && (
                  <p className="mt-1.5 font-display text-[20px] font-bold text-primary-700">
                    {doc.amount.toLocaleString('th-TH')} บาท
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {signedIds.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-primary-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            เซ็นไปแล้ว {signedIds.length} ใบในรอบนี้
          </p>
        </div>
      )}
    </div>
  );
}

interface HelpStep {
  icon: LucideIcon;
  title: string;
  detail: string;
}

const HELP_STEPS: HelpStep[] = [
  {
    icon: MousePointerClick,
    title: '1. เลือกโมดูลจากเมนูล่างจอ',
    detail: 'Doc Done ใช้กับงานเอกสาร ส่วน Kru Done ใช้กับกิจกรรม เบิกจ่าย และแผนการสอน',
  },
  {
    icon: Camera,
    title: '2. สแกน เลือก หรือเล่าให้ AI ฟัง',
    detail: 'ระบบใช้ OCR และ AI เติมข้อมูลตั้งต้นให้ก่อน คุณครูค่อยตรวจเฉพาะจุดสำคัญ',
  },
  {
    icon: Send,
    title: '3. ยืนยัน แล้วให้ระบบจัดการต่อ',
    detail: 'เอกสาร ใบเบิก และแผนงบจะมีสถานะติดตามได้ ลดการเดินกระดาษและงานซ้ำ',
  },
  {
    icon: Download,
    title: 'รับไฟล์หรือแจ้งเตือนใน LINE',
    detail: 'งานที่เสร็จแล้วและ deadline สำคัญจะกลับมาอยู่ในแชทหรือหน้า “งานของฉัน”',
  },
];

/** คู่มือสั้น ๆ อ่านจบใน 30 วินาที */
export function HowToScreen() {
  return (
    <div className="space-y-3">
      <SectionTitle hint="ไม่ต้องติดตั้งอะไรเพิ่ม ทำตามนี้ได้เลยค่ะ">
        วิธีใช้งาน KruAssist
      </SectionTitle>

      <ol className="space-y-2">
        {HELP_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[14px] font-bold text-ink">
                  {step.title}
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-light">
                  {step.detail}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* ⑦ ไม่มีทางตัน — มีทางออกให้เสมอ */}
      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-light" aria-hidden />
        <p className="text-[12px] leading-relaxed text-ink-light">
          ถ้ายังไม่แน่ใจตรงไหน โทรหาฝ่ายไอทีของโรงเรียนได้ที่{' '}
          <span className="font-bold text-primary-700">{env.supportPhone}</span> ได้ตลอดเวลาค่ะ
        </p>
      </div>
    </div>
  );
}
