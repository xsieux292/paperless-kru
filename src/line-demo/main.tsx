import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LineDemoApp } from './LineDemoApp';
import '@/styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('ไม่พบ element #root ใน line-demo.html');

createRoot(container).render(
  <StrictMode>
    <LineDemoApp />
  </StrictMode>,
);
