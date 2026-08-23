import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SystemManagement from '../SystemManagement';

const { isLoggedIn, isAdmin, redirectToAuthorize } = vi.hoisted(() => ({
  isLoggedIn: vi.fn(),
  isAdmin: vi.fn(),
  redirectToAuthorize: vi.fn(),
}));

vi.mock('../../auth', () => ({
  gossoClient: { isLoggedIn, isAdmin },
  redirectToAuthorize,
}));

vi.mock('../system-management/ClientsTab', () => ({ default: () => <div>Clients content</div> }));
vi.mock('../system-management/UsersTab', () => ({ default: () => <div>Users content</div> }));
vi.mock('../system-management/AuditLogsTab', () => ({ default: () => <div>Audit content</div> }));
vi.mock('../system-management/SystemStatusTab', () => ({ default: () => <div>System content</div> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function renderSystemManagement(path = '/system-management/clients') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/system-management/:tab" element={<SystemManagement />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SystemManagement access gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects an anonymous visitor to authorization', async () => {
    isLoggedIn.mockReturnValue(false);
    renderSystemManagement();
    await waitFor(() => expect(redirectToAuthorize).toHaveBeenCalledWith('/system-management/clients'));
    expect(screen.getByText('systemManagement.checkingAccess')).toBeInTheDocument();
  });

  it('shows an access-denied state for an authenticated non-admin', async () => {
    isLoggedIn.mockReturnValue(true);
    isAdmin.mockReturnValue(false);
    renderSystemManagement();
    expect(await screen.findByText('systemManagement.accessDeniedTitle')).toBeInTheDocument();
    expect(redirectToAuthorize).not.toHaveBeenCalled();
  });

  it('renders administration content only for administrators', async () => {
    isLoggedIn.mockReturnValue(true);
    isAdmin.mockReturnValue(true);
    renderSystemManagement();
    expect(await screen.findByText('Clients content')).toBeInTheDocument();
  });
});
