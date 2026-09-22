import type { ReactNode } from 'react';
import { Alert, Card, Text } from '@gouno/ui/core';

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
    <div data-pattern="settings-composition" className="flex flex-col gap-5">
      {description || actions ? (
        <div
          data-slot="gosso-tab-panel-lead"
          data-pattern="tab-panel-lead"
          className="flex min-h-9 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            {description ? (
              <Text tone="muted" size="sm" leading="relaxed" className="max-w-3xl">
                {description}
              </Text>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
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
      <dt className="type-body-sm type-weight-medium text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 type-body-sm">{children}</dd>
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
