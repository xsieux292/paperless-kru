import { Headset, Phone, PlayCircle } from 'lucide-react';
import { env } from '@/config/env';

export interface HelpCardProps {
  onOpenHelp: () => void;
}

/** กล่องช่วยเหลือ — ทางออกสุดท้ายเมื่อคุณครูติดขัด ต้องหาเจอง่ายที่สุด */
export function HelpCard({ onOpenHelp }: HelpCardProps) {
  return (
    <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 text-sky-900">
      <div className="mb-2 flex items-center gap-3">
        <Headset className="h-7 w-7 text-sky-600" aria-hidden />
        <h4 className="font-prompt text-base font-bold">ต้องการความช่วยเหลือ?</h4>
      </div>
      <p className="mb-4 text-sm text-sky-700">
        ดูวิธีใช้งานแบบทีละขั้นตอน หรือโทรถามฝ่ายไอทีของโรงเรียนได้ตลอดเวลาค่ะ
      </p>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onOpenHelp}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-sky-300 bg-white px-4 py-3 font-prompt text-sm font-bold text-sky-800 transition hover:bg-sky-100"
        >
          <PlayCircle className="h-5 w-5" aria-hidden />
          ดูวิธีใช้งาน 3 ขั้นตอน
        </button>

        <a
          href={`tel:${env.supportPhoneHref}`}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 font-prompt text-sm font-bold text-white shadow-sm transition hover:bg-primary-700"
        >
          <Phone className="h-5 w-5" aria-hidden />
          โทร {env.supportPhone}
        </a>
      </div>
    </div>
  );
}
