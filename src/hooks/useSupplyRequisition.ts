import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptSupplyRequisition,
  addCustomSupplyToCart,
  cancelSupplyRequisition,
  clearSupplyCart,
  createSupplyRequisition,
  fetchMySupplyRequisitions,
  fetchSupplies,
  fetchSupplyRequisition,
  fetchSupplyRequisitionAuditEvents,
  fetchSupplyRequisitionDocument,
  fetchSupplyTeacherProfile,
  getSupplyCart,
  removeSupplyCartItem,
  sendSupplyRequisitionOtp,
  setCatalogCartItemQuantity,
  setSupplyCartItemQuantity,
  subscribeToSupplyStorage,
  verifySupplyRequisitionOtp,
  verifySupplyRequisitionDocument,
} from '@/api/supplies.api';
import type {
  CreateSupplyRequisitionInput,
  CustomSupplyRequest,
  Requisition,
} from '@/types/supply';

const supplyQueryKeys = {
  all: ['supply-requisition'] as const,
  profile: () => [...supplyQueryKeys.all, 'profile'] as const,
  catalog: () => [...supplyQueryKeys.all, 'catalog'] as const,
  requests: () => [...supplyQueryKeys.all, 'requests'] as const,
  request: (id: string) => [...supplyQueryKeys.all, 'request', id] as const,
  audit: (id: string) => [...supplyQueryKeys.all, 'audit', id] as const,
  document: (id: string) => [...supplyQueryKeys.all, 'document', id] as const,
  documentVerification: (id: string) => [...supplyQueryKeys.all, 'document-verification', id] as const,
};

export function useSupplyCart() {
  const [cart, setCart] = useState(() => getSupplyCart());

  useEffect(() => {
    const refresh = () => setCart(getSupplyCart());
    refresh();
    return subscribeToSupplyStorage(refresh);
  }, []);

  const setCatalogQuantity = useCallback((supplyId: string, quantity: number) => {
    setCart(setCatalogCartItemQuantity(supplyId, Math.max(0, quantity)));
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setCart(setSupplyCartItemQuantity(itemId, Math.max(0, quantity)));
  }, []);

  const saveCustom = useCallback(
    (input: Omit<CustomSupplyRequest, 'id'>, existingId?: string) => {
      setCart(addCustomSupplyToCart(input, existingId));
    },
    [],
  );

  const remove = useCallback((itemId: string) => {
    setCart(removeSupplyCartItem(itemId));
  }, []);

  const clear = useCallback(() => {
    clearSupplyCart();
    setCart([]);
  }, []);

  return { cart, setCatalogQuantity, setQuantity, saveCustom, remove, clear };
}

export function useSupplyTeacherProfile() {
  return useQuery({
    queryKey: supplyQueryKeys.profile(),
    queryFn: fetchSupplyTeacherProfile,
    staleTime: 5 * 60_000,
  });
}

export function useSupplyCatalog() {
  return useQuery({ queryKey: supplyQueryKeys.catalog(), queryFn: fetchSupplies });
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

export function useSupplyRequest(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: supplyQueryKeys.request(id),
    queryFn: async () => {
      const previous = queryClient.getQueryData<Requisition>(supplyQueryKeys.request(id));
      const next = await fetchSupplyRequisition(id);
      if (previous?.status === 'pending_stock_check' && next.status !== 'pending_stock_check') {
        void queryClient.invalidateQueries({ queryKey: supplyQueryKeys.audit(id) });
      }
      return next;
    },
    enabled: id.length > 0,
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
      return requests?.some((request) => request.status === 'pending_stock_check') ? 1_500 : false;
    },
  });
}

function useRequisitionMutation(id: string) {
  const queryClient = useQueryClient();
  return (requisition: Requisition) => {
    queryClient.setQueryData(supplyQueryKeys.request(id), requisition);
    void queryClient.invalidateQueries({ queryKey: supplyQueryKeys.requests() });
    void queryClient.invalidateQueries({ queryKey: supplyQueryKeys.audit(id) });
  };
}

export function useCancelSupplyRequest(id: string) {
  const onSuccess = useRequisitionMutation(id);
  return useMutation({ mutationFn: () => cancelSupplyRequisition(id), onSuccess });
}

export function useAcceptSupplyRequest(id: string) {
  const onSuccess = useRequisitionMutation(id);
  return useMutation({ mutationFn: () => acceptSupplyRequisition(id), onSuccess });
}

export function useSendSupplyOtp(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sendSupplyRequisitionOtp(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: supplyQueryKeys.audit(id) }),
  });
}

export function useVerifySupplyOtp(id: string) {
  const onSuccessRequisition = useRequisitionMutation(id);
  return useMutation({
    mutationFn: (otp: string) => verifySupplyRequisitionOtp(id, otp),
    onSuccess: ({ requisition }) => onSuccessRequisition(requisition),
  });
}

export function useSupplyAuditEvents(id: string, poll = false) {
  return useQuery({
    queryKey: supplyQueryKeys.audit(id),
    queryFn: () => fetchSupplyRequisitionAuditEvents(id),
    enabled: id.length > 0,
    refetchInterval: poll ? 1_500 : false,
  });
}

/** เอกสารถูกสร้างเมื่อเปิดหน้าเอกสารเท่านั้น เพื่อไม่เพิ่ม audit จาก polling */
export function useSupplyDocument(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: supplyQueryKeys.document(id),
    queryFn: async () => {
      const document = await fetchSupplyRequisitionDocument(id);
      void queryClient.invalidateQueries({ queryKey: supplyQueryKeys.audit(id) });
      return document;
    },
    enabled: id.length > 0,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useVerifySupplyDocument(id: string) {
  return useQuery({
    queryKey: supplyQueryKeys.documentVerification(id),
    queryFn: () => verifySupplyRequisitionDocument(id),
    enabled: id.length > 0,
  });
}
