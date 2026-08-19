import { apiFetch } from '../auth';
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
    const res = await apiFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load audit logs: ${res.statusText}`);
    }
    const body = await res.json();
    return {
      logs: body.data?.items || [],
      total: body.data?.total || 0,
    };
  },
};
