import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GossoProvider, RequireAuth } from '@gosso/client/react';
import AccountSettings from '../AccountSettings';

const { subscribe, getSnapshot, redirectToAuthorize, mockClient } = vi.hoisted(() => {
  const subscribe = vi.fn(() => () => {});
  const getSnapshot = vi.fn();
  const redirectToAuthorize = vi.fn().mockResolvedValue(undefined);
  const mockClient = {
    subscribe,
    getSnapshot,
    redirectToAuthorize,
  } as any;
  return { subscribe, getSnapshot, redirectToAuthorize, mockClient };
});

vi.mock('../../auth', () => ({
  gossoClient: mockClient,
  redirectToAuthorize,
}));

vi.mock('../account-settings/ProfilePanel', () => ({ default: () => <div>Profile content</div> }));
vi.mock('../account-settings/MFAPanel', () => ({ default: () => <div>MFA content</div> }));
vi.mock('../account-settings/PasskeysPanel', () => ({ default: () => <div>Passkeys content</div> }));
vi.mock('../account-settings/SessionsPanel', () => ({ default: () => <div>Sessions content</div> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function renderAccountSettings(path = '/account-settings/profile') {
  return render(
    <GossoProvider client={mockClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/account-settings/:tab"
            element={
              <RequireAuth redirectTo="/account-settings/profile" fallback={<div>accountSettings.checkingAccess</div>}>
                <AccountSettings />
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </GossoProvider>
  );
}

describe('AccountSettings access gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSnapshot.mockReturnValue({
      loggedIn: true,
      isAdmin: false,
      profile: { sub: 'account-1', preferred_username: 'operator' },
    });
  });

  it('redirects an anonymous visitor to authorization', async () => {
    getSnapshot.mockReturnValue({ loggedIn: false, isAdmin: false, profile: null });
    renderAccountSettings();
    await waitFor(() => expect(redirectToAuthorize).toHaveBeenCalledWith('/account-settings/profile'));
    expect(screen.getByText('accountSettings.checkingAccess')).toBeInTheDocument();
  });

  it('shows the profile panel for a signed-in account', async () => {
    getSnapshot.mockReturnValue({
      loggedIn: true,
      isAdmin: false,
      profile: { sub: 'account-1', preferred_username: 'operator' },
    });
    renderAccountSettings();
    expect(await screen.findByText('Profile content')).toBeInTheDocument();
    expect(redirectToAuthorize).not.toHaveBeenCalled();
  });
});
