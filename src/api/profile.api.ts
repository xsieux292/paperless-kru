import { env } from '@/config/env';
import type { TeacherProfile } from '@/types';
import { http } from './http';
import { endpoints } from './endpoints';
import { mockServer } from './mock/mockServer';

/**
 * ข้อมูลผู้ใช้ที่ล็อกอินอยู่
 * โครงสร้างฟังก์ชันเหมือนกันทั้ง mock และ API จริง — สลับด้วย env.useMock
 */
export async function fetchProfile(): Promise<TeacherProfile> {
  if (env.useMock) return mockServer.getProfile();

  const raw = await http.get<TeacherProfile>(endpoints.profile.me());
  return normalizeProfile(raw);
}

/** จุดแปลงข้อมูลจาก backend → โดเมนของ frontend (แก้ที่นี่ถ้าฟิลด์ไม่ตรง) */
function normalizeProfile(raw: TeacherProfile): TeacherProfile {
  return {
    ...raw,
    initial: raw.initial || raw.fullName.replace(/^คุณครู/, '').trim().charAt(0) || '?',
  };
}
