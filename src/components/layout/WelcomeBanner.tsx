import { useProfile } from '@/hooks/useProfile';

/**
 * แถบต้อนรับ
 * ตั้งใจให้เบาและสั้น — จอนี้มีงานเดียวคือ "ส่งเอกสาร" แบนเนอร์จึงต้องไม่แย่งสายตาไปจากปุ่มหลัก
 */
export function WelcomeBanner() {
  const { data: profile } = useProfile();
  const shortName = profile?.fullName?.replace(/^คุณครู/, '') ?? '';

  return (
    <section className="mb-6 rounded-2xl bg-primary-600 px-5 py-5 text-white sm:px-6">
      <h2 className="font-display text-xl font-bold sm:text-2xl">
        {shortName ? `สวัสดีค่ะ คุณครู${shortName}` : 'สวัสดีค่ะ คุณครู'}
      </h2>
      <p className="mt-1 text-base text-primary-50">
        ส่งเอกสารให้ AI ทำแทนได้เลย ทำตาม 3 ขั้นตอนด้านล่าง ใช้เวลาไม่ถึง 2 นาทีค่ะ
      </p>
    </section>
  );
}
