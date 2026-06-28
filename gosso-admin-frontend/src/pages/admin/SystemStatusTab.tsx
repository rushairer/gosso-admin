import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield as ShieldIcon, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../auth';
import { DefinitionList, DefinitionRow, Feedback, PanelHeader, PlainSection, Tag } from '../../components/ui';
import type { OidcConfiguration, DependencyStatus } from '../../types/api';
import { dependencyLabel, dependencyIsHealthy, formatHealthTimestamp } from '../../utils/format';
import { logger } from '../../utils/logger';

interface SystemHealth {
  status: string;
  ready: boolean;
  checks: {
    database?: DependencyStatus;
    redis?: DependencyStatus;
  };
  checked_at?: string;
  duration_ms?: number;
  http_status?: number;
  fetched_at?: string;
  fetch_error?: string;
}

export default function SystemStatusTab() {
  const { t } = useTranslation();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [oidcConfig, setOidcConfig] = useState<OidcConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  const hasHealthIssue =
    !systemHealth?.ready ||
    !dependencyIsHealthy(systemHealth?.checks?.database) ||
    !dependencyIsHealthy(systemHealth?.checks?.redis);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);

      try {
        const readRes = await apiFetch('/readiness');
        const contentType = readRes.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await readRes.text();
          throw new Error(
            `Readiness returned ${readRes.status} ${contentType || 'unknown content-type'}: ${text.slice(0, 120)}`
          );
        }
        const readBody = (await readRes.json()) as SystemHealth;
        setSystemHealth({
          ...readBody,
          http_status: readBody.http_status ?? readRes.status,
          fetched_at: new Date().toISOString(),
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to reach readiness endpoint';
        logger.error('Error fetching readiness health status', e);
        setSystemHealth({
          status: 'unavailable',
          ready: false,
          checks: { database: 'error', redis: 'error' },
          http_status: 0,
          fetched_at: new Date().toISOString(),
          fetch_error: message,
        });
      }

      try {
        const oidcRes = await apiFetch('/.well-known/openid-configuration');
        const oidcBody = await oidcRes.json();
        setOidcConfig(oidcBody);
      } catch (e) {
        logger.error('Error fetching OIDC configuration metadata', e);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center" style={{ padding: '60px 0' }}>
        <div
          style={{
            margin: '0 auto 16px auto',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.06)',
            borderTopColor: 'var(--color-primary)',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p className="text-muted">{t('system.loadingStatus')}</p>
      </div>
    );
  }

  return (
    <div>
      <PanelHeader
        title={t('system.title')}
        description={t('system.description')}
        action={
          <button
            className="btn btn-secondary content-action"
            type="button"
            onClick={fetchSystemStatus}
            disabled={loading}
            title={t('system.refreshButton')}
          >
            <RefreshCw />
            {t('system.refreshButton')}
          </button>
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
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.10)',
              border: '1px solid rgba(239, 68, 68, 0.16)',
              color: '#fecaca',
              fontSize: '13px',
            }}
          >
            {systemHealth.fetch_error}
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
                  <Tag key={scope} tone="secondary">
                    {scope}
                  </Tag>
                ))}
              </div>
            </DefinitionRow>

            <DefinitionRow label={t('system.grantTypesSupported')}>
              <div className="flex-row flex-wrap gap-xs">
                {oidcConfig.grant_types_supported?.map((gt: string) => (
                  <Tag key={gt} tone="secondary">
                    {gt}
                  </Tag>
                ))}
              </div>
            </DefinitionRow>
          </DefinitionList>
        </PlainSection>
      )}
    </div>
  );
}
