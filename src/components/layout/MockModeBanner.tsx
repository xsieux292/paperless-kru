import { FlaskConical } from 'lucide-react';
import { env } from '@/config/env';

/**
 * แถบบอกว่ากำลังใช้ข้อมูลจำลอง
 * แสดงเฉพาะตอน dev เพื่อให้ทีมพัฒนารู้ว่ายังไม่ได้ต่อ API จริง
 * (บน production ที่ตั้ง VITE_API_BASE_URL แล้ว แถบนี้จะหายไปเอง)
 */
export function MockModeBanner() {
  if (!env.useMock || !env.isDev) return null;

  return (
    <div className="border-b border-slate-300 bg-slate-200 px-4 py-2 text-center text-sm font-medium text-ink">
      <FlaskConical className="mr-1.5 inline h-4 w-4" aria-hidden />
      โหมดข้อมูลจำลอง (mock) — ตั้งค่า <code className="font-mono">VITE_API_BASE_URL</code> ใน
      <code className="font-mono"> .env</code> เพื่อเชื่อมต่อ API จริง
    </div>
  );
}
