import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

/**
 * Build เฉพาะ prototype LINE OA ให้ออกมาเป็นก้อนเดียว
 *
 * ทำไมต้องแยก config: ตัว prototype มีไว้เอาไปเปิดนำเสนอ ซึ่งบางครั้งไม่มีเน็ต
 * ไม่มีเซิร์ฟเวอร์ หรือเปิดจาก USB — จึงต้องรวม JS/CSS ให้เหลือไฟล์เดียว
 * (ถ้าแตกเป็นหลาย chunk จะ inline ไม่ได้ เพราะแต่ละ chunk import กันเอง)
 *
 * ใช้คู่กับ scripts/inline-prototype.mjs ที่ยัด JS/CSS กลับเข้าไปใน HTML
 * เรียกทั้งชุดด้วย: npm run build:prototype
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': resolvePath('./src'),
    },
  },
  build: {
    outDir: 'dist-prototype',
    emptyOutDir: true,
    sourcemap: false,
    // รวม CSS ทั้งหมดเป็นไฟล์เดียว จะได้ inline ได้ง่าย
    cssCodeSplit: false,
    rollupOptions: {
      input: resolvePath('./line-demo.html'),
      output: {
        /**
         * ออกมาเป็น IIFE (classic script) ไม่ใช่ ES module
         *
         * สำคัญมาก: error เดิม "Strict MIME type checking is enforced for module scripts"
         * เกิดเฉพาะกับ <script type="module"> เท่านั้น
         * พอเป็น classic script เบราว์เซอร์ไม่บังคับตรวจ MIME และเปิดจาก file:// ได้ด้วย
         */
        format: 'iife',
        // บังคับให้เหลือ JS ก้อนเดียว ไม่แตก chunk (จำเป็นสำหรับ inline)
        inlineDynamicImports: true,
        manualChunks: undefined,
        entryFileNames: 'prototype.js',
        assetFileNames: 'prototype.[ext]',
      },
    },
  },
});
