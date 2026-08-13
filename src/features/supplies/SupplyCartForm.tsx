import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Send,
  ShoppingBasket,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField, inputClass, textareaClass } from '@/components/ui/FormField';
import {
  useCreateSupplyRequisition,
  useSupplyCart,
  useSupplyCatalog,
  useSupplyTeacherProfile,
} from '@/hooks/useSupplyRequisition';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/toastContext';
import type { SupplyRoute } from '@/routes';
import type { CustomSupplyRequest } from '@/types/supply';
import { CustomSupplyModal } from './CustomSupplyModal';
import {
  getErrorMessage,
  LoadingSkeleton,
  QuantityStepper,
  StatePanel,
  SupplyImage,
  SupplyPageHeading,
} from './SupplyShared';

type FormValues = {
  purpose: string;
  activityName: string;
  requestedPickupDate: string;
  note: string;
};
type FieldErrors = Partial<Record<keyof FormValues | 'items', string>>;

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const EMPTY_FORM: FormValues = {
  purpose: '',
  activityName: '',
  requestedPickupDate: '',
  note: '',
};

/**
 * วัตถุประสงค์ที่โรงเรียนใช้บ่อย — ให้ครูเลือกแทนการพิมพ์
 *
 * ค่าที่เลือกถูกเก็บลง `values.purpose` เป็นข้อความเหมือนเดิม
 * จึงไม่กระทบ contract ที่ส่งให้ createRequest
 */
const PURPOSE_OPTIONS = [
  'ใช้จัดกิจกรรมการเรียนการสอนในชั้นเรียน',
  'ใช้จัดทำสื่อและอุปกรณ์การสอน',
  'ใช้จัดกิจกรรมหรือโครงการของโรงเรียน',
  'ใช้ในงานธุรการและงานเอกสาร',
  'ใช้ในการวัดผลและประเมินผลผู้เรียน',
  'ใช้ซ่อมแซมและบำรุงรักษาอุปกรณ์',
] as const;

/** ค่าพิเศษของ dropdown ที่เปิดช่องให้พิมพ์เอง */
const PURPOSE_OTHER = 'อื่น ๆ (ระบุเอง)';

