/**
 * ก๊อปไฟล์ prototype แบบไฟล์เดียวเข้าไปใน dist/
 *
 * เพื่อให้หลัง deploy แล้วครูหรือกรรมการโหลดไฟล์ไปเปิดออฟไลน์ได้จาก URL ตรง ๆ
 * โดยไม่ต้อง clone repo หรือ build เอง
 *
 * รันอัตโนมัติเป็นขั้นสุดท้ายของ npm run build:all
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';

const resolve = (relative) => fileURLToPath(new URL(relative, import.meta.url));

const SOURCE = resolve('../dist-prototype/kruassist-line-prototype.html');
const TARGET = resolve('../dist/kruassist-line-prototype.html');

async function main() {
  await mkdir(resolve('../dist'), { recursive: true });
  await copyFile(SOURCE, TARGET);
  console.log('\n✓ ก๊อป prototype ไฟล์เดียวเข้า dist/ แล้ว');
  console.log('  จะเปิดได้ที่ /kruassist-line-prototype.html หลัง deploy\n');
}

main().catch((error) => {
  console.error('ก๊อปไฟล์ prototype ไม่สำเร็จ:', error);
  process.exit(1);
});
