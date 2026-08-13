import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  KeyRound,
  PackageCheck,
  RefreshCw,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import {
  useAcceptSupplyRequest,
  useCancelSupplyRequest,
  useSendSupplyOtp,
  useSupplyCatalog,
  useSupplyRequest,
  useVerifySupplyOtp,
} from '@/hooks/useSupplyRequisition';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/toastContext';
import type { SupplyRoute } from '@/routes';
import type { SendOtpResponse } from '@/types/supply';
import { getErrorMessage, LoadingSkeleton, StatePanel, SupplyPageHeading } from './SupplyShared';

export function SupplyConfirmation({ token, onNavigate }: { token: string; onNavigate: (route: SupplyRoute) => void }) {
  const request = useSupplyRequest(token);
  const catalog = useSupplyCatalog();
  const acceptRequest = useAcceptSupplyRequest(token);
  const sendOtp = useSendSupplyOtp(token);
  const verifyOtp = useVerifySupplyOtp(token);
  const cancelRequest = useCancelSupplyRequest(token);
  const [otpOpen, setOtpOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [otpResponse, setOtpResponse] = useState<SendOtpResponse | null>(null);
  const [otp, setOtp] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = window.setInterval(() => setSecondsRemaining((value) => Math.max(0, value - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, [secondsRemaining]);

  const suppliesById = useMemo(() => new Map((catalog.data ?? []).map((item) => [item.id, item])), [catalog.data]);

  if (request.isLoading || catalog.isLoading) return <LoadingSkeleton cards={2} />;
  if (request.isError || !request.data) return <StatePanel tone="danger" title="โหลดผลตรวจไม่สำเร็จ" description="ยังไม่สามารถเปิดผลตรวจของคำขอนี้ได้" actionLabel="โหลดผลตรวจอีกครั้ง" onAction={() => void request.refetch()} />;
  const requisition = request.data;
  if (requisition.status !== 'awaiting_confirmation') {
    return <StatePanel tone={['cancelled', 'rejected'].includes(requisition.status) ? 'danger' : 'neutral'} title={requisition.status === 'ready_for_pickup' ? 'ยืนยันรายการแล้ว' : 'ยังไม่ถึงขั้นตอนยืนยัน'} description="ดูสถานะล่าสุดได้จากหน้าคำขอของฉัน" actionLabel={requisition.status === 'ready_for_pickup' ? 'เปิด QR รับพัสดุ' : 'ดูคำขอของฉัน'} onAction={() => onNavigate(requisition.status === 'ready_for_pickup' ? { name: 'supply-pickup', token } : { name: 'supply-requests' })} />;
  }

  const requestedTotal = requisition.items.reduce((sum, item) => sum + item.requestedQuantity, 0);
  const confirmedTotal = requisition.items.reduce((sum, item) => sum + (item.confirmedQuantity ?? 0), 0);
  const fallbackMaskedPhone = maskPhone(requisition.teacherProfile.phone);

  /**
   * ยอมรับรายการแล้วส่ง OTP ให้ทันที
   *
   * เดิมครูต้องกดปุ่ม "ส่งรหัส OTP" ใน popup ซ้ำอีกครั้ง ทั้งที่ตรงนั้นไม่มีอะไร
   * ให้ตัดสินใจ จึงรวบเหลือปุ่มเดียว (ถ้าส่งไม่สำเร็จ popup ยังมีปุ่มส่งใหม่ให้)
   */
  const handleAccept = async () => {
    try {
      if (!requisition.teacherAcceptedAt) await acceptRequest.mutateAsync();
      setOtpOpen(true);
      await handleSendOtp();
    } catch (error) {
      toast.error('ยอมรับรายการไม่สำเร็จ', getErrorMessage(error, 'กรุณาลองใหม่อีกครั้ง'));
    }
  };

  const handleSendOtp = async () => {
    try {
      const response = await sendOtp.mutateAsync();
      setOtpResponse(response);
      setSecondsRemaining(response.resendAfterSeconds);
      setAttemptsRemaining(response.attemptsRemaining);
      setOtp('');
      toast.success('ส่งรหัส OTP แล้ว', `ส่งไปยัง ${response.maskedPhone}`);
    } catch (error) {
      toast.error('ส่งรหัส OTP ไม่สำเร็จ', getErrorMessage(error, 'กรุณาลองใหม่อีกครั้ง'));
    }
  };

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      toast.warning('รหัส OTP ไม่ครบ', 'กรุณากรอกตัวเลข 6 หลัก');
      return;
    }
    try {
      await verifyOtp.mutateAsync(otp);
      toast.success('ยืนยันสำเร็จ', 'ระบบสร้าง QR และใบเบิกวัสดุแล้ว');
      setOtpOpen(false);
      onNavigate({ name: 'supply-pickup', token });
    } catch (error) {
      setAttemptsRemaining((current) => (current === null ? null : Math.max(0, current - 1)));
      toast.error('ยืนยัน OTP ไม่สำเร็จ', getErrorMessage(error, 'รหัสไม่ถูกต้องหรือหมดอายุ'));
    }
  };

  const handleCancel = async () => {
    try {
      await cancelRequest.mutateAsync();
      setCancelOpen(false);
      toast.success('ยกเลิกคำขอแล้ว', requisition.requestNumber);
      onNavigate({ name: 'supply-requests' });
    } catch (error) {
      toast.error('ยกเลิกไม่สำเร็จ', getErrorMessage(error, 'กรุณาลองใหม่อีกครั้ง'));
    }
  };

  return (
    <>
      <SupplyPageHeading eyebrow={`คำขอเลขที่ ${requisition.requestNumber}`} title="ตรวจผลและยืนยันรายการ" description="ตรวจจำนวน รายการเพิ่มเติม และรายการทดแทนก่อนยอมรับด้วย OTP" />
      <section className="card overflow-hidden" aria-labelledby="confirmed-items-title">
        <div className="border-b border-slate-200 p-5 sm:p-6"><div className="flex items-center gap-3"><CheckCircle2 className="h-7 w-7 text-primary-600" aria-hidden /><div><h2 id="confirmed-items-title" className="font-display text-xl font-bold text-ink">ผลตรวจจากเจ้าหน้าที่</h2><p className="mt-1 text-base text-ink-light">รายการที่เปลี่ยนจะแสดงคำเตือนและหมายเหตุ</p></div></div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left text-base">
            <thead className="bg-slate-50 text-ink-light"><tr><th scope="col" className="px-5 py-3 font-semibold">รายการ</th><th scope="col" className="px-4 py-3 text-center font-semibold">จำนวนที่ขอ</th><th scope="col" className="px-4 py-3 text-center font-semibold">ยืนยันได้</th><th scope="col" className="px-5 py-3 font-semibold">ผลตรวจ/หมายเหตุ</th></tr></thead>
            <tbody className="divide-y divide-slate-200">
              {requisition.items.map((item) => {
                const supply = item.source === 'catalog' ? suppliesById.get(item.supplyId) : undefined;
                const replacement = item.source === 'custom' && item.replacementSupplyId ? suppliesById.get(item.replacementSupplyId) : undefined;
                const name = item.source === 'custom' ? item.customSupply.name : supply?.name ?? item.supplyId;
                const unit = item.source === 'custom' ? item.customSupply.unit : supply?.unit ?? 'ชิ้น';
                const confirmed = item.confirmedQuantity ?? 0;
                const changed = confirmed !== item.requestedQuantity || item.source === 'custom';
                return (
                  <tr key={item.id} className={changed ? 'bg-attention-50/60' : 'bg-white'}>
                    <th scope="row" className="px-5 py-4 font-bold text-ink"><span className="flex items-center gap-2">{changed && <AlertTriangle className="h-5 w-5 shrink-0 text-attention-700" aria-label="รายการต้องตรวจสอบ" />}{name}</span>{item.source === 'custom' && <span className="mt-2 inline-flex rounded-full bg-attention-100 px-2.5 py-1 text-sm font-bold text-attention-900">รายการที่แจ้งเพิ่มเติม</span>}</th>
                    <td className="px-4 py-4 text-center text-ink">{item.requestedQuantity} {unit}</td>
                    <td className={cn('px-4 py-4 text-center font-bold', confirmed > 0 ? 'text-primary-800' : 'text-danger-700')}>{confirmed} {unit}</td>
                    <td className="px-5 py-4 text-ink-light"><ResultLabel item={item} replacementName={replacement?.name} />{item.staffNote && <p className="mt-1">{item.staffNote}</p>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 border-t border-slate-200 bg-slate-50 p-5 text-base sm:grid-cols-2 sm:p-6"><p className="rounded-xl bg-white p-4 text-ink">ขอทั้งหมด <strong className="text-xl">{requestedTotal}</strong> ชิ้น</p><p className="rounded-xl bg-primary-50 p-4 text-primary-900">ยืนยันได้ <strong className="text-xl">{confirmedTotal}</strong> ชิ้น</p></div>
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"><Button variant="danger" onClick={() => setCancelOpen(true)} leftIcon={<XCircle className="h-5 w-5" aria-hidden />}>ยกเลิกคำขอ</Button><Button size="lg" isLoading={acceptRequest.isPending || sendOtp.isPending} loadingText="กำลังส่งรหัส OTP…" onClick={() => void handleAccept()} leftIcon={<ShieldCheck className="h-5 w-5" aria-hidden />}>{requisition.teacherAcceptedAt ? 'ขอรหัส OTP เพื่อยืนยัน' : 'ยอมรับและรับรหัส OTP'}</Button></div>

      <Modal open={otpOpen} onClose={() => setOtpOpen(false)} dismissible={!sendOtp.isPending && !verifyOtp.isPending} labelledBy="otp-title">
        <KeyRound className="h-11 w-11 text-primary-600" aria-hidden />
        <h2 id="otp-title" className="mt-3 font-display text-2xl font-bold text-ink">ยืนยันตัวตนด้วย OTP</h2>
        <p className="mt-2 text-base leading-relaxed text-ink-light">ส่งรหัส 6 หลักไปยังเบอร์ {otpResponse?.maskedPhone ?? fallbackMaskedPhone}</p>
        {!otpResponse ? (
          /* ปกติระบบส่งรหัสให้อัตโนมัติแล้ว ส่วนนี้จะเห็นก็ต่อเมื่อส่งไม่สำเร็จ */
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="ghost" disabled={sendOtp.isPending} onClick={() => setOtpOpen(false)}>ยังก่อน</Button><Button isLoading={sendOtp.isPending} loadingText="กำลังส่งรหัส…" leftIcon={<Send className="h-5 w-5" aria-hidden />} onClick={() => void handleSendOtp()}>ส่งรหัสอีกครั้ง</Button></div>
        ) : (
          <form onSubmit={handleVerify} className="mt-5" noValidate>
            {otpResponse.mockOtp && <div className="mb-4 rounded-xl border border-slate-300 bg-slate-100 p-3 text-base text-ink"><FlaskConical className="mr-2 inline h-5 w-5" aria-hidden /><strong>โหมดข้อมูลจำลอง:</strong> OTP คือ <code className="font-mono font-bold">{otpResponse.mockOtp}</code></div>}
            <label htmlFor="supply-otp" className="mb-2 block text-base font-bold text-ink">รหัส OTP 6 หลัก</label>
            <input id="supply-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className={cn(inputClass, 'h-14 text-center font-mono text-2xl font-bold tracking-[0.35em]')} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-light"><span>ลองได้อีก {attemptsRemaining ?? otpResponse.attemptsRemaining} ครั้ง</span><button type="button" disabled={secondsRemaining > 0 || sendOtp.isPending} onClick={() => void handleSendOtp()} className="tap-target inline-flex items-center gap-1 rounded-xl px-2 text-base font-bold text-primary-700 hover:bg-primary-50 disabled:text-ink-mute"><RefreshCw className="h-4 w-4" aria-hidden />{secondsRemaining > 0 ? `ส่งใหม่ได้ใน ${secondsRemaining} วินาที` : 'ส่งรหัสใหม่'}</button></div>
            {verifyOtp.isError && <p role="alert" className="mt-3 rounded-xl bg-danger-50 p-3 text-base font-semibold text-danger-800">{getErrorMessage(verifyOtp.error, 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ')}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" disabled={verifyOtp.isPending} onClick={() => setOtpOpen(false)}>ยังก่อน</Button><Button type="submit" isLoading={verifyOtp.isPending} loadingText="กำลังยืนยัน…" leftIcon={<PackageCheck className="h-5 w-5" aria-hidden />} disabled={otp.length !== 6 || attemptsRemaining === 0}>ยืนยันรหัส OTP</Button></div>
          </form>
        )}
      </Modal>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} dismissible={!cancelRequest.isPending} labelledBy="confirm-cancel-title"><XCircle className="h-11 w-11 text-danger-600" aria-hidden /><h2 id="confirm-cancel-title" className="mt-3 font-display text-2xl font-bold text-ink">ยกเลิกคำขอนี้?</h2><p className="mt-2 text-base text-ink-light">หากต้องการเปลี่ยนรายการ ต้องยกเลิกแล้วสร้างคำขอใหม่</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="ghost" disabled={cancelRequest.isPending} onClick={() => setCancelOpen(false)}>กลับไปตรวจผล</Button><Button variant="danger" isLoading={cancelRequest.isPending} loadingText="กำลังยกเลิก…" onClick={() => void handleCancel()}>ยืนยันยกเลิกคำขอ</Button></div></Modal>
    </>
  );
}

function ResultLabel({ item, replacementName }: { item: import('@/types/supply').RequisitionItem; replacementName?: string }) {
  if (item.source === 'catalog') return <strong className="text-primary-800">ยืนยันรายการได้</strong>;
  if (item.reviewStatus === 'confirmed') return <strong className="text-primary-800">ยืนยันรายการได้</strong>;
  if (item.reviewStatus === 'rejected') return <strong className="text-danger-700">ปฏิเสธรายการ</strong>;
  if (item.reviewStatus === 'replacement') return <strong className="text-attention-900">เสนอรายการทดแทน: {replacementName ?? item.replacementSupplyId}</strong>;
  return <strong className="text-attention-900">รอเจ้าหน้าที่ตรวจสอบรายการ</strong>;
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return 'เบอร์ที่ลงทะเบียน';
  return `${digits.slice(0, 2)}X-XXX-${digits.slice(-4)}`;
}
