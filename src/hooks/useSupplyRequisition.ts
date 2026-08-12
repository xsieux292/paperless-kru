import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelSupplyRequisition,
  clearSupplyCart,
  createSupplyRequisition,
  fetchMySupplyRequisitions,
  fetchSupplies,
  fetchSupplyRequisition,
  getSupplyCart,
  removeSupplyCartItem,
  sendSupplyRequisitionOtp,
  setSupplyCartItemQuantity,
  subscribeToSupplyStorage,
  verifySupplyRequisitionOtp,
} from '@/api/supplies.api';
import type { CreateSupplyRequisitionInput, Requisition } from '@/types/supply';

const supplyQueryKeys = {
  all: ['supply-requisition'] as const,
  catalog: () => [...supplyQueryKeys.all, 'catalog'] as const,
  requests: () => [...supplyQueryKeys.all, 'requests'] as const,
  request: (token: string) => [...supplyQueryKeys.all, 'request', token] as const,
};

/** ตะกร้าแบบ reactive โดยให้ API layer เป็นเจ้าของ persistence ทั้งหมด */
export function useSupplyCart() {
  const [cart, setCart] = useState(() => getSupplyCart());

  useEffect(() => {
    const refresh = () => setCart(getSupplyCart());
    refresh();
    return subscribeToSupplyStorage(refresh);
  }, []);

  const setQuantity = useCallback((supplyId: string, quantity: number) => {
    setCart(setSupplyCartItemQuantity(supplyId, Math.max(0, quantity)));
  }, []);

  const remove = useCallback((supplyId: string) => {
    setCart(removeSupplyCartItem(supplyId));
  }, []);

  const clear = useCallback(() => {
    clearSupplyCart();
    setCart([]);
  }, []);

  return { cart, setQuantity, remove, clear };
}

export function useSupplyCatalog() {
  return useQuery({
    queryKey: supplyQueryKeys.catalog(),
    queryFn: fetchSupplies,
  });
}

export function useCreateSupplyRequisition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupplyRequisitionInput) => createSupplyRequisition(input),
    onSuccess: (requisition) => {
      queryClient.setQueryData(supplyQueryKeys.request(requisition.publicToken), requisition);
      void queryClient.invalidateQueries({ queryKey: supplyQueryKeys.requests() });
    },
  });
}

/** Polling ทำงานเฉพาะช่วงที่เจ้าหน้าที่กำลังตรวจของ */
export function useSupplyRequest(token: string) {
  return useQuery({
    queryKey: supplyQueryKeys.request(token),
    queryFn: () => fetchSupplyRequisition(token),
    enabled: token.length > 0,
    refetchInterval: (query) =>
      (query.state.data as Requisition | undefined)?.status === 'pending_stock_check'
        ? 1_500
        : false,
  });
}

export function useMySupplyRequests() {
  return useQuery({
    queryKey: supplyQueryKeys.requests(),
    queryFn: fetchMySupplyRequisitions,
    refetchInterval: (query) => {
      const requests = query.state.data as Requisition[] | undefined;
      return requests?.some((request) => request.status === 'pending_stock_check')
        ? 1_500
        : false;
    },
  });
}

export function useCancelSupplyRequest(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelSupplyRequisition(token),
    onSuccess: (requisition) => {
      queryClient.setQueryData(supplyQueryKeys.request(token), requisition);
      void queryClient.invalidateQueries({ queryKey: supplyQueryKeys.requests() });
    },
  });
}

export function useSendSupplyOtp(token: string) {
  return useMutation({ mutationFn: () => sendSupplyRequisitionOtp(token) });
}

export function useVerifySupplyOtp(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otp: string) => verifySupplyRequisitionOtp(token, otp),
    onSuccess: ({ requisition }) => {
      queryClient.setQueryData(supplyQueryKeys.request(token), requisition);
      void queryClient.invalidateQueries({ queryKey: supplyQueryKeys.requests() });
    },
  });
}
