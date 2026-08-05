import { Check, Loader2, Sparkles } from 'lucide-react';
import { getReceiptCategories } from '@/api/catalog.api';
import { DOCUMENT_MODES } from '@/constants/documentModes';
import { useProjects } from '@/hooks/useCatalog';
import type { DocumentDetection } from '@/types';

const baht = (value: number) => value.toLocaleString('th-TH', { minimumFractionDigits: 2 });

/**
 * แถบบอกผลที่ AI อ่านได้จากไฟล์ที่ครูเพิ่งแนบ
 *
 * เป้าหมาย: ครูไม่ต้องมานั่งเลือกบริการ / โครงการ / หมวดเองอีก
 * ระบบเดาให้หมดแล้วตั้งค่าให้เลย เหลือแค่ให้ครูดูว่าถูกไหม
 * ช่องที่ AI ไม่มั่นใจจะขึ้นสีส้มพร้อมบอกเหตุผล
 */
export function AiDetectionBanner({
  detecting,
  detection,
  onUndo,
}: {
  detecting: boolean;
  detection: DocumentDetection | null;
  /** ให้ครูปฏิเสธคำเดาแล้วกลับไปเลือกเองได้ */
  onUndo: () => void;
}) {
  const projects = useProjects();

  if (detecting) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl border-2 border-primary-200 bg-primary-50 p-4">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary-600" aria-hidden />
        <p className="text-base font-semibold text-primary-800">
          AI กำลังดูไฟล์ให้ว่าเป็นงานแบบไหน…
        </p>
      </div>
    );
  }

  if (!detection) return null;

  const modeName = DOCUMENT_MODES[detection.mode.value].title;
  const projectName = projects.data?.find(
    (item) => item.id === detection.projectId?.value,
  )?.name;
  const categoryName = getReceiptCategories().find(
    (item) => item.id === detection.receiptCategory?.value,
  )?.name;

  const uncertain = detection.summary.confidentCount < detection.summary.totalCount;

  return (
    <div
      className={`mb-4 rounded-xl border-2 p-4 ${
        uncertain ? 'border-attention-500 bg-attention-50' : 'border-primary-500 bg-primary-50'
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Sparkles
          className={`h-5 w-5 shrink-0 ${uncertain ? 'text-attention-600' : 'text-primary-600'}`}
          aria-hidden
        />
        <p
          className={`font-display text-base font-bold ${
            uncertain ? 'text-attention-800' : 'text-primary-800'
          }`}
        >
          AI ตั้งค่าให้แล้ว
        </p>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-sm font-bold text-ink ring-1 ring-slate-300">
          {detection.summary.confidentCount}/{detection.summary.totalCount} ชัดเจน
        </span>
      </div>

      <ul className="space-y-1.5 text-base text-ink">
        <Row label="บริการ" value={modeName} certain={detection.mode.confidence === 'high'} reason={detection.mode.reason} />

        {projectName && (
          <Row
            label="โครงการ"
            value={projectName}
            certain={detection.projectId?.confidence === 'high'}
            reason={detection.projectId?.reason}
          />
        )}

        {categoryName && (
          <Row
            label="ประเภท"
            value={categoryName}
            certain={detection.receiptCategory?.confidence === 'high'}
          />
        )}

        {detection.vendor && (
          <Row label="ร้านค้า" value={detection.vendor.value} certain={detection.vendor.confidence === 'high'} />
        )}

        {detection.totalAmount && (
          <Row
            label="ยอดเงิน"
            value={`${baht(detection.totalAmount.value)} บาท`}
            certain={detection.totalAmount.confidence === 'high'}
          />
        )}
      </ul>

      {/* คำนวณ VAT ให้เอง ครูไม่ต้องกดเครื่องคิดเลข */}
      {detection.vatAmount !== undefined && (
        <p className="mt-2 flex items-center gap-1.5 rounded-btn bg-white/70 px-3 py-2 text-sm text-ink">
          <Check className="h-4 w-4 shrink-0 text-primary-600" strokeWidth={3} aria-hidden />
          ยอดนี้รวม VAT 7% แล้ว — คิดเป็นภาษี {baht(detection.vatAmount)} บาท
        </p>
      )}

      <p className="mt-2 text-sm text-ink-light">
        ถ้าไม่ตรง แก้ได้ที่ด้านล่างเลยค่ะ หรือ{' '}
        <button
          type="button"
          onClick={onUndo}
          className="font-bold text-primary-700 underline underline-offset-2"
        >
          เลือกเองทั้งหมด
        </button>
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  certain,
  reason,
}: {
  label: string;
  value: string;
  certain?: boolean;
  reason?: string;
}) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2">
      <span className="shrink-0 text-ink-light">{label}:</span>
      <span className="font-bold text-ink">{value}</span>
      {certain === false && (
        <span className="rounded-full bg-attention-500 px-2 py-0.5 text-xs font-bold text-white">
          AI ไม่แน่ใจ
        </span>
      )}
      {reason && <span className="w-full text-sm text-ink-light">{reason}</span>}
    </li>
  );
}
