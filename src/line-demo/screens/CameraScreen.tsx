import { Lightbulb } from 'lucide-react';

/**
 * หน้ากล้อง — เปิดขึ้นมาถ่ายได้ทันที ไม่มีหน้าคั่น (Flow A ขั้นที่ 2)
 * มีกรอบไกด์ช่วยวางใบเสร็จ ลดโอกาสที่ OCR อ่านไม่ออกตั้งแต่ต้นทาง
 */
export function CameraScreen({ onShoot }: { onShoot: () => void }) {
  return (
    <div className="relative flex h-full flex-col">
      {/* ภาพจากกล้องจำลอง */}
      <div className="relative flex flex-1 items-center justify-center bg-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900" />

        {/* ใบเสร็จจำลองที่วางอยู่ในกรอบ */}
        <div className="relative z-10 h-[58%] w-[74%] rotate-[-1.5deg] rounded-sm bg-[#f7f4ec] p-3 shadow-2xl">
          <p className="text-center font-mono text-[10px] font-bold text-neutral-700">
            ร้านสหกรณ์โรงเรียนเรียนดีวิทยา
          </p>
          <p className="mt-0.5 text-center font-mono text-[8px] text-neutral-500">
            ใบเสร็จรับเงิน / RECEIPT
          </p>
          <div className="my-2 border-t border-dashed border-neutral-400" />
          {[
            ['กระดาษ A4 5 รีม', '650.00'],
            ['ปากกาเคมี 2 กล่อง', '240.00'],
            ['กระดาษปรู๊ฟ 20 แผ่น', '160.00'],
            ['เทปกาว 4 ม้วน', '200.00'],
          ].map(([name, price]) => (
            <div key={name} className="flex justify-between font-mono text-[8px] text-neutral-600">
              <span>{name}</span>
              <span>{price}</span>
            </div>
          ))}
          <div className="my-2 border-t border-dashed border-neutral-400" />
          <div className="flex justify-between font-mono text-[11px] font-bold text-neutral-800">
            <span>รวมสุทธิ</span>
            <span>1,250.00</span>
          </div>
          <p className="mt-2 text-center font-mono text-[7px] text-neutral-400">
            12 ส.ค. 2567 · 14:32 น.
          </p>
        </div>

        {/* กรอบไกด์ */}
        <div className="pointer-events-none absolute z-20 h-[64%] w-[80%] rounded-lg border-2 border-dashed border-white/80">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white">
            วางใบเสร็จให้อยู่ในกรอบนี้
          </span>
        </div>
      </div>

      {/* คำแนะนำสั้น ๆ + ปุ่มชัตเตอร์ */}
      <div className="shrink-0 bg-black px-4 pb-8 pt-3">
        <p className="mb-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-white/70">
          <Lightbulb className="h-4 w-4 shrink-0" aria-hidden />
          ถ่ายในที่สว่าง จะอ่านตัวเลขได้แม่นขึ้นค่ะ
        </p>
        <button
          type="button"
          onClick={onShoot}
          aria-label="ถ่ายรูปใบเสร็จ"
          className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white/40 transition-transform active:scale-95"
        >
          <span className="h-14 w-14 rounded-full bg-white" />
        </button>
      </div>
    </div>
  );
}
