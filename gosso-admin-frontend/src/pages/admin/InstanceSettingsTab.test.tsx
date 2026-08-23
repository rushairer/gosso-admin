import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui';
import { instanceSettingsService } from '../../services';
import InstanceSettingsTab from './InstanceSettingsTab';

vi.mock('../../services', () => ({
  instanceSettingsService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    getSecurityPolicy: vi.fn(),
  },
}));

const settings = {
  product_name: 'Acme Identity',
  logo_url: '',
  favicon_url: '',
  primary_color: '#3b82f6',
  login_title: '',
  login_description: '',
  login_background_url: '',
  support_email: '',
  support_url: '',
  privacy_policy_url: '',
  terms_of_service_url: '',
  default_locale: 'en' as const,
};

describe('InstanceSettingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(instanceSettingsService.getSettings).mockResolvedValue(settings);
    vi.mocked(instanceSettingsService.updateSettings).mockImplementation(async (next) => next);
    vi.mocked(instanceSettingsService.getSecurityPolicy).mockResolvedValue({
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

  it('loads settings and saves the updated brand form', async () => {
    render(
      <ToastProvider>
        <InstanceSettingsTab />
      </ToastProvider>
    );
    expect(await screen.findByDisplayValue('Acme Identity')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();

    const productName = screen.getByDisplayValue('Acme Identity');
    await userEvent.clear(productName);
    await userEvent.type(productName, 'Acme SSO');
    await userEvent.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() =>
      expect(instanceSettingsService.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ product_name: 'Acme SSO' })
      )
    );
  });
});
