import { env } from '@/config/env';
import type { DailySummary, DocumentDetection, RequisitionDraft } from '@/types';
import { http } from './http';
import { endpoints } from './endpoints';
import { mockAiAssist } from './mock/mockAiAssist';

/**
 * ชั้น "AI ช่วยร่างให้ก่อน"
 *
 * ทุกฟังก์ชันคืนค่าที่ AI เดามาให้พร้อมระดับความมั่นใจ (DraftField)
 * เพื่อให้ UI ไฮไลต์เฉพาะช่องที่ควรให้ครูตรวจ ไม่ใช่ให้ครูไล่ตรวจทุกช่อง
 */

/** ครูพิมพ์ประโยคเดียว → ได้ใบเบิกทั้งใบ */
export async function draftRequisition(description: string): Promise<RequisitionDraft> {
  if (env.useMock) return mockAiAssist.draftRequisition(description);
  return http.post<RequisitionDraft>(endpoints.ai.draftRequisition(), { description });
}

/** อ่านไฟล์ที่ครูส่งมาแล้วเดาบริการ/โครงการ/ยอดเงินให้ */
export async function detectDocument(files: File[]): Promise<DocumentDetection> {
  if (env.useMock) return mockAiAssist.detectDocument(files.map((file) => file.name));

  const formData = new FormData();
  for (const file of files) formData.append('files', file, file.name);
  return http.post<DocumentDetection>(endpoints.ai.detectDocument(), formData, {
    isFormData: true,
  });
}

/** ตัวเลขสรุปประจำวันสำหรับการ์ดภาพรวม */
export async function fetchDailySummary(
  pendingSignatures: number,
  activeJobs: number,
): Promise<DailySummary> {
  if (env.useMock) return mockAiAssist.getDailySummary(pendingSignatures, activeJobs);
  return http.get<DailySummary>(endpoints.ai.dailySummary());
}

/** ให้ AI เรียบเรียงคำบรรยายผลงาน ว.PA ให้เป็นภาษาราชการ */
export async function writePortfolioCaption(shortText: string): Promise<string> {
  if (env.useMock) return mockAiAssist.writePortfolioCaption(shortText);
  const result = await http.post<{ caption: string }>(endpoints.ai.portfolioCaption(), {
    text: shortText,
  });
  return result.caption;
}
