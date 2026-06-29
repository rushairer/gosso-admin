import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../Login';
import { loginWithPassword, redirectToAuthorize } from '../../auth';

vi.mock('../../auth', () => ({
  loginWithPassword: vi.fn(),
  loginWithPasskey: vi.fn(),
  redirectToAuthorize: vi.fn(),
  verifyMfa: vi.fn(),
}));

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loginWithPassword).mockResolvedValue({
      access_token: 'direct-login-token',
      refresh_token: 'direct-refresh-token',
      expires_in: 900,
    });
    vi.mocked(redirectToAuthorize).mockResolvedValue(undefined);
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
      expect(loginWithPassword).toHaveBeenCalledWith('admin', 'admin123');
      expect(redirectToAuthorize).toHaveBeenCalledWith('/admin');
    });
  });

  it('links to the forgot password flow', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /forgot password|忘记密码/i })).toHaveAttribute('href', '/forgot-password');
  });
});
