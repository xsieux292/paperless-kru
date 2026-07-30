/** ฟังก์ชันจัดรูปแบบข้อความให้เป็นภาษาไทยที่คุณครูอ่านเข้าใจทันที */

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} ไบต์`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const thaiTime = (date: Date) =>
  date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

/** "2 นาทีที่แล้ว", "วันนี้ 09:30 น.", "เมื่อวานนี้" */
export function formatRelativeThai(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return 'เมื่อสักครู่';
  if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;

  const today = new Date();
  const isSameDay = date.toDateString() === today.toDateString();
  if (isSameDay) return `วันนี้ ${thaiTime(date)} น.`;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `เมื่อวานนี้ ${thaiTime(date)} น.`;

  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** ประมาณเวลาที่เหลือจาก progress เพื่อลดความกังวลระหว่างรอ */
export function formatRemaining(progress: number, totalSeconds = 24): string {
  const remaining = Math.max(1, Math.round(((100 - progress) / 100) * totalSeconds));
  if (remaining < 60) return `อีกประมาณ ${remaining} วินาที`;
  return `อีกประมาณ ${Math.ceil(remaining / 60)} นาที`;
}

/** ตัดชื่อไฟล์ยาว ๆ ให้สั้นลงแต่ยังเห็นนามสกุล */
export function truncateFileName(name: string, maxLength = 32): string {
  if (name.length <= maxLength) return name;
  const dotIndex = name.lastIndexOf('.');
  const ext = dotIndex > -1 ? name.slice(dotIndex) : '';
  const base = dotIndex > -1 ? name.slice(0, dotIndex) : name;
  return `${base.slice(0, maxLength - ext.length - 1)}…${ext}`;
}
