/**
 * รวม prototype LINE OA ให้เหลือไฟล์ HTML ไฟล์เดียว
 *
 * ที่มา: เดิม line-demo.html ชี้ไปที่ /src/line-demo/main.tsx ซึ่งต้องมี Vite คอยแปลงให้
 * ถ้าเอาไฟล์ไปวางบนเซิร์ฟเวอร์ธรรมดา (หรือเปิดจากเครื่องตรง ๆ) เบราว์เซอร์จะได้ไฟล์ .tsx
 * เป็น application/octet-stream แล้วปฏิเสธที่จะรัน — เป็นที่มาของ error
 *   "Expected a JavaScript-or-Wasm module script but the server responded with
 *    a MIME type of application/octet-stream"
 *
 * สคริปต์นี้แก้ที่ต้นเหตุ: ยัด JS และ CSS ที่ build แล้วกลับเข้าไปใน HTML
 * ผลลัพธ์คือไฟล์เดียวที่ดับเบิลคลิกเปิดได้เลย ไม่ต้องมีเซิร์ฟเวอร์ ไม่ต้องมีเน็ต
 *
 * รันผ่าน: npm run build:prototype
 */
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';

const resolve = (relative) => fileURLToPath(new URL(relative, import.meta.url));

const BUILD_DIR = resolve('../dist-prototype');
const OUTPUT = resolve('../dist-prototype/kruassist-line-prototype.html');

/**
 * กันสตริงที่ปิด <script> ก่อนเวลาอันควร
 * ตาม HTML spec ตัวที่จบ script element คือ `</script` ตามด้วย whitespace, `/` หรือ `>`
 * จึง escape ทุกกรณี ไม่ใช่แค่ `</script>` เต็ม ๆ
 */
const escapeForInlineScript = (code) => code.replace(/<\/(script)/gi, '<\\/$1');

/**
 * แทนที่ข้อความแบบตรงตัว
 *
 * ห้ามส่ง replacement เป็น string เข้า String.replace เด็ดขาด เพราะ `$` จะถูกตีความ
 * เป็นรูปแบบพิเศษ ($$, $&, $`, $') — โค้ดที่ minify มาแล้วมี `$$typeof` ของ React
 * และ `$&` อยู่เต็มไปหมด ผลคือไฟล์เพี้ยนและ <script> ถูกปิดกลางคัน
 * การส่งเป็นฟังก์ชันทำให้ JavaScript ไม่ตีความ `$` เลย
 */
const replaceLiteral = (haystack, needle, replacement) => haystack.replace(needle, () => replacement);

