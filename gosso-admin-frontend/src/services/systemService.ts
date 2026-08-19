import { apiFetch } from '../auth';
import type { OidcConfiguration, DependencyStatus } from '../types/api';

export interface SystemHealth {
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

export const systemService = {
  async fetchReadiness(): Promise<SystemHealth> {
    const res = await apiFetch('/readiness');
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Readiness returned ${res.status} ${contentType || 'unknown content-type'}: ${text.slice(0, 120)}`);
    }
    const body = (await res.json()) as SystemHealth;
    return {
      ...body,
      http_status: body.http_status ?? res.status,
      fetched_at: new Date().toISOString(),
    };
  },

  async fetchOidcConfiguration(): Promise<OidcConfiguration> {
    const res = await apiFetch('/.well-known/openid-configuration');
    if (!res.ok) {
      throw new Error(`Failed to load OIDC configuration: ${res.statusText}`);
    }
    return res.json();
  },
};
