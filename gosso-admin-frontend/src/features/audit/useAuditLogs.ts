import { useCallback, useEffect, useState } from 'react';
import { auditService } from '../../services';
import type { AuditLog } from '../../types/api';
import { logger } from '../../utils/logger';

const PAGE_SIZE = 20;

interface AuditFilters {
  eventType: string;
  accountId: string;
}

const emptyFilters: AuditFilters = { eventType: '', accountId: '' };

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventType, setEventType] = useState('');
  const [accountId, setAccountId] = useState('');

  const fetchPage = useCallback(async (nextPage: number, filters: AuditFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditService.fetchAuditLogs({
        page: nextPage,
        pageSize: PAGE_SIZE,
        eventType: filters.eventType || undefined,
        accountId: filters.accountId || undefined,
      });
      setLogs(data.logs);
      setTotal(data.total);
      setPage(nextPage);
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : 'Error loading audit logs';
      logger.error('Failed to load audit logs', reason);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage(1, emptyFilters);
  }, [fetchPage]);

  const search = useCallback(() => {
    void fetchPage(1, { eventType, accountId });
  }, [accountId, eventType, fetchPage]);

  const clearFilters = useCallback(() => {
    setEventType('');
    setAccountId('');
    void fetchPage(1, emptyFilters);
  }, [fetchPage]);

  const goToPage = useCallback(
    (nextPage: number) => {
      void fetchPage(nextPage, { eventType, accountId });
    },
    [accountId, eventType, fetchPage]
  );

  return {
    logs,
    total,
    page,
    pageSize: PAGE_SIZE,
    loading,
    error,
    eventType,
    setEventType,
    accountId,
    setAccountId,
    search,
    clearFilters,
    goToPage,
  };
}
