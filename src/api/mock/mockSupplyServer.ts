import { ApiError } from '@/api/http';
import {
  clearSupplyCart,
  getStoredSupplyRequisition,
  getStoredSupplyRequisitions,
  nextSupplyRequestSequence,
  saveStoredSupplyRequisition,
  type StoredSupplyRequisitionRecord,
} from '@/services/supplyStorage';
import type {
  CreateSupplyRequisitionInput,
  DocumentVerification,
  Requisition,
  RequisitionAuditEvent,
  RequisitionAuditEventType,
  RequisitionDocument,
  RequisitionItem,
  SendOtpResponse,
  SupplyItem,
  VerifyOtpResponse,
} from '@/types/supply';
import {
  findMockSupply,
  mockSchoolDocumentTemplate,
  mockSupplyItems,
} from './mockSupplyData';

const MOCK_LATENCY_MS = 220;
const STOCK_CHECK_MIN_MS = 5_000;
const STOCK_CHECK_RANGE_MS = 3_001;
const OTP_RESEND_SECONDS = 60;
const OTP_VALID_FOR_MS = 10 * 60_000;
const MINIMUM_PICKUP_VALIDITY_MS = 24 * 60 * 60_000;

export const MOCK_SUPPLY_OTP = '123456';
export const SUPPLY_OTP_MAX_ATTEMPTS = 5;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function fail(
  status: number,
  code: string,
  message: string,
  friendlyMessage: string,
  details?: unknown,
): never {
  throw new ApiError({ status, code, message, friendlyMessage, details });
}

