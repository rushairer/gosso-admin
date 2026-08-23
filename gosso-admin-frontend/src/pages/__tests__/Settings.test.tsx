import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Settings from '../Settings';

const { isLoggedIn, getUserProfile, redirectToAuthorize } = vi.hoisted(() => ({
  isLoggedIn: vi.fn(),
  getUserProfile: vi.fn(),
  redirectToAuthorize: vi.fn(),
}));

vi.mock('../../auth', () => ({
  gossoClient: { isLoggedIn, getUserProfile },
  redirectToAuthorize,
}));

vi.mock('../settings/ProfilePanel', () => ({ default: () => <div>Profile content</div> }));
vi.mock('../settings/MFAPanel', () => ({ default: () => <div>MFA content</div> }));
vi.mock('../settings/PasskeysPanel', () => ({ default: () => <div>Passkeys content</div> }));
vi.mock('../settings/SessionsPanel', () => ({ default: () => <div>Sessions content</div> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function renderSettings(path = '/settings/profile') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/settings/:tab" element={<Settings />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Settings access gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserProfile.mockReturnValue({ sub: 'account-1', preferred_username: 'operator' });
  });

  it('redirects an anonymous visitor to authorization', async () => {
    isLoggedIn.mockReturnValue(false);
    renderSettings();
    await waitFor(() => expect(redirectToAuthorize).toHaveBeenCalledWith('/settings/profile'));
    expect(screen.getByText('settings.checkingAccess')).toBeInTheDocument();
  });

  it('shows the profile panel for a signed-in account', async () => {
    isLoggedIn.mockReturnValue(true);
    renderSettings();
    expect(await screen.findByText('Profile content')).toBeInTheDocument();
    expect(redirectToAuthorize).not.toHaveBeenCalled();
  });
});
