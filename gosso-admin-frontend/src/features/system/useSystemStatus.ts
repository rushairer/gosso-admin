import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { siteSettingsService, systemService } from '../../services';
import type { SystemHealth } from '../../services';
import type { OidcConfiguration, SecurityPolicy } from '../../types/api';
import { logger } from '../../utils/logger';

function unavailableHealth(reason: unknown, fallbackMessage: string): SystemHealth {
  const message = reason instanceof Error ? reason.message : fallbackMessage;
  return {
    status: 'unavailable',
    ready: false,
    checks: { database: 'error', redis: 'error' },
    http_status: 0,
    fetched_at: new Date().toISOString(),
    fetch_error: message,
  };
}

export function useSystemStatus() {
  const { t } = useTranslation();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [oidcConfig, setOidcConfig] = useState<OidcConfiguration | null>(null);
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [healthResult, oidcResult, securityResult] = await Promise.allSettled([
      systemService.fetchReadiness(),
      systemService.fetchOidcConfiguration(),
      siteSettingsService.getSecurityPolicy(),
    ]);

    if (healthResult.status === 'fulfilled') {
      setSystemHealth(healthResult.value);
    } else {
      logger.error('Error fetching readiness health status', healthResult.reason);
      setSystemHealth(unavailableHealth(healthResult.reason, t('system.readinessFailed')));
    }

    if (oidcResult.status === 'fulfilled') {
      setOidcConfig(oidcResult.value);
    } else {
      logger.error('Error fetching OIDC configuration metadata', oidcResult.reason);
      setOidcConfig(null);
    }
    setSecurityPolicy(securityResult.status === 'fulfilled' ? securityResult.value : null);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { systemHealth, oidcConfig, securityPolicy, loading, refresh };
}
