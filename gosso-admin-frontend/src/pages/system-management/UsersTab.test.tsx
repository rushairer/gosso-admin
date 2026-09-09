import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageProvider } from '@gouno/ui/core';
import { GossoProvider } from '@gosso/client/react';
import { apiFetch, gossoClient } from '../../auth';
import UsersTab from './UsersTab';

const { apiFetchMock, sessionSnapshot } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  sessionSnapshot: {
    loggedIn: true,
    isAdmin: true,
    profile: { sub: 'current-admin', roles: ['admin'] },
  },
}));

vi.mock('../../auth', () => ({
  apiFetch: apiFetchMock,
  gossoClient: {
    getUserProfile: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    getSnapshot: vi.fn(() => sessionSnapshot),
    apiFetch: apiFetchMock,
    get: (url: string, init?: { params?: Record<string, unknown> | URLSearchParams }) => {
      let targetUrl = url;
      if (init?.params) {
        const query = init.params instanceof URLSearchParams ? init.params : new URLSearchParams();
        if (!(init.params instanceof URLSearchParams)) {
          Object.entries(init.params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
          });
        }
        const qs = query.toString();
        if (qs) targetUrl += (targetUrl.includes('?') ? '&' : '?') + qs;
      }
      return apiFetchMock(targetUrl).then(async (res: Response) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.message || 'GET request failed');
        }
        return body.data;
      });
    },
    post: (url: string, body?: unknown) =>
      apiFetchMock(url, { method: 'POST', body: JSON.stringify(body) }).then(async (res: Response) => {
        const b = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(b.message || 'POST request failed');
        }
        return b.data;
      }),
    put: (url: string, body?: unknown) =>
      apiFetchMock(url, { method: 'PUT', body: JSON.stringify(body) }).then(async (res: Response) => {
        const b = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(b.message || 'PUT request failed');
        }
        return b.data;
      }),
    delete: (url: string) =>
      apiFetchMock(url, { method: 'DELETE' }).then(async (res: Response) => {
        const b = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(b.message || 'DELETE request failed');
        }
      }),
  },
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

function renderUsersTab() {
  return render(
    <GossoProvider client={gossoClient as any}>
      <MessageProvider>
        <UsersTab />
      </MessageProvider>
    </GossoProvider>
  );
}

describe('UsersTab pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(gossoClient.getUserProfile).mockReturnValue({ sub: 'current-admin', roles: ['admin'] });
    vi.mocked(apiFetch).mockImplementation(async (input) => {
      const url = String(input);
      return accountResponse(url.includes('page=2') ? 2 : 1);
    });
  });

  it('shows a structural table skeleton while the first account request is pending', () => {
    vi.mocked(apiFetch).mockImplementation(() => new Promise<Response>(() => {}));

    renderUsersTab();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
  });

  it('does not render an empty state when the initial account load fails', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Account API unavailable' }),
    } as Response);

    renderUsersTab();

    expect(await screen.findByText('Account API unavailable')).toBeInTheDocument();
    expect(screen.queryByText(/No User Accounts|暂无用户账户/i)).not.toBeInTheDocument();
  });

  it('uses the bounded role projection without per-account requests', async () => {
    renderUsersTab();

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

  it('keeps the current table visible and disables pagination while the next page is loading', async () => {
    let resolvePageTwo: ((value: Response) => void) | undefined;
    vi.mocked(apiFetch).mockImplementation((input) => {
      const url = String(input);
      if (url.includes('page=2')) {
        return new Promise<Response>((resolve) => {
          resolvePageTwo = resolve;
        });
      }
      return Promise.resolve(accountResponse(1));
    });

    renderUsersTab();
    expect(await screen.findByText('Operator 1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /next|下一步/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/v1/admin/accounts?page=2&page_size=20&include=roles');
      expect(screen.getByRole('button', { name: /next|下一步/i })).toBeDisabled();
    });
    expect(screen.getByText('Operator 1')).toBeInTheDocument();
    expect(screen.getByRole('table').closest('[aria-busy="true"]')).not.toBeNull();

    resolvePageTwo?.(accountResponse(2));
    expect(await screen.findByText('Operator 2')).toBeInTheDocument();
  });
});
