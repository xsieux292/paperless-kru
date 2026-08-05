import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  plugins: [react()],
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
