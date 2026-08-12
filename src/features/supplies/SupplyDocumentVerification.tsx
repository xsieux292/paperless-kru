import { CheckCircle2, FileSearch, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useVerifySupplyDocument } from '@/hooks/useSupplyRequisition';
import type { SupplyRoute } from '@/routes';
import { formatThaiDate, LoadingSkeleton, StatePanel, SupplyPageHeading } from './SupplyShared';

export function SupplyDocumentVerification({ token, onNavigate }: { token: string; onNavigate: (route: SupplyRoute) => void }) {
  const verification = useVerifySupplyDocument(token);
  if (verification.isLoading) return <LoadingSkeleton cards={1} />;
  if (verification.isError || !verification.data) return <StatePanel tone="danger" icon={XCircle} title="ตรวจสอบเอกสารไม่สำเร็จ" description="ไม่พบเลขตรวจสอบนี้ หรือเอกสารยังไม่ถูกสร้าง" actionLabel="กลับหน้าเบิกวัสดุ" onAction={() => onNavigate({ name: 'supply-catalog' })} />;
  const result = verification.data;
  return (
    <>
      <SupplyPageHeading title="ตรวจสอบเอกสาร" description="หน้านี้แสดงเฉพาะข้อมูลที่จำเป็นสำหรับตรวจความถูกต้องของเอกสาร" />
      <section className="card mx-auto max-w-2xl p-6 text-center sm:p-8" aria-live="polite">
        {result.valid ? <CheckCircle2 className="mx-auto h-16 w-16 text-primary-600" aria-hidden /> : <FileSearch className="mx-auto h-16 w-16 text-attention-700" aria-hidden />}
        <h2 className="mt-4 font-display text-2xl font-bold text-ink">{result.valid ? 'เอกสารถูกต้องในระบบ' : 'ยังไม่พบเอกสารที่สร้าง'}</h2>
        <p className="mt-2 text-base text-ink-light">ผลตรวจจาก Mock API โดยไม่เปิดเผยข้อมูลส่วนตัวของผู้ขอ</p>
        <dl className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-left text-base"><Row label="เลขตรวจสอบ" value={result.verificationNumber} /><Row label="เลขคำขอ" value={result.requestNumber} /><Row label="Version" value={result.version} /><Row label="สร้างล่าสุด" value={formatThaiDate(result.generatedAt, true)} /></dl>
        <div className="mt-5 flex gap-3 rounded-xl bg-primary-50 p-4 text-left text-base text-primary-900"><ShieldCheck className="h-6 w-6 shrink-0" aria-hidden /><p>QR นี้ใช้ตรวจสอบเอกสารเท่านั้น ไม่ใช่หลักฐานว่ามีการจ่ายวัสดุแล้ว</p></div>
        <Button fullWidth className="mt-6" onClick={() => onNavigate({ name: 'supply-catalog' })}>กลับหน้าเบิกวัสดุ</Button>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[7rem_1fr] gap-3"><dt className="text-ink-light">{label}</dt><dd className="break-all font-bold text-ink">{value}</dd></div>;
}
