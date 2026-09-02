import type { ReactNode } from 'react';
import { Feedback } from './Feedback';
import { PageLoader } from './LoadingSpinner';
import { Button } from './Button';

interface AsyncStateProps {
  loading: boolean;
  loadingMessage?: string;
  skeleton?: ReactNode;
  error?: string | null;
  retryLabel?: string;
  onRetry?: () => void;
  children: ReactNode;
}

/** Standard loading, failure, and retry state for data-backed admin panels. */
export function AsyncState({
  loading,
  loadingMessage,
  skeleton,
  error,
  retryLabel = 'Retry',
  onRetry,
  children,
}: AsyncStateProps) {
  if (loading) {
    return skeleton ? <>{skeleton}</> : <PageLoader message={loadingMessage} />;
  }
  if (error) {
    return (
      <div className="panel-body">
        <Feedback type="error">{error}</Feedback>
        {onRetry && (
          <div style={{ marginTop: '16px' }}>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
