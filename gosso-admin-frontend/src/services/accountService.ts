import { apiFetch } from '../auth';
import type { Account, Role, Consent } from '../types/api';
import { extractErrorMessage } from './helper';

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
    const res = await apiFetch(`/api/v1/admin/accounts?page=${page}&page_size=${pageSize}${rolesQuery}`);
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to load accounts'));
    }
    const body = await res.json();
    return {
      accounts: body.data?.items || [],
      total: body.data?.total || 0,
    };
  },

  async createAccount(payload: CreateAccountPayload): Promise<Account> {
    const res = await apiFetch('/api/v1/admin/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to create account'));
    }
    const body = await res.json();
    return body.data;
  },

  async deleteAccount(accountId: string): Promise<void> {
    const res = await apiFetch(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to delete account'));
    }
  },

  async updateAccountStatus(accountId: string, status: string): Promise<void> {
    const res = await apiFetch(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to update status'));
    }
  },

  async updateAccountProfile(accountId: string, profile: UpdateProfilePayload): Promise<void> {
    const res = await apiFetch(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to update profile'));
    }
  },

  async resetPassword(accountId: string, password: string): Promise<void> {
    const res = await apiFetch(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to reset password'));
    }
  },

  async clearLockout(accountId: string): Promise<void> {
    const res = await apiFetch(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/lockout`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to clear lockout'));
    }
  },

  async resetMfa(accountId: string): Promise<void> {
    const res = await apiFetch(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/mfa`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to reset MFA'));
    }
  },

  async fetchAccountRoles(accountId: string): Promise<Role[]> {
    const res = await apiFetch(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/roles`);
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to load roles'));
    }
    const body = await res.json();
    return body.data?.items || [];
  },

  async assignRole(accountId: string, roleId: string): Promise<void> {
    const res = await apiFetch(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: roleId }),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to assign role'));
    }
  },

  async removeRole(accountId: string, roleId: string): Promise<void> {
    const res = await apiFetch(
      `/api/v1/admin/accounts/${encodeURIComponent(accountId)}/roles/${encodeURIComponent(roleId)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to remove role'));
    }
  },

  async fetchAccountConsents(accountId: string): Promise<Consent[]> {
    const res = await apiFetch(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/consents`);
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to load consents'));
    }
    const body = await res.json();
    return body.data?.items || body.data || [];
  },

  async revokeConsent(accountId: string, clientId: string): Promise<void> {
    const res = await apiFetch(
      `/api/v1/admin/accounts/${encodeURIComponent(accountId)}/consents/${encodeURIComponent(clientId)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to revoke consent'));
    }
  },

  async fetchAccountSessions(accountId: string): Promise<SessionInfo[]> {
    const res = await apiFetch(`/api/v1/admin/accounts/${encodeURIComponent(accountId)}/sessions`);
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to load sessions'));
    }
    const body = await res.json();
    return body.data?.items || [];
  },

  async revokeSession(accountId: string, sessionId: string): Promise<void> {
    const res = await apiFetch(
      `/api/v1/admin/accounts/${encodeURIComponent(accountId)}/sessions/${encodeURIComponent(sessionId)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to revoke session'));
    }
  },
};
