import { CheckCircle2, ChevronLeft, FileText, Menu, PenLine, Receipt } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * หน้าแชท LINE จำลอง
 * ตาม plan ข้อ 3 "แชทคือทางเข้า, LIFF คือทางทำงาน" — แชทใช้แจ้งเตือน สรุป และยืนยัน
 */

export type ChatItem =
  | { kind: 'text'; id: string; from: 'oa' | 'user'; text: string; time: string }
  | { kind: 'receipt-summary'; id: string; time: string; amount: string; vendor: string; budget: string; onSign: () => void }
  | { kind: 'signed-proof'; id: string; time: string; docNo: string; amount: string }
  | { kind: 'system'; id: string; text: string };

export interface LineChatProps {
  items: ChatItem[];
  /**
   * ref ของกล่องที่เลื่อนได้
   * ต้องเลื่อนด้วย scrollTop ของกล่องนี้เท่านั้น — ถ้าใช้ scrollIntoView
   * เบราว์เซอร์จะเลื่อนทั้งหน้าเว็บด้วย ทำให้กรอบมือถือหลุดจอตอนนำเสนอ
   */
  scrollRef?: React.RefObject<HTMLDivElement>;
}

export function LineChatHeader() {
  return (
    <div className="flex shrink-0 items-center gap-3 bg-white px-3 py-2.5 shadow-sm">
      <ChevronLeft className="h-6 w-6 shrink-0 text-slate-600" aria-hidden />
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
        KA
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[15px] font-bold text-ink">KruAssist</p>
        <p className="truncate text-[11px] text-ink-light">บัญชีทางการ · ตอบอัตโนมัติ</p>
      </div>
      <Menu className="h-6 w-6 shrink-0 text-slate-600" aria-hidden />
    </div>
  );
}

export function LineChat({ items, scrollRef }: LineChatProps) {
  return (
    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-line-bg px-3 py-4">
      {items.map((item) => (
        <ChatRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function ChatRow({ item }: { item: ChatItem }) {
  if (item.kind === 'system') {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] font-medium text-white">
          {item.text}
        </span>
      </div>
    );
  }

  if (item.kind === 'text') {
    const isUser = item.from === 'user';
    return (
      <div className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
        {!isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white">
            KA
          </div>
        )}
        {isUser && <span className="mb-1 text-[10px] text-slate-600">{item.time}</span>}
        <div
          className={cn(
            'max-w-[220px] rounded-2xl px-3 py-2 text-[14px] leading-relaxed',
            isUser ? 'bg-line-bubble text-ink' : 'bg-white text-ink',
          )}
        >
          {item.text}
        </div>
        {!isUser && <span className="mb-1 text-[10px] text-slate-600">{item.time}</span>}
      </div>
    );
  }

  if (item.kind === 'receipt-summary') {
    return (
      <FlexBubble time={item.time}>
        <div className="bg-primary-600 px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-white">
            <Receipt className="h-4 w-4" aria-hidden />
            อ่านใบเสร็จเรียบร้อยแล้ว
          </p>
        </div>

        <div className="space-y-2.5 px-4 py-3">
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="shrink-0 text-ink-light">ร้านค้า</span>
            <span className="text-right font-semibold text-ink">{item.vendor}</span>
          </div>
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="shrink-0 text-ink-light">หมวดงบ</span>
            <span className="text-right font-semibold text-ink">{item.budget}</span>
          </div>

          <div className="border-t border-slate-200 pt-2.5">
            <p className="text-[12px] text-ink-light">ยอดเงินรวม</p>
            {/* ตัวเลขเงิน 24px ตาม design system */}
            <p className="font-display text-money text-primary-700">{item.amount} บาท</p>
          </div>

          <p className="text-[11px] leading-relaxed text-ink-light">
            ระบบร่างใบเบิกให้แล้ว เหลือขั้นตอนเซ็นยืนยันของคุณครูค่ะ
          </p>
        </div>

        {/* ③ ปุ่มเป็น "กริยา + สิ่งของ" และมีปุ่มทึบเดียวต่อการ์ด */}
        <div className="space-y-1.5 border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={item.onSign}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-btn bg-primary-600 text-[14px] font-bold text-white transition active:scale-[0.98]"
          >
            <PenLine className="h-4 w-4" aria-hidden />
            เซ็นอนุมัติด้วย OTP
          </button>
          <button
            type="button"
            className="h-10 w-full rounded-btn text-[13px] font-bold text-ink-light transition hover:bg-slate-50"
          >
            เก็บเป็นร่างไว้ก่อน
          </button>
        </div>
      </FlexBubble>
    );
  }

  return (
    <FlexBubble time={item.time}>
      <div className="px-4 py-4 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-primary-600" aria-hidden />
        <p className="font-display text-[15px] font-bold text-ink">เซ็นเอกสารเรียบร้อยแล้ว</p>
        <p className="mt-1 text-[12px] text-ink-light">เก็บการ์ดนี้ไว้เป็นหลักฐานได้เลยค่ะ</p>
      </div>

      <div className="space-y-2 border-t border-slate-200 px-4 py-3 text-[12px]">
        <div className="flex justify-between gap-3">
          <span className="text-ink-light">เลขที่เอกสาร</span>
          <span className="font-mono font-semibold text-ink">{item.docNo}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ink-light">ยอดเงิน</span>
          <span className="font-semibold text-ink">{item.amount} บาท</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ink-light">เวลาที่เซ็น</span>
          <span className="font-semibold text-ink">วันนี้ {item.time} น.</span>
        </div>
      </div>

      {/* microcopy: สำเร็จแล้วต้องบอกว่าเกิดอะไรต่อ */}
      <div className="border-t border-slate-200 bg-primary-50 px-4 py-3">
        <p className="text-[12px] font-semibold text-primary-800">ขั้นตอนถัดไป</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink">
          ส่งให้ ผอ. อนุมัติแล้ว รอผลภายใน 2 วันทำการ ระบบจะแจ้งเตือนในแชทนี้ค่ะ
        </p>
      </div>
    </FlexBubble>
  );
}

function FlexBubble({ time, children }: { time: string; children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white">
        KA
      </div>
      <div className="w-[248px] overflow-hidden rounded-2xl bg-white shadow-sm">{children}</div>
      <span className="mb-1 text-[10px] text-slate-600">{time}</span>
    </div>
  );
}

/** ไอคอนไฟล์ใช้ในการ์ดอื่น ๆ (เผื่อขยาย flow) */
export const ChatFileIcon = FileText;
