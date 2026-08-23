import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccountSettings from '../AccountSettings';

const { isLoggedIn, getUserProfile, redirectToAuthorize } = vi.hoisted(() => ({
  isLoggedIn: vi.fn(),
  getUserProfile: vi.fn(),
  redirectToAuthorize: vi.fn(),
}));

vi.mock('../../auth', () => ({
  gossoClient: { isLoggedIn, getUserProfile },
  redirectToAuthorize,
}));

vi.mock('../account-settings/ProfilePanel', () => ({ default: () => <div>Profile content</div> }));
vi.mock('../account-settings/MFAPanel', () => ({ default: () => <div>MFA content</div> }));
vi.mock('../account-settings/PasskeysPanel', () => ({ default: () => <div>Passkeys content</div> }));
vi.mock('../account-settings/SessionsPanel', () => ({ default: () => <div>Sessions content</div> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function renderAccountSettings(path = '/account-settings/profile') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/account-settings/:tab" element={<AccountSettings />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AccountSettings access gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserProfile.mockReturnValue({ sub: 'account-1', preferred_username: 'operator' });
  });

  it('redirects an anonymous visitor to authorization', async () => {
    isLoggedIn.mockReturnValue(false);
    renderAccountSettings();
    await waitFor(() => expect(redirectToAuthorize).toHaveBeenCalledWith('/account-settings/profile'));
    expect(screen.getByText('accountSettings.checkingAccess')).toBeInTheDocument();
  });

  it('shows the profile panel for a signed-in account', async () => {
    isLoggedIn.mockReturnValue(true);
    renderAccountSettings();
    expect(await screen.findByText('Profile content')).toBeInTheDocument();
    expect(redirectToAuthorize).not.toHaveBeenCalled();
  });
});
