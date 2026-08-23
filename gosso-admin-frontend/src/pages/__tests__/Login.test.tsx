import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../Login';
import { gossoClient, redirectToAuthorize } from '../../auth';
import { instanceSettingsService } from '../../services';

const authMethods = vi.hoisted(() => ({
  loginWithPassword: vi.fn(),
  loginWithPasskey: vi.fn(),
  verifyMfa: vi.fn(),
}));

vi.mock('../../auth', () => ({
  gossoClient: authMethods,
  redirectToAuthorize: vi.fn(),
}));

vi.mock('../../services', () => ({
  instanceSettingsService: {
    getPublicBranding: vi.fn(),
  },
}));

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(gossoClient.loginWithPassword).mockResolvedValue({
      access_token: 'direct-login-token',
      refresh_token: 'direct-refresh-token',
      expires_in: 900,
    });
    vi.mocked(redirectToAuthorize).mockResolvedValue(undefined);
    vi.mocked(instanceSettingsService.getPublicBranding).mockResolvedValue({
      product_name: 'GOSSO',
      logo_url: '',
      favicon_url: '',
      login_title: '',
      login_description: '',
      login_background_url: '',
    });
  });

  it('continues through admin OAuth when opened directly', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText(/username|用户名/i), 'admin');
    await userEvent.type(screen.getByPlaceholderText(/password|密码/i), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: /^(sign in|登录)$/i }));

    await waitFor(() => {
      expect(gossoClient.loginWithPassword).toHaveBeenCalledWith('admin', 'admin123');
      expect(redirectToAuthorize).toHaveBeenCalledWith('/admin');
    });
  });

  it('links to the forgot password flow', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: /forgot password|忘记密码/i })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
  });

  it('applies public branding while retaining the login flow', async () => {
    vi.mocked(instanceSettingsService.getPublicBranding).mockResolvedValueOnce({
      product_name: 'Acme Identity',
      logo_url: '',
      favicon_url: '',
      login_title: 'Welcome to Acme',
      login_description: 'Sign in securely',
      login_background_url: '',
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Welcome to Acme' })).toBeInTheDocument();
    expect(screen.getByText('Sign in securely')).toBeInTheDocument();
    expect(document.title).toBe('Acme Identity');
  });
});
