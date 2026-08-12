import { ApiError } from '@/api/http';
import {
  addSupplyPublicToken,
  clearSupplyCart,
  getStoredSupplyRequisition,
  getStoredSupplyRequisitions,
  nextSupplyRequestSequence,
  saveStoredSupplyRequisition,
  type StoredSupplyRequisitionRecord,
} from '@/services/supplyStorage';
import type {
  CreateSupplyRequisitionInput,
  Requisition,
  RequisitionItem,
  SendOtpResponse,
  SupplyItem,
  VerifyOtpResponse,
} from '@/types/supply';
import { findMockSupply, mockSupplyItems } from './mockSupplyData';

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

/** ระยะตรวจคงที่ต่อคำขอ และคำนวณซ้ำได้หลัง refresh จากข้อมูลที่ persist */
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
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
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

function normalizeCreateInput(input: CreateSupplyRequisitionInput): CreateSupplyRequisitionInput {
  const requesterName = input.requesterName.trim();
  const department = input.department.trim();
  const phone = input.phone.trim();
  const purpose = input.purpose.trim();
  const requestedPickupDate = input.requestedPickupDate.trim();

  if (!requesterName || !department || !phone || !purpose || !requestedPickupDate) {
    fail(
      400,
      'REQUIRED_FIELDS_MISSING',
      'required requester fields are missing',
      'กรุณากรอกชื่อ กลุ่มสาระ เบอร์โทร วัตถุประสงค์ และวันที่รับให้ครบค่ะ',
    );
  }

  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 9 || phoneDigits.length > 10) {
    fail(
      400,
      'INVALID_PHONE',
      'phone must contain 9 or 10 digits',
      'กรุณาตรวจสอบเบอร์โทรศัพท์ให้ถูกต้องค่ะ',
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedPickupDate)) {
    fail(
      400,
      'INVALID_PICKUP_DATE',
      'invalid pickup date',
      'กรุณาเลือกวันที่รับพัสดุให้ถูกต้องค่ะ',
    );
  }
  if (requestedPickupDate < localDateString(new Date())) {
    fail(
      400,
      'PICKUP_DATE_IN_PAST',
      'pickup date is in the past',
      'วันที่รับพัสดุต้องไม่เป็นวันที่ย้อนหลังค่ะ',
    );
  }

  if (!input.items.length) {
    fail(
      400,
      'EMPTY_CART',
      'at least one item is required',
      'กรุณาเลือกพัสดุอย่างน้อย 1 รายการค่ะ',
    );
  }

  const quantities = new Map<string, number>();
  for (const cartItem of input.items) {
    const supply = findMockSupply(cartItem.supplyId);
    if (!supply || !supply.active) {
      fail(
        400,
        'SUPPLY_NOT_FOUND',
        'unknown supply item',
        'มีพัสดุบางรายการที่ไม่พบ กรุณาตรวจสอบตะกร้าอีกครั้งค่ะ',
      );
    }
    if (supply.availabilityLabel === 'paused') {
      fail(
        409,
        'SUPPLY_PAUSED',
        `supply ${supply.id} is paused`,
        `${supply.name} งดเบิกชั่วคราว กรุณานำออกจากตะกร้าก่อนส่งคำขอค่ะ`,
      );
    }
    if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1 || cartItem.quantity > 99) {
      fail(
        400,
        'INVALID_QUANTITY',
        'quantity must be from 1 to 99',
        'จำนวนพัสดุต้องอยู่ระหว่าง 1–99 ค่ะ',
      );
    }
    quantities.set(cartItem.supplyId, (quantities.get(cartItem.supplyId) ?? 0) + cartItem.quantity);
  }

  const items = [...quantities].map(([supplyId, quantity]) => ({
    supplyId,
    quantity: Math.min(quantity, 99),
  }));

  return {
    requesterName,
    department,
    phone,
    purpose,
    requestedPickupDate,
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    items,
  };
}

