import type { CartItem, Requisition, SupplyStorageSnapshot } from '@/types/supply';

/**
 * localStorage adapter ของระบบเบิกพัสดุ
 *
 * ไฟล์นี้เป็นจุดเดียวที่ทราบชื่อ key และแตะ browser storage เพื่อไม่ให้ UI
 * ผูกกับวิธี persistence ปัจจุบัน เมื่อมี backend จริงจึงเปลี่ยนได้โดยไม่รื้อหน้า
 */

export const SUPPLY_STORAGE_KEYS = {
  cart: 'kruassist.supply.cart.v1',
  requisitions: 'kruassist.supply.requisitions.v1',
  publicTokens: 'kruassist.supply.public-tokens.v1',
  requestSequence: 'kruassist.supply.request-sequence.v1',
} as const;

const SUPPLY_STORAGE_EVENT = 'kruassist:supply-storage-change';
const SUPPLY_STORAGE_KEY_SET: ReadonlySet<string> = new Set(Object.values(SUPPLY_STORAGE_KEYS));
const MAX_CART_QUANTITY = 99;
const MAX_PUBLIC_TOKEN_HISTORY = 200;

export type StoredOtpChallenge = {
  sentAt: string;
  resendAvailableAt: string;
  expiresAt: string;
  attemptsRemaining: number;
};

export type StoredSupplyRequisitionRecord = {
  requisition: Requisition;
  otpChallenge?: StoredOtpChallenge;
};

type StoredRequisitionMap = Record<string, StoredSupplyRequisitionRecord>;
type StoredSequence = { buddhistYear: number; value: number };

// ใช้เป็น fallback เมื่อ localStorage ถูกปิด (เช่น private browser policy)
const memoryStorage = new Map<string, string>();

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readRaw(key: string): string | null {
  const storage = browserStorage();
  if (!storage) return memoryStorage.get(key) ?? null;

  try {
    const value = storage.getItem(key);
    if (value === null) memoryStorage.delete(key);
    else memoryStorage.set(key, value);
    return value;
  } catch {
    return memoryStorage.get(key) ?? null;
  }
}

function writeRaw(key: string, value: string): void {
  memoryStorage.set(key, value);
  try {
    browserStorage()?.setItem(key, value);
  } catch {
    // memory fallback ยังทำให้ flow ใช้ต่อได้ใน session นี้
  }
}

function removeRaw(key: string): void {
  memoryStorage.delete(key);
  try {
    browserStorage()?.removeItem(key);
  } catch {
    // ไม่มีงานเพิ่มเมื่อใช้ memory fallback
  }
}

function parseJson(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function emitStorageChange(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SUPPLY_STORAGE_EVENT));
}

function sanitizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  const quantities = new Map<string, number>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue;
    const supplyId = Reflect.get(candidate, 'supplyId');
    const quantity = Reflect.get(candidate, 'quantity');
    if (typeof supplyId !== 'string' || !supplyId.trim() || typeof quantity !== 'number') continue;

    const normalized = Math.min(MAX_CART_QUANTITY, Math.trunc(quantity));
    if (normalized > 0) quantities.set(supplyId, normalized);
  }

  return [...quantities].map(([supplyId, quantity]) => ({ supplyId, quantity }));
}

function sanitizePublicTokens(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(value.filter((token): token is string => typeof token === 'string' && !!token)),
  ].slice(-MAX_PUBLIC_TOKEN_HISTORY);
}

function isStoredRecord(value: unknown): value is StoredSupplyRequisitionRecord {
  if (!value || typeof value !== 'object') return false;
  const requisition = Reflect.get(value, 'requisition');
  return (
    !!requisition &&
    typeof requisition === 'object' &&
    typeof Reflect.get(requisition, 'publicToken') === 'string' &&
    typeof Reflect.get(requisition, 'createdAt') === 'string' &&
    Array.isArray(Reflect.get(requisition, 'items'))
  );
}

function readRequisitionMap(): StoredRequisitionMap {
  const parsed = parseJson(readRaw(SUPPLY_STORAGE_KEYS.requisitions));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

  const safeEntries = Object.entries(parsed).filter(
    (entry): entry is [string, StoredSupplyRequisitionRecord] => isStoredRecord(entry[1]),
  );
  return Object.fromEntries(safeEntries);
}

