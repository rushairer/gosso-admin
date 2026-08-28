import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui';
import { apiFetch } from '../../auth';
import ClientsTab from './ClientsTab';

const { apiFetchMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
}));

vi.mock('../../auth', () => ({
  apiFetch: apiFetchMock,
  gossoClient: {
    getUserProfile: vi.fn(),
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

describe('ClientsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an empty state after loading the client collection', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ ok: true, json: async () => ({ data: [] }) } as Response);

    render(
      <ToastProvider>
        <ClientsTab />
      </ToastProvider>
    );

    expect(await screen.findByText(/No Clients Registered|暂无已注册的客户端/i)).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/api/v1/oauth2/clients');
  });

  it('offers a retry after a load failure', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Client API unavailable' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) } as Response);

    render(
      <ToastProvider>
        <ClientsTab />
      </ToastProvider>
    );

    const retry = await screen.findByRole('button', { name: /retry|重试/i });
    await userEvent.click(retry);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText(/No Clients Registered|暂无已注册的客户端/i)).toBeInTheDocument();
  });
});
