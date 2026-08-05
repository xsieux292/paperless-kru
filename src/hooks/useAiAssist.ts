import { useMutation, useQuery } from '@tanstack/react-query';
import {
  detectDocument,
  draftRequisition,
  fetchDailySummary,
  writePortfolioCaption,
} from '@/api/aiAssist.api';

/** ครูพิมพ์ประโยคเดียว → AI ร่างใบเบิกทั้งใบให้ */
export function useDraftRequisition() {
  return useMutation({ mutationFn: draftRequisition });
}

/** อ่านไฟล์ที่แนบมาแล้วเดาบริการ/โครงการให้อัตโนมัติ */
export function useDetectDocument() {
  return useMutation({ mutationFn: detectDocument });
}

/** ให้ AI เรียบเรียงคำบรรยายผลงาน ว.PA */
export function useWriteCaption() {
  return useMutation({ mutationFn: writePortfolioCaption });
}

/** ตัวเลขสรุปประจำวัน */
export function useDailySummary(pendingSignatures: number, activeJobs: number) {
  return useQuery({
    queryKey: ['daily-summary', pendingSignatures, activeJobs],
    queryFn: () => fetchDailySummary(pendingSignatures, activeJobs),
    staleTime: 60_000,
  });
}
