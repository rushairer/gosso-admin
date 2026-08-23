import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Admin from '../Admin';

const { isLoggedIn, isAdmin, redirectToAuthorize } = vi.hoisted(() => ({
  isLoggedIn: vi.fn(),
  isAdmin: vi.fn(),
  redirectToAuthorize: vi.fn(),
}));

vi.mock('../../auth', () => ({
  gossoClient: { isLoggedIn, isAdmin },
  redirectToAuthorize,
}));

vi.mock('../admin/ClientsTab', () => ({ default: () => <div>Clients content</div> }));
vi.mock('../admin/UsersTab', () => ({ default: () => <div>Users content</div> }));
vi.mock('../admin/AuditLogsTab', () => ({ default: () => <div>Audit content</div> }));
vi.mock('../admin/SystemStatusTab', () => ({ default: () => <div>System content</div> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

function renderAdmin(path = '/admin/clients') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/:tab" element={<Admin />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Admin access gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects an anonymous visitor to authorization', async () => {
    isLoggedIn.mockReturnValue(false);
    renderAdmin();
    await waitFor(() => expect(redirectToAuthorize).toHaveBeenCalledWith('/admin/clients'));
    expect(screen.getByText('admin.checkingAccess')).toBeInTheDocument();
  });

  it('shows an access-denied state for an authenticated non-admin', async () => {
    isLoggedIn.mockReturnValue(true);
    isAdmin.mockReturnValue(false);
    renderAdmin();
    expect(await screen.findByText('admin.accessDeniedTitle')).toBeInTheDocument();
    expect(redirectToAuthorize).not.toHaveBeenCalled();
  });

  it('renders administration content only for administrators', async () => {
    isLoggedIn.mockReturnValue(true);
    isAdmin.mockReturnValue(true);
    renderAdmin();
    expect(await screen.findByText('Clients content')).toBeInTheDocument();
  });
});
