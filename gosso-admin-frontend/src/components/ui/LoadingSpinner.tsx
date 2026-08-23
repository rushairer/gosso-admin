import React from 'react';
import { useTranslation } from 'react-i18next';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

const sizeMap = {
  sm: { width: '20px', height: '20px', borderWidth: '2px' },
  md: { width: '32px', height: '32px', borderWidth: '3px' },
  lg: { width: '48px', height: '48px', borderWidth: '4px' },
};

export function LoadingSpinner({ size = 'md', className = '', style }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const dimensions = sizeMap[size];

  return (
    <div
      className={className}
      role="status"
      aria-label={t('common.loadingLabel')}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: '50%',
        borderStyle: 'solid',
        borderWidth: dimensions.borderWidth,
        borderColor: 'rgba(255,255,255,0.06)',
        borderTopColor: 'var(--color-primary)',
        animation: 'spin 1s linear infinite',
        ...style,
      }}
    />
  );
}

export interface PageLoaderProps {
  message?: string;
  minHeight?: string;
  size?: 'sm' | 'md' | 'lg';
  padding?: string;
}

export function PageLoader({ message, minHeight, size = 'md', padding = '60px 0' }: PageLoaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding,
        minHeight,
      }}
    >
      <LoadingSpinner size={size} style={{ margin: '0 auto 16px auto' }} />
      {message && <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{message}</p>}
    </div>
  );
}
