import { Headset, Phone, PlayCircle } from 'lucide-react';
import { env } from '@/config/env';

export interface HelpCardProps {
  onOpenHelp: () => void;
}

/**
 * กล่องช่วยเหลือ — ทางออกตาม plan ข้อ ⑦ "ไม่มีทางตัน"
 * ต้องหาเจอง่ายที่สุด แต่ไม่ใช้สีทึบ เพราะปุ่มทึบของจอนี้สงวนไว้ให้ปุ่มส่งเอกสาร
 */
export function HelpCard({ onOpenHelp }: HelpCardProps) {
  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center gap-3">
        <Headset className="h-6 w-6 shrink-0 text-primary-700" aria-hidden />
        <h4 className="font-display text-base font-bold text-ink">ติดตรงไหน ถามได้เลยค่ะ</h4>
      </div>
      <p className="mb-4 text-base text-ink-light">
        ดูวิธีใช้แบบทีละขั้นตอน หรือโทรถามฝ่ายไอทีของโรงเรียนได้ตลอดเวลา
      </p>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onOpenHelp}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-btn border-2 border-primary-600 bg-white px-4 font-display text-base font-bold text-primary-700 transition hover:bg-primary-50"
        >
          <PlayCircle className="h-5 w-5" aria-hidden />
          ดูวิธีใช้งาน 3 ขั้นตอน
        </button>

        <a
          href={`tel:${env.supportPhoneHref}`}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-btn border-2 border-slate-300 px-4 font-display text-base font-bold text-ink transition hover:bg-slate-50"
        >
          <Phone className="h-5 w-5" aria-hidden />
          โทรถามฝ่ายไอที {env.supportPhone}
        </a>
      </div>
    </div>
  );
}