export function SupplyCartForm({ onNavigate }: { onNavigate: (route: SupplyRoute) => void }) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [purposeChoice, setPurposeChoice] = useState('');
  const [editingCustom, setEditingCustom] = useState<CustomSupplyRequest | undefined>();
  const submittingRef = useRef(false);
  const { cart, setQuantity, saveCustom, remove, clear } = useSupplyCart();
  const catalog = useSupplyCatalog();
  const profile = useSupplyTeacherProfile();
  const createRequest = useCreateSupplyRequisition();
  const toast = useToast();
  const minimumDate = localDateValue();

  const suppliesById = useMemo(
    () => new Map((catalog.data ?? []).map((item) => [item.id, item])),
    [catalog.data],
  );
  const totalPieces = cart.reduce((sum, item) => sum + item.requestedQuantity, 0);

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const purposeIsOther = purposeChoice === PURPOSE_OTHER;

  /** เลือกจากรายการ = ได้ข้อความทันที · เลือก "อื่น ๆ" = ล้างช่องไว้ให้พิมพ์เอง */
  const handlePurposeChoice = (choice: string) => {
    setPurposeChoice(choice);
    updateField('purpose', choice === PURPOSE_OTHER ? '' : choice);
  };

  const validate = () => {
    const next: FieldErrors = {};
    if (cart.length === 0) next.items = 'กรุณาเลือกวัสดุอย่างน้อย 1 รายการ';
    if (cart.some((item) => item.requestedQuantity <= 0)) next.items = 'จำนวนต้องมากกว่า 0';
    if (!values.purpose.trim()) {
      next.purpose = purposeIsOther
        ? 'กรุณาระบุวัตถุประสงค์ในการใช้งาน'
        : 'กรุณาเลือกวัตถุประสงค์ในการใช้งาน';
    }
    if (!values.activityName.trim()) next.activityName = 'กรุณากรอกชื่องานหรือกิจกรรม';
    if (!values.requestedPickupDate) next.requestedPickupDate = 'กรุณาเลือกวันที่ต้องการรับ';
    else if (values.requestedPickupDate < minimumDate) {
      next.requestedPickupDate = 'วันที่ต้องการรับต้องไม่ย้อนหลัง';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /**
   * ส่งคำขอในปุ่มเดียว — ไม่มี popup ยืนยันซ้ำ
   *
   * หน้านี้แสดงรายการในตะกร้าและข้อมูลผู้ขอครบอยู่แล้ว popup เดิมจึงบอกข้อมูล
   * น้อยกว่าหน้าที่ครูเห็นอยู่ และถ้าส่งผิดยังกดยกเลิกคำขอได้ในหน้าติดตาม
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      toast.warning('กรุณาตรวจสอบข้อมูล', 'ยังมีข้อมูลที่ต้องกรอกหรือแก้ไข');
      return;
    }
    if (submittingRef.current || !profile.data) return;
    submittingRef.current = true;
    try {
      const requisition = await createRequest.mutateAsync({
        teacherProfile: profile.data,
        purpose: values.purpose.trim(),
        activityName: values.activityName.trim(),
        requestedPickupDate: values.requestedPickupDate,
        note: values.note.trim() || undefined,
        items: cart,
      });
      clear();
      toast.success('ส่งคำขอแล้ว', `เลขคำขอ ${requisition.requestNumber}`);
      onNavigate({ name: 'supply-tracking', token: requisition.publicToken });
    } catch (error) {
      toast.error('ส่งคำขอไม่สำเร็จ', getErrorMessage(error, 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      submittingRef.current = false;
    }
  };

  if (catalog.isLoading || profile.isLoading) return <LoadingSkeleton cards={2} />;
  if (catalog.isError || profile.isError || !profile.data) {
    return (
      <StatePanel
        tone="danger"
        title="โหลดข้อมูลตะกร้าไม่สำเร็จ"
        description="ยังไม่สามารถโหลดข้อมูลวัสดุหรือข้อมูลผู้ใช้ที่เข้าสู่ระบบได้"
        actionLabel="โหลดข้อมูลอีกครั้ง"
        onAction={() => {
          void catalog.refetch();
          void profile.refetch();
        }}
      />
    );
  }
  if (cart.length === 0) {
    return (
      <>
        <SupplyPageHeading title="ตะกร้าวัสดุ" description="ตรวจรายการก่อนส่งให้เจ้าหน้าที่ตรวจสอบ" />
        <StatePanel icon={ShoppingBasket} title="ตะกร้ายังว่าง" description="เลือกวัสดุอย่างน้อย 1 รายการ แล้วกลับมาที่หน้านี้" actionLabel="เลือกวัสดุ" onAction={() => onNavigate({ name: 'supply-catalog' })} />
      </>
    );
  }

  return (
    <>
      <button type="button" onClick={() => onNavigate({ name: 'supply-catalog' })} className="tap-target mb-3 inline-flex items-center gap-2 rounded-xl px-2 text-base font-bold text-primary-700 hover:bg-primary-50">
        <ArrowLeft className="h-5 w-5" aria-hidden /> กลับไปเลือกวัสดุ
      </button>
      <SupplyPageHeading title="ตรวจตะกร้าและส่งคำขอ" description="ระบบโหลดข้อมูลผู้ขอจากบัญชีที่เข้าสู่ระบบแล้ว คุณครูไม่ต้องกรอกข้อมูลส่วนตัวซ้ำ" />

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <section className="card h-fit p-4 sm:p-6" aria-labelledby="cart-items-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="cart-items-title" className="font-display text-xl font-bold text-ink">รายการที่เลือก</h2>
            <span className="text-base text-ink-light">{cart.length} รายการ</span>
          </div>
          {errors.items && <p className="mt-2 text-base font-semibold text-danger-700">{errors.items}</p>}
          <ul className="mt-4 divide-y divide-slate-200">
            {cart.map((item) => {
              const supply = item.source === 'catalog' ? suppliesById.get(item.supplyId) : undefined;
              const name = item.source === 'custom' ? item.customSupply.name : supply?.name ?? 'ไม่พบข้อมูลวัสดุ';
              const unit = item.source === 'custom' ? item.customSupply.unit : supply?.unit ?? 'ชิ้น';
              return (
                <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex gap-3">
                    {item.source === 'catalog' && supply ? (
                      <SupplyImage item={supply} className="h-20 w-20 shrink-0 rounded-xl" />
                    ) : item.source === 'custom' && item.customSupply.imageUrl ? (
                      <img src={item.customSupply.imageUrl} alt={`รูปตัวอย่าง ${name}`} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-attention-50 text-attention-700"><ShoppingBasket className="h-7 w-7" aria-hidden /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink">{name}</h3>
                        {item.source === 'custom' && <span className="rounded-full bg-attention-100 px-2.5 py-1 text-sm font-bold text-attention-900">รายการที่แจ้งเพิ่มเติม</span>}
                      </div>
                      <p className="mt-1 text-sm text-ink-light">
                        {item.source === 'catalog' ? `${supply?.code ?? '—'} · หน่วยนับ ${unit}` : item.customSupply.description}
                      </p>
                      {item.source === 'custom' && <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-attention-800"><CheckCircle2 className="h-4 w-4" aria-hidden /> รอเจ้าหน้าที่ตรวจสอบรายการ</p>}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <QuantityStepper label={name} value={item.requestedQuantity} onChange={(next) => setQuantity(item.id, next)} />
                        <div className="flex flex-wrap gap-1">
                          {item.source === 'custom' && (
                            <button type="button" onClick={() => setEditingCustom(item.customSupply)} className="tap-target inline-flex items-center gap-1.5 rounded-xl px-3 text-base font-bold text-primary-700 hover:bg-primary-50"><Edit3 className="h-5 w-5" aria-hidden /> แก้ไข</button>
                          )}
                          <button type="button" onClick={() => remove(item.id)} className="tap-target inline-flex items-center gap-1.5 rounded-xl px-3 text-base font-bold text-danger-700 hover:bg-danger-50"><Trash2 className="h-5 w-5" aria-hidden /> ลบ</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-base"><span className="font-semibold text-ink">รวมทั้งหมด</span><strong className="text-lg text-ink">{totalPieces} ชิ้น</strong></div>
        </section>

        <div className="space-y-6">
          <section className="card p-4 sm:p-6" aria-labelledby="requester-title">
            <div className="flex items-start gap-3">
              <UserCheck className="h-7 w-7 shrink-0 text-primary-600" aria-hidden />
              <div>
                <h2 id="requester-title" className="font-display text-xl font-bold text-ink">ข้อมูลผู้ขอจากบัญชี</h2>
                <p className="mt-1 text-base text-ink-light">โหลดอัตโนมัติจากระบบบุคลากร</p>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 rounded-xl bg-primary-50 p-4 text-base sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <ReadOnlyDetail label="ชื่อ–นามสกุล" value={profile.data.fullName} />
              <ReadOnlyDetail label="รหัสบุคลากร" value={profile.data.personnelId} />
              <ReadOnlyDetail label="ตำแหน่ง" value={profile.data.position} />
              <ReadOnlyDetail label="กลุ่มสาระ/ฝ่าย" value={profile.data.department} />
              <ReadOnlyDetail label="เบอร์โทร" value={profile.data.phone} />
            </dl>
          </section>

          <section className="card p-4 sm:p-6" aria-labelledby="request-purpose-title">
            <h2 id="request-purpose-title" className="font-display text-xl font-bold text-ink">ข้อมูลการใช้งาน</h2>
            <p className="mt-1 text-base text-ink-light">กรอกเฉพาะข้อมูลของคำขอครั้งนี้</p>
            <div className="mt-5 space-y-5">
              <FieldWithError label="วัตถุประสงค์ *" id="purpose" error={errors.purpose}>
                <select id="purpose" value={purposeChoice} onChange={(event) => handlePurposeChoice(event.target.value)} className={cn(inputClass, errors.purpose && 'border-danger-500')}>
                  <option value="">เลือกวัตถุประสงค์</option>
                  {PURPOSE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  <option value={PURPOSE_OTHER}>{PURPOSE_OTHER}</option>
                </select>
                {purposeIsOther && <textarea aria-label="ระบุวัตถุประสงค์ในการใช้งาน" rows={2} value={values.purpose} onChange={(event) => updateField('purpose', event.target.value)} placeholder="ระบุวัตถุประสงค์ในการใช้งาน" className={cn(textareaClass, 'mt-3', errors.purpose && 'border-danger-500')} />}
              </FieldWithError>
              <FieldWithError label="งานหรือกิจกรรม *" id="activity-name" error={errors.activityName}>
                <input id="activity-name" value={values.activityName} onChange={(event) => updateField('activityName', event.target.value)} placeholder="เช่น กิจกรรมวันวิทยาศาสตร์" className={cn(inputClass, errors.activityName && 'border-danger-500')} />
              </FieldWithError>
              <FieldWithError label="วันที่ต้องการรับ *" id="pickup-date" error={errors.requestedPickupDate}>
                <div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-ink-light" aria-hidden /><input id="pickup-date" type="date" min={minimumDate} value={values.requestedPickupDate} onChange={(event) => updateField('requestedPickupDate', event.target.value)} onInput={(event) => updateField('requestedPickupDate', (event.target as HTMLInputElement).value)} className={cn(inputClass, 'pl-11', errors.requestedPickupDate && 'border-danger-500')} /></div>
              </FieldWithError>
              <FormField label="หมายเหตุ" htmlFor="note" optional><textarea id="note" rows={3} value={values.note} onChange={(event) => updateField('note', event.target.value)} className={textareaClass} /></FormField>
            </div>
            <Button type="submit" size="lg" fullWidth className="mt-6" isLoading={createRequest.isPending} loadingText="กำลังส่งคำขอ…" leftIcon={<Send className="h-5 w-5" aria-hidden />}>ส่งคำขอเบิกพัสดุ</Button>
            <p className="mt-3 text-center text-sm text-ink-light">ส่งแล้วยังกดยกเลิกคำขอได้ในหน้าติดตาม</p>
            {createRequest.isError && <p role="alert" className="mt-4 rounded-xl bg-danger-50 p-3 text-base font-semibold text-danger-800">{getErrorMessage(createRequest.error, 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่')}</p>}
          </section>
        </div>
      </form>

      <CustomSupplyModal open={Boolean(editingCustom)} onClose={() => setEditingCustom(undefined)} initialValue={editingCustom} onSave={(value) => {
        if (!editingCustom) return;
        saveCustom(value, editingCustom.id);
        toast.success('บันทึกการแก้ไขแล้ว', value.name);
      }} />

    </>
  );
}

function FieldWithError({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return <FormField label={label} htmlFor={id}>{children}{error && <p role="alert" className="mt-1.5 text-base font-semibold text-danger-700">{error}</p>}</FormField>;
}

function ReadOnlyDetail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-sm font-semibold text-primary-800">{label}</dt><dd className="mt-1 font-bold text-ink">{value}</dd></div>;
}
