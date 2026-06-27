import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught', { error, errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '32px',
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              textAlign: 'center',
              padding: '48px 32px',
              borderLeft: '4px solid var(--danger-color)',
            }}
          >
            <AlertTriangle
              style={{
                width: '48px',
                height: '48px',
                color: 'var(--danger-color)',
                marginBottom: '20px',
                display: 'inline-block',
              }}
            />
            <h2 style={{ color: 'var(--color-text-main)', marginBottom: '12px', fontSize: '22px' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
              An unexpected error occurred while rendering this page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre
                style={{
                  textAlign: 'left',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#fca5a5',
                  overflow: 'auto',
                  maxHeight: '200px',
                  marginBottom: '20px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={this.handleReload}>
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                Reload Page
              </button>
              <button className="btn btn-secondary" onClick={this.handleGoHome}>
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