function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export function getMockStockCheckDelayMs(
  requisition: Pick<Requisition, 'createdAt' | 'publicToken'>,
): number {
  return (
    STOCK_CHECK_MIN_MS +
    (stableHash(`${requisition.createdAt}:${requisition.publicToken}`) % STOCK_CHECK_RANGE_MS)
  );
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function uniquePublicToken(): string {
  let token = '';
  do token = `req_${randomHex(16)}`;
  while (getStoredSupplyRequisition(token));
  return token;
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function event(
  requisition: Requisition,
  type: RequisitionAuditEventType,
  actorType: RequisitionAuditEvent['actorType'],
  actorName: string,
  options: Pick<RequisitionAuditEvent, 'actorId' | 'note' | 'before' | 'after'> = {},
  occurredAt = new Date().toISOString(),
): RequisitionAuditEvent {
  return {
    id: `audit_${randomHex(10)}`,
    requisitionId: requisition.id,
    event: type,
    actorType,
    ...(options.actorId ? { actorId: options.actorId } : {}),
    actorName,
    occurredAt,
    ...(options.note ? { note: options.note } : {}),
    ...(options.before !== undefined ? { before: options.before } : {}),
    ...(options.after !== undefined ? { after: options.after } : {}),
  };
}

function appendAudit(
  record: StoredSupplyRequisitionRecord,
  auditEvent: RequisitionAuditEvent,
): StoredSupplyRequisitionRecord {
  return { ...record, auditEvents: [...record.auditEvents, auditEvent] };
}

function normalizeCreateInput(input: CreateSupplyRequisitionInput): CreateSupplyRequisitionInput {
  const purpose = input.purpose.trim();
  const activityName = input.activityName.trim();
  const requestedPickupDate = input.requestedPickupDate.trim();
  const profile = input.teacherProfile;

  if (!profile.id || !profile.fullName || !profile.department || !profile.phone) {
    fail(400, 'PROFILE_INCOMPLETE', 'teacher profile is incomplete', 'ข้อมูลผู้ใช้ยังไม่ครบ กรุณาติดต่อผู้ดูแลระบบ');
  }
  if (!purpose || !activityName || !requestedPickupDate) {
    fail(400, 'REQUIRED_FIELDS_MISSING', 'request details are missing', 'กรุณากรอกวัตถุประสงค์ งานหรือกิจกรรม และวันที่ต้องการรับให้ครบ');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedPickupDate) || requestedPickupDate < localDateString(new Date())) {
    fail(400, 'INVALID_PICKUP_DATE', 'pickup date is invalid', 'วันที่ต้องการรับต้องไม่ย้อนหลัง');
  }
  if (!input.items.length) {
    fail(400, 'EMPTY_CART', 'at least one item is required', 'กรุณาเลือกวัสดุอย่างน้อย 1 รายการ');
  }

  const items = input.items.map((item): RequisitionItem => {
    if (!Number.isInteger(item.requestedQuantity) || item.requestedQuantity < 1 || item.requestedQuantity > 99) {
      fail(400, 'INVALID_QUANTITY', 'quantity must be from 1 to 99', 'จำนวนวัสดุต้องอยู่ระหว่าง 1-99');
    }
    if (item.source === 'catalog') {
      const supply = findMockSupply(item.supplyId);
      if (!supply?.active) fail(400, 'SUPPLY_NOT_FOUND', 'unknown supply', 'ไม่พบวัสดุบางรายการ');
      if (supply.availabilityLabel === 'paused') {
        fail(409, 'SUPPLY_PAUSED', 'supply is paused', `${supply.name} งดเบิกชั่วคราว`);
      }
      return {
        id: item.id || `catalog:${item.supplyId}`,
        source: 'catalog',
        supplyId: item.supplyId,
        requestedQuantity: item.requestedQuantity,
      };
    }

    const custom = item.customSupply;
    if (!custom.name.trim() || !custom.description.trim() || !custom.unit.trim() || !custom.reason.trim()) {
      fail(400, 'CUSTOM_ITEM_INCOMPLETE', 'custom item is incomplete', 'ข้อมูลรายการที่แจ้งเพิ่มเติมยังไม่ครบ');
    }
    return {
      id: item.id,
      source: 'custom',
      requestedQuantity: item.requestedQuantity,
      reviewStatus: 'pending',
      customSupply: {
        ...custom,
        id: item.id,
        name: custom.name.trim(),
        description: custom.description.trim(),
        quantity: item.requestedQuantity,
        unit: custom.unit.trim(),
        reason: custom.reason.trim(),
        ...(custom.imageUrl?.trim() ? { imageUrl: custom.imageUrl.trim() } : {}),
        ...(custom.referenceUrl?.trim() ? { referenceUrl: custom.referenceUrl.trim() } : {}),
        ...(custom.note?.trim() ? { note: custom.note.trim() } : {}),
      },
    };
  });

  return {
    teacherProfile: clone(profile),
    purpose,
    activityName,
    requestedPickupDate,
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    items,
  };
}

function reviewedItems(items: readonly RequisitionItem[]): RequisitionItem[] {
  let customIndex = 0;
  return items.map((item) => {
    if (item.source === 'catalog') {
      if (item.supplyId !== 'supply-blue-pen') {
        return { ...item, confirmedQuantity: item.requestedQuantity };
      }
      const confirmedQuantity = Math.min(item.requestedQuantity, 1);
      return {
        ...item,
        confirmedQuantity,
        ...(confirmedQuantity < item.requestedQuantity
          ? { staffNote: 'มีสำหรับจ่าย 1 ด้าม' }
          : {}),
      };
    }

    const outcome = customIndex % 3;
    customIndex += 1;
    if (outcome === 0) {
      return {
        ...item,
        reviewStatus: 'confirmed',
        confirmedQuantity: item.requestedQuantity,
        staffNote: 'เจ้าหน้าที่ยืนยันรายการได้',
      };
    }
    if (outcome === 1) {
      return {
        ...item,
        reviewStatus: 'rejected',
        confirmedQuantity: 0,
        staffNote: 'ไม่มีหรือไม่สามารถเบิกได้',
      };
    }
    return {
      ...item,
      reviewStatus: 'replacement',
      replacementSupplyId: 'supply-a4-paper',
      confirmedQuantity: item.requestedQuantity,
      staffNote: 'เจ้าหน้าที่เสนอวัสดุในระบบทดแทน กรุณาตรวจสอบก่อนยืนยัน',
    };
  });
}

function itemLabel(item: RequisitionItem): string {
  if (item.source === 'custom') return item.customSupply.name;
  return findMockSupply(item.supplyId)?.name ?? item.supplyId;
}

function advanceRecord(
  stored: StoredSupplyRequisitionRecord,
  nowMs = Date.now(),
): StoredSupplyRequisitionRecord {
  let record = stored;
  const createdAtMs = new Date(record.requisition.createdAt).getTime();
  if (
    record.requisition.status === 'pending_stock_check' &&
    Number.isFinite(createdAtMs) &&
    nowMs >= createdAtMs + getMockStockCheckDelayMs(record.requisition)
  ) {
    const previousItems = clone(record.requisition.items);
    const items = reviewedItems(record.requisition.items);
    const confirmedTotal = items.reduce((sum, item) => sum + (item.confirmedQuantity ?? 0), 0);
    const occurredAt = new Date(nowMs).toISOString();
    const requisition: Requisition = {
      ...record.requisition,
      status: confirmedTotal > 0 ? 'awaiting_confirmation' : 'rejected',
      items,
      updatedAt: occurredAt,
    };
    record = { ...record, requisition };
    record = appendAudit(
      record,
      event(requisition, 'stock_check_completed', 'staff', 'เจ้าหน้าที่พัสดุ (จำลอง)', {
        note: 'ตรวจรายการและจำนวนวัสดุเรียบร้อย',
      }, occurredAt),
    );
    items.forEach((item, index) => {
      const before = previousItems[index] ?? item;
      if (
        before.requestedQuantity !== item.confirmedQuantity ||
        item.source === 'custom'
      ) {
        record = appendAudit(
          record,
          event(requisition, 'items_changed', 'staff', 'เจ้าหน้าที่พัสดุ (จำลอง)', {
            note: `${itemLabel(item)}: ขอ ${before.requestedQuantity} ยืนยัน ${item.confirmedQuantity ?? 0}`,
            before,
            after: item,
          }, occurredAt),
        );
      }
    });
    saveStoredSupplyRequisition(record);
  }

  const expiryMs = record.requisition.pickupExpiresAt
    ? new Date(record.requisition.pickupExpiresAt).getTime()
    : Number.NaN;
  if (
    record.requisition.status === 'ready_for_pickup' &&
    Number.isFinite(expiryMs) &&
    nowMs >= expiryMs
  ) {
    record = {
      ...record,
      requisition: {
        ...record.requisition,
        status: 'expired',
        updatedAt: new Date(nowMs).toISOString(),
      },
    };
    saveStoredSupplyRequisition(record);
  }
  return record;
}

function recordFor(tokenOrId: string): StoredSupplyRequisitionRecord {
  const stored = getStoredSupplyRequisition(tokenOrId);
  if (!stored) fail(404, 'REQUISITION_NOT_FOUND', 'requisition not found', 'ไม่พบคำขอนี้');
  return advanceRecord(stored);
}

function maskedPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return 'เบอร์ที่ลงทะเบียน';
  return `${digits.slice(0, 2)}X-XXX-${digits.slice(-4)}`;
}

