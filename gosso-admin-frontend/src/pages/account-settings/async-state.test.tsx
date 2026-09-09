import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageProvider } from '@gouno/ui/core';
import MFAPanel from './MFAPanel';
import PasskeysPanel from './PasskeysPanel';
import SessionsPanel from './SessionsPanel';

const hookState = vi.hoisted(() => ({
  mfa: {} as any,
  passkeys: {} as any,
  sessions: {} as any,
}));

vi.mock('@gosso/client/react', () => ({
  useMfa: () => hookState.mfa,
  usePasskeys: () => hookState.passkeys,
  useSessions: () => hookState.sessions,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../components/auth/SudoContext', () => ({
  useSudo: () => ({
    requireSudo: vi.fn(),
    clearSudo: vi.fn(),
  }),
}));

vi.mock('../../auth', () => ({ logout: vi.fn() }));

function renderPanel(panel: React.ReactNode) {
  return render(<MessageProvider>{panel}</MessageProvider>);
}

describe('account settings async state semantics', () => {
  beforeEach(() => {
    hookState.mfa = {
      status: { enabled: false, types: [] },
      enrollment: null,
      backupCodes: [],
      loading: true,
      error: null,
      reload: vi.fn().mockResolvedValue({ enabled: false, types: [] }),
      startEnroll: vi.fn(),
      activate: vi.fn(),
      disable: vi.fn(),
      regenerateBackupCodes: vi.fn(),
      cancelEnroll: vi.fn(),
    };
    hookState.passkeys = {
      passkeys: [],
      loading: true,
      error: null,
      reload: vi.fn().mockResolvedValue([]),
      register: vi.fn(),
      remove: vi.fn(),
    };
    hookState.sessions = {
      sessions: [],
      currentSession: null,
      loading: true,
      error: null,
      reload: vi.fn().mockResolvedValue({ list: [], current: null }),
      revoke: vi.fn(),
    };
  });

  it('does not present the SDK default MFA-disabled state when the initial status request failed', () => {
    hookState.mfa.loading = false;
    hookState.mfa.error = 'MFA API unavailable';

    renderPanel(<MFAPanel />);

    expect(screen.getByText('MFA API unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.retry' })).toBeInTheDocument();
    expect(screen.queryByText('mfa.statusDisabled')).not.toBeInTheDocument();
    expect(screen.queryByText('mfa.mfaNotEnrolledDescription')).not.toBeInTheDocument();
  });

  it('keeps a known disabled MFA state visible during a later operation instead of returning to skeletons', async () => {
    hookState.mfa.loading = false;
    const view = renderPanel(<MFAPanel />);

    expect(screen.getByText('mfa.mfaNotEnrolledDescription')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByLabelText('mfa.loadingMfa')).not.toBeInTheDocument());

    hookState.mfa.loading = true;
    view.rerender(
      <MessageProvider>
        <MFAPanel />
      </MessageProvider>
    );

    expect(screen.queryByLabelText('mfa.loadingMfa')).not.toBeInTheDocument();
    expect(screen.getByText('mfa.mfaNotEnrolledDescription')).toBeInTheDocument();
  });

  it('does not render Passkeys empty state for an unresolved fatal load error', () => {
    hookState.passkeys.loading = false;
    hookState.passkeys.error = 'Passkey API unavailable';

    renderPanel(<PasskeysPanel />);

    expect(screen.getByText('Passkey API unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.retry' })).toBeInTheDocument();
    expect(screen.queryByText('passkeys.noPasskeysTitle')).not.toBeInTheDocument();
  });

  it('keeps a known-empty Passkeys state visible while a later mutation is loading', async () => {
    hookState.passkeys.loading = false;
    const view = renderPanel(<PasskeysPanel />);

    expect(screen.getByText('passkeys.noPasskeysTitle')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByLabelText('passkeys.loadingPasskeys')).not.toBeInTheDocument());

    hookState.passkeys.loading = true;
    view.rerender(
      <MessageProvider>
        <PasskeysPanel />
      </MessageProvider>
    );

    expect(screen.queryByLabelText('passkeys.loadingPasskeys')).not.toBeInTheDocument();
    expect(screen.getByText('passkeys.noPasskeysTitle')).toBeInTheDocument();
  });

  it('does not render an empty sessions table or empty state for an initial load error', () => {
    hookState.sessions.loading = false;
    hookState.sessions.error = 'Session API unavailable';

    renderPanel(<SessionsPanel />);

    expect(screen.getByText('Session API unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.retry' })).toBeInTheDocument();
    expect(screen.queryByText('sessions.noSessionsTitle')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
