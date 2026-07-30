import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AccessibilityContext,
  FONT_SCALE_STORAGE_KEY,
  SCALE_VALUE,
  type FontScale,
} from './accessibilityContext';

/**
 * การตั้งค่าเพื่อการเข้าถึง — ออกแบบมาเพื่อคุณครูที่อ่านตัวเล็กไม่ถนัด
 * ค่าที่เลือกจะถูกจำไว้ในเครื่อง ไม่ต้องตั้งใหม่ทุกครั้ง
 */

function readStoredScale(): FontScale {
  try {
    const stored = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    if (stored === 'normal' || stored === 'large' || stored === 'xlarge') return stored;
  } catch {
    // localStorage อาจถูกปิดในโหมดส่วนตัว — ใช้ค่าเริ่มต้นแทน
  }
  return 'normal';
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>(readStoredScale);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(SCALE_VALUE[fontScale]));
  }, [fontScale]);

  const setFontScale = useCallback((scale: FontScale) => {
    setFontScaleState(scale);
    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, scale);
    } catch {
      // ไม่สามารถบันทึกได้ก็ยังใช้งานต่อได้ในรอบนี้
    }
  }, []);

  const value = useMemo(() => ({ fontScale, setFontScale }), [fontScale, setFontScale]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}
