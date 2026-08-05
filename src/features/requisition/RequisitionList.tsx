import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileWarning,
  Inbox,
  PackageOpen,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toFriendlyMessage } from '@/api/http';
import { useRequisitions } from '@/hooks/useRequisitions';
import { cn } from '@/lib/cn';
import { formatRelativeThai } from '@/lib/format';
import type { Requisition, RequisitionStatus } from '@/types';

const formatBaht = (value: number) => value.toLocaleString('th-TH');

/**
 * สถานะ = สี + ไอคอน + ข้อความ (ไม่พึ่งสีอย่างเดียว ตาม plan ข้อ 6)
 * ส้ม = รอครูลงมือ · เขียว = เรียบร้อย · แดง = ต้องแก้ · เทา = ยังไม่ถึงตา
 */
const STATUS_META: Record<
  RequisitionStatus,
  { label: string; icon: typeof Clock; box: string; text: string }
> = {
  draft: {
    label: 'ร่างไว้ ยังไม่ได้ส่ง',
    icon: ClipboardList,
    box: 'bg-attention-50 text-attention-800 ring-attention-300',
    text: 'text-attention-800',
  },
  pending: {
    label: 'รอผู้อนุมัติเซ็น',
    icon: Clock,
    box: 'bg-slate-100 text-ink ring-slate-300',
    text: 'text-ink-light',
  },
  approved: {
    label: 'อนุมัติแล้ว',
    icon: CheckCircle2,
    box: 'bg-primary-50 text-primary-800 ring-primary-300',
    text: 'text-primary-800',
  },
  returned: {
    label: 'ถูกตีกลับ ต้องแก้',
    icon: FileWarning,
    box: 'bg-danger-50 text-danger-700 ring-danger-300',
    text: 'text-danger-700',
  },
};

type FilterId = 'all' | RequisitionStatus;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'pending', label: 'รออนุมัติ' },
  { id: 'approved', label: 'อนุมัติแล้ว' },
  { id: 'returned', label: 'ถูกตีกลับ' },
];

/** รายการใบเบิกของครูคนนี้ (Flow D "เอกสารของฉัน" เวอร์ชันเว็บ) */
export function RequisitionList() {
  const { data, isLoading, isError, error, refetch } = useRequisitions();
  const [filter, setFilter] = useState<FilterId>('all');

  const items = (data ?? []).filter((item) => filter === 'all' || item.status === filter);
  const returnedCount = (data ?? []).filter((item) => item.status === 'returned').length;

  return (
    <div className="card p-5">
      <h3 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-ink">
        <ClipboardList className="h-5 w-5 shrink-0 text-primary-700" aria-hidden />
        ใบเบิกของฉัน
      </h3>
      <p className="mb-3 text-sm text-ink-light">ติดตามได้ว่าเรื่องถึงไหนแล้ว</p>

      {/* เตือนงานที่รอครูก่อนอย่างอื่น */}
      {returnedCount > 0 && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border-2 border-attention-500 bg-attention-50 p-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-attention-600" aria-hidden />
          <p className="text-base text-ink">
            มี {returnedCount} ใบที่ถูกตีกลับ รอคุณครูแก้แล้วส่งใหม่ค่ะ
          </p>
        </div>
      )}

      <div role="group" aria-label="กรองตามสถานะ" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={cn(
              'rounded-full border-2 px-3 py-1.5 text-sm font-bold transition-colors',
              filter === item.id
                ? 'border-primary-600 bg-primary-50 text-primary-800'
                : 'border-slate-300 bg-white text-ink-light hover:border-slate-400',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2" aria-hidden>
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border-2 border-danger-300 bg-danger-50 p-4">
          <p className="text-base font-bold text-danger-700">ยังโหลดรายการใบเบิกไม่ได้</p>
          <p className="mt-0.5 text-base text-ink">{toFriendlyMessage(error)}</p>
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            className="mt-3"
            onClick={() => void refetch()}
          >
            ลองโหลดใหม่อีกครั้ง
          </Button>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
          <Inbox className="mx-auto mb-2 h-8 w-8 text-ink-mute" aria-hidden />
          <p className="text-base font-semibold text-ink">
            {filter === 'all' ? 'ยังไม่มีใบเบิกค่ะ 🎉' : 'ไม่มีใบเบิกในสถานะนี้ค่ะ'}
          </p>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((requisition) => (
            <RequisitionCard key={requisition.id} requisition={requisition} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RequisitionCard({ requisition }: { requisition: Requisition }) {
  const meta = STATUS_META[requisition.status];
  const StatusIcon = meta.icon;
  const KindIcon = requisition.kind === 'budget' ? Wallet : PackageOpen;

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold ring-1',
            meta.box,
          )}
        >
          <StatusIcon className="h-4 w-4 shrink-0" aria-hidden />
          {meta.label}
        </span>
        <span className="shrink-0 text-sm text-ink-light">
          {formatRelativeThai(requisition.createdAt)}
        </span>
      </div>

      <p className="font-display text-base font-bold text-ink">{requisition.purpose}</p>

      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-light">
        <KindIcon className="h-4 w-4 shrink-0" aria-hidden />
        {requisition.kind === 'budget' ? 'เบิกงบซื้อของ' : 'ยืมพัสดุ'} · {requisition.docNo}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm text-ink-light">
          {requisition.projectName}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm text-ink-light">
          ต้องใช้ {requisition.neededBy}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm text-ink-light">
          {requisition.items.length} รายการ
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-200 pt-3">
        <span className="text-sm text-ink-light">ผู้อนุมัติ: {requisition.approverName}</span>
        {requisition.kind === 'budget' && (
          <span className="font-display text-money text-primary-700">
            {formatBaht(requisition.totalAmount)} บาท
          </span>
        )}
      </div>

      {requisition.status === 'returned' && requisition.returnedReason && (
        <div className="mt-3 rounded-xl border-2 border-danger-300 bg-danger-50 p-3">
          <p className="text-sm font-bold text-danger-700">เหตุผลที่ตีกลับ</p>
          <p className="mt-0.5 text-base text-ink">{requisition.returnedReason}</p>
        </div>
      )}
    </li>
  );
}
