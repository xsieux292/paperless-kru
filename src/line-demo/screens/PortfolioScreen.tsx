import { useState } from 'react';
import { Award, BookOpen, Plus, Sparkles, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * แฟ้มสะสมงาน ว.PA (Flow G)
 * ระบบเก็บผลงานให้เองระหว่างปี — ครูไม่ต้องรวบรวมย้อนหลังตอนใกล้ส่ง
 * แถบความครบถ้วนบอกด้วยว่า "ขาดด้านไหน" ไม่ใช่แค่ตัวเลขเปอร์เซ็นต์
 */

interface PortfolioItem {
  id: string;
  icon: LucideIcon;
  date: string;
  title: string;
  desc: string;
  /** ยังไม่ได้เขียนคำบรรยาย = รอครูลงมือ (ส้ม) */
  needsSummary: boolean;
}

const ITEMS: PortfolioItem[] = [
  {
    id: 'p3',
    icon: Trophy,
    date: '5 ส.ค. 2567',
    title: 'พานักเรียนแข่งขันทักษะวิชาการ',
    desc: 'ได้รับรางวัลเหรียญทอง ระดับเขตพื้นที่การศึกษา',
    needsSummary: true,
  },
  {
    id: 'p2',
    icon: Award,
    date: '12 ก.ค. 2567',
    title: 'อบรมการจัดการเรียนรู้แบบ Active Learning',
    desc: 'อบรมเชิงปฏิบัติการ 2 วัน ณ สพฐ. — เขียนสรุปแล้ว',
    needsSummary: false,
  },
  {
    id: 'p1',
    icon: BookOpen,
    date: '3 ก.ค. 2567',
    title: 'สอนคณิตศาสตร์ ม.2/3 เรื่องสมการเชิงเส้น',
    desc: 'บันทึกการสอนพร้อมผลประเมินหลังเรียน — เขียนสรุปแล้ว',
    needsSummary: false,
  },
];

export function PortfolioScreen() {
  const [writtenIds, setWrittenIds] = useState<string[]>([]);
  const [writingId, setWritingId] = useState<string | null>(null);

  const handleWrite = (id: string) => {
    setWritingId(id);
    window.setTimeout(() => {
      setWrittenIds((current) => [...current, id]);
      setWritingId(null);
    }, 1100);
  };

  const remaining = ITEMS.filter(
    (item) => item.needsSummary && !writtenIds.includes(item.id),
  ).length;
  const completeness = remaining === 0 ? 82 : 68;

  return (
    <div className="space-y-4">
      {/* ความครบถ้วน + บอกว่าขาดด้านไหน */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-end justify-between">
          <span className="font-display text-[14px] font-bold text-ink">
            ความครบถ้วนของแฟ้มปีนี้
          </span>
          <span className="font-display text-[18px] font-bold text-grow-700">{completeness}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-grow-600 transition-[width] duration-700"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <p className="mt-2 text-[12px] text-ink-light">
          {remaining === 0
            ? 'เขียนสรุปครบทุกชิ้นแล้วค่ะ เหลือด้านการพัฒนาตนเองอีก 1 กิจกรรม'
            : `ยังขาดด้านการพัฒนาตนเอง และมีผลงาน ${remaining} ชิ้นที่ยังไม่ได้เขียนสรุป`}
        </p>
      </div>

      <h3 className="font-display text-[15px] font-bold text-ink">ไทม์ไลน์ผลงาน ปี 2567</h3>

      <ol className="relative space-y-3 border-l-2 border-slate-200 pl-5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isWritten = writtenIds.includes(item.id);
          const waiting = item.needsSummary && !isWritten;

          return (
            <li key={item.id} className="relative">
              <span
                aria-hidden
                className={`absolute -left-[30px] flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white ${
                  waiting ? 'border-attention-500 text-attention-600' : 'border-grow-600 text-grow-700'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>

              <div
                className={`rounded-xl border bg-white p-3 ${
                  waiting ? 'border-attention-300' : 'border-slate-200'
                }`}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold text-ink-mute">{item.date}</span>
                  {waiting && (
                    <span className="shrink-0 rounded-full bg-attention-50 px-2 py-0.5 text-[10px] font-bold text-attention-800">
                      รอเขียนสรุป
                    </span>
                  )}
                  {isWritten && (
                    <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-800">
                      AI เขียนให้แล้ว
                    </span>
                  )}
                </div>

                <h4 className="font-display text-[14px] font-bold leading-snug text-ink">
                  {item.title}
                </h4>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink-light">
                  {isWritten
                    ? 'ครูผู้สอนได้นำนักเรียนเข้าร่วมการแข่งขันทักษะทางวิชาการ ระดับเขตพื้นที่การศึกษา และได้รับรางวัลเหรียญทอง อันแสดงถึงผลลัพธ์การจัดการเรียนรู้ที่ส่งเสริมสมรรถนะผู้เรียนอย่างเป็นรูปธรรม'
                    : item.desc}
                </p>

                {waiting && (
                  <button
                    type="button"
                    onClick={() => handleWrite(item.id)}
                    disabled={writingId === item.id}
                    className="mt-2.5 flex h-10 items-center gap-1.5 rounded-btn border-2 border-grow-600 px-3 text-[12px] font-bold text-grow-700 transition active:scale-[0.98] disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    {writingId === item.id ? 'AI กำลังเขียนให้…' : 'ให้ AI ช่วยเขียนสรุป'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className="flex h-btn-sm w-full items-center justify-center gap-2 rounded-btn border-2 border-dashed border-slate-300 text-[14px] font-bold text-ink-light transition hover:bg-white"
      >
        <Plus className="h-5 w-5" aria-hidden />
        เพิ่มผลงานใหม่ด้วยการถ่ายรูป
      </button>
    </div>
  );
}