function writeRequisitionMap(records: StoredRequisitionMap): void {
  writeRaw(SUPPLY_STORAGE_KEYS.requisitions, JSON.stringify(records));
  emitStorageChange();
}

export function getSupplyCart(): CartItem[] {
  return sanitizeCart(parseJson(readRaw(SUPPLY_STORAGE_KEYS.cart)));
}

export function saveSupplyCart(cart: readonly CartItem[]): CartItem[] {
  const sanitized = sanitizeCart(cart);
  writeRaw(SUPPLY_STORAGE_KEYS.cart, JSON.stringify(sanitized));
  emitStorageChange();
  return sanitized;
}

export function setSupplyCartItemQuantity(supplyId: string, quantity: number): CartItem[] {
  const normalizedSupplyId = supplyId.trim();
  if (!normalizedSupplyId) return getSupplyCart();

  const cart = getSupplyCart().filter((item) => item.supplyId !== normalizedSupplyId);
  const normalizedQuantity = Math.min(MAX_CART_QUANTITY, Math.trunc(quantity));
  if (Number.isFinite(normalizedQuantity) && normalizedQuantity > 0) {
    cart.push({ supplyId: normalizedSupplyId, quantity: normalizedQuantity });
  }
  return saveSupplyCart(cart);
}

export function removeSupplyCartItem(supplyId: string): CartItem[] {
  return saveSupplyCart(getSupplyCart().filter((item) => item.supplyId !== supplyId));
}

export function clearSupplyCart(): void {
  removeRaw(SUPPLY_STORAGE_KEYS.cart);
  emitStorageChange();
}

export function getSupplyPublicTokens(): string[] {
  return sanitizePublicTokens(parseJson(readRaw(SUPPLY_STORAGE_KEYS.publicTokens)));
}

export function addSupplyPublicToken(publicToken: string): string[] {
  const tokens = sanitizePublicTokens([...getSupplyPublicTokens(), publicToken]);
  writeRaw(SUPPLY_STORAGE_KEYS.publicTokens, JSON.stringify(tokens));
  emitStorageChange();
  return tokens;
}

export function getStoredSupplyRequisition(
  publicToken: string,
): StoredSupplyRequisitionRecord | undefined {
  return readRequisitionMap()[publicToken];
}

export function saveStoredSupplyRequisition(record: StoredSupplyRequisitionRecord): void {
  const records = readRequisitionMap();
  records[record.requisition.publicToken] = record;
  writeRequisitionMap(records);
}

export function getStoredSupplyRequisitions(
  publicTokens = getSupplyPublicTokens(),
): StoredSupplyRequisitionRecord[] {
  const records = readRequisitionMap();
  return publicTokens.flatMap((token) => (records[token] ? [records[token]] : []));
}

export function nextSupplyRequestSequence(buddhistYear: number): number {
  const parsed = parseJson(readRaw(SUPPLY_STORAGE_KEYS.requestSequence));
  const stored = parsed as Partial<StoredSequence> | undefined;
  const previous =
    stored?.buddhistYear === buddhistYear && typeof stored.value === 'number' ? stored.value : 0;
  const next = Math.max(0, Math.trunc(previous)) + 1;
  writeRaw(
    SUPPLY_STORAGE_KEYS.requestSequence,
    JSON.stringify({ buddhistYear, value: next } satisfies StoredSequence),
  );
  return next;
}

export function getSupplyStorageSnapshot(): SupplyStorageSnapshot {
  return {
    cart: getSupplyCart(),
    publicTokens: getSupplyPublicTokens(),
  };
}

/** รับทั้งการเปลี่ยนใน tab เดียวกันและ storage event จาก tab อื่น */
export function subscribeToSupplyStorage(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handleLocalChange = () => listener();
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === null || SUPPLY_STORAGE_KEY_SET.has(event.key)) listener();
  };

  window.addEventListener(SUPPLY_STORAGE_EVENT, handleLocalChange);
  window.addEventListener('storage', handleStorageChange);
  return () => {
    window.removeEventListener(SUPPLY_STORAGE_EVENT, handleLocalChange);
    window.removeEventListener('storage', handleStorageChange);
  };
}
