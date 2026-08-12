import { useEffect, useState } from 'react';

/** หน้าเดิมของ KruAssist — คงชนิดนี้ไว้เพื่อให้ Header และหน้าเดิมใช้งานต่อได้ */
export type AppRoute = 'upload' | 'requisition' | 'planning';

/** หน้าย่อยของ flow เบิกพัสดุฝั่งครู */
export type SupplyRoute =
  | { name: 'supply-catalog' }
  | { name: 'supply-cart' }
  | { name: 'supply-tracking'; token: string }
  | { name: 'supply-confirmation'; token: string }
  | { name: 'supply-pickup'; token: string }
  | { name: 'supply-requests' };

export type RouteTarget = AppRoute | SupplyRoute;

export interface RouteState {
  /** route ระดับเมนู ใช้กับ AppHeader และหน้าเดิม */
  appRoute: AppRoute;
  /** มีค่าเฉพาะเมื่ออยู่ใน flow เบิกพัสดุ */
  supplyRoute: SupplyRoute | null;
}

const DEFAULT_ROUTE: AppRoute = 'upload';

const ROUTE_HASH: Record<AppRoute, string> = {
  upload: '#/ส่งเอกสาร',
  requisition: '#/เบิกพัสดุ',
  planning: '#/วางแผนงบ',
};

/** ป้ายเมนูของแต่ละหน้า — คง API เดิมไว้ให้ AppHeader */
export const ROUTE_LABEL: Record<AppRoute, string> = {
  upload: 'ส่งเอกสารให้ AI',
  requisition: 'เบิกพัสดุ',
  planning: 'วางแผนงบกิจกรรม',
};

export const ROUTE_ORDER: AppRoute[] = ['planning', 'requisition', 'upload'];

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function hashSegments(hash: string): string[] {
  return hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeSegment);
}

/** แปลง hash เป็น route แบบมีชนิด รองรับการเปิด URL ตรงและ refresh */
export function parseHash(hash: string): RouteState {
  const segments = hashSegments(hash);

  if (segments[0] === 'เบิกพัสดุ') {
    const section = segments[1];
    const token = segments[2];

    let supplyRoute: SupplyRoute;
    if (!section) supplyRoute = { name: 'supply-catalog' };
    else if (section === 'ตะกร้า') supplyRoute = { name: 'supply-cart' };
    else if (section === 'คำขอของฉัน') supplyRoute = { name: 'supply-requests' };
    else if (section === 'ติดตาม' && token) {
      supplyRoute = { name: 'supply-tracking', token };
    } else if (section === 'ยืนยัน' && token) {
      supplyRoute = { name: 'supply-confirmation', token };
    } else if (section === 'รับของ' && token) {
      supplyRoute = { name: 'supply-pickup', token };
    } else {
      supplyRoute = { name: 'supply-catalog' };
    }

    return { appRoute: 'requisition', supplyRoute };
  }

  if (segments[0] === 'วางแผนงบ' && segments.length === 1) {
    return { appRoute: 'planning', supplyRoute: null };
  }

  if (segments[0] === 'ส่งเอกสาร' && segments.length === 1) {
    return { appRoute: 'upload', supplyRoute: null };
  }

  return { appRoute: DEFAULT_ROUTE, supplyRoute: null };
}

/** สร้าง hash โดย encode เฉพาะ token เพื่อให้ token ที่มีอักขระพิเศษปลอดภัย */
export function hashForRoute(route: RouteTarget): string {
  if (typeof route === 'string') return ROUTE_HASH[route];

  switch (route.name) {
    case 'supply-catalog':
      return ROUTE_HASH.requisition;
    case 'supply-cart':
      return '#/เบิกพัสดุ/ตะกร้า';
    case 'supply-tracking':
      return `#/เบิกพัสดุ/ติดตาม/${encodeURIComponent(route.token)}`;
    case 'supply-confirmation':
      return `#/เบิกพัสดุ/ยืนยัน/${encodeURIComponent(route.token)}`;
    case 'supply-pickup':
      return `#/เบิกพัสดุ/รับของ/${encodeURIComponent(route.token)}`;
    case 'supply-requests':
      return '#/เบิกพัสดุ/คำขอของฉัน';
  }
}

export type Navigate = (route: RouteTarget) => void;

/**
 * คืนค่า [appRoute, navigate, supplyRoute]
 *
 * สมาชิกสองตัวแรกเข้ากันได้กับการใช้งานเดิม (`const [route, navigate] = useRoute()`).
 * App สามารถอ่านสมาชิกตัวที่สามเพื่อเลือกหน้าของ flow เบิกพัสดุได้
 */
export function useRoute(): [AppRoute, Navigate, SupplyRoute | null] {
  const [state, setState] = useState<RouteState>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setState(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate: Navigate = (next) => {
    const hash = hashForRoute(next);
    window.location.hash = hash;
    // hashchange ไม่ทำงานเมื่อไป URL เดิม จึงอัปเดต state โดยตรงด้วย
    setState(parseHash(hash));
    window.scrollTo({ top: 0 });
  };

  return [state.appRoute, navigate, state.supplyRoute];
}
