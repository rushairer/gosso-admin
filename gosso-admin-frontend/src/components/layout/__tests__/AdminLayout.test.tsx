import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminLayout } from '../AdminLayout';

vi.mock('../../../services/authSession', () => ({
  authSession: {
    getSnapshot: () => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      profile: { sub: 'admin', preferred_username: 'admin' },
      loggedIn: true,
      isAdmin: true,
    }),
    subscribe: () => () => {},
    logout: vi.fn(),
  },
  redirectToAuthorize: vi.fn(),
}));

describe('AdminLayout', () => {
  it('renders a blog admin SSO entry in the sidebar', () => {
    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Workspace</div>
        </AdminLayout>
      </MemoryRouter>
    );

    const blogAdminLink = screen.getByRole('link', { name: /blog admin/i });

    expect(blogAdminLink).toBeInTheDocument();
    expect(blogAdminLink).toHaveAttribute('href', `${window.location.origin}/admin`);
  });
});
