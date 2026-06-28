import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../Login';
import { authSession, fetchUserProfile, redirectToAuthorize } from '../../auth';

vi.mock('../../auth', () => ({
  authSession: {
    saveTokenSet: vi.fn(),
  },
  fetchUserProfile: vi.fn(),
  redirectToAuthorize: vi.fn(),
}));

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            access_token: 'direct-login-token',
            refresh_token: 'direct-refresh-token',
            expires_in: 900,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.mocked(fetchUserProfile).mockResolvedValue({ sub: 'admin' });
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
      expect(authSession.saveTokenSet).toHaveBeenCalledWith({
        access_token: 'direct-login-token',
        refresh_token: 'direct-refresh-token',
        expires_in: 900,
      });
      expect(redirectToAuthorize).toHaveBeenCalledWith('/admin');
    });
  });
});
