import { useEffect, useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';

/**
 * หน้ายืนยันการเซ็นด้วย OTP (Flow C) — จุดที่ครูกังวลที่สุด
 *
 * โครงหน้าจอตาม plan:
 *   ไอคอนกุญแจ → กล่องสรุปสีเทา (ยอดเงินตัวใหญ่ 24px) → บรรทัดเตือนใจสีเทาเข้ม (ไม่ใช่แดง)
 *   → ช่อง OTP 6 ช่องแยกกัน → timer + ขอรหัสใหม่ → ปุ่มเดียว
 */

export interface OtpScreenProps {
  amount: string;
  budgetName: string;
  otp: string[];
  onOtpChange: (next: string[]) => void;
}

export function OtpScreen({ amount, budgetName, otp, onOtpChange }: OtpScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(180);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const setDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    onOtpChange(next);
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');

  return (
    <div className="space-y-5">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
        <KeyRound className="h-8 w-8 text-primary-700" aria-hidden />
      </div>

      {/* กล่องสรุป — ต้องเห็นครบก่อนเซ็น */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
        <p className="text-[12px] text-ink-light">เอกสารที่จะเซ็น</p>
        <p className="mt-0.5 font-display text-[15px] font-bold text-ink">
          ใบเบิกค่าวัสดุอุปกรณ์ (บก.01)
        </p>

        <div className="mt-3 border-t border-slate-200 pt-3">
          <p className="text-[12px] text-ink-light">เบิกจาก</p>
          <p className="text-[13px] font-semibold text-ink">{budgetName}</p>
        </div>

        <div className="mt-3 border-t border-slate-200 pt-3">
          <p className="text-[12px] text-ink-light">ยอดเงินรวม</p>
          {/* ตัวเลขเงิน 24px */}
          <p className="font-display text-money text-primary-700">{amount} บาท</p>
        </div>
      </div>

      {/* บรรทัดเตือนใจ — สีเทาเข้ม ไม่ใช่แดง เพราะนี่เป็นขั้นตอนปกติ ไม่ใช่ความผิดพลาด */}
      <p className="px-2 text-center text-[13px] leading-relaxed text-ink-light">
        ลายเซ็นนี้มีผลผูกพันตามระเบียบราชการ โปรดตรวจสอบยอดเงินให้ถูกต้องก่อนยืนยันค่ะ
      </p>

      <div>
        <p className="mb-2 text-center text-[13px] font-semibold text-ink">
          กรอกรหัส 6 หลักที่ส่งไปยังเบอร์ 08x-xxx-4567
        </p>
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputsRef.current[index] = element;
              }}
              inputMode="numeric"
              maxLength={1}
              value={digit}
              aria-label={`รหัสหลักที่ ${index + 1}`}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event.key)}
              className="h-14 w-11 rounded-btn border-2 border-slate-300 text-center font-display text-money text-ink focus:border-primary-600 focus:outline-none"
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 text-[12px]">
        <span className="text-ink-light">
          รหัสหมดอายุใน {minutes}:{seconds}
        </span>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => setSecondsLeft(180)}
          className="font-bold text-primary-700 underline"
        >
          ขอรหัสใหม่
        </button>
      </div>

      {otp.some((digit) => !digit) && (
        <button
          type="button"
          onClick={() => onOtpChange(['4', '8', '2', '9', '1', '6'])}
          className="w-full rounded-btn border border-dashed border-slate-300 py-2.5 text-[12px] font-semibold text-ink-light transition hover:bg-slate-50"
        >
          (โหมดนำเสนอ) แตะเพื่อเติมรหัสอัตโนมัติ
        </button>
      )}
    </div>
  );
}
