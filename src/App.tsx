import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UploadPortalPage } from '@/pages/UploadPortalPage';
import { AccessibilityProvider } from '@/providers/AccessibilityProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';

export default function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AccessibilityProvider>
          <ToastProvider>
            <UploadPortalPage />
          </ToastProvider>
        </AccessibilityProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
