import { useCallback, useEffect, useState } from 'react';
import { clientService } from '../../services';
import type { OAuth2Client } from '../../types/api';
import { logger } from '../../utils/logger';

export function useClients(fallbackErrorMessage: string) {
  const [clients, setClients] = useState<OAuth2Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setClients(await clientService.fetchClients());
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : fallbackErrorMessage;
      logger.error('Failed to load clients', reason);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fallbackErrorMessage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { clients, loading, error, refresh };
}
