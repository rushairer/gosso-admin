import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GossoProvider, RequireAdmin } from '@gosso/client/react';
import SystemManagement from '../SystemManagement';

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

vi.mock('../system-management/ClientsTab', () => ({ default: () => <div>Clients content</div> }));
vi.mock('../system-management/UsersTab', () => ({ default: () => <div>Users content</div> }));
vi.mock('../system-management/AuditLogsTab', () => ({ default: () => <div>Audit content</div> }));
vi.mock('../system-management/SystemStatusTab', () => ({ default: () => <div>System content</div> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function renderSystemManagement(path = '/system-management/clients') {
  return render(
    <GossoProvider client={mockClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/system-management/:tab"
            element={
              <RequireAdmin
                redirectTo="/system-management/clients"
                fallback={<div>systemManagement.checkingAccess</div>}
                unauthorized={<div>systemManagement.accessDeniedTitle</div>}
              >
                <SystemManagement />
              </RequireAdmin>
            }
          />
        </Routes>
      </MemoryRouter>
    </GossoProvider>
  );
}

describe('SystemManagement access gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects an anonymous visitor to authorization', async () => {
    getSnapshot.mockReturnValue({ loggedIn: false, isAdmin: false, profile: null });
    renderSystemManagement();
    await waitFor(() => expect(redirectToAuthorize).toHaveBeenCalledWith('/system-management/clients'));
    expect(screen.getByText('systemManagement.checkingAccess')).toBeInTheDocument();
  });

  it('shows an access-denied state for an authenticated non-admin', async () => {
    getSnapshot.mockReturnValue({ loggedIn: true, isAdmin: false, profile: { sub: 'user-1' } });
    renderSystemManagement();
    expect(await screen.findByText('systemManagement.accessDeniedTitle')).toBeInTheDocument();
    expect(redirectToAuthorize).not.toHaveBeenCalled();
  });

  it('renders administration content only for administrators', async () => {
    getSnapshot.mockReturnValue({ loggedIn: true, isAdmin: true, profile: { sub: 'admin-1' } });
    renderSystemManagement();
    expect(await screen.findByText('Clients content')).toBeInTheDocument();
  });
});
