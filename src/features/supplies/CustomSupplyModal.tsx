import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Link, PackagePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField, inputClass, textareaClass } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import type { CustomSupplyRequest } from '@/types/supply';

export type CustomSupplyDraft = Omit<CustomSupplyRequest, 'id'>;

const EMPTY_DRAFT: CustomSupplyDraft = {
  name: '',
  description: '',
  quantity: 1,
  unit: '',
  reason: '',
  imageUrl: '',
  referenceUrl: '',
  note: '',
};

type FieldName = 'name' | 'description' | 'quantity' | 'unit' | 'reason' | 'referenceUrl';
type Errors = Partial<Record<FieldName, string>>;

export function CustomSupplyModal({
  open,
  onClose,
  onSave,
  initialValue,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (value: CustomSupplyDraft) => void;
  initialValue?: CustomSupplyRequest;
}) {
  const [values, setValues] = useState<CustomSupplyDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Errors>({});
  const [readingImage, setReadingImage] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(initialValue ? { ...initialValue } : EMPTY_DRAFT);
    setErrors({});
  }, [initialValue, open]);

  const update = <K extends keyof CustomSupplyDraft>(field: K, value: CustomSupplyDraft[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, referenceUrl: 'กรุณาเลือกไฟล์รูปภาพ' }));
      return;
    }
    setReadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      update('imageUrl', typeof reader.result === 'string' ? reader.result : '');
      setReadingImage(false);
    };
    reader.onerror = () => setReadingImage(false);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const next: Errors = {};
    if (!values.name.trim()) next.name = 'กรุณากรอกชื่อวัสดุ';
    if (!values.description.trim()) next.description = 'กรุณากรอกรายละเอียดหรือลักษณะของวัสดุ';
    if (!Number.isInteger(values.quantity) || values.quantity < 1 || values.quantity > 99) {
      next.quantity = 'จำนวนต้องอยู่ระหว่าง 1-99';
    }
    if (!values.unit.trim()) next.unit = 'กรุณากรอกหน่วยนับ';
    if (!values.reason.trim()) next.reason = 'กรุณากรอกเหตุผลที่ต้องการใช้';
    if (values.referenceUrl?.trim()) {
      try {
        const url = new URL(values.referenceUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid');
      } catch {
        next.referenceUrl = 'กรุณากรอกลิงก์ http:// หรือ https:// ที่ถูกต้อง';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    onSave({
      name: values.name.trim(),
      description: values.description.trim(),
      quantity: values.quantity,
      unit: values.unit.trim(),
      reason: values.reason.trim(),
      ...(values.imageUrl ? { imageUrl: values.imageUrl } : {}),
      ...(values.referenceUrl?.trim() ? { referenceUrl: values.referenceUrl.trim() } : {}),
      ...(values.note?.trim() ? { note: values.note.trim() } : {}),
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="custom-supply-title">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <PackagePlus className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 id="custom-supply-title" className="font-display text-2xl font-bold text-ink">
            {initialValue ? 'แก้ไขรายการที่แจ้งเพิ่มเติม' : 'เพิ่มของที่ไม่มีในรายการ'}
          </h2>
          <p className="mt-1 text-base leading-relaxed text-ink-light">
            รายการนี้ยังไม่ใช่วัสดุในระบบ และจะรอเจ้าหน้าที่ตรวจสอบก่อนยืนยัน
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="ชื่อวัสดุที่ต้องการ *" id="custom-name" error={errors.name}>
          <input id="custom-name" value={values.name} onChange={(event) => update('name', event.target.value)} placeholder="เช่น กระดาษสติกเกอร์ A4" className={cn(inputClass, errors.name && 'border-danger-500')} />
        </Field>
        <Field label="รายละเอียด/ลักษณะของวัสดุ *" id="custom-description" error={errors.description}>
          <textarea id="custom-description" rows={3} value={values.description} onChange={(event) => update('description', event.target.value)} placeholder="เช่น สีขาว แบบด้าน สำหรับเครื่องพิมพ์อิงก์เจ็ต" className={cn(textareaClass, errors.description && 'border-danger-500')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="จำนวน *" id="custom-quantity" error={errors.quantity}>
            <input id="custom-quantity" type="number" inputMode="numeric" min={1} max={99} value={values.quantity} onChange={(event) => update('quantity', Number(event.target.value))} className={cn(inputClass, errors.quantity && 'border-danger-500')} />
          </Field>
          <Field label="หน่วยนับ *" id="custom-unit" error={errors.unit}>
            <input id="custom-unit" value={values.unit} onChange={(event) => update('unit', event.target.value)} placeholder="เช่น แพ็ก" className={cn(inputClass, errors.unit && 'border-danger-500')} />
          </Field>
        </div>
        <Field label="เหตุผลที่ต้องการใช้ *" id="custom-reason" error={errors.reason}>
          <textarea id="custom-reason" rows={3} value={values.reason} onChange={(event) => update('reason', event.target.value)} placeholder="เช่น ใช้ทำป้ายชื่อกิจกรรมวันวิทยาศาสตร์" className={cn(textareaClass, errors.reason && 'border-danger-500')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="รูปตัวอย่าง" htmlFor="custom-image" optional>
            {values.imageUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-slate-200">
                <img src={values.imageUrl} alt="รูปตัวอย่างวัสดุ" className="h-32 w-full object-cover" />
                <button type="button" onClick={() => update('imageUrl', '')} className="tap-target absolute right-1 top-1 inline-flex items-center rounded-xl bg-white/95 px-3 text-base font-bold text-danger-700 shadow" aria-label="ลบรูปตัวอย่าง">
                  <Trash2 className="h-5 w-5" aria-hidden />
                </button>
              </div>
            ) : (
              <label htmlFor="custom-image" className="tap-target flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 text-base font-bold text-primary-700 hover:bg-primary-50">
                <ImagePlus className="h-5 w-5" aria-hidden /> {readingImage ? 'กำลังอ่านรูป…' : 'เลือกรูปภาพ'}
              </label>
            )}
            <input id="custom-image" type="file" accept="image/*" onChange={handleImage} className="sr-only" />
          </FormField>
          <Field label="ลิงก์ตัวอย่าง" id="custom-reference" error={errors.referenceUrl} optional>
            <div className="relative">
              <Link className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-ink-light" aria-hidden />
              <input id="custom-reference" type="url" value={values.referenceUrl} onChange={(event) => update('referenceUrl', event.target.value)} placeholder="https://…" className={cn(inputClass, 'pl-11', errors.referenceUrl && 'border-danger-500')} />
            </div>
          </Field>
        </div>
        <FormField label="หมายเหตุ" htmlFor="custom-note" optional>
          <textarea id="custom-note" rows={2} value={values.note} onChange={(event) => update('note', event.target.value)} className={textareaClass} />
        </FormField>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button type="submit" leftIcon={<PackagePlus className="h-5 w-5" aria-hidden />}>
            {initialValue ? 'บันทึกการแก้ไข' : 'เพิ่มลงตะกร้า'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  id,
  error,
  optional = false,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <FormField label={label} htmlFor={id} optional={optional}>
      {children}
      {error && <p role="alert" className="mt-1.5 text-base font-semibold text-danger-700">{error}</p>}
    </FormField>
  );
}
