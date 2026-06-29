import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPassword from '../ForgotPassword';
import ResetPassword from '../ResetPassword';

describe('password reset pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'ok' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
  });

  it('submits the forgot password request to the relative API and shows neutral success', async () => {
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <ForgotPassword />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email|邮箱/i), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link|发送重置链接/i }));

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      });
      expect(screen.getByText(/reset link has been sent|重置链接已经发送/i)).toBeInTheDocument();
    });
  });

  it('blocks reset submission when passwords do not match', async () => {
    render(
      <MemoryRouter initialEntries={['/reset-password#token=abc']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/^new password$|^新密码$/i), 'NewPassword123');
    await userEvent.type(screen.getByLabelText(/confirm new password|确认新密码/i), 'Different1234');
    await userEvent.click(screen.getByRole('button', { name: /reset password|重置密码/i }));

    expect(await screen.findByText(/passwords do not match|不一致/i)).toBeInTheDocument();
    expect(window.fetch).not.toHaveBeenCalled();
  });

  it('submits token from the URL fragment when resetting password', async () => {
    render(
      <MemoryRouter initialEntries={['/reset-password#token=abc']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/^new password$|^新密码$/i), 'NewPassword123');
    await userEvent.type(screen.getByLabelText(/confirm new password|确认新密码/i), 'NewPassword123');
    await userEvent.click(screen.getByRole('button', { name: /reset password|重置密码/i }));

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'abc', new_password: 'NewPassword123' }),
      });
      expect(screen.getByText(/password has been reset|密码已重置/i)).toBeInTheDocument();
    });
  });

  it('trims token whitespace from the URL fragment before submitting', async () => {
    render(
      <MemoryRouter initialEntries={['/reset-password#token=%20abc%20']}>
        <ResetPassword />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/^new password$|^新密码$/i), 'NewPassword123');
    await userEvent.type(screen.getByLabelText(/confirm new password|确认新密码/i), 'NewPassword123');
    await userEvent.click(screen.getByRole('button', { name: /reset password|重置密码/i }));

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith('/api/v1/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'abc', new_password: 'NewPassword123' }),
      });
    });
  });

  it('disables reset submission when the reset link has no token', () => {
    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <ResetPassword />
      </MemoryRouter>
    );

    expect(screen.getByText(/missing a token|缺少令牌/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password|重置密码/i })).toBeDisabled();
  });
});
