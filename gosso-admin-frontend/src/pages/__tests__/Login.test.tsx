import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../Login';
import { AuthenticationError } from '@gosso/client';
import { gossoClient, logout, redirectToAuthorize } from '../../auth';
import { siteSettingsService } from '../../services';

const mockSession = vi.hoisted(() => ({
  value: { loggedIn: false, profile: null as any, isAdmin: false },
}));

const authMethods = vi.hoisted(() => ({
  loginWithPassword: vi.fn(),
  loginWithPasskey: vi.fn(),
  verifyMfa: vi.fn(),
  stepUpMfa: vi.fn(),
}));

vi.mock('@gosso/client/react', async () => {
  const actual = await vi.importActual('@gosso/client/react');
  return {
    ...actual,
    useSession: () => mockSession.value,
  };
});

vi.mock('../../auth', () => ({
  gossoClient: authMethods,
  redirectToAuthorize: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../../services', () => ({
  siteSettingsService: {
    getPublicSiteBranding: vi.fn(),
  },
}));

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.value = { loggedIn: false, profile: null, isAdmin: false };
    vi.mocked(gossoClient.loginWithPassword).mockResolvedValue({
      access_token: 'direct-login-token',
      refresh_token: 'direct-refresh-token',
      expires_in: 900,
    });
    vi.mocked(redirectToAuthorize).mockResolvedValue(undefined);
    vi.mocked(siteSettingsService.getPublicSiteBranding).mockResolvedValue({
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
      expect(redirectToAuthorize).toHaveBeenCalledWith('/system-management');
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
    vi.mocked(siteSettingsService.getPublicSiteBranding).mockResolvedValueOnce({
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
    expect(document.title).toMatch(/^(Sign In|登录) - Acme Identity$/);
  });

  it('uses the verified profile-load error message from the hosted flow', async () => {
    vi.mocked(gossoClient.loginWithPassword).mockRejectedValueOnce(
      new AuthenticationError('Failed to fetch user profile', 'USER_PROFILE_FAILED')
    );
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText(/username|用户名/i), 'admin');
    await userEvent.type(screen.getByPlaceholderText(/password|密码/i), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: /^(sign in|登录)$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to load your user profile|无法加载用户资料/i);
  });

  it('renders Sudo Mode when reason=mfa and user is already logged in', async () => {
    mockSession.value = {
      loggedIn: true,
      profile: { sub: 'admin-1', preferred_username: 'superadmin', roles: ['admin'] },
      isAdmin: true,
    };
    vi.mocked(gossoClient.stepUpMfa).mockResolvedValue({
      auth_time: Date.now() / 1000,
      amr: ['pwd', 'otp'],
    });

    render(
      <MemoryRouter initialEntries={['/login?reason=mfa&redirect_uri=%2Fsystem-management%2Fusers']}>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/sudo mode|安全提权验证/i)).toBeInTheDocument();
    expect(screen.getByText(/superadmin/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/password|密码/i)).not.toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/code|验证码/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /^(verify|验证)$/i }));

    await waitFor(() => {
      expect(gossoClient.stepUpMfa).toHaveBeenCalledWith('123456');
    });
  });

  it('supports passkey step-up directly in Sudo Mode', async () => {
    mockSession.value = {
      loggedIn: true,
      profile: { sub: 'admin-1', preferred_username: 'superadmin', roles: ['admin'] },
      isAdmin: true,
    };
    vi.mocked(gossoClient.loginWithPasskey).mockResolvedValue({
      access_token: 'step-up-passkey-token',
      refresh_token: 'refresh',
      expires_in: 900,
    });

    render(
      <MemoryRouter initialEntries={['/login?reason=mfa&redirect_uri=%2Fsystem-management%2Fusers']}>
        <Login />
      </MemoryRouter>
    );

    const passkeyBtn = screen.getByRole('button', { name: /passkey|通行密钥/i });
    await userEvent.click(passkeyBtn);

    await waitFor(() => {
      expect(gossoClient.loginWithPasskey).toHaveBeenCalled();
    });
  });
});
