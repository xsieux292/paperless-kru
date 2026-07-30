import { createContext, useContext } from 'react';

/**
 * นิยามของการตั้งค่าเพื่อการเข้าถึง แยกไฟล์ออกจาก Provider
 * เพื่อให้ไฟล์ Provider export เฉพาะ component (ทำให้ hot reload ทำงานถูกต้อง)
 */

export type FontScale = 'normal' | 'large' | 'xlarge';

export const SCALE_VALUE: Record<FontScale, number> = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};

export const FONT_SCALE_OPTIONS: { value: FontScale; label: string; hint: string }[] = [
  { value: 'normal', label: 'ก', hint: 'ขนาดปกติ' },
  { value: 'large', label: 'ก', hint: 'ตัวใหญ่ขึ้น' },
  { value: 'xlarge', label: 'ก', hint: 'ตัวใหญ่พิเศษ' },
];

export const FONT_SCALE_STORAGE_KEY = 'teacher-portal:font-scale';

export interface AccessibilityContextValue {
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
}

export const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility ต้องใช้ภายใน <AccessibilityProvider>');
  return context;
}
