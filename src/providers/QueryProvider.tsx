import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError } from '@/api/http';

/**
 * ตั้งค่ากลางของ react-query
 * - ไม่ retry เมื่อเป็น error ฝั่งผู้ใช้ (4xx) เพราะลองใหม่ก็ได้ผลเดิม
 * - refetch เมื่อกลับมาที่แท็บ เพื่อให้สถานะงานสดใหม่เสมอ
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: true,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
          mutations: { retry: false },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
