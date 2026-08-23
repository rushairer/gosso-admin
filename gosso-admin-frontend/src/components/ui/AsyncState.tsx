import type { ReactNode } from 'react';
import { Feedback } from './Feedback';
import { PageLoader } from './LoadingSpinner';

interface AsyncStateProps {
  loading: boolean;
  loadingMessage?: string;
  error?: string | null;
  retryLabel?: string;
  onRetry?: () => void;
  children: ReactNode;
}

/** Standard loading, failure, and retry state for data-backed admin panels. */
export function AsyncState({
  loading,
  loadingMessage,
  error,
  retryLabel = 'Retry',
  onRetry,
  children,
}: AsyncStateProps) {
  if (loading) return <PageLoader message={loadingMessage} />;
  if (error) {
    return (
      <div className="panel-body">
        <Feedback type="error">{error}</Feedback>
        {onRetry && (
          <button type="button" className="btn btn-secondary btn-sm mt-md" onClick={onRetry}>
            {retryLabel}
          </button>
        )}
      </div>
    );
  }
  return <>{children}</>;
}
