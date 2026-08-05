import { useQuery } from '@tanstack/react-query';
import { fetchApprovers, fetchFormTemplates, fetchProjects } from '@/api/catalog.api';
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
