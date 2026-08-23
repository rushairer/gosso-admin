import { useCallback, useEffect, useState } from 'react';
import { accountService } from '../../services';
import type { Account, Role } from '../../types/api';
import { logger } from '../../utils/logger';
import { collectRolesFromAccounts } from './roles';

const PAGE_SIZE = 20;

export function useAdminUsers() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountService.fetchAccounts(page, PAGE_SIZE, true);
      setAccounts(data.accounts);
      setTotalAccounts(data.total);
      setRoles(collectRolesFromAccounts(data.accounts));
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : 'Error loading accounts';
      logger.error('Failed to load accounts', reason);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { accounts, roles, loading, error, page, setPage, pageSize: PAGE_SIZE, totalAccounts, refresh };
}
