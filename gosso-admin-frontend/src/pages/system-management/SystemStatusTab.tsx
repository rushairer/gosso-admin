import { useTranslation } from 'react-i18next';
import { Shield as ShieldIcon, RefreshCw } from 'lucide-react';
import {
  Badge,
  Button,
  DefinitionList,
  DefinitionRow,
  Feedback,
  PanelHeader,
  PlainSection,
  Skeleton,
} from '../../components/ui';
import { useSystemStatus } from '../../features/system/useSystemStatus';
import { dependencyLabel, dependencyIsHealthy, formatHealthTimestamp } from '../../utils/format';

function SystemStatusSkeleton() {
  return (
    <div className="panel-stack" aria-busy="true" aria-label="Loading system status">
      <div className="flex-row items-center justify-between mb-lg">
        <div>
          <Skeleton height={28} width={200} className="mb-xs" />
          <Skeleton height={16} width={320} />
        </div>
        <Skeleton height={36} width={100} />
      </div>
      <div className="metric-strip">
        <div className="metric-item">
          <Skeleton height={14} width={80} className="mb-xs" />
          <Skeleton height={20} width={120} />
        </div>
        <div className="metric-item">
          <Skeleton height={14} width={80} className="mb-xs" />
          <Skeleton height={20} width={60} />
        </div>
        <div className="metric-item">
          <Skeleton height={14} width={80} className="mb-xs" />
          <Skeleton height={20} width={100} />
        </div>
      </div>
      <div className="inline-status-list mt-md">
        <div className="inline-status-row">
          <Skeleton variant="rectangular" width={34} height={34} />
          <div className="flex-1">
            <Skeleton height={14} width={140} className="mb-xs" />
            <Skeleton height={18} width={80} />
          </div>
        </div>
        <div className="inline-status-row">
          <Skeleton variant="rectangular" width={34} height={34} />
          <div className="flex-1">
            <Skeleton height={14} width={140} className="mb-xs" />
            <Skeleton height={18} width={80} />
          </div>
        </div>
      </div>
    </div>
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
    return <SystemStatusSkeleton />;
  }

  return (
    <div>
      <PanelHeader
        title={t('system.title')}
        description={t('system.description')}
        action={
          <Button
            variant="secondary"
            onClick={() => void refresh()}
            loading={loading}
            icon={<RefreshCw size={16} />}
            title={t('system.refreshButton')}
          >
            {t('system.refreshButton')}
          </Button>
        }
      />

      <PlainSection title={t('system.infrastructureHealthSection')}>
        <div className="metric-strip">
          <div className="metric-item">
            <div className="field-label">{t('system.checkedAtLabel')}</div>
            <div className="field-value">
              {formatHealthTimestamp(systemHealth?.checked_at || systemHealth?.fetched_at)}
            </div>
          </div>
          <div className="metric-item">
            <div className="field-label">{t('system.httpStatusLabel')}</div>
            <div className="field-value">{systemHealth?.http_status || t('common.notAvailable')}</div>
          </div>
          <div className="metric-item">
            <div className="field-label">{t('system.probeDurationLabel')}</div>
            <div className="field-value">
              {typeof systemHealth?.duration_ms === 'number'
                ? `${systemHealth.duration_ms} ms`
                : t('common.notAvailable')}
            </div>
          </div>
        </div>

        {systemHealth?.fetch_error && (
          <div className="mb-md flex-row items-center justify-between gap-md">
            <Feedback type="error">{systemHealth.fetch_error}</Feedback>
            <Button variant="secondary" size="sm" onClick={() => void refresh()} loading={loading}>
              {t('common.retry', { defaultValue: 'Retry' })}
            </Button>
          </div>
        )}

        {hasHealthIssue && (
          <div className="mb-md">
            <Feedback type="error">{t('system.healthTroubleshootingHint')}</Feedback>
          </div>
        )}

        <div className="inline-status-list mt-md">
          {/* Database Health */}
          <div className="inline-status-row">
            <div
              className={`inline-icon ${systemHealth?.checks?.database === 'ok' ? 'inline-icon--success' : 'inline-icon--danger'}`}
            >
              <ShieldIcon size={20} />
            </div>
            <div>
              <div className="inline-status-title">{t('system.databaseConnection')}</div>
              <div
                className={`inline-status-value ${dependencyIsHealthy(systemHealth?.checks?.database) ? 'inline-status-value--success' : 'inline-status-value--danger'}`}
              >
                {dependencyLabel(systemHealth?.checks?.database)}
              </div>
            </div>
          </div>

          {/* Redis Health */}
          <div className="inline-status-row">
            <div
              className={`inline-icon ${systemHealth?.checks?.redis === 'ok' ? 'inline-icon--success' : 'inline-icon--danger'}`}
            >
              <RefreshCw size={20} />
            </div>
            <div>
              <div className="inline-status-title">{t('system.redisCacheAndLock')}</div>
              <div
                className={`inline-status-value ${dependencyIsHealthy(systemHealth?.checks?.redis) ? 'inline-status-value--success' : 'inline-status-value--danger'}`}
              >
                {dependencyLabel(systemHealth?.checks?.redis)}
              </div>
            </div>
          </div>
        </div>
      </PlainSection>

      {/* OIDC configuration info card */}
      {oidcConfig && (
        <PlainSection title={t('system.oidcProfileSection')}>
          <DefinitionList>
            <DefinitionRow label={t('system.issuerLabel')} mono>
              {oidcConfig.issuer}
            </DefinitionRow>

            <DefinitionRow label={t('system.authorizationEndpoint')} mono>
              {oidcConfig.authorization_endpoint}
            </DefinitionRow>

            <DefinitionRow label={t('system.tokenEndpoint')} mono>
              {oidcConfig.token_endpoint}
            </DefinitionRow>

            <DefinitionRow label={t('system.userinfoEndpoint')} mono>
              {oidcConfig.userinfo_endpoint}
            </DefinitionRow>

            <DefinitionRow label={t('system.jwksUri')} mono>
              <a href={oidcConfig.jwks_uri} target="_blank" rel="noopener noreferrer" className="system-link">
                {oidcConfig.jwks_uri}
              </a>
            </DefinitionRow>

            <DefinitionRow label={t('system.supportedScopes')}>
              <div className="flex-row flex-wrap gap-xs">
                {oidcConfig.scopes_supported?.map((scope: string) => (
                  <Badge key={scope} tone="secondary">
                    {scope}
                  </Badge>
                ))}
              </div>
            </DefinitionRow>

            <DefinitionRow label={t('system.grantTypesSupported')}>
              <div className="flex-row flex-wrap gap-xs">
                {oidcConfig.grant_types_supported?.map((gt: string) => (
                  <Badge key={gt} tone="secondary">
                    {gt}
                  </Badge>
                ))}
              </div>
            </DefinitionRow>
          </DefinitionList>
        </PlainSection>
      )}

      {securityPolicy && (
        <PlainSection title={t('system.securityPolicy')}>
          <p className="text-muted mb-md">{t('system.securityPolicyDescription')}</p>
          <DefinitionList>
            <DefinitionRow label={t('system.sessionTtl')}>{securityPolicy.session_ttl}</DefinitionRow>
            <DefinitionRow label={t('system.maxSessions')}>{securityPolicy.max_sessions}</DefinitionRow>
            <DefinitionRow label={t('system.tokenExpiry')}>
              {securityPolicy.access_token_expiry} / {securityPolicy.refresh_token_expiry}
            </DefinitionRow>
            <DefinitionRow label={t('system.loginRateLimit')}>
              {securityPolicy.login_max_attempts} / {securityPolicy.login_rate_limit_window}
            </DefinitionRow>
            <DefinitionRow label={t('system.mfaRateLimit')}>
              {securityPolicy.mfa_account_max_attempts} / {securityPolicy.mfa_account_rate_limit_window}
            </DefinitionRow>
          </DefinitionList>
        </PlainSection>
      )}
    </div>
  );
}
