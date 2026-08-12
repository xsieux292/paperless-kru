import { env } from '@/config/env';
import {
  addSupplyPublicToken,
  clearSupplyCart as clearStoredCart,
  getSupplyCart as readStoredCart,
  getSupplyPublicTokens,
  getSupplyStorageSnapshot as readStorageSnapshot,
  removeSupplyCartItem as removeStoredCartItem,
  saveSupplyCart,
  setSupplyCartItemQuantity as setStoredCartItemQuantity,
  subscribeToSupplyStorage as subscribeToStoredSupplyData,
} from '@/services/supplyStorage';
import type {
  CartItem,
  CreateSupplyRequisitionInput,
  Requisition,
  SendOtpResponse,
  SupplyItem,
  SupplyStorageSnapshot,
  VerifyOtpResponse,
} from '@/types/supply';
import { endpoints } from './endpoints';
import { http } from './http';
import { mockSupplyServer } from './mock/mockSupplyServer';

/**
 * API boundary ของระบบเบิกพัสดุฝั่งครู
 * UI ต้องเรียกผ่าน module นี้เสมอ ไม่อ่าน localStorage หรือ mock data โดยตรง
 */

export async function fetchSupplies(): Promise<SupplyItem[]> {
  if (env.useMock) return mockSupplyServer.listSupplies();
  return http.get<SupplyItem[]>(endpoints.supplies.list());
}

export function getSupplyCart(): CartItem[] {
  return readStoredCart();
}

export function replaceSupplyCart(cart: readonly CartItem[]): CartItem[] {
  return saveSupplyCart(cart);
}

export function setSupplyCartItemQuantity(supplyId: string, quantity: number): CartItem[] {
  return setStoredCartItemQuantity(supplyId, quantity);
}

export function removeSupplyCartItem(supplyId: string): CartItem[] {
  return removeStoredCartItem(supplyId);
}

export function clearSupplyCart(): void {
  clearStoredCart();
}

export function getSupplyStorageSnapshot(): SupplyStorageSnapshot {
  return readStorageSnapshot();
}

export function subscribeToSupplyStorage(listener: () => void): () => void {
  return subscribeToStoredSupplyData(listener);
}

export async function createSupplyRequisition(
  input: CreateSupplyRequisitionInput,
): Promise<Requisition> {
  if (env.useMock) return mockSupplyServer.createRequisition(input);

  const requisition = await http.post<Requisition>(endpoints.supplyRequisitions.create(), input);
  // Public token index อยู่ใน browser เพราะ flow นี้ไม่มี login
  addSupplyPublicToken(requisition.publicToken);
  clearStoredCart();
  return requisition;
}

export async function fetchSupplyRequisition(publicToken: string): Promise<Requisition> {
  if (env.useMock) return mockSupplyServer.getRequisition(publicToken);
  return http.get<Requisition>(endpoints.supplyRequisitions.publicDetail(publicToken));
}

/**
 * "คำขอของฉัน" อ้างอิงเฉพาะ public token ที่สร้างจาก browser เครื่องนี้
 * ใน real mode จะอ่านรายละเอียดแต่ละ token ผ่าน public API โดยไม่ต้องมี endpoint พิเศษ
 */
export async function fetchMySupplyRequisitions(): Promise<Requisition[]> {
  if (env.useMock) return mockSupplyServer.listBrowserRequisitions();

  const results = await Promise.allSettled(
    getSupplyPublicTokens().map((publicToken) => fetchSupplyRequisition(publicToken)),
  );
  return results
    .filter(
      (result): result is PromiseFulfilledResult<Requisition> => result.status === 'fulfilled',
    )
    .map((result) => result.value)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function cancelSupplyRequisition(publicToken: string): Promise<Requisition> {
  if (env.useMock) return mockSupplyServer.cancelRequisition(publicToken);
  return http.post<Requisition>(endpoints.supplyRequisitions.cancel(publicToken));
}

export async function sendSupplyRequisitionOtp(publicToken: string): Promise<SendOtpResponse> {
  if (env.useMock) {
    const response = await mockSupplyServer.sendOtp(publicToken);
    if (env.isDev) return response;
    // production build อาจยังใช้ mock backend ได้ แต่ต้องไม่เผย OTP ทดสอบใน UI ปกติ
    return {
      sentAt: response.sentAt,
      resendAvailableAt: response.resendAvailableAt,
      expiresAt: response.expiresAt,
      resendAfterSeconds: response.resendAfterSeconds,
      maxAttempts: response.maxAttempts,
      attemptsRemaining: response.attemptsRemaining,
      maskedPhone: response.maskedPhone,
    };
  }
  return http.post<SendOtpResponse>(endpoints.supplyRequisitions.sendOtp(publicToken));
}

export async function verifySupplyRequisitionOtp(
  publicToken: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  if (env.useMock) return mockSupplyServer.verifyOtp(publicToken, otp);
  return http.post<VerifyOtpResponse>(endpoints.supplyRequisitions.verifyOtp(publicToken), { otp });
}
