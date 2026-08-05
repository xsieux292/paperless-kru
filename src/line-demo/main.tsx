import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryProvider } from '@/providers/QueryProvider';
import { LineDemoApp } from './LineDemoApp';
import '@/styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('ไม่พบ element #root ใน line-demo.html');

createRoot(container).render(
  <StrictMode>
    {/* ใช้ QueryProvider ตัวเดียวกับเว็บ เพื่อให้ prototype ดึงข้อมูลจาก mock API ชุดเดียวกัน */}
    <QueryProvider>
      <LineDemoApp />
    </QueryProvider>
  </StrictMode>,
);
