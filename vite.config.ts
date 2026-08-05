import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  plugins: [react()],
  /**
   * ใช้ path แบบสัมพัทธ์ เพื่อให้ dist/ เปิดได้จากทุกที่
   * (โฟลเดอร์ย่อย, GitHub Pages ของ repo, หรือเปิดจากเครื่องตรง ๆ)
   * ถ้าใช้ '/' ไฟล์ asset จะถูกอ้างเป็น /assets/... ซึ่งพังทันทีเมื่อ deploy ไม่ได้อยู่ที่ root
   */
  base: './',
  resolve: {
    alias: {
      '@': resolvePath('./src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    // เมื่อย้ายไปต่อ API จริง ให้ตั้งค่า VITE_API_BASE_URL ใน .env แทนการใช้ proxy นี้
    // proxy: {
    //   '/api': { target: 'http://localhost:8080', changeOrigin: true },
    // },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // 2 หน้าแยกกัน: ระบบจริง (index) และ prototype จำลอง LINE OA (line-demo)
      input: {
        main: resolvePath('./index.html'),
        'line-demo': resolvePath('./line-demo.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
