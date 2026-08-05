import type {
  Approver,
  CreateRequisitionInput,
  FormTemplate,
  Project,
  Requisition,
  SuggestedItem,
} from '@/types';
import { ApiError } from '@/api/http';
import {
  initialMockRequisitions,
  mockApprovers,
  mockFormTemplates,
  mockProjects,
  suggestItemsFor,
} from './mockCatalog';

/**
 * Backend จำลองส่วน "แบบฟอร์ม / โครงการ / ใบเบิก"
 * แยกไฟล์จาก mockServer.ts เพื่อไม่ให้ไฟล์เดียวโตเกินไป
 */

const LATENCY_MS = 420;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const templates = new Map(mockFormTemplates.map((item) => [item.id, item]));
const requisitions = new Map(initialMockRequisitions.map((item) => [item.id, item]));

let requisitionCounter = 1002;
let docCounter = 841;

export const mockCatalogServer = {
  async listFormTemplates(): Promise<FormTemplate[]> {
    await delay(LATENCY_MS);
    // เรียงตัวที่ใช้บ่อยที่สุดขึ้นก่อน — ครูจะเจอของที่ใช้ประจำทันที
    return [...templates.values()].sort((a, b) => b.usageCount - a.usageCount);
  },

  /** นับการใช้งานเพิ่ม เพื่อให้ลำดับในรายการสะท้อนพฤติกรรมจริง */
  markTemplateUsed(templateId: string): void {
    const template = templates.get(templateId);
    if (!template) return;
    templates.set(templateId, {
      ...template,
      usageCount: template.usageCount + 1,
      lastUsedAt: new Date().toISOString(),
    });
  },

  getTemplate(templateId: string): FormTemplate | undefined {
    return templates.get(templateId);
  },

  async listProjects(): Promise<Project[]> {
    await delay(LATENCY_MS);
    return mockProjects.filter((project) => project.active);
  },

  async listApprovers(): Promise<Approver[]> {
    await delay(LATENCY_MS / 2);
    return mockApprovers;
  },

  async listRequisitions(): Promise<Requisition[]> {
    await delay(LATENCY_MS);
    return [...requisitions.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async suggestItems(description: string): Promise<SuggestedItem[]> {
    // หน่วงนานกว่าปกติเล็กน้อยเพื่อให้เห็นสถานะ "AI กำลังคิด…" ตอนสาธิต
    await delay(1400);
    if (!description.trim()) {
      throw new ApiError({
        status: 400,
        code: 'EMPTY_DESCRIPTION',
        message: 'description is required',
        friendlyMessage: 'กรุณาพิมพ์สั้น ๆ ว่าจะจัดกิจกรรมอะไร AI จะได้คิดรายการให้ถูกค่ะ',
      });
    }
    return suggestItemsFor(description);
  },

  async createRequisition(input: CreateRequisitionInput): Promise<Requisition> {
    await delay(900);

    const project = mockProjects.find((item) => item.id === input.projectId);
    const approver = mockApprovers.find((item) => item.id === input.approverId);

    if (!project || !approver) {
      throw new ApiError({
        status: 400,
        code: 'INVALID_REFERENCE',
        message: 'unknown project or approver',
        friendlyMessage: 'ข้อมูลโครงการหรือผู้อนุมัติไม่ถูกต้อง กรุณาเลือกใหม่อีกครั้งค่ะ',
      });
    }

    const id = `req-${++requisitionCounter}`;
    const prefix = input.kind === 'budget' ? 'บก.01' : 'ยพ.02';
    // เลขที่เอกสารใช้ปี พ.ศ. ปัจจุบัน ให้ตรงกับวันที่ที่แสดงในระบบ
    const buddhistYear = new Date().getFullYear() + 543;
    const totalAmount = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const requisition: Requisition = {
      id,
      docNo: `${prefix}-${buddhistYear}-${String(++docCounter).padStart(4, '0')}`,
      kind: input.kind,
      status: 'pending',
      purpose: input.purpose,
      projectId: project.id,
      projectName: project.name,
      neededBy: input.neededBy,
      items: input.items.map((item, index) => ({ ...item, id: `${id}-item-${index}` })),
      totalAmount,
      approverId: approver.id,
      approverName: approver.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requisitions.set(id, requisition);
    return requisition;
  },
};