async function main() {
  const htmlPath = `${BUILD_DIR}/line-demo.html`;
  let html = await readFile(htmlPath, 'utf8');

  // ---- ดึงชื่อไฟล์ JS/CSS ที่ Vite สร้างไว้ ----
  const scriptMatch = html.match(/<script[^>]*src="\.?\/?([^"]+\.js)"[^>]*><\/script>/i);
  // ตัด type="module" ทิ้ง — ไฟล์ที่ build มาเป็น IIFE จึงเป็น classic script
  const styleMatch = html.match(/<link[^>]*rel="stylesheet"[^>]*href="\.?\/?([^"]+\.css)"[^>]*>/i);

  if (!scriptMatch) {
    throw new Error('ไม่พบ <script> ในไฟล์ที่ build มา — ตรวจ vite.config.prototype.ts');
  }

  const js = await readFile(`${BUILD_DIR}/${scriptMatch[1]}`, 'utf8');
  const css = styleMatch ? await readFile(`${BUILD_DIR}/${styleMatch[1]}`, 'utf8') : '';

  // ---- ยัดกลับเข้า HTML ----
  /**
   * เอา <script> เดิมออกจาก <head> แล้วไปวางท้าย <body> แทน
   *
   * เหตุผล: ของเดิมเป็น module ซึ่งเบราว์เซอร์ defer ให้อัตโนมัติ (รันหลัง DOM พร้อม)
   * แต่ classic script รันทันทีที่เจอ ถ้ายังอยู่ใน <head> จะรันก่อนที่ <div id="root">
   * จะถูกสร้าง แล้ว main.tsx จะหา #root ไม่เจอ → จอขาว
   * (ใส่ defer ไม่ช่วย เพราะ defer ใช้ได้กับ script ที่มี src เท่านั้น)
   */
  html = replaceLiteral(html, scriptMatch[0], '');
  html = replaceLiteral(
    html,
    '</body>',
    `  <script>\n${escapeForInlineScript(js)}\n  </script>\n</body>`,
  );

  if (styleMatch) {
    html = replaceLiteral(html, styleMatch[0], `<style>\n${css}\n</style>`);
  }

  // modulepreload ชี้ไปไฟล์ที่ไม่มีอยู่แล้ว ต้องเอาออก ไม่งั้นเบราว์เซอร์จะขึ้น error ใน console
  html = html.replace(/\s*<link[^>]*rel="modulepreload"[^>]*>/gi, '');

  // เผื่อกรณีเปิดแบบไม่มีเน็ต: ฟอนต์จาก Google จะโหลดไม่ได้
  // ระบบมี fallback เป็นฟอนต์ของเครื่องอยู่แล้ว จึงยังอ่านภาษาไทยได้ปกติ
  html = replaceLiteral(
    html,
    '</head>',
    '  <!-- ไฟล์นี้รวมทุกอย่างไว้ในตัวแล้ว เปิดได้โดยไม่ต้องมีเซิร์ฟเวอร์หรืออินเทอร์เน็ต -->\n  </head>',
  );

  // ---- ตรวจผลลัพธ์ก่อนเขียนไฟล์ ----
  // ถ้า escape หรือการแทนที่พลาด อาการจะเป็น "โค้ดโผล่มาเป็นตัวหนังสือเต็มหน้าจอ"
  // ซึ่งเห็นตอนเปิดเท่านั้น จึงเช็กตรงนี้ให้ build พังทันทีแทนที่จะไปเจอตอนนำเสนอ
  // ต้องเหลือ </script> แค่อันเดียวคืออันที่ปิดบล็อกของเรา
  // (คำว่า `<script` เฉย ๆ ในโค้ดไม่เป็นไร เพราะไม่ได้ปิด element ตาม HTML spec)
  const closeTags = html.match(/<\/script>/gi) ?? [];
  if (closeTags.length !== 1) {
    throw new Error(
      `พบ </script> ${closeTags.length} ที่ (ต้องมี 1) — โค้ดที่ inline ไปปิด tag กลางคัน`,
    );
  }

  // โค้ดต้องอยู่ครบตรงตัว ถ้าไม่ตรงแปลว่าโดน $-substitution ของ String.replace กิน
  if (!html.includes(escapeForInlineScript(js))) {
    throw new Error('โค้ดที่ inline ไม่ตรงกับต้นฉบับ — น่าจะโดน $-substitution ของ String.replace');
  }

  // ห้ามเหลือ module script หรือไฟล์ภายนอก มิฉะนั้นจะเจอ MIME error เดิมอีก
  if (/<script[^>]*\bsrc=/i.test(html) || /<script[^>]*type="module"/i.test(html)) {
    throw new Error('ยังมี external หรือ module script เหลืออยู่ — จะเจอ MIME error เดิมซ้ำ');
  }

  await writeFile(OUTPUT, html, 'utf8');

  // เก็บกวาดไฟล์ที่ inline เข้าไปแล้ว เหลือไว้แค่ไฟล์เดียวจะได้ไม่สับสนว่าต้องเอาอันไหนไป
  await rm(`${BUILD_DIR}/${scriptMatch[1]}`, { force: true });
  if (styleMatch) await rm(`${BUILD_DIR}/${styleMatch[1]}`, { force: true });
  await rm(htmlPath, { force: true });

  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
  console.log(`\n✓ สร้าง prototype ไฟล์เดียวเรียบร้อย (${sizeKb} KB)`);
  console.log(`  ${OUTPUT}`);
  console.log('  ดับเบิลคลิกเปิดได้เลย ไม่ต้องรันเซิร์ฟเวอร์\n');
}

main().catch((error) => {
  console.error('สร้าง prototype ไฟล์เดียวไม่สำเร็จ:', error);
  process.exit(1);
});
