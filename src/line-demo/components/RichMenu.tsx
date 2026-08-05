import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  PenLine,
  Sparkles,
  Trophy,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FlowId } from '../journey';

/**
 * Rich Menu จำลอง (สัดส่วนจริง 2500 × 1686 px, 6 ช่อง)
 *
 * ตามกฎใน plan ข้อ 3:
 *   - ช่องซ้ายบน = งานที่ทำบ่อยสุด → พื้นทึบเข้ม ตัวหนังสือขาว
 *   - งานค้าง → จุดส้ม + ตัวเลข มุมขวาบนของช่อง
 *   - ช่องขวาล่าง = ปุ่มสลับแท็บ มีลูกศร ◀ ▶
 *   - เส้นแบ่งช่องหนา 3px เพื่อสื่อว่าแตะได้เป็นช่อง ๆ
 *   - ④ ทุกช่องมีไอคอน + ข้อความ ห้ามไอคอนเดี่ยว
 */

interface Cell {
  icon: LucideIcon;
  label: string;
  /** ช่องเด่น = พื้นทึบเข้ม */
  featured?: boolean;
  /** จำนวนงานค้าง แสดงเป็นจุดส้ม + ตัวเลข */
  badge?: number;
  onTap?: () => void;
}

export interface RichMenuProps {
  tab: FlowId;
  onSwitchTab: (tab: FlowId) => void;
  onTapCamera: () => void;
  onTapPortfolio: () => void;
  onTapUnavailable: (label: string) => void;
  pendingSignatures: number;
  /** พับเมนูเก็บเหมือนใน LINE จริง เพื่อให้เห็นการ์ดในแชทได้เต็ม ๆ */
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function RichMenu({
  tab,
  onSwitchTab,
  onTapCamera,
  onTapPortfolio,
  onTapUnavailable,
  pendingSignatures,
  collapsed,
  onToggleCollapsed,
}: RichMenuProps) {
  const docDoneCells: Cell[] = [
    { icon: Camera, label: 'ถ่ายใบเสร็จ', featured: true, onTap: onTapCamera },
    { icon: FileText, label: 'เบิกงบ / พัสดุ', onTap: () => onTapUnavailable('เบิกงบ / พัสดุ') },
    {
      icon: PenLine,
      label: 'รอฉันเซ็น',
      badge: pendingSignatures,
      onTap: () => onTapUnavailable('รอฉันเซ็น'),
    },
    { icon: FolderOpen, label: 'เอกสารของฉัน', onTap: () => onTapUnavailable('เอกสารของฉัน') },
    { icon: Wallet, label: 'สรุปงบ', onTap: () => onTapUnavailable('สรุปงบ') },
  ];

  const teachGrowCells: Cell[] = [
    { icon: Calendar, label: 'แผนการสอน', featured: true, onTap: () => onTapUnavailable('แผนการสอน') },
    { icon: Trophy, label: 'งานแข่ง / อบรม', onTap: () => onTapUnavailable('งานแข่ง / อบรม') },
    { icon: BarChart3, label: 'ผลนักเรียน', onTap: () => onTapUnavailable('ผลนักเรียน') },
    { icon: FolderOpen, label: 'แฟ้ม ว.PA', onTap: onTapPortfolio },
    { icon: Sparkles, label: 'ถาม AI', onTap: () => onTapUnavailable('ถาม AI') },
  ];

  const cells = tab === 'docdone' ? docDoneCells : teachGrowCells;
  const isDocDone = tab === 'docdone';

  // แถบล่างตอนพับเมนู — เหมือนช่องพิมพ์ข้อความของ LINE
  if (collapsed) {
    return (
      <div className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-10 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-[12px] font-bold text-ink"
        >
          <ChevronUp className="h-4 w-4" aria-hidden />
          เปิดเมนู
          {pendingSignatures > 0 && (
            <span className="ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-attention-500 px-1 text-[11px] font-bold text-white">
              {pendingSignatures}
            </span>
          )}
        </button>
        <div className="h-10 flex-1 rounded-full bg-slate-100 px-4 text-[13px] leading-10 text-ink-mute">
          พิมพ์ข้อความ…
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t-[3px] border-slate-900 bg-slate-900">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex w-full items-center justify-center gap-1 bg-white py-1.5 text-[11px] font-bold text-ink-light"
      >
        <ChevronDown className="h-4 w-4" aria-hidden />
        พับเมนูเก็บ
      </button>
      {/* อัตราส่วน 2500:1686 ของ Rich Menu จริง */}
      <div className="grid aspect-[2500/1686] grid-cols-3 grid-rows-2 gap-[3px]">
        {cells.map((cell) => (
          <RichMenuCell key={cell.label} cell={cell} accent={isDocDone ? 'primary' : 'grow'} />
        ))}

        {/* ช่องที่ 6 = สลับแท็บ */}
        <button
          type="button"
          onClick={() => onSwitchTab(isDocDone ? 'teachgrow' : 'docdone')}
          className={cn(
            'flex flex-col items-center justify-center gap-1 text-center transition-colors',
            isDocDone
              ? 'bg-grow-50 text-grow-700 hover:bg-grow-100'
              : 'bg-primary-50 text-primary-700 hover:bg-primary-100',
          )}
        >
          <span className="flex items-center gap-1 text-[11px] font-bold leading-tight">
            {isDocDone ? (
              <>
                Teach & Grow <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </>
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Doc Done
              </>
            )}
          </span>
          <span className="text-[10px] opacity-70">แตะเพื่อสลับเมนู</span>
        </button>
      </div>
    </div>
  );
}

function RichMenuCell({ cell, accent }: { cell: Cell; accent: 'primary' | 'grow' }) {
  const Icon = cell.icon;
  const featuredBg = accent === 'primary' ? 'bg-primary-700' : 'bg-grow-700';

  return (
    <button
      type="button"
      onClick={cell.onTap}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1.5 px-1 text-center transition-colors',
        cell.featured ? `${featuredBg} text-white` : 'bg-white text-ink hover:bg-slate-50',
      )}
    >
      <Icon className="h-6 w-6" aria-hidden />
      {/* ④ ไอคอนต้องมีข้อความคู่เสมอ */}
      <span className="px-1 text-[11px] font-bold leading-tight">{cell.label}</span>

      {cell.badge !== undefined && cell.badge > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-attention-500 px-1 text-[11px] font-bold text-white">
          {cell.badge > 9 ? '9+' : cell.badge}
        </span>
      )}
    </button>
  );
}
