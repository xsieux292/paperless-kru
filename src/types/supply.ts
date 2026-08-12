/** โดเมนระบบเบิกวัสดุฝั่งครู แยกจาก flow เบิกงบเดิม */

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

export type CustomSupplyRequest = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  reason: string;
  imageUrl?: string;
  referenceUrl?: string;
  note?: string;
};

export type CustomSupplyReviewStatus = 'pending' | 'confirmed' | 'rejected' | 'replacement';

export type RequisitionItem =
  | {
      id: string;
      source: 'catalog';
      supplyId: string;
      requestedQuantity: number;
      confirmedQuantity?: number;
      staffNote?: string;
    }
  | {
      id: string;
      source: 'custom';
      customSupply: CustomSupplyRequest;
      requestedQuantity: number;
      confirmedQuantity?: number;
      staffNote?: string;
      replacementSupplyId?: string;
      reviewStatus?: CustomSupplyReviewStatus;
    };

/** ตะกร้าใช้ชนิดเดียวกับรายการคำขอ แต่ยังไม่มีผลตรวจจากเจ้าหน้าที่ */
export type CartItem = RequisitionItem;

export type RequisitionRequester = {
  id: string;
  fullName: string;
  personnelId: string;
  position: string;
  department: string;
  phone: string;
  schoolName: string;
};

export type Requisition = {
  id: string;
  requestNumber: string;
  publicToken: string;
  teacherProfile: RequisitionRequester;
  purpose: string;
  activityName: string;
  requestedPickupDate: string;
  note?: string;
  status: RequisitionStatus;
  items: RequisitionItem[];
  submittedAt: string;
  teacherAcceptedAt?: string;
  otpVerifiedAt?: string;
  otpReference?: string;
  pickupToken?: string;
  pickupExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupplyRequisitionInput = {
  teacherProfile: RequisitionRequester;
  purpose: string;
  activityName: string;
  requestedPickupDate: string;
  note?: string;
  items: CartItem[];
};

export type RequisitionAuditEventType =
  | 'created'
  | 'submitted'
  | 'stock_check_completed'
  | 'items_changed'
  | 'teacher_accepted'
  | 'otp_sent'
  | 'otp_verified'
  | 'pickup_qr_created'
  | 'cancelled'
  | 'document_generated';

export type RequisitionAuditEvent = {
  id: string;
  requisitionId: string;
  event: RequisitionAuditEventType;
  actorType: 'teacher' | 'staff' | 'system';
  actorId?: string;
  actorName: string;
  occurredAt: string;
  note?: string;
  before?: unknown;
  after?: unknown;
};

export type SchoolDocumentTemplate = {
  schoolName: string;
  schoolAddress: string;
  schoolLogoUrl?: string;
  fiscalYear: string;
  documentTitle: string;
  verificationBaseUrl: string;
  version: string;
};

export type RequisitionDocument = {
  requisition: Requisition;
  template: SchoolDocumentTemplate;
  kind: 'pending_review' | 'ready_for_pickup';
  generatedAt: string;
  verificationNumber: string;
  verificationUrl: string;
  version: string;
  statusLabel: string;
  watermark?: string;
};

export type DocumentVerification = {
  valid: boolean;
  verificationNumber: string;
  requestNumber: string;
  status: RequisitionStatus;
  version: string;
  generatedAt: string;
};

export type SendOtpResponse = {
  sentAt: string;
  resendAvailableAt: string;
  expiresAt: string;
  resendAfterSeconds: number;
  maxAttempts: number;
  attemptsRemaining: number;
  maskedPhone: string;
  mockOtp?: string;
};

export type VerifyOtpResponse = {
  requisition: Requisition;
  pickupToken: string;
  pickupExpiresAt: string;
};

export type SupplyStorageSnapshot = {
  cart: CartItem[];
};
