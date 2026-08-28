import { gossoClient } from '../auth';
import type { Account, Role, Consent } from '../types/api';

export interface CreateAccountPayload {
  username: string;
  display_name: string;
  email: string;
  phone?: string;
  password?: string;
  locale?: string;
  timezone?: string;
}

export interface UpdateProfilePayload {
  display_name: string;
  email: string;
  phone?: string;
  locale?: string;
  timezone?: string;
}

export interface SessionInfo {
  id: string;
  created_at: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  current?: boolean;
}

export const accountService = {
  async fetchAccounts(page = 1, pageSize = 20, includeRoles = true): Promise<{ accounts: Account[]; total: number }> {
    const rolesQuery = includeRoles ? '&include=roles' : '';
    const data = await gossoClient.get<{ items?: Account[]; total?: number }>(
      `/api/v1/admin/accounts?page=${page}&page_size=${pageSize}${rolesQuery}`
    );
    return {
      accounts: data?.items || [],
      total: data?.total || 0,
    };
  },

  createAccount(payload: CreateAccountPayload): Promise<Account> {
    return gossoClient.post<Account>('/api/v1/admin/accounts', payload);
  },

  deleteAccount(accountId: string): Promise<void> {
    return gossoClient.delete<void>(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}`);
  },

  updateAccountStatus(accountId: string, status: string): Promise<void> {
    return gossoClient.put<void>(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/status`, { status });
  },

  updateAccountProfile(accountId: string, profile: UpdateProfilePayload): Promise<void> {
    return gossoClient.put<void>(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/profile`, profile);
  },

  resetPassword(accountId: string, password: string): Promise<void> {
    return gossoClient.put<void>(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/password`, { password });
  },

  clearLockout(accountId: string): Promise<void> {
    return gossoClient.delete<void>(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/lockout`);
  },

  resetMfa(accountId: string): Promise<void> {
    return gossoClient.delete<void>(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/mfa`);
  },

  async fetchAccountRoles(accountId: string): Promise<Role[]> {
    const data = await gossoClient.get<{ items?: Role[] }>(
      `/api/v1/admin/accounts/${encodeURIComponent(accountId)}/roles`
    );
    return data?.items || [];
  },

  assignRole(accountId: string, roleId: string): Promise<void> {
    return gossoClient.post<void>(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/roles`, {
      role_id: roleId,
    });
  },

  removeRole(accountId: string, roleId: string): Promise<void> {
    return gossoClient.delete<void>(
      `/api/v1/admin/accounts/${encodeURIComponent(accountId)}/roles/${encodeURIComponent(roleId)}`
    );
  },

  async fetchAccountConsents(accountId: string): Promise<Consent[]> {
    const data = await gossoClient.get<Consent[] | { items?: Consent[] }>(
      `/api/v1/admin/accounts/${encodeURIComponent(accountId)}/consents`
    );
    if (Array.isArray(data)) return data;
    return data?.items || [];
  },

  revokeConsent(accountId: string, clientId: string): Promise<void> {
    return gossoClient.delete<void>(
      `/api/v1/admin/accounts/${encodeURIComponent(accountId)}/consents/${encodeURIComponent(clientId)}`
    );
  },

  async fetchAccountSessions(accountId: string): Promise<SessionInfo[]> {
    const data = await gossoClient.get<{ items?: SessionInfo[] }>(
      `/api/v1/admin/accounts/${encodeURIComponent(accountId)}/sessions`
    );
    return data?.items || [];
  },

  revokeSession(accountId: string, sessionId: string): Promise<void> {
    return gossoClient.delete<void>(
      `/api/v1/admin/accounts/${encodeURIComponent(accountId)}/sessions/${encodeURIComponent(sessionId)}`
    );
  },
};
