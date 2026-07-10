import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui';
import { apiFetch, getUserProfile } from '../../auth';
import UsersTab from './UsersTab';

vi.mock('../../auth', () => ({
  apiFetch: vi.fn(),
  getUserProfile: vi.fn(),
}));

function accountResponse(page: number): Response {
  return {
    ok: true,
    json: async () => ({
      data: {
        items: [
          {
            id: `00000000-0000-0000-0000-00000000000${page}`,
            username: `operator-${page}`,
            display_name: `Operator ${page}`,
            status: 'active',
            roles: [{ id: 'role-1', name: 'support', description: 'Support operator' }],
          },
        ],
        total: 21,
        page,
        page_size: 20,
      },
    }),
  } as Response;
}

describe('UsersTab pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserProfile).mockReturnValue({ sub: 'current-admin', roles: ['admin'] });
    vi.mocked(apiFetch).mockImplementation(async (input) => {
      const url = String(input);
      return accountResponse(url.includes('page=2') ? 2 : 1);
    });
  });

  it('uses the bounded role projection without per-account requests', async () => {
    render(
      <ToastProvider>
        <UsersTab />
      </ToastProvider>
    );

    expect(await screen.findByText('Operator 1')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith('/api/v1/admin/accounts?page=1&page_size=20&include=roles');
    expect(vi.mocked(apiFetch).mock.calls.some(([url]) => /\/(roles|lockout)$/.test(String(url)))).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: /next|下一步/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/v1/admin/accounts?page=2&page_size=20&include=roles');
    });
    expect(await screen.findByText('Operator 2')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });
});
