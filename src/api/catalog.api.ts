import { env } from '@/config/env';
import type { Approver, FormTemplate, Project, ReceiptCategory } from '@/types';
import { http } from './http';
import { endpoints } from './endpoints';
import { mockCatalogServer } from './mock/mockRequisitionServer';
import { RECEIPT_CATEGORIES } from './mock/mockCatalog';

/**
 * ข้อมูลตั้งต้นที่ระบบต้องใช้ตอนกรอกฟอร์ม
 * (แบบฟอร์มที่เคยอัปโหลด, โครงการ, ผู้อนุมัติ, ประเภทใบเสร็จ)
 */

export async function fetchFormTemplates(): Promise<FormTemplate[]> {
  if (env.useMock) return mockCatalogServer.listFormTemplates();
  const raw = await http.get<FormTemplate[]>(endpoints.formTemplates.list());
  return raw.map((item) => ({ ...item, usageCount: Number(item.usageCount) || 0 }));
}

export async function fetchProjects(): Promise<Project[]> {
  if (env.useMock) return mockCatalogServer.listProjects();
  return http.get<Project[]>(endpoints.projects.list());
}

export async function fetchApprovers(): Promise<Approver[]> {
  if (env.useMock) return mockCatalogServer.listApprovers();
  return http.get<Approver[]>(endpoints.requisitions.approvers());
}

/**
 * ประเภทใบเสร็จเป็นค่าคงที่ของระบบ ไม่ได้มาจาก backend
 * ถ้าภายหลังโรงเรียนอยากกำหนดเอง ให้เปลี่ยนมาดึงจาก API ที่ฟังก์ชันนี้ที่เดียว
 */
export function getReceiptCategories(): ReceiptCategory[] {
  return RECEIPT_CATEGORIES;
}
