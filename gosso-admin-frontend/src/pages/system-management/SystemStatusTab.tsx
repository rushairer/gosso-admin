import { useTranslation } from 'react-i18next';
import { Shield as ShieldIcon, RefreshCw } from 'lucide-react';
import {
  Badge,
  Button,
  DefinitionList,
  DefinitionRow,
  Feedback,
  PageLoader,
  PanelHeader,
  PlainSection,
} from '../../components/ui';
import { useSystemStatus } from '../../features/system/useSystemStatus';
import { dependencyLabel, dependencyIsHealthy, formatHealthTimestamp } from '../../utils/format';

export default function SystemStatusTab() {
  const { t } = useTranslation();
  const { systemHealth, oidcConfig, securityPolicy, loading, refresh } = useSystemStatus();

  const hasHealthIssue =
    !systemHealth?.ready ||
    !dependencyIsHealthy(systemHealth?.checks?.database) ||
    !dependencyIsHealthy(systemHealth?.checks?.redis);

  if (loading) {
    return <PageLoader message={t('system.loadingStatus')} />;
  }

  return (
    <div>
      <PanelHeader
        title={t('system.title')}
        description={t('system.description')}
        action={
          <Button
            variant="secondary"
            className="content-action"
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
          <div className="mb-md">
            <Feedback type="error">{systemHealth.fetch_error}</Feedback>
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
              className="inline-icon"
              style={{
                background:
                  systemHealth?.checks?.database === 'ok' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: systemHealth?.checks?.database === 'ok' ? 'var(--success-color)' : 'var(--danger-color)',
              }}
            >
              <ShieldIcon style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '14px' }}>
                {t('system.databaseConnection')}
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginTop: '2px',
                  color: dependencyIsHealthy(systemHealth?.checks?.database)
                    ? 'var(--success-color)'
                    : 'var(--danger-color)',
                }}
              >
                {dependencyLabel(systemHealth?.checks?.database)}
              </div>
            </div>
          </div>

          {/* Redis Health */}
          <div className="inline-status-row">
            <div
              className="inline-icon"
              style={{
                background:
                  systemHealth?.checks?.redis === 'ok' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: systemHealth?.checks?.redis === 'ok' ? 'var(--success-color)' : 'var(--danger-color)',
              }}
            >
              <RefreshCw style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '14px' }}>
                {t('system.redisCacheAndLock')}
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginTop: '2px',
                  color: dependencyIsHealthy(systemHealth?.checks?.redis)
                    ? 'var(--success-color)'
                    : 'var(--danger-color)',
                }}
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
              <a
                href={oidcConfig.jwks_uri}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
              >
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
