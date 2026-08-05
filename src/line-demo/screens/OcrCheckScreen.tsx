import { useState } from 'react';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * หน้าตรวจข้อมูลที่ AI อ่านมาได้ (Flow A ขั้นที่ 3) — หัวใจของทั้งระบบ
 *
 * ⑥ AI ทำก่อน ครูแค่ตรวจ:
 *    ช่องที่ AI มั่นใจ = พื้นเทา อ่านอย่างเดียว มีเครื่องหมายถูก
 *    ช่องที่ AI ไม่มั่นใจ = พื้นส้ม ขอบส้ม 2px พร้อมบอกจำนวนว่า "แก้แค่ 1 ช่องพอ"
 */

const CONFIDENT_FIELDS = [
  { label: 'ชื่อร้านค้า', value: 'ร้านสหกรณ์โรงเรียนเรียนดีวิทยา' },
  { label: 'วันที่ในใบเสร็จ', value: '12 สิงหาคม 2567' },
  { label: 'จำนวนรายการ', value: '4 รายการ' },
];

export interface OcrCheckScreenProps {
  amount: string;
  onAmountChange: (value: string) => void;
  confirmed: boolean;
  onConfirm: () => void;
}

export function OcrCheckScreen({
  amount,
  onAmountChange,
  confirmed,
  onConfirm,
}: OcrCheckScreenProps) {
  const [touched, setTouched] = useState(false);
  const isFixed = confirmed || touched;

  return (
    <div className="space-y-4">
      {/* แถบบอกงานที่เหลือ — บอกจำนวนตรง ๆ ว่าเหลือแก้กี่ช่อง */}
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border-2 p-3 transition-colors',
          isFixed ? 'border-primary-500 bg-primary-50' : 'border-attention-500 bg-attention-50',
        )}
      >
        {isFixed ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden />
        ) : (
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-attention-600" aria-hidden />
        )}
        <div>
          <p
            className={cn(
              'font-display text-[14px] font-bold',
              isFixed ? 'text-primary-800' : 'text-attention-800',
            )}
          >
            {isFixed ? 'ครบแล้วค่ะ ส่งต่อได้เลย' : 'แก้แค่ 1 ช่องพอค่ะ'}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink">
            {isFixed
              ? 'AI อ่านข้อมูลได้ครบ และคุณครูยืนยันยอดเงินแล้ว'
              : 'AI อ่านได้หมดแล้ว ยกเว้นยอดเงินที่ตัวเลขไม่ชัด รบกวนคุณครูตรวจอีกครั้งค่ะ'}
          </p>
        </div>
      </div>

      {/* ช่องที่ AI มั่นใจ — เทา อ่านอย่างเดียว */}
      {CONFIDENT_FIELDS.map((field) => (
        <div key={field.label}>
          <label className="mb-1 block text-[13px] font-semibold text-ink-light">
            {field.label}
          </label>
          <div className="relative">
            <input
              readOnly
              value={field.value}
              className="h-12 w-full rounded-btn border border-slate-200 bg-slate-100 pl-3 pr-10 text-[14px] text-ink-light"
            />
            <Lock
              className="absolute right-3 top-3.5 h-5 w-5 text-ink-mute"
              aria-label="AI อ่านค่านี้ได้ชัดเจน ไม่ต้องแก้"
            />
          </div>
        </div>
      ))}

      {/* ช่องที่ต้องให้ครูยืนยัน — ส้ม */}
      <div>
        <label
          htmlFor="ocr-amount"
          className={cn(
            'mb-1 block text-[13px] font-bold',
            isFixed ? 'text-primary-700' : 'text-attention-700',
          )}
        >
          ยอดเงินสุทธิ (บาท) — ช่องนี้รอคุณครูยืนยัน
        </label>
        <div className="relative">
          <input
            id="ocr-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => {
              onAmountChange(event.target.value);
              setTouched(true);
            }}
            className={cn(
              'h-14 w-full rounded-btn border-2 pl-3 pr-11 font-display text-money transition-colors focus:outline-none',
              isFixed
                ? 'border-primary-500 bg-white text-ink'
                : 'border-attention-500 bg-attention-50 text-ink',
            )}
          />
          {isFixed && (
            <CheckCircle2
              className="absolute right-3 top-4 h-6 w-6 text-primary-600"
              aria-hidden
            />
          )}
        </div>
        <p className="mt-1.5 text-[12px] text-ink-light">
          เทียบกับใบเสร็จอีกครั้งนะคะ ถ้าตรงแล้วกดปุ่มด้านล่างได้เลย
        </p>
      </div>

      {!touched && !confirmed && (
        <button
          type="button"
          onClick={() => {
            onAmountChange('1,250.00');
            setTouched(true);
            onConfirm();
          }}
          className="w-full rounded-btn border border-dashed border-slate-300 py-2.5 text-[12px] font-semibold text-ink-light transition hover:bg-slate-50"
        >
          (โหมดนำเสนอ) แตะเพื่อจำลองว่าครูยืนยันยอด 1,250.00 แล้ว
        </button>
      )}

      {/* ⑦ ไม่มีทางตัน */}
      <div className="flex justify-center gap-4 pt-1 text-[12px] font-semibold text-ink-light">
        <button type="button" className="underline">
          เก็บเป็นร่างไว้ก่อน
        </button>
        <button type="button" className="underline">
          ถามเจ้าหน้าที่
        </button>
      </div>
    </div>
  );
}
