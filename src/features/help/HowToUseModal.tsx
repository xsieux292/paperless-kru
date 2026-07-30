import { Camera, Download, MousePointerClick, Phone, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { env } from '@/config/env';

interface HelpStep {
  icon: LucideIcon;
  title: string;
  detail: string;
  color: string;
}

const STEPS: HelpStep[] = [
  {
    icon: MousePointerClick,
    title: '1. เลือกว่าจะให้ AI ช่วยอะไร',
    detail:
      'กดที่การ์ดใบใดใบหนึ่งจาก 3 ใบด้านบน การ์ดที่เลือกอยู่จะมีกรอบสีและเครื่องหมายถูกสีเขียวค่ะ',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Camera,
    title: '2. ส่งไฟล์หรือถ่ายรูป',
    detail:
      'กด “เลือกไฟล์ในเครื่อง” ถ้ามีไฟล์อยู่แล้ว หรือกด “ถ่ายรูปใหม่” ถ้าใช้มือถือถ่ายเอกสารตรงนั้นเลยค่ะ',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Send,
    title: '3. กดปุ่มสีเขียวเพื่อส่ง',
    detail:
      'ระบบจะสรุปให้ดูอีกครั้งก่อนส่งจริง ถ้าถูกต้องแล้วกดยืนยัน จากนั้นปิดหน้านี้ไปพักได้เลยค่ะ',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Download,
    title: 'เสร็จแล้วรับไฟล์อย่างไร?',
    detail:
      'กลับมาที่หน้านี้เมื่อไรก็ได้ ไฟล์ที่ AI ทำเสร็จจะอยู่ในรายการ “งานที่เสร็จแล้ว” ทางขวามือ กดดาวน์โหลดได้เลยค่ะ',
    color: 'bg-amber-100 text-amber-600',
  },
];

export interface HowToUseModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * คู่มือใช้งานแบบสั้น เปิดจากปุ่ม "วิธีใช้งาน" ที่แถบบน
 * เพิ่มใหม่จาก HTML เดิม เพื่อให้คุณครูที่ไม่ถนัดเทคโนโลยีเริ่มต้นได้ด้วยตัวเอง
 */
export function HowToUseModal({ open, onClose }: HowToUseModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="howto-title" className="max-w-2xl">
      <div className="space-y-6">
        <div>
          <h3 id="howto-title" className="font-prompt text-2xl font-bold text-slate-900">
            วิธีใช้งาน ง่าย ๆ 3 ขั้นตอน
          </h3>
          <p className="mt-1 text-base text-slate-600">
            ไม่ต้องติดตั้งอะไรเพิ่มค่ะ ทำตามนี้ได้เลย
          </p>
        </div>

        <ol className="space-y-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${step.color}`}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h4 className="font-prompt text-base font-bold text-slate-900">{step.title}</h4>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex items-start gap-3 rounded-2xl border-2 border-sky-200 bg-sky-50 p-4 text-sky-900">
          <Phone className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden />
          <p className="text-sm leading-relaxed">
            ถ้ายังไม่แน่ใจตรงไหน โทรหาฝ่ายไอทีของโรงเรียนได้ที่{' '}
            <a href={`tel:${env.supportPhoneHref}`} className="font-bold underline">
              {env.supportPhone}
            </a>{' '}
            ได้ตลอดเวลาค่ะ
          </p>
        </div>

        <Button type="button" variant="primary" size="lg" fullWidth onClick={onClose}>
          เข้าใจแล้ว เริ่มใช้งาน
        </Button>
      </div>
    </Modal>
  );
}
