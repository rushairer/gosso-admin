import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditService } from '../../services';
import AuditLogsTab from './AuditLogsTab';

vi.mock('../../services', () => ({
  auditService: { fetchAuditLogs: vi.fn() },
}));

const firstPage = {
  logs: [
    {
      id: 'audit-1',
      action: 'account.updated',
      actor: 'admin',
      account_id: 'account-1',
      created_at: '2026-08-23T12:00:00.000Z',
    },
  ],
  total: 1,
};

describe('AuditLogsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auditService.fetchAuditLogs).mockResolvedValue(firstPage);
  });

  it('loads filters explicitly and clears them without relying on a timer', async () => {
    render(<AuditLogsTab />);

    expect(await screen.findByText('account.updated')).toBeInTheDocument();
    expect(auditService.fetchAuditLogs).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      eventType: undefined,
      accountId: undefined,
    });

    await userEvent.type(screen.getByPlaceholderText('e.g. auth.login.success'), 'account.updated');
    await userEvent.type(screen.getByPlaceholderText('UUID or Username'), 'account-1');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(auditService.fetchAuditLogs).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        eventType: 'account.updated',
        accountId: 'account-1',
      });
    });

    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    await waitFor(() => {
      expect(auditService.fetchAuditLogs).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        eventType: undefined,
        accountId: undefined,
      });
    });
  });
});