function otpResponse(record: StoredSupplyRequisitionRecord): SendOtpResponse {
  const challenge = record.otpChallenge;
  if (!challenge) fail(409, 'OTP_NOT_SENT', 'otp has not been sent', 'ยังไม่ได้ส่งรหัส OTP');
  return {
    sentAt: challenge.sentAt,
    resendAvailableAt: challenge.resendAvailableAt,
    expiresAt: challenge.expiresAt,
    resendAfterSeconds: Math.max(
      0,
      Math.ceil((new Date(challenge.resendAvailableAt).getTime() - Date.now()) / 1_000),
    ),
    maxAttempts: SUPPLY_OTP_MAX_ATTEMPTS,
    attemptsRemaining: challenge.attemptsRemaining,
    maskedPhone: maskedPhone(record.requisition.teacherProfile.phone),
    mockOtp: MOCK_SUPPLY_OTP,
  };
}

function pickupExpiry(requisition: Requisition, verifiedAtMs: number): string {
  const requestedDeadline = new Date(`${requisition.requestedPickupDate}T16:30:00`).getTime();
  return new Date(
    Math.max(requestedDeadline || 0, verifiedAtMs + MINIMUM_PICKUP_VALIDITY_MS),
  ).toISOString();
}

function verificationNumber(requisition: Requisition): string {
  return `DOC-${requisition.requestNumber.replace('REQ-', '')}-${stableHash(requisition.id)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0')}`;
}

