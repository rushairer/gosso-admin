import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

const spinnerDimensions = {
  sm: { width: '20px', height: '20px' },
  md: { width: '32px', height: '32px' },
  lg: { width: '48px', height: '48px' },
};

export function LoadingSpinner({ size = 'md', className = '', style }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const dimensions = spinnerDimensions[size];

  return (
    <div
      className={cn(
        'loading-spinner inline-block animate-spin rounded-full border-2 border-primary border-t-transparent',
        `loading-spinner--${size}`,
        className
      )}
      role="status"
      aria-label={t('common.loadingLabel', { defaultValue: 'Loading' })}
      style={{ ...dimensions, ...style }}
    />
  );
}

export interface PageLoaderProps {
  message?: string;
  minHeight?: string;
  size?: 'sm' | 'md' | 'lg';
  padding?: string;
  className?: string;
}

export function PageLoader({ message, minHeight = '240px', size = 'md', padding, className = '' }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'page-loader flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground w-full',
        className
      )}
      style={{ minHeight, padding }}
    >
      <LoadingSpinner size={size} />
      {message && <p className="page-loader__message text-sm font-medium">{message}</p>}
    </div>
  );
}
