import { CircleHelp, FileText, Sparkles, Wallet } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/cn';
import { ROUTE_LABEL, ROUTE_ORDER, type AppRoute } from '@/routes';
import { FontSizeControl } from './FontSizeControl';

const ROUTE_ICON: Record<AppRoute, typeof FileText> = {
  upload: FileText,
  requisition: Wallet,
};

export interface AppHeaderProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenHelp: () => void;
}

/** แถบด้านบน — ชื่อระบบ เมนูหลัก ปุ่มช่วยเหลือ ปรับขนาดตัวอักษร และข้อมูลผู้ใช้ */
export function AppHeader({ route, onNavigate, onOpenHelp }: AppHeaderProps) {
  const { data: profile, isLoading } = useProfile();

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Sparkles className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-heading leading-tight text-ink">
              KruAssist — ผู้ช่วยงานเอกสารครู
            </h1>
            <p className="truncate text-sm text-ink-light">
              ถ่ายรูป ส่งไฟล์ แล้วให้ AI ทำเอกสารกับบัญชีให้
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <FontSizeControl className="hidden md:flex" />

          <button
            type="button"
            onClick={onOpenHelp}
            className="tap-target flex items-center gap-2 rounded-btn border-2 border-primary-600 px-3 font-display text-base font-bold text-primary-700 transition hover:bg-primary-50"
          >
            <CircleHelp className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">วิธีใช้งาน</span>
          </button>

          <div className="hidden flex-col text-right lg:flex">
            <span className="text-base font-semibold text-ink">
              {isLoading ? 'กำลังโหลด…' : (profile?.fullName ?? 'ผู้ใช้งาน')}
            </span>
            <span className="text-sm text-ink-light">{profile?.schoolName ?? ''}</span>
          </div>

          <div
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary-600 bg-primary-50 text-base font-bold text-primary-700"
          >
            {profile?.initial ?? '…'}
          </div>
        </div>
      </div>

      {/* เมนูหลัก — ทั้ง 2 หน้าอยู่ในกลุ่มงานเอกสาร (Doc Done) เดียวกัน */}
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4 lg:px-6">
          {ROUTE_ORDER.map((item) => {
            const Icon = ROUTE_ICON[item];
            const active = route === item;
            return (
              <button
                key={item}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(item)}
                className={cn(
                  'tap-target flex shrink-0 items-center gap-2 border-b-[3px] px-4 font-display text-base font-bold transition-colors',
                  active
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-ink-light hover:text-ink',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {ROUTE_LABEL[item]}
              </button>
            );
          })}
        </div>
      </div>

      {/* บนจอเล็ก ย้ายปุ่มปรับขนาดตัวอักษรมาไว้แถวล่างเพื่อไม่ให้แถบบนแน่นเกินไป */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 md:hidden">
        <span className="truncate text-sm text-ink-light">{profile?.fullName ?? ''}</span>
        <FontSizeControl />
      </div>
    </nav>
  );
}