export const mockSupplyServer = {
  async listSupplies(): Promise<SupplyItem[]> {
    await delay(MOCK_LATENCY_MS);
    return mockSupplyItems.filter((item) => item.active).map((item) => clone(item));
  },

  async createRequisition(input: CreateSupplyRequisitionInput): Promise<Requisition> {
    await delay(MOCK_LATENCY_MS * 2);
    const normalized = normalizeCreateInput(input);
    const now = new Date();
    const createdAt = now.toISOString();
    const publicToken = uniquePublicToken();
    const buddhistYear = now.getFullYear() + 543;
    const sequence = nextSupplyRequestSequence(buddhistYear);
    const requisition: Requisition = {
      id: `supply-requisition-${randomHex(10)}`,
      requestNumber: `REQ-${buddhistYear}-${String(sequence).padStart(4, '0')}`,
      publicToken,
      teacherProfile: normalized.teacherProfile,
      purpose: normalized.purpose,
      activityName: normalized.activityName,
      requestedPickupDate: normalized.requestedPickupDate,
      ...(normalized.note ? { note: normalized.note } : {}),
      status: 'pending_stock_check',
      items: normalized.items,
      submittedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    };
    let record: StoredSupplyRequisitionRecord = { requisition, auditEvents: [] };
    record = appendAudit(
      record,
      event(requisition, 'created', 'teacher', requisition.teacherProfile.fullName, {
        actorId: requisition.teacherProfile.id,
        note: 'สร้างคำขอเบิกวัสดุ',
      }, createdAt),
    );
    record = appendAudit(
      record,
      event(requisition, 'submitted', 'teacher', requisition.teacherProfile.fullName, {
        actorId: requisition.teacherProfile.id,
        note: 'ส่งคำขอให้เจ้าหน้าที่ตรวจรายการ',
      }, createdAt),
    );
    saveStoredSupplyRequisition(record);
    clearSupplyCart();
    return clone(requisition);
  },

  async getRequisition(tokenOrId: string): Promise<Requisition> {
    await delay(MOCK_LATENCY_MS);
    return clone(recordFor(tokenOrId).requisition);
  },

  async listMyRequisitions(teacherId: string): Promise<Requisition[]> {
    await delay(MOCK_LATENCY_MS);
    return getStoredSupplyRequisitions()
      .map((record) => advanceRecord(record).requisition)
      .filter((requisition) => requisition.teacherProfile.id === teacherId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((requisition) => clone(requisition));
  },

  async cancelRequisition(tokenOrId: string): Promise<Requisition> {
    await delay(MOCK_LATENCY_MS);
    let record = recordFor(tokenOrId);
    if (record.requisition.status === 'cancelled') return clone(record.requisition);
    if (!['draft', 'pending_stock_check', 'awaiting_confirmation'].includes(record.requisition.status)) {
      fail(409, 'REQUISITION_CANNOT_BE_CANCELLED', 'cannot cancel', 'ไม่สามารถยกเลิกคำขอในสถานะปัจจุบันได้');
    }
    const occurredAt = new Date().toISOString();
    const requisition = { ...record.requisition, status: 'cancelled' as const, updatedAt: occurredAt };
    record = { ...record, requisition };
    record = appendAudit(
      record,
      event(requisition, 'cancelled', 'teacher', requisition.teacherProfile.fullName, {
        actorId: requisition.teacherProfile.id,
        note: 'ยกเลิกคำขอ',
      }, occurredAt),
    );
    saveStoredSupplyRequisition(record);
    return clone(requisition);
  },

  async acceptRequisition(tokenOrId: string): Promise<Requisition> {
    await delay(MOCK_LATENCY_MS);
    let record = recordFor(tokenOrId);
    if (record.requisition.status !== 'awaiting_confirmation') {
      fail(409, 'REQUISITION_NOT_READY', 'cannot accept', 'คำขอยังไม่พร้อมให้ยืนยัน');
    }
    if (record.requisition.teacherAcceptedAt) return clone(record.requisition);
    const occurredAt = new Date().toISOString();
    const requisition = { ...record.requisition, teacherAcceptedAt: occurredAt, updatedAt: occurredAt };
    record = { ...record, requisition };
    record = appendAudit(
      record,
      event(requisition, 'teacher_accepted', 'teacher', requisition.teacherProfile.fullName, {
        actorId: requisition.teacherProfile.id,
        note: 'ยอมรับรายการและจำนวนที่เจ้าหน้าที่ตรวจ',
      }, occurredAt),
    );
    saveStoredSupplyRequisition(record);
    return clone(requisition);
  },

  async sendOtp(tokenOrId: string): Promise<SendOtpResponse> {
    await delay(MOCK_LATENCY_MS);
    let record = recordFor(tokenOrId);
    if (record.requisition.status !== 'awaiting_confirmation' || !record.requisition.teacherAcceptedAt) {
      fail(409, 'OTP_NOT_AVAILABLE', 'otp unavailable', 'กรุณายอมรับรายการก่อนส่ง OTP');
    }
    const nowMs = Date.now();
    const resendAt = record.otpChallenge
      ? new Date(record.otpChallenge.resendAvailableAt).getTime()
      : 0;
    if (Number.isFinite(resendAt) && nowMs < resendAt) {
      const current = otpResponse(record);
      fail(429, 'OTP_RESEND_COOLDOWN', 'otp cooldown', `กรุณารออีก ${current.resendAfterSeconds} วินาที`, current);
    }
    const sentAt = new Date(nowMs).toISOString();
    record = {
      ...record,
      otpChallenge: {
        sentAt,
        resendAvailableAt: new Date(nowMs + OTP_RESEND_SECONDS * 1_000).toISOString(),
        expiresAt: new Date(nowMs + OTP_VALID_FOR_MS).toISOString(),
        attemptsRemaining: SUPPLY_OTP_MAX_ATTEMPTS,
      },
    };
    record = appendAudit(
      record,
      event(record.requisition, 'otp_sent', 'system', 'ระบบ KruAssist', {
        note: `ส่ง OTP ไปยัง ${maskedPhone(record.requisition.teacherProfile.phone)}`,
      }, sentAt),
    );
    saveStoredSupplyRequisition(record);
    return otpResponse(record);
  },

  async verifyOtp(tokenOrId: string, otp: string): Promise<VerifyOtpResponse> {
    await delay(MOCK_LATENCY_MS);
    let record = recordFor(tokenOrId);
    if (record.requisition.status !== 'awaiting_confirmation' || !record.otpChallenge) {
      fail(409, 'OTP_NOT_AVAILABLE', 'otp unavailable', 'ยังไม่สามารถยืนยัน OTP ได้');
    }
    const nowMs = Date.now();
    if (nowMs >= new Date(record.otpChallenge.expiresAt).getTime()) {
      fail(410, 'OTP_EXPIRED', 'otp expired', 'รหัส OTP หมดอายุแล้ว กรุณาส่งรหัสใหม่');
    }
    if (record.otpChallenge.attemptsRemaining <= 0) {
      fail(429, 'OTP_ATTEMPTS_EXCEEDED', 'attempts exceeded', 'ลองรหัส OTP ครบจำนวนแล้ว');
    }
    if (otp.trim() !== MOCK_SUPPLY_OTP) {
      const attemptsRemaining = record.otpChallenge.attemptsRemaining - 1;
      record = { ...record, otpChallenge: { ...record.otpChallenge, attemptsRemaining } };
      saveStoredSupplyRequisition(record);
      fail(
        attemptsRemaining > 0 ? 400 : 429,
        attemptsRemaining > 0 ? 'OTP_INVALID' : 'OTP_ATTEMPTS_EXCEEDED',
        'invalid otp',
        attemptsRemaining > 0 ? `รหัส OTP ไม่ถูกต้อง เหลืออีก ${attemptsRemaining} ครั้ง` : 'ลองรหัส OTP ครบจำนวนแล้ว',
        { attemptsRemaining },
      );
    }
    const verifiedAt = new Date(nowMs).toISOString();
    const pickupToken = `pickup_${randomHex(20)}`;
    const pickupExpiresAt = pickupExpiry(record.requisition, nowMs);
    const otpReference = `OTP-${randomHex(4).toUpperCase()}`;
    const requisition: Requisition = {
      ...record.requisition,
      status: 'ready_for_pickup',
      otpVerifiedAt: verifiedAt,
      otpReference,
      pickupToken,
      pickupExpiresAt,
      updatedAt: verifiedAt,
    };
    record = { ...record, requisition };
    record = appendAudit(record, event(requisition, 'otp_verified', 'system', 'ระบบ KruAssist', { note: `ยืนยัน OTP สำเร็จ อ้างอิง ${otpReference}` }, verifiedAt));
    record = appendAudit(record, event(requisition, 'pickup_qr_created', 'system', 'ระบบ KruAssist', { note: 'สร้าง QR สำหรับตรวจรับพัสดุ' }, verifiedAt));
    saveStoredSupplyRequisition(record);
    return { requisition: clone(requisition), pickupToken, pickupExpiresAt };
  },

  async listAuditEvents(tokenOrId: string): Promise<RequisitionAuditEvent[]> {
    await delay(MOCK_LATENCY_MS);
    return clone(recordFor(tokenOrId).auditEvents);
  },

  async getDocument(tokenOrId: string): Promise<RequisitionDocument> {
    await delay(MOCK_LATENCY_MS);
    let record = recordFor(tokenOrId);
    const generatedAt = new Date().toISOString();
    const kind = record.requisition.status === 'ready_for_pickup' ? 'ready_for_pickup' : 'pending_review';
    const number = verificationNumber(record.requisition);
    const verificationBaseUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/#/เบิกพัสดุ/ตรวจเอกสาร`
        : mockSchoolDocumentTemplate.verificationBaseUrl;
    const document: RequisitionDocument = {
      requisition: clone(record.requisition),
      template: clone(mockSchoolDocumentTemplate),
      kind,
      generatedAt,
      verificationNumber: number,
      verificationUrl: `${verificationBaseUrl}/${encodeURIComponent(record.requisition.publicToken)}`,
      version: mockSchoolDocumentTemplate.version,
      statusLabel:
        kind === 'ready_for_pickup'
          ? 'พร้อมรับพัสดุ - ยังไม่ได้บันทึกการจ่ายวัสดุ'
          : 'ฉบับรอตรวจสอบ - ยังไม่ใช่หลักฐานการจ่ายวัสดุ',
      ...(kind === 'pending_review'
        ? { watermark: 'ฉบับรอตรวจสอบ - ยังไม่ใช่หลักฐานการจ่ายวัสดุ' }
        : {}),
    };
    record = { ...record, documentGeneratedAt: generatedAt };
    record = appendAudit(
      record,
      event(record.requisition, 'document_generated', 'system', 'ระบบ KruAssist', {
        note: kind === 'ready_for_pickup' ? 'สร้างใบเบิกวัสดุ' : 'สร้างใบคำขอฉบับรอตรวจ',
      }, generatedAt),
    );
    saveStoredSupplyRequisition(record);
    return document;
  },

  async verifyDocument(tokenOrId: string): Promise<DocumentVerification> {
    await delay(MOCK_LATENCY_MS);
    const record = recordFor(tokenOrId);
    const generatedAt = record.documentGeneratedAt ?? record.requisition.updatedAt;
    return {
      valid: Boolean(record.documentGeneratedAt),
      verificationNumber: verificationNumber(record.requisition),
      requestNumber: record.requisition.requestNumber,
      status: record.requisition.status,
      version: mockSchoolDocumentTemplate.version,
      generatedAt,
    };
  },
};
