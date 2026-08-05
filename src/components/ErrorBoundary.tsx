import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { env } from '@/config/env';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * กันไม่ให้หน้าจอขาวทั้งหน้าเมื่อเกิดข้อผิดพลาดที่ไม่คาดคิด
 * แสดงข้อความที่คุณครูอ่านแล้วรู้ว่าต้องทำอะไรต่อ พร้อมเบอร์ติดต่อ
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // จุดต่อ error tracking (Sentry / LogRocket) ในภายหลัง
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="card max-w-md space-y-5 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <AlertTriangle className="h-8 w-8" aria-hidden />
          </div>
          <div>
            <h1 className="mb-2 font-display text-heading text-ink">
              ระบบขัดข้องชั่วคราวค่ะ
            </h1>
            <p className="text-base leading-relaxed text-ink-light">
              ขออภัยค่ะ กรุณากดปุ่มด้านล่างเพื่อโหลดหน้าใหม่
              หากยังไม่หายกรุณาโทรหาฝ่ายไอทีของโรงเรียนที่{' '}
              <a href={`tel:${env.supportPhoneHref}`} className="font-bold text-primary-700 underline">
                {env.supportPhone}
              </a>
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="tap-target h-btn w-full rounded-btn bg-primary-600 px-6 font-display text-base font-bold text-white transition hover:bg-primary-700"
          >
            โหลดหน้าใหม่
          </button>
        </div>
      </div>
    );
  }
}
