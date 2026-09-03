import React from 'react';
import { useTranslation } from 'react-i18next';

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
      className={`loading-spinner loading-spinner--${size} ${className}`}
      role="status"
      aria-label={t('common.loadingLabel')}
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

export function PageLoader({ message, minHeight, size = 'md', padding, className = '' }: PageLoaderProps) {
  return (
    <div className={`page-loader ${className}`} style={minHeight || padding ? { minHeight, padding } : undefined}>
      <LoadingSpinner size={size} />
      {message && <p className="page-loader__message">{message}</p>}
    </div>
  );
}
