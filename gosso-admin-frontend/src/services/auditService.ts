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
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    let url = `/api/v1/admin/audit-logs?page=${page}&page_size=${pageSize}`;
    if (params.eventType) {
      url += `&event_type=${encodeURIComponent(params.eventType)}`;
    }
    if (params.accountId) {
      url += `&account_id=${encodeURIComponent(params.accountId)}`;
    }
    const data = await gossoClient.get<{ items?: AuditLog[]; total?: number }>(url);
    return {
      logs: data?.items || [],
      total: data?.total || 0,
    };
  },
};
