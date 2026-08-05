/**
 * Theme ตาม "KruAssist — UX/UI Design Plan บน LINE OA" (archive/new UX,UI/plan.md)
 * ชื่อสีสื่อความหมาย ไม่ใช่สื่อเฉดสี — เพื่อบังคับกฎข้อ ⑤ "สีมีความหมายเดียวตลอดระบบ"
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './line-demo.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Doc Done — สีหลักของระบบเอกสาร / ปุ่มหลัก / สถานะเรียบร้อย
        primary: {
          50: '#EAF4EF',
          100: '#D0E7DB',
          200: '#A6D2BC',
          300: '#74B99A',
          400: '#4A9C79',
          500: '#2E7D5B',
          600: '#2E7D5B',
          700: '#246348',
          800: '#1B4A36',
          900: '#123123',
        },
        // Teach & Grow — งานพัฒนาวิชาชีพ
        grow: {
          50: '#EAF1F9',
          100: '#D3E2F2',
          200: '#A8C5E5',
          300: '#7BA6D6',
          400: '#4F88C4',
          500: '#2C6BB0',
          600: '#2C6BB0',
          700: '#23568D',
          800: '#1A406A',
          900: '#122B47',
        },
        // "ตรงนี้รอคุณอยู่" — ห้ามใช้เป็นสีตกแต่ง
        attention: {
          50: '#FFF8E1',
          100: '#FDEFC4',
          200: '#FBE19B',
          300: '#F9D173',
          400: '#F7BC4B',
          500: '#F5A623',
          600: '#D98D12',
          700: '#B2710D',
          800: '#8A5709',
          900: '#5E3B06',
        },
        // มีปัญหา ต้องแก้
        danger: {
          50: '#FCEDED',
          100: '#F8D9D9',
          200: '#F0B4B4',
          300: '#E58585',
          400: '#DD6262',
          500: '#D64545',
          600: '#C03A3A',
          700: '#9C2E2E',
          800: '#762424',
          900: '#4F1818',
        },
        // ตัวอักษรและพื้นหลัง (contrast ≥ 4.5:1 บนพื้นขาว)
        ink: {
          DEFAULT: '#333333',
          light: '#666666',
          mute: '#9E9E9E',
        },
        surface: '#F5F7FA',
        // สีจำลองหน้าตา LINE ใช้เฉพาะใน prototype (src/line-demo)
        line: {
          green: '#06C755',
          bg: '#E4EBF2',
          bubble: '#B7E77E',
          dark: '#2B333C',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans Thai"', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        display: ['"IBM Plex Sans Thai"', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // เนื้อหาขั้นต่ำ 16px · หัวเรื่อง 20px · ตัวเลขเงิน 24px
        body: ['1rem', { lineHeight: '1.6' }],
        heading: ['1.25rem', { lineHeight: '1.4', fontWeight: '700' }],
        money: ['1.5rem', { lineHeight: '1.3', fontWeight: '700' }],
      },
      height: {
        // ปุ่มหลัก 56px / ปุ่มรอง 48px
        btn: '3.5rem',
        'btn-sm': '3rem',
      },
      minHeight: {
        tap: '3rem',
      },
      minWidth: {
        tap: '3rem',
      },
      borderRadius: {
        btn: '0.75rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.25s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
