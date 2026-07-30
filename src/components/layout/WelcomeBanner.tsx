import { FileText } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

/** แบนเนอร์ต้อนรับ — บอกสั้น ๆ ว่าระบบนี้ทำอะไรให้ และใช้ง่ายแค่ไหน */
export function WelcomeBanner() {
  const { data: profile } = useProfile();
  const shortName = profile?.fullName?.replace(/^คุณครู/, '') ?? '';

  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-sky-700 p-6 text-white shadow-lg sm:p-8">
      <div className="relative z-10 max-w-2xl">
        <span className="mb-3 inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold backdrop-blur-md sm:text-sm">
          ✨ ใช้งานง่าย เพียง 3 ขั้นตอน
        </span>
        <h2 className="mb-2 font-prompt text-2xl font-bold sm:text-3xl">
          {shortName ? `สวัสดีค่ะ คุณครู${shortName}` : 'สวัสดีค่ะ คุณครู'} —
          ส่งเอกสารมาแล้วให้ AI ทำงานแทนได้เลยค่ะ
        </h2>
        <p className="text-base text-sky-100 sm:text-lg">
          เลือกบริการที่ต้องการ แล้วส่งไฟล์หรือถ่ายรูป
          จากนั้นคุณครูปิดหน้านี้ไปพักผ่อนได้ทันที ระบบจะทำงานต่อให้เองค่ะ
        </p>
      </div>
      <FileText
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 text-white/10"
      />
    </section>
  );
}
