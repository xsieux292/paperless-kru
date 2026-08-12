import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SupplyRequisitionPage } from '@/pages/SupplyRequisitionPage';
import { UploadPortalPage } from '@/pages/UploadPortalPage';
import { ActivityPlanningPage } from '@/pages/ActivityPlanningPage';
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
  const [route, navigate, supplyRoute] = useRoute();

  if (route === 'planning')
    return <ActivityPlanningPage route={route} onNavigate={navigate} />;
  if (route === 'requisition') {
    return (
      <SupplyRequisitionPage
        route={supplyRoute ?? { name: 'supply-catalog' }}
        onNavigate={navigate}
      />
    );
  }
  return <UploadPortalPage route={route} onNavigate={navigate} />;
}
