import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRequisition,
  fetchRequisitions,
  suggestRequisitionItems,
} from '@/api/requisitions.api';
import { queryKeys } from './queryKeys';

/** ใบเบิกของฉัน */
export function useRequisitions() {
  return useQuery({
    queryKey: queryKeys.requisitions.list(),
    queryFn: fetchRequisitions,
  });
}

export function useCreateRequisition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRequisition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.requisitions.all }),
  });
}

/** ให้ AI ช่วยคิดรายการอุปกรณ์จากคำอธิบายกิจกรรม */
export function useSuggestItems() {
  return useMutation({ mutationFn: suggestRequisitionItems });
}
