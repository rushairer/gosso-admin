import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { siteSettingsService, systemService } from '../../services';
import SystemStatusTab from './SystemStatusTab';

vi.mock('../../services', () => ({
  systemService: {
    fetchReadiness: vi.fn(),
    fetchOidcConfiguration: vi.fn(),
  },
  siteSettingsService: { getSecurityPolicy: vi.fn() },
}));

describe('SystemStatusTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(systemService.fetchReadiness).mockResolvedValue({
      status: 'ok',
      ready: true,
      checks: { database: 'ok', redis: 'ok' },
      checked_at: '2026-08-23T12:00:00.000Z',
      duration_ms: 12,
      http_status: 200,
    });
    vi.mocked(systemService.fetchOidcConfiguration).mockResolvedValue({
      issuer: 'https://sso.example.test',
      authorization_endpoint: 'https://sso.example.test/authorize',
      token_endpoint: 'https://sso.example.test/token',
      userinfo_endpoint: 'https://sso.example.test/userinfo',
      jwks_uri: 'https://sso.example.test/jwks',
    });
    vi.mocked(siteSettingsService.getSecurityPolicy).mockResolvedValue({
      session_ttl: '24h',
      max_sessions: 5,
      max_session_age: '0s',
      access_token_expiry: '15m',
      refresh_token_expiry: '168h',
      id_token_expiry: '15m',
      enforce_ip_binding: false,
      enforce_pkce_for_confidential: true,
      login_max_attempts: 10,
      login_rate_limit_window: '15m',
      mfa_account_max_attempts: 10,
      mfa_account_rate_limit_window: '5m',
      password_reset_token_ttl: '1h',
      webauthn_enabled: true,
    });
  });

  it('requests health and OIDC metadata together, then renders both results', async () => {
    render(<SystemStatusTab />);

    expect(systemService.fetchReadiness).toHaveBeenCalledTimes(1);
    expect(systemService.fetchOidcConfiguration).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('https://sso.example.test')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });
});
