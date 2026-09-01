import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GossoProvider, RequireAuth } from '@gosso/client/react';
import Home from '../Home';

const { redirectToAuthorize, logout, subscribe, getSnapshot, mockClient, currentSnapshot } = vi.hoisted(() => {
  const currentSnapshot = {
    value: { loggedIn: false, isAdmin: false, profile: null as any },
  };
  const redirectToAuthorize = vi.fn().mockResolvedValue(undefined);
  const logout = vi.fn().mockResolvedValue(undefined);
  const subscribe = vi.fn(() => () => {});
  const getSnapshot = vi.fn(() => currentSnapshot.value);
  const mockClient = {
    redirectToAuthorize,
    logout,
    subscribe,
    getSnapshot,
  } as any;
  return { redirectToAuthorize, logout, subscribe, getSnapshot, mockClient, currentSnapshot };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../auth', () => ({
  gossoClient: mockClient,
  redirectToAuthorize,
  logout,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, any>) => (options?.name ? `${key}:${options.name}` : key),
  }),
}));

describe('Home page dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSnapshot.value = { loggedIn: false, isAdmin: false, profile: null };
  });

  it('returns root-entry authentication to the overview, not system management', async () => {
    render(
      <GossoProvider client={mockClient}>
        <MemoryRouter>
          <RequireAuth redirectTo="/" fallback={<div>checking</div>}>
            <Home />
          </RequireAuth>
        </MemoryRouter>
      </GossoProvider>
    );

    await waitFor(() => expect(redirectToAuthorize).toHaveBeenCalledWith('/'));
    expect(redirectToAuthorize).not.toHaveBeenCalledWith('/system-management');
  });

  it('renders admin dashboard view when user is admin', () => {
    currentSnapshot.value = {
      loggedIn: true,
      isAdmin: true,
      profile: { preferred_username: 'alice_admin', name: 'Alice Admin' },
    };

    render(
      <GossoProvider client={mockClient}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </GossoProvider>
    );

    expect(screen.getByText('home.title')).toBeInTheDocument();
    expect(screen.getByText('home.loggedInAsAdmin:alice_admin')).toBeInTheDocument();
    expect(screen.getByText('home.enterDashboard')).toBeInTheDocument();
    expect(screen.getByText('home.clientRegistry')).toBeInTheDocument();
    expect(screen.getByText('home.userControl')).toBeInTheDocument();
    expect(screen.getByText('home.mfaAndPasskeys')).toBeInTheDocument();

    fireEvent.click(screen.getByText('home.enterDashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/system-management');

    fireEvent.click(screen.getByText('home.clientRegistry'));
    expect(mockNavigate).toHaveBeenCalledWith('/system-management/clients');
  });

  it('renders tailored user account center view when user is non-admin', () => {
    currentSnapshot.value = {
      loggedIn: true,
      isAdmin: false,
      profile: { preferred_username: 'owen_user', name: 'Owen' },
    };

    render(
      <GossoProvider client={mockClient}>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </GossoProvider>
    );

    expect(screen.getByText('home.userTitle')).toBeInTheDocument();
    expect(screen.getByText('home.loggedInAsUser:owen_user')).toBeInTheDocument();
    expect(screen.getByText('home.goToAccountSettings')).toBeInTheDocument();
    expect(screen.getByText('home.adminNotice')).toBeInTheDocument();
    expect(screen.getByText('home.userProfile')).toBeInTheDocument();
    expect(screen.getByText('home.userSecurity')).toBeInTheDocument();
    expect(screen.getByText('home.userSessions')).toBeInTheDocument();

    fireEvent.click(screen.getByText('home.goToAccountSettings'));
    expect(mockNavigate).toHaveBeenCalledWith('/account-settings/profile');

    fireEvent.click(screen.getByText('home.userProfile'));
    expect(mockNavigate).toHaveBeenCalledWith('/account-settings/profile');

    fireEvent.click(screen.getByText('home.userSecurity'));
    expect(mockNavigate).toHaveBeenCalledWith('/account-settings/mfa');

    fireEvent.click(screen.getByText('home.userSessions'));
    expect(mockNavigate).toHaveBeenCalledWith('/account-settings/sessions');

    fireEvent.click(screen.getByText('home.switchAccount'));
    expect(logout).toHaveBeenCalledWith('/');
  });
});

