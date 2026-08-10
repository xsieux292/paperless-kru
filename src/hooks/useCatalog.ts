import { useMutation, useQuery } from '@tanstack/react-query';
import {
  draftFormContent,
  fetchApprovers,
  fetchFormTemplateSpec,
  fetchFormTemplates,
  fetchProjects,
} from '@/api/catalog.api';
import { queryKeys } from './queryKeys';

/** ข้อมูลตั้งต้นเปลี่ยนไม่บ่อย จึง cache ไว้นานกว่างานทั่วไป */
const CATALOG_STALE_MS = 5 * 60_000;

export function useFormTemplates() {
  return useQuery({
    queryKey: queryKeys.formTemplates.list(),
    queryFn: fetchFormTemplates,
    staleTime: CATALOG_STALE_MS,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: fetchProjects,
    staleTime: CATALOG_STALE_MS,
  });
}

export function useApprovers() {
  return useQuery({
    queryKey: queryKeys.approvers.list(),
    queryFn: fetchApprovers,
    staleTime: CATALOG_STALE_MS,
  });
}

/** โครงของแบบฟอร์มที่เลือกอยู่ — ว่ามีช่องอะไรบ้าง */
export function useFormTemplateSpec(templateId: string | null, templateName: string) {
  return useQuery({
    queryKey: [...queryKeys.formTemplates.all, 'spec', templateId],
    queryFn: () => fetchFormTemplateSpec(templateId!, templateName),
    enabled: Boolean(templateId),
    staleTime: CATALOG_STALE_MS,
  });
}

/** ให้ AI ร่างเนื้อหาลงทุกช่องของแบบฟอร์ม */
export function useDraftFormContent() {
  return useMutation({
    mutationFn: ({ templateId, description }: { templateId: string; description: string }) =>
      draftFormContent(templateId, description),
  });
}
