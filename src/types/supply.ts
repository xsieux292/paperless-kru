/**
 * โดเมน "เบิกพัสดุ" ฝั่งครู
 *
 * แยกจาก Requisition เดิมใน src/types/index.ts โดยตั้งใจ เพราะ Requisition เดิม
 * เป็น flow เบิกงบ/ยืมพัสดุคนละระบบและมีสถานะคนละชุดกัน
 */

export type SupplyAvailability = 'available' | 'low' | 'paused';

export type RequisitionStatus =
  | 'draft'
  | 'pending_stock_check'
  | 'awaiting_confirmation'
  | 'ready_for_pickup'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type SupplyItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  imageUrl?: string;
  unit: string;
  availabilityLabel: SupplyAvailability;
  active: boolean;
};

export type CartItem = {
  supplyId: string;
  quantity: number;
};

export type RequisitionItem = {
  supplyId: string;
  requestedQuantity: number;
  confirmedQuantity?: number;
  staffNote?: string;
};

export type Requisition = {
  id: string;
  requestNumber: string;
  publicToken: string;
  requesterName: string;
  department: string;
  phone: string;
  purpose: string;
  requestedPickupDate: string;
  note?: string;
  status: RequisitionStatus;
  items: RequisitionItem[];
  otpVerifiedAt?: string;
  pickupToken?: string;
  pickupExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

/** Payload ของ POST /requisitions สำหรับ flow เบิกพัสดุ */
export type CreateSupplyRequisitionInput = Pick<
  Requisition,
  'requesterName' | 'department' | 'phone' | 'purpose' | 'requestedPickupDate' | 'note'
> & {
  items: CartItem[];
};

export type SendOtpResponse = {
  sentAt: string;
  resendAvailableAt: string;
  expiresAt: string;
  resendAfterSeconds: number;
  maxAttempts: number;
  attemptsRemaining: number;
  maskedPhone: string;
  /** มีเฉพาะ mock mode เพื่อแสดงในแถบ Mock Mode เท่านั้น */
  mockOtp?: string;
};

export type VerifyOtpInput = {
  otp: string;
};

export type VerifyOtpResponse = {
  requisition: Requisition;
  pickupToken: string;
  pickupExpiresAt: string;
};

/** snapshot ที่เหมาะกับ useSyncExternalStore โดย UI ไม่ต้องแตะ localStorage */
export type SupplyStorageSnapshot = {
  cart: CartItem[];
  publicTokens: string[];
};
