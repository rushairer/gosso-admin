import { gossoClient } from '../auth';
import type { AuditLog } from '../types/api';

export interface FetchAuditLogsParams {
  page?: number;
  pageSize?: number;
  eventType?: string;
  accountId?: string;
}

export const auditService = {
  async fetchAuditLogs(params: FetchAuditLogsParams = {}): Promise<{ logs: AuditLog[]; total: number }> {
    const data = await gossoClient.get<{ items?: AuditLog[]; total?: number }>('/api/v1/admin/audit-logs', {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 20,
        event_type: params.eventType,
        account_id: params.accountId,
      },
    });
    return {
      logs: data?.items || [],
      total: data?.total || 0,
    };
  },
};
