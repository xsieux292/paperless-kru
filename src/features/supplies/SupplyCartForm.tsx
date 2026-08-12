import { useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, CalendarDays, Send, ShoppingBasket, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField, inputClass, textareaClass } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { useCreateSupplyRequisition, useSupplyCart, useSupplyCatalog } from '@/hooks/useSupplyRequisition';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/toastContext';
import type { SupplyRoute } from '@/routes';
import type { CreateSupplyRequisitionInput } from '@/types/supply';
import {
  formatThaiDate,
  getErrorMessage,
  LoadingSkeleton,
  QuantityStepper,
  StatePanel,
  SupplyImage,
  SupplyPageHeading,
} from './SupplyShared';

type FormValues = Omit<CreateSupplyRequisitionInput, 'items'>;
type FieldErrors = Partial<Record<keyof FormValues | 'items', string>>;

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const EMPTY_FORM: FormValues = {
  requesterName: '',
  department: '',
  phone: '',
  purpose: '',
  requestedPickupDate: '',
  note: '',
};

export function SupplyCartForm({ onNavigate }: { onNavigate: (route: SupplyRoute) => void }) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submittingRef = useRef(false);
  const { cart, setQuantity, remove, clear } = useSupplyCart();
  const catalog = useSupplyCatalog();
  const createRequest = useCreateSupplyRequisition();
  const toast = useToast();
  const minimumDate = localDateValue();

  const suppliesById = useMemo(
    () => new Map((catalog.data ?? []).map((item) => [item.id, item])),
    [catalog.data],
  );
  const cartDetails = cart.map((cartItem) => ({
    ...cartItem,
    supply: suppliesById.get(cartItem.supplyId),
  }));
  const totalPieces = cart.reduce((sum, item) => sum + item.quantity, 0);

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next: FieldErrors = {};
    if (cart.length === 0) next.items = 'กรุณาเลือกพัสดุอย่างน้อย 1 รายการ';
    if (cart.some((item) => item.quantity <= 0)) next.items = 'จำนวนพัสดุต้องมากกว่า 0';
    if (values.requesterName.trim().length < 2) next.requesterName = 'กรุณากรอกชื่อ–นามสกุล';
    if (!values.department.trim()) next.department = 'กรุณากรอกกลุ่มสาระหรือฝ่าย';
    const phoneDigits = values.phone.replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 10) {
      next.phone = 'กรุณากรอกเบอร์โทรศัพท์ 9–10 หลัก';
    }
    if (!values.purpose.trim()) next.purpose = 'กรุณากรอกวัตถุประสงค์ในการใช้งาน';
    if (!values.requestedPickupDate) next.requestedPickupDate = 'กรุณาเลือกวันที่ต้องการรับ';
    else if (values.requestedPickupDate < minimumDate) {
      next.requestedPickupDate = 'วันที่ต้องการรับต้องไม่ย้อนหลัง';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleReview = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      toast.warning('กรุณาตรวจสอบข้อมูล', 'ยังมีข้อมูลที่ต้องกรอกหรือแก้ไข');
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const requisition = await createRequest.mutateAsync({
        ...values,
        requesterName: values.requesterName.trim(),
        department: values.department.trim(),
        phone: values.phone.trim(),
        purpose: values.purpose.trim(),
        note: values.note?.trim() || undefined,
        items: cart,
      });
      clear();
      setConfirmOpen(false);
      toast.success('ส่งคำขอแล้ว', `เลขคำขอ ${requisition.requestNumber}`);
      onNavigate({ name: 'supply-tracking', token: requisition.publicToken });
    } catch (error) {
      toast.error('ส่งคำขอไม่สำเร็จ', getErrorMessage(error, 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      submittingRef.current = false;
    }
  };

  if (catalog.isLoading) return <LoadingSkeleton cards={2} />;
  if (catalog.isError) {
    return (
      <StatePanel
        tone="danger"
        title="โหลดข้อมูลตะกร้าไม่สำเร็จ"
        description="ยังไม่สามารถแสดงรายละเอียดพัสดุได้ กรุณาลองใหม่อีกครั้ง"
        actionLabel="โหลดข้อมูลอีกครั้ง"
        onAction={() => void catalog.refetch()}
      />
    );
  }
  if (cart.length === 0) {
    return (
      <>
        <SupplyPageHeading
          title="ตะกร้าพัสดุ"
          description="ตรวจรายการและกรอกข้อมูลผู้เบิกก่อนส่งให้เจ้าหน้าที่ตรวจของ"
        />
        <StatePanel
          icon={ShoppingBasket}
          title="ตะกร้ายังว่าง"
          description="เลือกพัสดุอย่างน้อย 1 รายการ แล้วกลับมากรอกข้อมูลผู้เบิกที่หน้านี้"
          actionLabel="เลือกพัสดุ"
          onAction={() => onNavigate({ name: 'supply-catalog' })}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => onNavigate({ name: 'supply-catalog' })}
        className="tap-target mb-3 inline-flex items-center gap-2 rounded-xl px-2 text-base font-bold text-primary-700 hover:bg-primary-50"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
        กลับไปเลือกพัสดุ
      </button>
      <SupplyPageHeading
        title="ตะกร้าและข้อมูลผู้เบิก"
        description="ตรวจจำนวนให้เรียบร้อย ข้อมูลในตะกร้าจะยังอยู่เมื่อย้อนกลับหรือรีเฟรชหน้า"
      />

      <form onSubmit={handleReview} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <section className="card h-fit p-4 sm:p-6" aria-labelledby="cart-items-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="cart-items-title" className="font-display text-xl font-bold text-ink">
              รายการที่เลือก
            </h2>
            <span className="text-base text-ink-light">{cart.length} รายการ</span>
          </div>
          {errors.items && <p className="mt-2 text-base font-semibold text-danger-700">{errors.items}</p>}
          <ul className="mt-4 divide-y divide-slate-200">
            {cartDetails.map(({ supplyId, quantity, supply }) => (
              <li key={supplyId} className="py-4 first:pt-0 last:pb-0">
                <div className="flex gap-3">
                  {supply ? (
                    <SupplyImage item={supply} className="h-20 w-20 shrink-0 rounded-xl" />
                  ) : (
                    <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-ink">{supply?.name ?? 'ไม่พบข้อมูลพัสดุ'}</h3>
                    <p className="mt-1 text-sm text-ink-light">
                      {supply ? `${supply.code} · หน่วยนับ ${supply.unit}` : supplyId}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <QuantityStepper
                        label={supply?.name ?? supplyId}
                        value={quantity}
                        onChange={(next) => {
                          setQuantity(supplyId, next);
                          setErrors((current) => ({ ...current, items: undefined }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => remove(supplyId)}
                        className="tap-target inline-flex items-center gap-1.5 rounded-xl px-3 text-base font-bold text-danger-700 hover:bg-danger-50"
                      >
                        <Trash2 className="h-5 w-5" aria-hidden /> ลบรายการ
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-base">
            <span className="font-semibold text-ink">รวมทั้งหมด</span>
            <strong className="text-lg text-ink">{totalPieces} ชิ้น</strong>
          </div>
        </section>

        <section className="card p-4 sm:p-6" aria-labelledby="requester-title">
          <h2 id="requester-title" className="font-display text-xl font-bold text-ink">
            ข้อมูลผู้เบิก
          </h2>
          <p className="mt-1 text-base text-ink-light">ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอก</p>
          <div className="mt-5 space-y-5">
            <FieldWithError label="ชื่อ–นามสกุล *" id="requester-name" error={errors.requesterName}>
              <input
                id="requester-name"
                autoComplete="name"
                value={values.requesterName}
                onChange={(event) => updateField('requesterName', event.target.value)}
                aria-invalid={Boolean(errors.requesterName)}
                className={cn(inputClass, errors.requesterName && 'border-danger-500')}
              />
            </FieldWithError>
            <FieldWithError label="กลุ่มสาระ/ฝ่าย *" id="department" error={errors.department}>
              <input
                id="department"
                value={values.department}
                onChange={(event) => updateField('department', event.target.value)}
                aria-invalid={Boolean(errors.department)}
                placeholder="เช่น กลุ่มสาระภาษาไทย"
                className={cn(inputClass, errors.department && 'border-danger-500')}
              />
            </FieldWithError>
            <FieldWithError label="เบอร์โทรศัพท์ *" id="phone" error={errors.phone}>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                placeholder="เช่น 081-234-5678"
                className={cn(inputClass, errors.phone && 'border-danger-500')}
              />
            </FieldWithError>
            <FieldWithError label="วัตถุประสงค์ในการใช้งาน *" id="purpose" error={errors.purpose}>
              <textarea
                id="purpose"
                rows={3}
                value={values.purpose}
                onChange={(event) => updateField('purpose', event.target.value)}
                aria-invalid={Boolean(errors.purpose)}
                placeholder="บอกสั้น ๆ ว่านำไปใช้กับงานใด"
                className={cn(textareaClass, errors.purpose && 'border-danger-500')}
              />
            </FieldWithError>
            <FieldWithError label="วันที่ต้องการรับ *" id="pickup-date" error={errors.requestedPickupDate}>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-ink-light" aria-hidden />
                <input
                  id="pickup-date"
                  type="date"
                  min={minimumDate}
                  value={values.requestedPickupDate}
                  onChange={(event) => updateField('requestedPickupDate', event.target.value)}
                  onInput={(event) =>
                    updateField('requestedPickupDate', (event.target as HTMLInputElement).value)
                  }
                  aria-invalid={Boolean(errors.requestedPickupDate)}
                  className={cn(inputClass, 'pl-11', errors.requestedPickupDate && 'border-danger-500')}
                />
              </div>
            </FieldWithError>
            <FormField label="หมายเหตุ" htmlFor="note" optional>
              <textarea
                id="note"
                rows={3}
                value={values.note}
                onChange={(event) => updateField('note', event.target.value)}
                placeholder="รายละเอียดเพิ่มเติมที่อยากแจ้งเจ้าหน้าที่"
                className={textareaClass}
              />
            </FormField>
          </div>
          <Button type="submit" size="lg" fullWidth className="mt-6" leftIcon={<Send className="h-5 w-5" aria-hidden />}>
            ส่งให้เจ้าหน้าที่ตรวจของ
          </Button>
        </section>
      </form>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        dismissible={!createRequest.isPending}
        labelledBy="confirm-request-title"
      >
        <h2 id="confirm-request-title" className="font-display text-2xl font-bold text-ink">
          ยืนยันการส่งคำขอ
        </h2>
        <p className="mt-2 text-base leading-relaxed text-ink-light">
          กรุณาตรวจข้อมูลอีกครั้ง เมื่อส่งแล้วเจ้าหน้าที่จะเริ่มตรวจของ
        </p>
        <dl className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-base">
          <SummaryRow label="ชื่อผู้เบิก" value={values.requesterName} />
          <SummaryRow label="กลุ่มสาระ/ฝ่าย" value={values.department} />
          <SummaryRow label="วันที่ต้องการรับ" value={formatThaiDate(values.requestedPickupDate)} />
          <SummaryRow label="จำนวนรวม" value={`${cart.length} รายการ · ${totalPieces} ชิ้น`} />
        </dl>
        <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 px-4">
          {cartDetails.map(({ supplyId, quantity, supply }) => (
            <li key={supplyId} className="flex items-center justify-between gap-4 py-3 text-base">
              <span className="font-semibold text-ink">{supply?.name ?? supplyId}</span>
              <span className="shrink-0 text-ink-light">{quantity} {supply?.unit ?? 'ชิ้น'}</span>
            </li>
          ))}
        </ul>
        {createRequest.isError && (
          <p role="alert" className="mt-4 rounded-xl bg-danger-50 p-3 text-base font-semibold text-danger-800">
            {getErrorMessage(createRequest.error, 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่')}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" disabled={createRequest.isPending} onClick={() => setConfirmOpen(false)}>
            กลับไปแก้ไข
          </Button>
          <Button
            type="button"
            isLoading={createRequest.isPending}
            loadingText="กำลังส่งคำขอ…"
            leftIcon={<Send className="h-5 w-5" aria-hidden />}
            onClick={() => void handleConfirm()}
          >
            ยืนยันส่งคำขอ
          </Button>
        </div>
      </Modal>
    </>
  );
}

function FieldWithError({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <FormField label={label} htmlFor={id}>
      {children}
      {error && <p id={errorId} className="mt-1.5 text-base font-semibold text-danger-700">{error}</p>}
    </FormField>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3">
      <dt className="text-ink-light">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
