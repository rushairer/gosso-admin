import type { ReactNode } from 'react';
import { Alert, Card } from '@gouno/ui/core';

interface SectionProps {
  description?: ReactNode;
  actions?: ReactNode;
  surface?: 'card' | 'direct';
  children: ReactNode;
}

interface SettingRowProps {
  label: ReactNode;
  children: ReactNode;
}

export function Section({ description, actions, surface = 'card', children }: SectionProps) {
  return (
    <div className="flex flex-col gap-5">
      {description || actions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {description ? (
            <p className="m-0 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          ) : (
            <span />
          )}
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {surface === 'card' ? (
        <Card padding="base" className="overflow-hidden">
          {children}
        </Card>
      ) : (
        children
      )}
    </div>
  );
}

export function SettingRow({ label, children }: SettingRowProps) {
  return (
    <div className="grid gap-2 border-t py-4 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 text-sm">{children}</dd>
    </div>
  );
}

export function StatusMessage({
  message,
  type = 'success',
}: {
  message: ReactNode;
  type?: 'success' | 'error' | 'info' | 'warning';
}) {
  return <Alert type={type} showIcon title={message} />;
}
