import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchPlanningQuestions, generateActivityBudget } from '@/api/activityPlanning.api';
import type { ActivityPlanForm } from '@/types';
import { queryKeys } from './queryKeys';

/**
 * Hooks สำหรับฟังก์ชันวางแผนงบกิจกรรม
 * ใช้ pattern เดียวกับ useAiAssist.ts / useRequisitions.ts
 */

/** ดึงคำถามที่ AI ต้องถามครูเพิ่มเติม — cache ไว้เพราะไม่เปลี่ยนระหว่าง session */
export function usePlanningQuestions() {
  return useQuery({
    queryKey: queryKeys.planningQuestions,
    queryFn: fetchPlanningQuestions,
    staleTime: Infinity,
  });
}

/** สร้างรายการงบจากข้อมูลกิจกรรม + คำตอบเพิ่มเติม */
export function useGenerateActivityBudget() {
  return useMutation({
    mutationFn: ({ form, answers }: { form: ActivityPlanForm; answers: Record<string, string> }) =>
      generateActivityBudget(form, answers),
  });
}
