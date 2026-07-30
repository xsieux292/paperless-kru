import { CircleHelp, Sparkles } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { FontSizeControl } from './FontSizeControl';

export interface AppHeaderProps {
  onOpenHelp: () => void;
}

/** แถบด้านบน — โลโก้ ชื่อระบบ ปุ่มช่วยเหลือ ปรับขนาดตัวอักษร และข้อมูลผู้ใช้ */
export function AppHeader({ onOpenHelp }: AppHeaderProps) {
  const { data: profile, isLoading } = useProfile();

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-auto max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-md">
            <Sparkles className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-prompt text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
              ระบบ AI ช่วยงานครู
            </h1>
            <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
              ทำเอกสาร เติมแบบฟอร์ม และบันทึกบัญชีอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <FontSizeControl className="hidden md:flex" />

          <button
            type="button"
            onClick={onOpenHelp}
            className="tap-target flex items-center gap-2 rounded-2xl border-2 border-primary-200 bg-primary-50 px-3 py-2 font-prompt text-sm font-bold text-primary-700 transition hover:bg-primary-100"
          >
            <CircleHelp className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">วิธีใช้งาน</span>
          </button>

          <div className="hidden flex-col text-right lg:flex">
            <span className="text-sm font-semibold text-slate-800">
              {isLoading ? 'กำลังโหลด…' : (profile?.fullName ?? 'ผู้ใช้งาน')}
            </span>
            <span className="text-xs text-slate-500">{profile?.schoolName ?? ''}</span>
          </div>

          <div
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary-500 bg-slate-100 text-lg font-bold text-primary-700"
          >
            {profile?.initial ?? '…'}
          </div>
        </div>
      </div>

      {/* บนจอเล็ก ย้ายปุ่มปรับขนาดตัวอักษรมาไว้แถวล่างเพื่อไม่ให้แถบบนแน่นเกินไป */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 md:hidden">
        <span className="text-xs font-medium text-slate-500">
          {profile?.fullName ?? ''}
        </span>
        <FontSizeControl />
      </div>
    </nav>
  );
}