function confirmedItems(items: readonly RequisitionItem[]): RequisitionItem[] {
  return items.map((item) => {
    // Demo contract: กรรไกรและรายการทั่วไปยืนยันครบ ส่วนปากกาน้ำเงินจ่ายได้สูงสุด 1 ด้าม
    if (item.supplyId !== 'supply-blue-pen') {
      return { ...item, confirmedQuantity: item.requestedQuantity };
    }

    const confirmedQuantity = Math.min(item.requestedQuantity, 1);
    return {
      ...item,
      confirmedQuantity,
      ...(confirmedQuantity < item.requestedQuantity
        ? { staffNote: 'ปากกาน้ำเงินคงเหลือสำหรับจ่าย 1 ด้าม' }
        : {}),
    };
  });
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
    record = {
      ...record,
      requisition: {
        ...record.requisition,
        status: 'awaiting_confirmation',
        items: confirmedItems(record.requisition.items),
        updatedAt: new Date(nowMs).toISOString(),
      },
    };
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

function recordFor(publicToken: string): StoredSupplyRequisitionRecord {
  const record = getStoredSupplyRequisition(publicToken);
  if (!record) {
    fail(
      404,
      'SUPPLY_REQUISITION_NOT_FOUND',
      'requisition not found',
      'ไม่พบคำขอนี้ หรือคำขอไม่ได้สร้างจากอุปกรณ์เครื่องนี้ค่ะ',
    );
  }
  return advanceRecord(record);
}

function maskedPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 7) return `${digits.slice(0, 2)}X-XXX-${digits.slice(-4)}`;
  return `XXX-XXX-${digits.slice(-4).padStart(4, 'X')}`;
}

function otpResponse(record: StoredSupplyRequisitionRecord): SendOtpResponse {
  const challenge = record.otpChallenge;
  if (!challenge) {
    fail(409, 'OTP_NOT_SENT', 'otp has not been sent', 'กรุณากดส่งรหัส OTP ก่อนค่ะ');
  }
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
    maskedPhone: maskedPhone(record.requisition.phone),
    mockOtp: MOCK_SUPPLY_OTP,
  };
}

