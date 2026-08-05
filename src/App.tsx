import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RequisitionPage } from '@/pages/RequisitionPage';
import { UploadPortalPage } from '@/pages/UploadPortalPage';
import { useRoute } from '@/routes';
import { AccessibilityProvider } from '@/providers/AccessibilityProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';

export default function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AccessibilityProvider>
          <ToastProvider>
            <RoutedPages />
          </ToastProvider>
        </AccessibilityProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

function RoutedPages() {
  const [route, navigate] = useRoute();

  return route === 'requisition' ? (
    <RequisitionPage route={route} onNavigate={navigate} />
  ) : (
    <UploadPortalPage route={route} onNavigate={navigate} />
  );
}
