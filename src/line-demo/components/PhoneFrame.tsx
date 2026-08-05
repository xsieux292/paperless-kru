import type { ReactNode } from 'react';

/**
 * กรอบมือถือสำหรับนำเสนอ — ขนาดจอ 375×812 (iPhone) ตรงกับที่ครูใช้จริง
 * เนื้อหาข้างในถูกจำกัดความกว้างเท่ามือถือจริง เพื่อให้คนดูเชื่อว่านี่คือของจริง
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-[375px] shrink-0">
      <div className="relative h-[812px] overflow-hidden rounded-[2.5rem] border-[10px] border-slate-900 bg-white shadow-2xl">
        {/* notch */}
        <div className="absolute left-1/2 top-0 z-30 h-6 w-36 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
        <div className="relative flex h-full flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

/** แถบสถานะปลอมด้านบนจอ ให้ดูเหมือนมือถือจริงตอนนำเสนอ */
export function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`flex h-8 shrink-0 items-end justify-between px-6 pb-1 text-[11px] font-semibold ${
        dark ? 'text-white' : 'text-slate-900'
      }`}
    >
      <span>09:41</span>
      <span className="flex items-center gap-1">
        <span>••••</span>
        <span>􀙇</span>
        <span>100%</span>
      </span>
    </div>
  );
}
