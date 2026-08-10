import { env } from '@/config/env';
import type {
  Approver,
  FormContentDraft,
  FormTemplate,
  FormTemplateSpec,
  Project,
  ReceiptCategory,
} from '@/types';
import { http } from './http';
import { endpoints } from './endpoints';
import { mockCatalogServer } from './mock/mockRequisitionServer';
import { mockFormTemplateSpecs } from './mock/mockFormTemplates';
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

/**
 * อ่านโครงของแบบฟอร์มว่าต้องกรอกช่องอะไรบ้าง
 * ใช้บอกครูล่วงหน้าว่าต้องเตรียมข้อมูลอะไร แทนที่จะปล่อยให้เดาเอง
 */
export async function fetchFormTemplateSpec(
  templateId: string,
  templateName: string,
): Promise<FormTemplateSpec> {
  if (env.useMock) return mockFormTemplateSpecs.inspect(templateId, templateName);
  return http.get<FormTemplateSpec>(endpoints.formTemplates.spec(templateId));
}

/** ให้ AI ร่างเนื้อหาลงทุกช่องของแบบฟอร์มจากประโยคเดียว */
export async function draftFormContent(
  templateId: string,
  description: string,
): Promise<FormContentDraft> {
  if (env.useMock) return mockFormTemplateSpecs.draftContent(templateId, description);
  return http.post<FormContentDraft>(endpoints.formTemplates.draftContent(templateId), {
    description,
  });
}
