import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { DocumentModeConfig } from '@/constants/documentModes';

export interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  mode: DocumentModeConfig;
}

/**
 * ยืนยันว่าส่งสำเร็จ
 * ตาม microcopy plan ข้อ 7: สำเร็จแล้วต้อง "บอกว่าเกิดอะไรต่อ" ไม่ใช่แค่ ✓ เขียว
 */
export function SuccessDialog({ open, onClose, mode }: SuccessDialogProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="success-title" className="max-w-md text-center">
      <div className="space-y-5">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <CheckCircle2 className="h-11 w-11" aria-hidden />
        </div>

        <div>
          <h3 id="success-title" className="mb-2 font-display text-heading text-ink">
            ส่งให้ AI เรียบร้อยแล้วค่ะ
          </h3>
          <p className="text-base leading-relaxed text-ink-light">
            AI กำลัง{mode.shortTitle}ให้อยู่ ใช้เวลาประมาณ 1–2 นาที
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
          <p className="font-display text-base font-bold text-ink">แล้วต้องทำอะไรต่อ?</p>
          <ul className="mt-2 space-y-1.5 text-base leading-relaxed text-ink-light">
            <li>• คุณครูปิดหน้านี้ไปพักได้เลยค่ะ ระบบทำต่อให้เอง</li>
            <li>• กลับมาดูที่กล่อง “สถานะการทำงานของ AI” เมื่อไรก็ได้</li>
            <li>• เสร็จแล้วไฟล์จะไปอยู่ใน “งานที่เสร็จแล้ว” กดดาวน์โหลดได้ทันที</li>
          </ul>
        </div>

        <Button type="button" variant="primary" size="lg" fullWidth onClick={onClose}>
          รับทราบ กลับไปหน้าหลัก
        </Button>
      </div>
    </Modal>
  );
}
