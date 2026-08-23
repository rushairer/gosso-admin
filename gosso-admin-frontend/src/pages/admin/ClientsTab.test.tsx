import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui';
import { apiFetch } from '../../auth';
import ClientsTab from './ClientsTab';

vi.mock('../../auth', () => ({
  apiFetch: vi.fn(),
  gossoClient: { getUserProfile: vi.fn() },
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
