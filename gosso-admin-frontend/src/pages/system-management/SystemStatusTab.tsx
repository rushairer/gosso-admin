import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { Alert, Button, Card, Heading, Spinner, Tag, Text } from '@gouno/ui/core';
import { useSystemStatus } from '../../features/system/useSystemStatus';
import { dependencyLabel, dependencyIsHealthy, formatHealthTimestamp } from '../../utils/format';
import { ManagementPanelLead } from './shared';

function DefinitionCard({ title, rows }: { title: ReactNode; rows: Array<[ReactNode, ReactNode]> }) {
  return (
    <Card padding="base">
      <Heading level={2} className="mb-4 text-base">{title}</Heading>
      <dl className="divide-y">
        {rows.map(([label, value], index) => (
          <div key={index} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="m-0 min-w-0 break-all text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default function SystemStatusTab() {
  const { t } = useTranslation();
  const { systemHealth, oidcConfig, securityPolicy, loading, refresh } = useSystemStatus();

  const hasHealthIssue =
    !systemHealth?.ready ||
    !dependencyIsHealthy(systemHealth?.checks?.database) ||
    !dependencyIsHealthy(systemHealth?.checks?.redis);

  if (loading && !systemHealth) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 rounded-lg border bg-card text-sm text-muted-foreground" role="status">
        <Spinner aria-label={t('system.description')} />
        <span>{t('system.description')}</span>
      </div>
    );
  }

  const oidcRows: Array<[ReactNode, ReactNode]> = oidcConfig
    ? [
        [t('system.issuerLabel'), <code className="font-mono text-xs">{oidcConfig.issuer}</code>],
        [t('system.authorizationEndpoint'), <code className="font-mono text-xs">{oidcConfig.authorization_endpoint}</code>],
        [t('system.tokenEndpoint'), <code className="font-mono text-xs">{oidcConfig.token_endpoint}</code>],
        [t('system.userinfoEndpoint'), <code className="font-mono text-xs">{oidcConfig.userinfo_endpoint}</code>],
        [
          t('system.jwksUri'),
          <a href={oidcConfig.jwks_uri} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-primary hover:underline">
            {oidcConfig.jwks_uri}
          </a>,
        ],
      ]
    : [];

  const policyRows: Array<[ReactNode, ReactNode]> = securityPolicy
    ? [
        [t('system.sessionTtl'), securityPolicy.session_ttl],
        [t('system.maxSessions'), securityPolicy.max_sessions],
        [t('system.tokenExpiry'), `${securityPolicy.access_token_expiry} / ${securityPolicy.refresh_token_expiry}`],
        [t('system.loginRateLimit'), `${securityPolicy.login_max_attempts} / ${securityPolicy.login_rate_limit_window}`],
        [t('system.mfaRateLimit'), `${securityPolicy.mfa_account_max_attempts} / ${securityPolicy.mfa_account_rate_limit_window}`],
      ]
    : [];

  return (
    <div className="flex flex-col gap-5">
      <ManagementPanelLead
        description={t('system.description')}
        actions={
          <Button icon={<RefreshCw />} onClick={() => void refresh()} loading={loading} title={t('system.refreshButton')}>
            {t('system.refreshButton')}
          </Button>
        }
      />

      {systemHealth?.fetch_error ? (
        <Alert
          type="error"
          showIcon
          title={systemHealth.fetch_error}
          action={<Button size="small" onClick={() => void refresh()} loading={loading}>{t('common.retry', { defaultValue: 'Retry' })}</Button>}
        />
      ) : null}
      {hasHealthIssue ? <Alert type="error" showIcon title={t('system.healthTroubleshootingHint')} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card padding="base">
          <Text size="xs" tone="muted">{t('system.checkedAtLabel')}</Text>
          <div className="mt-2 text-lg font-semibold">{formatHealthTimestamp(systemHealth?.checked_at || systemHealth?.fetched_at)}</div>
        </Card>
        <Card padding="base">
          <Text size="xs" tone="muted">{t('system.httpStatusLabel')}</Text>
          <div className="mt-2 text-lg font-semibold">{systemHealth?.http_status || t('common.notAvailable')}</div>
        </Card>
        <Card padding="base">
          <Text size="xs" tone="muted">{t('system.probeDurationLabel')}</Text>
          <div className="mt-2 text-lg font-semibold">
            {typeof systemHealth?.duration_ms === 'number' ? `${systemHealth.duration_ms} ms` : t('common.notAvailable')}
          </div>
        </Card>
      </div>

      <Card padding="base">
        <Heading level={2} className="mb-4 text-base">{t('system.infrastructureHealthSection')}</Heading>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <span className={`flex size-10 items-center justify-center rounded-lg ${dependencyIsHealthy(systemHealth?.checks?.database) ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-destructive'}`}>
              <Database aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium">{t('system.databaseConnection')}</div>
            </div>
            <Tag color={dependencyIsHealthy(systemHealth?.checks?.database) ? 'success' : 'error'}>
              {dependencyLabel(systemHealth?.checks?.database)}
            </Tag>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <span className={`flex size-10 items-center justify-center rounded-lg ${dependencyIsHealthy(systemHealth?.checks?.redis) ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-destructive'}`}>
              <Server aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium">{t('system.redisCacheAndLock')}</div>
            </div>
            <Tag color={dependencyIsHealthy(systemHealth?.checks?.redis) ? 'success' : 'error'}>
              {dependencyLabel(systemHealth?.checks?.redis)}
            </Tag>
          </div>
        </div>
      </Card>

      {oidcConfig ? (
        <>
          <DefinitionCard title={t('system.oidcProfileSection')} rows={oidcRows} />
          <Card padding="base">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
              <Heading level={2} className="text-base">{t('system.oidcProfileSection')}</Heading>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Text size="xs" tone="muted" className="mb-2">{t('system.supportedScopes')}</Text>
                <div className="flex flex-wrap gap-2">
                  {oidcConfig.scopes_supported?.map((scope: string) => <Tag key={scope} color={scope === 'admin' ? 'warning' : 'primary'}>{scope}</Tag>)}
                </div>
              </div>
              <div>
                <Text size="xs" tone="muted" className="mb-2">{t('system.grantTypesSupported')}</Text>
                <div className="flex flex-wrap gap-2">
                  {oidcConfig.grant_types_supported?.map((grant: string) => <Tag key={grant}>{grant}</Tag>)}
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : null}

      {securityPolicy ? <DefinitionCard title={t('system.securityPolicy')} rows={policyRows} /> : null}
    </div>
  );
}
