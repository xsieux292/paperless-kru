import { env } from '@/config/env';
import type { CreateRequisitionInput, Requisition, SuggestedItem } from '@/types';
import { http } from './http';
import { endpoints } from './endpoints';
import { mockCatalogServer } from './mock/mockRequisitionServer';

/**
 * ระบบเบิกงบ / ยืมพัสดุ (Flow B)
 * โครงสร้างเหมือน api module อื่น — สลับ mock/ของจริงด้วย env.useMock
 */

export async function fetchRequisitions(): Promise<Requisition[]> {
  if (env.useMock) return mockCatalogServer.listRequisitions();
  const raw = await http.get<Requisition[]>(endpoints.requisitions.list());
  return raw.map(normalizeRequisition);
}

export async function createRequisition(input: CreateRequisitionInput): Promise<Requisition> {
  if (env.useMock) return mockCatalogServer.createRequisition(input);
  return normalizeRequisition(
    await http.post<Requisition>(endpoints.requisitions.create(), input),
  );
}

/** ให้ AI ช่วยคิดรายการอุปกรณ์จากคำอธิบายกิจกรรมสั้น ๆ */
export async function suggestRequisitionItems(description: string): Promise<SuggestedItem[]> {
  if (env.useMock) return mockCatalogServer.suggestItems(description);
  return http.post<SuggestedItem[]>(endpoints.requisitions.suggestItems(), { description });
}

function normalizeRequisition(raw: Requisition): Requisition {
  const items = raw.items ?? [];
  return {
    ...raw,
    items,
    totalAmount:
      Number(raw.totalAmount) ||
      items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  };
}
