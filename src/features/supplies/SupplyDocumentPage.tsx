import { useEffect, useMemo } from 'react';
import { ArrowLeft, Download, FileCheck2, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/Button';
import { useSupplyCatalog, useSupplyDocument } from '@/hooks/useSupplyRequisition';
import type { SupplyRoute } from '@/routes';
import { formatThaiDate, LoadingSkeleton, StatePanel } from './SupplyShared';

export function SupplyDocumentPage({ token, onNavigate }: { token: string; onNavigate: (route: SupplyRoute) => void }) {
  const documentQuery = useSupplyDocument(token);
  const catalog = useSupplyCatalog();
  const suppliesById = useMemo(() => new Map((catalog.data ?? []).map((item) => [item.id, item])), [catalog.data]);

  useEffect(() => {
    if (!documentQuery.data) return;
    const previous = window.document.title;
    window.document.title = `ใบเบิกวัสดุ_${documentQuery.data.requisition.requestNumber}`;
    return () => { window.document.title = previous; };
  }, [documentQuery.data]);

  if (documentQuery.isLoading || catalog.isLoading) return <div className="mx-auto max-w-5xl p-6"><LoadingSkeleton cards={2} /></div>;
  if (documentQuery.isError || !documentQuery.data) return <div className="mx-auto max-w-3xl p-6"><StatePanel tone="danger" title="สร้างเอกสารไม่สำเร็จ" description="กรุณาลองสร้างเอกสารอีกครั้ง" actionLabel="ลองอีกครั้ง" onAction={() => void documentQuery.refetch()} /></div>;

  const document = documentQuery.data;
  const requisition = document.requisition;
  const isPending = document.kind === 'pending_review';

  return (
    <div className="min-h-screen bg-slate-100 py-5 print:bg-white print:py-0">
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
        @media print {
          html, body { background: white !important; font-size: 11pt !important; }
          .document-controls { display: none !important; }
          .a4-document { width: auto !important; min-height: auto !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: 0 !important; }
          .avoid-break, .a4-document tr { break-inside: avoid; page-break-inside: avoid; }
          .signature-grid { break-inside: avoid; page-break-inside: avoid; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="document-controls mx-auto mb-4 flex max-w-[210mm] flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => onNavigate(requisition.status === 'ready_for_pickup' ? { name: 'supply-pickup', token } : { name: 'supply-tracking', token })} className="tap-target inline-flex items-center gap-2 rounded-xl px-3 text-base font-bold text-primary-700 hover:bg-white"><ArrowLeft className="h-5 w-5" aria-hidden />กลับไปหน้าคำขอ</button>
        <div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" leftIcon={<Printer className="h-5 w-5" aria-hidden />} onClick={() => window.print()}>พิมพ์เอกสาร</Button><Button leftIcon={<Download className="h-5 w-5" aria-hidden />} onClick={() => window.print()}>ดาวน์โหลด PDF</Button></div>
      </div>

      <article className="a4-document relative mx-auto min-h-[297mm] w-[210mm] max-w-[calc(100%-1rem)] overflow-hidden border border-slate-300 bg-white p-[12mm] text-[12px] leading-relaxed text-slate-950 shadow-xl" aria-label={`${document.template.documentTitle} ${requisition.requestNumber}`}>
        {document.watermark && <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden><span className="-rotate-45 whitespace-nowrap border-4 border-red-200 px-8 py-4 text-3xl font-bold text-red-100">{document.watermark}</span></div>}

        <header className="avoid-break relative border-b-2 border-slate-900 pb-4 text-center">
          <div className="flex items-center justify-center gap-4">
            {document.template.schoolLogoUrl ? <img src={document.template.schoolLogoUrl} alt="ตราโรงเรียน" className="h-16 w-16 object-contain" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-900 text-center text-[10px] font-bold">ตรา<br />โรงเรียน</div>}
            <div><p className="text-lg font-bold">{document.template.schoolName}</p><p>{document.template.schoolAddress}</p><h1 className="mt-2 text-2xl font-bold">{document.template.documentTitle}</h1></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-left sm:grid-cols-4"><DocField label="เลขที่ใบเบิก" value={requisition.requestNumber} /><DocField label="ปีงบประมาณ" value={document.template.fiscalYear} /><DocField label="วันที่" value={formatThaiDate(requisition.createdAt)} /><DocField label="Version" value={document.version} /></div>
        </header>

        <section className="avoid-break relative mt-4" aria-labelledby="document-requester-title">
          <h2 id="document-requester-title" className="border-b border-slate-400 pb-1 text-sm font-bold">ข้อมูลผู้เบิก</h2>
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3"><DocField label="ชื่อ–นามสกุล" value={requisition.teacherProfile.fullName} /><DocField label="รหัสบุคลากร" value={requisition.teacherProfile.personnelId} /><DocField label="ตำแหน่ง" value={requisition.teacherProfile.position} /><DocField label="กลุ่มสาระ/ฝ่าย" value={requisition.teacherProfile.department} /><DocField label="วัตถุประสงค์" value={requisition.purpose} /><DocField label="งานหรือกิจกรรม" value={requisition.activityName} /><DocField label="วันที่ต้องการรับ" value={formatThaiDate(requisition.requestedPickupDate)} /></dl>
        </section>

        <section className="relative mt-4" aria-labelledby="document-items-title">
          <h2 id="document-items-title" className="mb-2 text-sm font-bold">รายการวัสดุ</h2>
          <table className="w-full table-fixed border-collapse text-[10.5px]">
            <thead><tr className="bg-slate-100"><th className="w-[6%] border border-slate-700 p-1.5">ลำดับ</th><th className="w-[13%] border border-slate-700 p-1.5">รหัสวัสดุ</th><th className="w-[29%] border border-slate-700 p-1.5">รายการ</th><th className="w-[10%] border border-slate-700 p-1.5">จำนวนที่ขอ</th><th className="w-[10%] border border-slate-700 p-1.5">หน่วยนับ</th><th className="w-[12%] border border-slate-700 p-1.5">ยืนยันให้</th><th className="w-[20%] border border-slate-700 p-1.5">หมายเหตุ</th></tr></thead>
            <tbody>{requisition.items.map((item, index) => { const supply = item.source === 'catalog' ? suppliesById.get(item.supplyId) : undefined; const replacement = item.source === 'custom' && item.replacementSupplyId ? suppliesById.get(item.replacementSupplyId) : undefined; const name = item.source === 'custom' ? item.customSupply.name : supply?.name ?? item.supplyId; const unit = item.source === 'custom' ? item.customSupply.unit : supply?.unit ?? 'ชิ้น'; const note = item.source === 'custom' ? [`รายการที่ผู้ขอแจ้งเพิ่มเติม`, item.reviewStatus === 'replacement' && replacement ? `เสนอ ${replacement.name} ทดแทน` : '', item.staffNote ?? ''].filter(Boolean).join(' · ') : item.staffNote ?? ''; return <tr key={item.id}><td className="border border-slate-700 p-1.5 text-center">{index + 1}</td><td className="border border-slate-700 p-1.5 text-center">{item.source === 'custom' ? '—' : supply?.code ?? '—'}</td><td className="border border-slate-700 p-1.5 font-semibold">{name}</td><td className="border border-slate-700 p-1.5 text-center">{item.requestedQuantity}</td><td className="border border-slate-700 p-1.5 text-center">{unit}</td><td className="border border-slate-700 p-1.5 text-center">{item.confirmedQuantity ?? '—'}</td><td className="border border-slate-700 p-1.5">{note || '—'}</td></tr>; })}</tbody>
          </table>
        </section>

        <section className="avoid-break relative mt-4 rounded border border-slate-500 p-3" aria-labelledby="document-confirmation-title">
          <h2 id="document-confirmation-title" className="text-sm font-bold">ส่วนการยืนยัน</h2>
          {requisition.otpVerifiedAt ? <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3"><DocField label="การยืนยัน" value="ผู้ขอเบิกยืนยันรายการด้วย OTP" /><DocField label="วันและเวลา" value={formatThaiDate(requisition.otpVerifiedAt, true)} /><DocField label="เลขอ้างอิง OTP" value={requisition.otpReference ?? '—'} /></dl> : <p className="mt-2 font-semibold text-red-700">ยังไม่ได้ยืนยันรายการด้วย OTP</p>}
        </section>

        <section className="signature-grid relative mt-6 grid grid-cols-2 gap-x-6 gap-y-8 text-center sm:grid-cols-3" aria-label="ช่องลงชื่อ">
          {['ผู้ขอเบิก', 'ผู้ตรวจสอบพัสดุ', 'ผู้อนุมัติ', 'ผู้จ่ายวัสดุ', 'ผู้รับวัสดุ'].map((role) => <div key={role} className="pt-7"><div className="border-b border-dotted border-slate-800" /><p className="mt-1">ลงชื่อ {role}</p><p>(........................................................)</p></div>)}
          <div className="pt-7"><div className="border-b border-dotted border-slate-800" /><p className="mt-1">วันที่จ่าย</p><p>........../........../..........</p></div>
        </section>

        <footer className="avoid-break relative mt-6 border-t-2 border-slate-900 pt-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-3"><div className="bg-white p-1"><QRCode value={document.verificationUrl} size={72} level="M" aria-label="QR ตรวจสอบเอกสาร" /></div><div><p className="font-bold">QR ตรวจสอบเอกสาร</p><p>เลขตรวจสอบ: {document.verificationNumber}</p><p>วันที่สร้าง PDF: {formatThaiDate(document.generatedAt, true)}</p><p>หมายเลข Version: {document.version}</p></div></div>
            <FileCheck2 className="h-10 w-10 text-slate-700" aria-hidden />
          </div>
          <p className={`mt-3 border-2 p-2 text-center text-sm font-bold ${isPending ? 'border-red-500 bg-red-50 text-red-800' : 'border-amber-500 bg-amber-50 text-amber-900'}`}>สถานะ: {document.statusLabel}</p>
        </footer>
      </article>
    </div>
  );
}

function DocField({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-semibold text-slate-600">{label}</dt><dd className="font-bold text-slate-950">{value}</dd></div>;
}
