import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { env } from '@/config/env';
import { cancelJob, fetchJobs, retryJob } from '@/api/jobs.api';
import type { Job } from '@/types';
import { queryKeys } from './queryKeys';

/**
 * รายการงานทั้งหมด
 * ถ้ายังมีงานที่กำลังทำอยู่ ระบบจะถามสถานะซ้ำอัตโนมัติ (polling)
 * และหยุดถามเองเมื่อทุกงานเสร็จแล้ว — ประหยัด request และไม่ต้องกดรีเฟรชเอง
 */
export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs.list(),
    queryFn: fetchJobs,
    refetchInterval: (query) => {
      const jobs = query.state.data as Job[] | undefined;
      const hasActive = jobs?.some((job) => job.status === 'processing' || job.status === 'queued');
      return hasActive ? env.jobPollIntervalMs : false;
    },
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryJob,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelJob,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
  });
}

/** แยกงานเป็นกลุ่ม "กำลังทำ" กับ "เสร็จแล้ว" ให้ UI ใช้ได้ทันที */
export function splitJobs(jobs: Job[] | undefined) {
  const list = jobs ?? [];
  return {
    active: list.filter((job) => job.status === 'processing' || job.status === 'queued'),
    finished: list.filter((job) => job.status === 'succeeded' || job.status === 'failed'),
  };
}
