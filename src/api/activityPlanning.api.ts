import { env } from '@/config/env';
import type { ActivityBudgetPlan, ActivityPlanForm, PlanningQuestion } from '@/types';
import { http } from './http';
import { endpoints } from './endpoints';
import { mockAiAssist } from './mock/mockAiAssist';

/**
 * วางแผนงบกิจกรรม — AI ถามคำถามเพิ่มเติมแล้วสร้างรายการงบให้
 * ย้ายตรรกะจาก inspiration/App.tsx มาอยู่ใน API layer
 * เพื่อให้ทั้งเว็บและ LINE ใช้ร่วมกันได้
 */

/** ดึงคำถามที่ AI ต้องถามครูเพิ่มเติม */
export async function fetchPlanningQuestions(): Promise<PlanningQuestion[]> {
  if (env.useMock) return mockAiAssist.getActivityPlanningQuestions();
  return http.get<PlanningQuestion[]>(endpoints.activityPlanning.questions());
}

/** สร้างรายการงบเบื้องต้นจากข้อมูลกิจกรรม + คำตอบเพิ่มเติม */
export async function generateActivityBudget(
  form: ActivityPlanForm,
  answers: Record<string, string>,
): Promise<ActivityBudgetPlan> {
  if (env.useMock) return mockAiAssist.generateActivityBudget(form, answers);
  return http.post<ActivityBudgetPlan>(endpoints.activityPlanning.budget(), { form, answers });
}
