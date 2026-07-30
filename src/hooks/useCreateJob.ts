import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { createJob } from '@/api/jobs.api';
import type { CreateJobInput, CreateJobResponse } from '@/types';
import { queryKeys } from './queryKeys';

/**
 * ส่งงานใหม่ให้ AI พร้อมรายงานความคืบหน้าการอัปโหลด
 * แยก uploadPercent ออกจาก mutation state เพื่อให้ progress bar อัปเดตลื่นไหล
 */
export function useCreateJob() {
  const queryClient = useQueryClient();
  const [uploadPercent, setUploadPercent] = useState(0);

  const mutation = useMutation<CreateJobResponse, Error, CreateJobInput>({
    mutationFn: (input) => createJob(input, setUploadPercent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });

  const submit = useCallback(
    (input: CreateJobInput) => {
      setUploadPercent(0);
      return mutation.mutateAsync(input);
    },
    [mutation],
  );

  return {
    submit,
    uploadPercent,
    isSubmitting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
