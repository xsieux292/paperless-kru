import type {
  CartItem,
  Requisition,
  RequisitionAuditEvent,
  SupplyStorageSnapshot,
} from '@/types/supply';

/** Adapter นี้เป็นจุดเดียวที่แตะ browser storage; component ติดต่อผ่าน API เท่านั้น */
export const SUPPLY_STORAGE_KEYS = {
  cart: 'kruassist.supply.cart.v2',
  requisitions: 'kruassist.supply.requisitions.v2',
  requestSequence: 'kruassist.supply.request-sequence.v2',
} as const;

const SUPPLY_STORAGE_EVENT = 'kruassist:supply-storage-change';
const SUPPLY_STORAGE_KEY_SET: ReadonlySet<string> = new Set(Object.values(SUPPLY_STORAGE_KEYS));
const MAX_CART_QUANTITY = 99;
const memoryStorage = new Map<string, string>();

export type StoredOtpChallenge = {
  sentAt: string;
  resendAvailableAt: string;
  expiresAt: string;
  attemptsRemaining: number;
};

export type StoredSupplyRequisitionRecord = {
  requisition: Requisition;
  auditEvents: RequisitionAuditEvent[];
  otpChallenge?: StoredOtpChallenge;
  documentGeneratedAt?: string;
};

type StoredRequisitionMap = Record<string, StoredSupplyRequisitionRecord>;
type StoredSequence = { buddhistYear: number; value: number };

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
    // memory fallback keeps the prototype usable when storage is blocked.
  }
}

function removeRaw(key: string): void {
  memoryStorage.delete(key);
  try {
    browserStorage()?.removeItem(key);
  } catch {
    // No additional action is required for memory fallback.
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

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function positiveInteger(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(MAX_CART_QUANTITY, Math.max(0, Math.trunc(value)));
}

function sanitizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const safe: CartItem[] = [];

  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue;
    const source = Reflect.get(candidate, 'source');

    if (source === 'catalog') {
      const supplyId = text(Reflect.get(candidate, 'supplyId'));
      const requestedQuantity = positiveInteger(Reflect.get(candidate, 'requestedQuantity'));
      if (!supplyId || !requestedQuantity) continue;
      safe.push({
        id: text(Reflect.get(candidate, 'id')) || `catalog:${supplyId}`,
        source: 'catalog',
        supplyId,
        requestedQuantity,
      });
      continue;
    }

    if (source === 'custom') {
      const custom = Reflect.get(candidate, 'customSupply');
      if (!custom || typeof custom !== 'object') continue;
      const id = text(Reflect.get(candidate, 'id')) || text(Reflect.get(custom, 'id'));
      const name = text(Reflect.get(custom, 'name'));
      const description = text(Reflect.get(custom, 'description'));
      const quantity = positiveInteger(
        Reflect.get(candidate, 'requestedQuantity') || Reflect.get(custom, 'quantity'),
      );
      const unit = text(Reflect.get(custom, 'unit'));
      const reason = text(Reflect.get(custom, 'reason'));
      if (!id || !name || !description || !quantity || !unit || !reason) continue;
      const imageUrl = text(Reflect.get(custom, 'imageUrl'));
      const referenceUrl = text(Reflect.get(custom, 'referenceUrl'));
      const note = text(Reflect.get(custom, 'note'));
      safe.push({
        id,
        source: 'custom',
        requestedQuantity: quantity,
        customSupply: {
          id,
          name,
          description,
          quantity,
          unit,
          reason,
          ...(imageUrl ? { imageUrl } : {}),
          ...(referenceUrl ? { referenceUrl } : {}),
          ...(note ? { note } : {}),
        },
        reviewStatus: 'pending',
      });
    }
  }

  return safe;
}

function isStoredRecord(value: unknown): value is StoredSupplyRequisitionRecord {
  if (!value || typeof value !== 'object') return false;
  const requisition = Reflect.get(value, 'requisition');
  return (
    !!requisition &&
    typeof requisition === 'object' &&
    typeof Reflect.get(requisition, 'publicToken') === 'string' &&
    typeof Reflect.get(requisition, 'createdAt') === 'string' &&
    Array.isArray(Reflect.get(requisition, 'items')) &&
    Array.isArray(Reflect.get(value, 'auditEvents'))
  );
}

function readRequisitionMap(): StoredRequisitionMap {
  const parsed = parseJson(readRaw(SUPPLY_STORAGE_KEYS.requisitions));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  return Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, StoredSupplyRequisitionRecord] => isStoredRecord(entry[1]),
    ),
  );
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

export function setSupplyCartItemQuantity(itemId: string, quantity: number): CartItem[] {
  const normalized = positiveInteger(quantity);
  const cart = getSupplyCart();
  const updated = cart.flatMap((item): CartItem[] => {
    if (item.id !== itemId) return [item];
    if (!normalized) return [];
    if (item.source === 'catalog') return [{ ...item, requestedQuantity: normalized }];
    return [
      {
        ...item,
        requestedQuantity: normalized,
        customSupply: { ...item.customSupply, quantity: normalized },
      },
    ];
  });
  return saveSupplyCart(updated);
}

export function setCatalogCartItemQuantity(supplyId: string, quantity: number): CartItem[] {
  const itemId = `catalog:${supplyId}`;
  const current = getSupplyCart().filter(
    (item) => !(item.source === 'catalog' && item.supplyId === supplyId),
  );
  const normalized = positiveInteger(quantity);
  if (normalized) {
    current.push({ id: itemId, source: 'catalog', supplyId, requestedQuantity: normalized });
  }
  return saveSupplyCart(current);
}

export function addCustomSupplyCartItem(item: CartItem): CartItem[] {
  if (item.source !== 'custom') return getSupplyCart();
  return saveSupplyCart([...getSupplyCart().filter((entry) => entry.id !== item.id), item]);
}

export function removeSupplyCartItem(itemId: string): CartItem[] {
  return saveSupplyCart(getSupplyCart().filter((item) => item.id !== itemId));
}

export function clearSupplyCart(): void {
  removeRaw(SUPPLY_STORAGE_KEYS.cart);
  emitStorageChange();
}

export function getStoredSupplyRequisition(
  tokenOrId: string,
): StoredSupplyRequisitionRecord | undefined {
  const records = readRequisitionMap();
  return (
    records[tokenOrId] ??
    Object.values(records).find(
      (record) =>
        record.requisition.id === tokenOrId || record.requisition.publicToken === tokenOrId,
    )
  );
}

export function saveStoredSupplyRequisition(record: StoredSupplyRequisitionRecord): void {
  const records = readRequisitionMap();
  records[record.requisition.publicToken] = record;
  writeRequisitionMap(records);
}

export function getStoredSupplyRequisitions(): StoredSupplyRequisitionRecord[] {
  return Object.values(readRequisitionMap());
}

export function nextSupplyRequestSequence(buddhistYear: number): number {
  const stored = parseJson(readRaw(SUPPLY_STORAGE_KEYS.requestSequence)) as
    | Partial<StoredSequence>
    | undefined;
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
  return { cart: getSupplyCart() };
}

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
