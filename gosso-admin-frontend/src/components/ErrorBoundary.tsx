import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import i18n from '../i18n';
import { logger } from '../utils/logger';
import { Button, Card, Heading, Text } from '@gouno/ui/core';

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
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
        <Card variant="elevated" padding="base" className="w-full max-w-xl text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-danger-subtle text-destructive">
            <AlertTriangle aria-hidden="true" className="size-6" />
          </div>
          <Heading level={1} className="text-xl">{i18n.t('errorBoundary.title')}</Heading>
          <Text tone="muted" className="mt-2">{i18n.t('errorBoundary.description')}</Text>
          {import.meta.env.DEV && this.state.error ? (
            <pre className="mt-5 max-h-56 overflow-auto rounded-lg bg-muted p-4 text-left font-mono text-xs">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="solid" color="primary" icon={<RefreshCw />} onClick={this.handleReload}>
              {i18n.t('errorBoundary.reloadPage')}
            </Button>
            <Button icon={<Home />} onClick={this.handleGoHome}>
              {i18n.t('errorBoundary.goHome')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}
