import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SudoProvider, useSudo } from '../SudoContext';
import { ToastProvider } from '../../ui';
import { gossoClient } from '../../../auth';

const authMethods = vi.hoisted(() => ({
  stepUpMfa: vi.fn(),
  loginWithPasskey: vi.fn(),
}));

const mockSession = vi.hoisted(() => ({
  value: {
    loggedIn: true,
    profile: { sub: 'admin-1', preferred_username: 'superadmin', roles: ['admin'] },
    isAdmin: true,
  },
}));

vi.mock('../../../auth', () => ({
  gossoClient: authMethods,
}));

vi.mock('@gosso/client/react', async () => {
  const actual = await vi.importActual('@gosso/client/react');
  return {
    ...actual,
    useSession: () => mockSession.value,
  };
});

function TestConsumer({ onAction }: { onAction: () => void }) {
  const { requireSudo, isSudoActive } = useSudo();
  return (
    <div>
      <div data-testid="sudo-status">{isSudoActive() ? 'active' : 'inactive'}</div>
      <button
        onClick={() => {
          void requireSudo({
            actionTitle: '敏感配置测试',
            onSuccess: onAction,
          });
        }}
      >
        Trigger Sudo Action
      </button>
    </div>
  );
}

describe('SudoContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('prompts SudoModal when sudo is not active, then performs action upon TOTP verification', async () => {
    const actionSpy = vi.fn();
    vi.mocked(gossoClient.stepUpMfa).mockResolvedValue({
      auth_time: Date.now() / 1000,
      amr: ['pwd', 'otp'],
    });

    render(
      <ToastProvider>
        <SudoProvider>
          <TestConsumer onAction={actionSpy} />
        </SudoProvider>
      </ToastProvider>
    );

    expect(screen.getByTestId('sudo-status')).toHaveTextContent('inactive');

    await userEvent.click(screen.getByRole('button', { name: 'Trigger Sudo Action' }));

    // Modal should be opened
    expect(screen.getByText('敏感配置测试')).toBeInTheDocument();
    expect(screen.getByText(/superadmin/)).toBeInTheDocument();
    expect(actionSpy).not.toHaveBeenCalled();

    // Type TOTP code and submit
    await userEvent.type(screen.getByPlaceholderText(/code|验证码/i), '654321');
    await userEvent.click(screen.getByRole('button', { name: /^(verify|验证)$/i }));

    await waitFor(() => {
      expect(gossoClient.stepUpMfa).toHaveBeenCalledWith('654321');
      expect(actionSpy).toHaveBeenCalledTimes(1);
    });

    // Check Sudo is now active in storage
    const stored = sessionStorage.getItem('gosso-admin:sudo_active_until');
    expect(stored).not.toBeNull();
    expect(parseInt(stored!, 10)).toBeGreaterThan(Date.now());
  });

  it('skips prompting when sudo is already active within grace period', async () => {
    const actionSpy = vi.fn();
    sessionStorage.setItem('gosso-admin:sudo_active_until', String(Date.now() + 10 * 60 * 1000));

    render(
      <ToastProvider>
        <SudoProvider>
          <TestConsumer onAction={actionSpy} />
        </SudoProvider>
      </ToastProvider>
    );

    expect(screen.getByTestId('sudo-status')).toHaveTextContent('active');

    await userEvent.click(screen.getByRole('button', { name: 'Trigger Sudo Action' }));

    // Action executed immediately without modal
    expect(actionSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('敏感配置测试')).not.toBeInTheDocument();
  });

  it('supports Passkey verification to step up', async () => {
    const actionSpy = vi.fn();
    vi.mocked(gossoClient.loginWithPasskey).mockResolvedValue({
      access_token: 'step-up-token',
      expires_in: 900,
    });

    render(
      <ToastProvider>
        <SudoProvider>
          <TestConsumer onAction={actionSpy} />
        </SudoProvider>
      </ToastProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Trigger Sudo Action' }));
    expect(screen.getByText('敏感配置测试')).toBeInTheDocument();

    const passkeyBtn = screen.getByRole('button', { name: /passkey|通行密钥/i });
    await userEvent.click(passkeyBtn);

    await waitFor(() => {
      expect(gossoClient.loginWithPasskey).toHaveBeenCalled();
      expect(actionSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('canceling modal does not execute the action', async () => {
    const actionSpy = vi.fn();

    render(
      <ToastProvider>
        <SudoProvider>
          <TestConsumer onAction={actionSpy} />
        </SudoProvider>
      </ToastProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Trigger Sudo Action' }));
    expect(screen.getByText('敏感配置测试')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancel|取消/i });
    await userEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('敏感配置测试')).not.toBeInTheDocument();
      expect(actionSpy).not.toHaveBeenCalled();
    });
  });
});
