/* eslint-disable react-refresh/only-export-components -- shared primitives and display metadata are intentionally colocated */
import { useState, type ReactNode } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  Package,
  PackageCheck,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toFriendlyMessage } from '@/api/http';
import { cn } from '@/lib/cn';
import type {
  RequisitionStatus,
  SupplyAvailability,
  SupplyItem,
} from '@/types/supply';

export const availabilityContent: Record<
  SupplyAvailability,
  { label: string; className: string; icon: LucideIcon }
> = {
  available: {
    label: 'พร้อมให้ตรวจสอบ',
    className: 'bg-primary-50 text-primary-800',
    icon: CheckCircle2,
  },
  low: {
    label: 'เหลือน้อย',
    className: 'bg-attention-50 text-attention-800',
    icon: AlertTriangle,
  },
  paused: {
    label: 'งดเบิกชั่วคราว',
    className: 'bg-danger-50 text-danger-800',
    icon: Ban,
  },
};

export const statusContent: Record<
  RequisitionStatus,
  { label: string; className: string; icon: LucideIcon }
> = {
  draft: { label: 'ร่าง', className: 'bg-slate-100 text-ink', icon: Clock3 },
  pending_stock_check: {
    label: 'รอเจ้าหน้าที่ตรวจของ',
    className: 'bg-attention-50 text-attention-800',
    icon: Clock3,
  },
  awaiting_confirmation: {
    label: 'รอคุณครูยืนยัน',
    className: 'bg-attention-50 text-attention-800',
    icon: AlertCircle,
  },
  ready_for_pickup: {
    label: 'พร้อมรับของ',
    className: 'bg-primary-50 text-primary-800',
    icon: PackageCheck,
  },
  rejected: {
    label: 'ไม่มีพัสดุ',
    className: 'bg-danger-50 text-danger-800',
    icon: XCircle,
  },
  cancelled: {
    label: 'ยกเลิกแล้ว',
    className: 'bg-danger-50 text-danger-800',
    icon: XCircle,
  },
  expired: {
    label: 'หมดเวลารับ',
    className: 'bg-danger-50 text-danger-800',
    icon: Clock3,
  },
};

export function RequestStatusBadge({ status }: { status: RequisitionStatus }) {
  const content = statusContent[status];
  const Icon = content.icon;
  return (
    <span
      className={cn(
        'inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold',
        content.className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {content.label}
    </span>
  );
}

export function SupplyImage({ item, className }: { item: SupplyItem; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!item.imageUrl || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-primary-50 text-primary-600',
          className,
        )}
        role="img"
        aria-label={`ภาพประกอบ ${item.name}`}
      >
        <Package className="h-9 w-9" aria-hidden />
      </div>
    );
  }
  return (
    <img
      src={item.imageUrl}
      alt={`ภาพ ${item.name}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}

export function QuantityStepper({
  value,
  onChange,
  disabled = false,
  label,
}: {
  value: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-slate-300 bg-white" role="group" aria-label={label}>
      <button
        type="button"
        disabled={disabled || value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="tap-target flex items-center justify-center rounded-l-xl text-xl font-bold text-primary-700 transition hover:bg-primary-50 disabled:text-ink-mute"
        aria-label={`ลดจำนวน ${label}`}
      >
        −
      </button>
      <output
        className="min-w-11 px-1 text-center text-base font-bold tabular-nums text-ink"
        aria-label={`จำนวน ${value}`}
      >
        {value}
      </output>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(value + 1)}
        className="tap-target flex items-center justify-center rounded-r-xl text-xl font-bold text-primary-700 transition hover:bg-primary-50 disabled:text-ink-mute"
        aria-label={`เพิ่มจำนวน ${label}`}
      >
        +
      </button>
    </div>
  );
}

export function LoadingSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="กำลังโหลดข้อมูล" aria-busy="true">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="card animate-pulse overflow-hidden p-4">
          <div className="h-32 rounded-xl bg-slate-200" />
          <div className="mt-4 h-5 w-2/3 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
          <div className="mt-5 h-12 rounded-xl bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function StatePanel({
  icon: Icon = AlertCircle,
  title,
  description,
  actionLabel,
  onAction,
  tone = 'neutral',
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'danger' | 'success';
}) {
  const color = tone === 'danger' ? 'text-danger-600' : tone === 'success' ? 'text-primary-600' : 'text-ink-light';
  return (
    <section className="card mx-auto max-w-2xl px-5 py-10 text-center" role={tone === 'danger' ? 'alert' : undefined}>
      <Icon className={cn('mx-auto h-12 w-12', color)} aria-hidden />
      <h2 className="mt-4 font-display text-xl font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-base leading-relaxed text-ink-light">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-6" leftIcon={<RefreshCw className="h-5 w-5" aria-hidden />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </section>
  );
}

export function SupplyPageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="mb-6 rounded-2xl bg-primary-700 px-5 py-6 text-white shadow-sm sm:px-7 sm:py-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && <p className="mb-1 text-sm font-bold text-primary-100">{eyebrow}</p>}
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-primary-50">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}

export function formatThaiDate(value: string, includeTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    ...(includeTime ? { timeStyle: 'short' as const } : {}),
  }).format(date);
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (!error) return fallback;
  return toFriendlyMessage(error) || fallback;
}
