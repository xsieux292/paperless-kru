import { Camera, Download, MousePointerClick, Phone, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { env } from '@/config/env';

interface HelpStep {
  icon: LucideIcon;
  title: string;
  detail: string;
}

const STEPS: HelpStep[] = [
  {
    icon: MousePointerClick,
    title: '1. เลือกว่าจะให้ AI ช่วยอะไร',
    detail:
      'แตะการ์ดใบใดใบหนึ่งจาก 3 ใบด้านบน ใบที่เลือกอยู่จะเป็นสีเขียวและมีเครื่องหมายถูกค่ะ',
  },
  {
    icon: Camera,
    title: '2. ถ่ายรูปหรือเลือกไฟล์',
    detail:
      'กดปุ่มสีเขียวในขั้นตอนที่ 2 ถ้าอยู่หน้าเอกสารให้ถ่ายรูปได้เลย หรือเลือกไฟล์ที่มีอยู่แล้วในเครื่องก็ได้ค่ะ',
  },
  {
    icon: Send,
    title: '3. กดปุ่มสีเขียวด้านล่างเพื่อส่ง',
    detail:
      'ระบบจะสรุปให้ดูอีกครั้งก่อนส่งจริง ถ้าถูกต้องแล้วกดยืนยัน จากนั้นปิดหน้านี้ไปพักได้เลยค่ะ',
  },
  {
    icon: Download,
    title: 'เสร็จแล้วรับไฟล์อย่างไร?',
    detail:
      'กลับมาที่หน้านี้เมื่อไรก็ได้ ไฟล์ที่ AI ทำเสร็จจะอยู่ในรายการ “งานที่เสร็จแล้ว” ทางขวามือ กดดาวน์โหลดได้เลยค่ะ',
  },
];

export interface HowToUseModalProps {
  open: boolean;
  onClose: () => void;
}

/** คู่มือใช้งานแบบสั้น — ตาม plan ข้อ 8 Onboarding: อ่านจบใน 30 วินาที ไม่ใช่ tutorial ยาว */
export function HowToUseModal({ open, onClose }: HowToUseModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="howto-title" className="max-w-2xl">
      <div className="space-y-5">
        <div>
          <h3 id="howto-title" className="font-display text-heading text-ink">
            วิธีใช้งาน ง่าย ๆ 3 ขั้นตอน
          </h3>
          <p className="mt-1 text-base text-ink-light">ไม่ต้องติดตั้งอะไรเพิ่มค่ะ ทำตามนี้ได้เลย</p>
        </div>

        <ol className="space-y-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display text-base font-bold text-ink">{step.title}</h4>
                  <p className="mt-0.5 text-base leading-relaxed text-ink-light">{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
          <Phone className="mt-0.5 h-5 w-5 shrink-0 text-ink-light" aria-hidden />
          <p className="text-base leading-relaxed text-ink-light">
            ถ้ายังไม่แน่ใจตรงไหน โทรหาฝ่ายไอทีของโรงเรียนได้ที่{' '}
            <a href={`tel:${env.supportPhoneHref}`} className="font-bold text-primary-700 underline">
              {env.supportPhone}
            </a>{' '}
            ได้ตลอดเวลาค่ะ
          </p>
        </div>

        <Button type="button" variant="primary" size="lg" fullWidth onClick={onClose}>
          เข้าใจแล้ว เริ่มส่งเอกสาร
        </Button>
      </div>
    </Modal>
  );
}
