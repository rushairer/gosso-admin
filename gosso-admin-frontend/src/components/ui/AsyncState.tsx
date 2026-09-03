import type { ReactNode } from 'react';
import { Feedback } from './Feedback';
import { PageLoader } from './LoadingSpinner';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

export interface AsyncStateProps {
  loading: boolean;
  loadingMessage?: string;
  skeleton?: ReactNode;
  error?: string | null;
  retryLabel?: string;
  onRetry?: () => void;
  empty?: boolean;
  emptyState?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  children: ReactNode;
}

/** Standard loading, failure, empty, and retry state for data-backed admin panels. */
export function AsyncState({
  loading,
  loadingMessage,
  skeleton,
  error,
  retryLabel = 'Retry',
  onRetry,
  empty = false,
  emptyState,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
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
          <div className="mt-md">
            <Button variant="secondary" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }
  if (empty) {
    return emptyState ? (
      <>{emptyState}</>
    ) : (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle || 'No data'}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }
  return <>{children}</>;
}
