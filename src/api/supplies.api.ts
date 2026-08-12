import { env } from '@/config/env';
import { fetchProfile } from '@/api/profile.api';
import {
  addCustomSupplyCartItem as addStoredCustomItem,
  clearSupplyCart as clearStoredCart,
  getSupplyCart as readStoredCart,
  removeSupplyCartItem as removeStoredCartItem,
  saveSupplyCart,
  setCatalogCartItemQuantity as setStoredCatalogQuantity,
  setSupplyCartItemQuantity as setStoredItemQuantity,
  subscribeToSupplyStorage as subscribeToStoredSupplyData,
} from '@/services/supplyStorage';
import type {
  CartItem,
  CreateSupplyRequisitionInput,
  CustomSupplyRequest,
  DocumentVerification,
  Requisition,
  RequisitionAuditEvent,
  RequisitionDocument,
  RequisitionRequester,
  SendOtpResponse,
  SupplyItem,
  VerifyOtpResponse,
} from '@/types/supply';
import { endpoints } from './endpoints';
import { http } from './http';
import { mockSupplyServer } from './mock/mockSupplyServer';

/** UI ติดต่อโดเมนเบิกวัสดุผ่าน module นี้เท่านั้น */
export async function fetchSupplyTeacherProfile(): Promise<RequisitionRequester> {
  const profile = await fetchProfile();
  return {
    id: profile.id,
    fullName: profile.fullName,
    personnelId: profile.personnelId ?? 'ไม่ระบุ',
    position: profile.position ?? 'ครู',
    department: profile.department ?? 'ไม่ระบุกลุ่มสาระ/ฝ่าย',
    phone: profile.phone ?? 'ไม่ระบุ',
    schoolName: profile.schoolName,
  };
}

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

export function setCatalogCartItemQuantity(supplyId: string, quantity: number): CartItem[] {
  return setStoredCatalogQuantity(supplyId, quantity);
}

export function setSupplyCartItemQuantity(itemId: string, quantity: number): CartItem[] {
  return setStoredItemQuantity(itemId, quantity);
}

function customId(): string {
  if (globalThis.crypto?.randomUUID) return `custom:${globalThis.crypto.randomUUID()}`;
  return `custom:${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function addCustomSupplyToCart(
  input: Omit<CustomSupplyRequest, 'id'>,
  existingId?: string,
): CartItem[] {
  const id = existingId ?? customId();
  const item: CartItem = {
    id,
    source: 'custom',
    requestedQuantity: input.quantity,
    reviewStatus: 'pending',
    customSupply: { ...input, id },
  };
  return addStoredCustomItem(item);
}

export function removeSupplyCartItem(itemId: string): CartItem[] {
  return removeStoredCartItem(itemId);
}

export function clearSupplyCart(): void {
  clearStoredCart();
}

export function subscribeToSupplyStorage(listener: () => void): () => void {
  return subscribeToStoredSupplyData(listener);
}

export async function createSupplyRequisition(
  input: CreateSupplyRequisitionInput,
): Promise<Requisition> {
  if (env.useMock) return mockSupplyServer.createRequisition(input);
  const requisition = await http.post<Requisition>(endpoints.supplyRequisitions.create(), input);
  clearStoredCart();
  return requisition;
}

export async function fetchSupplyRequisition(id: string): Promise<Requisition> {
  if (env.useMock) return mockSupplyServer.getRequisition(id);
  return http.get<Requisition>(endpoints.supplyRequisitions.detail(id));
}

export async function fetchMySupplyRequisitions(): Promise<Requisition[]> {
  if (env.useMock) {
    const profile = await fetchSupplyTeacherProfile();
    return mockSupplyServer.listMyRequisitions(profile.id);
  }
  return http.get<Requisition[]>(endpoints.supplyRequisitions.mine());
}

export async function cancelSupplyRequisition(id: string): Promise<Requisition> {
  if (env.useMock) return mockSupplyServer.cancelRequisition(id);
  return http.post<Requisition>(endpoints.supplyRequisitions.cancel(id));
}

export async function acceptSupplyRequisition(id: string): Promise<Requisition> {
  if (env.useMock) return mockSupplyServer.acceptRequisition(id);
  return http.post<Requisition>(endpoints.supplyRequisitions.accept(id));
}

export async function sendSupplyRequisitionOtp(id: string): Promise<SendOtpResponse> {
  if (env.useMock) {
    const response = await mockSupplyServer.sendOtp(id);
    if (env.isDev) return response;
    const { mockOtp: _mockOtp, ...safeResponse } = response;
    return safeResponse;
  }
  return http.post<SendOtpResponse>(endpoints.supplyRequisitions.sendOtp(id));
}

export async function verifySupplyRequisitionOtp(
  id: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  if (env.useMock) return mockSupplyServer.verifyOtp(id, otp);
  return http.post<VerifyOtpResponse>(endpoints.supplyRequisitions.verifyOtp(id), { otp });
}

export async function fetchSupplyRequisitionAuditEvents(
  id: string,
): Promise<RequisitionAuditEvent[]> {
  if (env.useMock) return mockSupplyServer.listAuditEvents(id);
  return http.get<RequisitionAuditEvent[]>(endpoints.supplyRequisitions.auditEvents(id));
}

export async function fetchSupplyRequisitionDocument(id: string): Promise<RequisitionDocument> {
  if (env.useMock) return mockSupplyServer.getDocument(id);
  return http.get<RequisitionDocument>(endpoints.supplyRequisitions.document(id));
}

export async function verifySupplyRequisitionDocument(
  id: string,
): Promise<DocumentVerification> {
  if (env.useMock) return mockSupplyServer.verifyDocument(id);
  return http.get<DocumentVerification>(endpoints.supplyRequisitions.verifyDocument(id));
}
