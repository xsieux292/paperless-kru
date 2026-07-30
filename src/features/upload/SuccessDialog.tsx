import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
}

/** ยืนยันว่าส่งสำเร็จ พร้อมบอกชัด ๆ ว่าคุณครูไม่ต้องทำอะไรต่อแล้ว */
export function SuccessDialog({ open, onClose }: SuccessDialogProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="success-title" className="max-w-md text-center">
      <div className="space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-11 w-11" aria-hidden />
        </div>

        <div>
          <h3 id="success-title" className="mb-2 font-prompt text-2xl font-bold text-slate-900">
            ส่งเอกสารเรียบร้อยแล้วค่ะ!
          </h3>
          <p className="text-base leading-relaxed text-slate-600">
            AI กำลังทำงานให้อยู่ค่ะ คุณครูดูความคืบหน้าได้ที่กล่อง
            <strong className="font-semibold text-slate-800"> “สถานะการทำงานของ AI” </strong>
            ทางด้านขวา และสามารถปิดหน้านี้ไปพักผ่อนได้เลยค่ะ
          </p>
        </div>

        <div className="rounded-2xl bg-sky-50 p-4 text-left text-sm text-sky-800">
          <p className="font-semibold">เมื่อทำเสร็จแล้ว</p>
          <p className="mt-1 leading-relaxed">
            ไฟล์ผลลัพธ์จะไปอยู่ในรายการ “งานที่เสร็จแล้ว” ให้กดปุ่มดาวน์โหลดได้ทันทีค่ะ
          </p>
        </div>

        <Button type="button" variant="secondary" size="lg" fullWidth onClick={onClose}>
          รับทราบ และปิดหน้าต่าง
        </Button>
      </div>
    </Modal>
  );
}