function pickupExpiry(requisition: Requisition, verifiedAtMs: number): string {
  // รับได้ถึง 16:30 ของวันที่เลือก แต่ให้เวลาอย่างน้อย 24 ชม. หากยืนยันช้ากว่านั้น
  const requestedDeadline = new Date(`${requisition.requestedPickupDate}T16:30:00`).getTime();
  const minimumDeadline = verifiedAtMs + MINIMUM_PICKUP_VALIDITY_MS;
  return new Date(Math.max(requestedDeadline || 0, minimumDeadline)).toISOString();
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
      requesterName: normalized.requesterName,
      department: normalized.department,
      phone: normalized.phone,
      purpose: normalized.purpose,
      requestedPickupDate: normalized.requestedPickupDate,
      ...(normalized.note ? { note: normalized.note } : {}),
      status: 'pending_stock_check',
      items: normalized.items.map((item) => ({
        supplyId: item.supplyId,
        requestedQuantity: item.quantity,
      })),
      createdAt,
      updatedAt: createdAt,
    };

    saveStoredSupplyRequisition({ requisition });
    addSupplyPublicToken(publicToken);
    clearSupplyCart();
    return clone(requisition);
  },

  async getRequisition(publicToken: string): Promise<Requisition> {
    await delay(MOCK_LATENCY_MS);
    return clone(recordFor(publicToken).requisition);
  },

  async listBrowserRequisitions(): Promise<Requisition[]> {
    await delay(MOCK_LATENCY_MS);
    return getStoredSupplyRequisitions()
      .map((record) => advanceRecord(record).requisition)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((requisition) => clone(requisition));
  },

  async cancelRequisition(publicToken: string): Promise<Requisition> {
    await delay(MOCK_LATENCY_MS);
    const record = recordFor(publicToken);
    if (record.requisition.status === 'cancelled') return clone(record.requisition);
    if (
      !['draft', 'pending_stock_check', 'awaiting_confirmation'].includes(record.requisition.status)
    ) {
      fail(
        409,
        'REQUISITION_CANNOT_BE_CANCELLED',
        `cannot cancel status ${record.requisition.status}`,
        'คำขอนี้ไม่สามารถยกเลิกในสถานะปัจจุบันได้ค่ะ',
      );
    }

    const updated: StoredSupplyRequisitionRecord = {
      ...record,
      requisition: {
        ...record.requisition,
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      },
    };
    saveStoredSupplyRequisition(updated);
    return clone(updated.requisition);
  },

  async sendOtp(publicToken: string): Promise<SendOtpResponse> {
    await delay(MOCK_LATENCY_MS);
    const record = recordFor(publicToken);
    if (record.requisition.status !== 'awaiting_confirmation') {
      fail(
        409,
        'OTP_NOT_AVAILABLE',
        `cannot send otp for status ${record.requisition.status}`,
        'ส่ง OTP ได้เมื่อเจ้าหน้าที่ตรวจพัสดุเรียบร้อยแล้วเท่านั้นค่ะ',
      );
    }

    const nowMs = Date.now();
    const resendAvailableAtMs = record.otpChallenge
      ? new Date(record.otpChallenge.resendAvailableAt).getTime()
      : 0;
    if (Number.isFinite(resendAvailableAtMs) && nowMs < resendAvailableAtMs) {
      const current = otpResponse(record);
      fail(
        429,
        'OTP_RESEND_COOLDOWN',
        'otp resend cooldown is active',
        `กรุณารออีก ${current.resendAfterSeconds} วินาทีก่อนส่งรหัสใหม่ค่ะ`,
        current,
      );
    }

    const sentAt = new Date(nowMs).toISOString();
    const updated: StoredSupplyRequisitionRecord = {
      ...record,
      otpChallenge: {
        sentAt,
        resendAvailableAt: new Date(nowMs + OTP_RESEND_SECONDS * 1_000).toISOString(),
        expiresAt: new Date(nowMs + OTP_VALID_FOR_MS).toISOString(),
        attemptsRemaining: SUPPLY_OTP_MAX_ATTEMPTS,
      },
    };
    saveStoredSupplyRequisition(updated);
    return otpResponse(updated);
  },

  async verifyOtp(publicToken: string, otp: string): Promise<VerifyOtpResponse> {
    await delay(MOCK_LATENCY_MS);
    const record = recordFor(publicToken);
    if (record.requisition.status !== 'awaiting_confirmation') {
      fail(
        409,
        'OTP_NOT_AVAILABLE',
        `cannot verify otp for status ${record.requisition.status}`,
        'คำขอนี้ไม่อยู่ในขั้นตอนยืนยัน OTP ค่ะ',
      );
    }
    if (!record.otpChallenge) {
      fail(409, 'OTP_NOT_SENT', 'otp has not been sent', 'กรุณากดส่งรหัส OTP ก่อนค่ะ');
    }

    const nowMs = Date.now();
    if (nowMs >= new Date(record.otpChallenge.expiresAt).getTime()) {
      fail(410, 'OTP_EXPIRED', 'otp has expired', 'รหัส OTP หมดอายุแล้ว กรุณาส่งรหัสใหม่ค่ะ');
    }
    if (record.otpChallenge.attemptsRemaining <= 0) {
      fail(
        429,
        'OTP_ATTEMPTS_EXCEEDED',
        'otp attempts exceeded',
        'ลองรหัส OTP ครบจำนวนแล้ว กรุณาส่งรหัสใหม่ค่ะ',
        { attemptsRemaining: 0 },
      );
    }

    if (otp.trim() !== MOCK_SUPPLY_OTP) {
      const attemptsRemaining = record.otpChallenge.attemptsRemaining - 1;
      const updated: StoredSupplyRequisitionRecord = {
        ...record,
        otpChallenge: { ...record.otpChallenge, attemptsRemaining },
      };
      saveStoredSupplyRequisition(updated);
      fail(
        attemptsRemaining > 0 ? 400 : 429,
        attemptsRemaining > 0 ? 'OTP_INVALID' : 'OTP_ATTEMPTS_EXCEEDED',
        'invalid otp',
        attemptsRemaining > 0
          ? `รหัส OTP ไม่ถูกต้อง เหลือลองได้อีก ${attemptsRemaining} ครั้งค่ะ`
          : 'ลองรหัส OTP ครบจำนวนแล้ว กรุณาส่งรหัสใหม่ค่ะ',
        { attemptsRemaining },
      );
    }

    const verifiedAt = new Date(nowMs).toISOString();
    const pickupToken = `pickup_${randomHex(20)}`;
    const pickupExpiresAt = pickupExpiry(record.requisition, nowMs);
    const updated: StoredSupplyRequisitionRecord = {
      requisition: {
        ...record.requisition,
        status: 'ready_for_pickup',
        otpVerifiedAt: verifiedAt,
        pickupToken,
        pickupExpiresAt,
        updatedAt: verifiedAt,
      },
      otpChallenge: record.otpChallenge,
    };
    saveStoredSupplyRequisition(updated);

    return {
      requisition: clone(updated.requisition),
      pickupToken,
      pickupExpiresAt,
    };
  },
};
