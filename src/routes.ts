import { useEffect, useState } from 'react';

/**
 * เส้นทางในเว็บ — ใช้ hash routing เพื่อให้ URL แชร์/บุ๊กมาร์กได้
 * โดยไม่ต้องตั้งค่า rewrite ที่ web server (สำคัญเวลา deploy เป็น static site)
 */
export type AppRoute = 'upload' | 'requisition' | 'planning';

const DEFAULT_ROUTE: AppRoute = 'upload';

const ROUTE_HASH: Record<AppRoute, string> = {
  upload: '#/ส่งเอกสาร',
  requisition: '#/เบิกพัสดุ',
  planning: '#/วางแผนงบ',
};

/** ป้ายเมนูของแต่ละหน้า — ทั้งคู่อยู่ในกลุ่ม Doc Done */
export const ROUTE_LABEL: Record<AppRoute, string> = {
  upload: 'ส่งเอกสารให้ AI',
  requisition: 'เบิกงบ / ยืมพัสดุ',
  planning: 'วางแผนงบกิจกรรม',
};

export const ROUTE_ORDER: AppRoute[] = ['planning', 'requisition', 'upload'];

function parseHash(hash: string): AppRoute {
  const decoded = decodeURIComponent(hash);
  const match = ROUTE_ORDER.find((route) => ROUTE_HASH[route] === decoded);
  return match ?? DEFAULT_ROUTE;
}

export function useRoute(): [AppRoute, (route: AppRoute) => void] {
  const [route, setRoute] = useState<AppRoute>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: AppRoute) => {
    window.location.hash = ROUTE_HASH[next];
    setRoute(next);
    window.scrollTo({ top: 0 });
  };

  return [route, navigate];
}
