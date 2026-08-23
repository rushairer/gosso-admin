import type { Account, Role } from '../../types/api';

/**
 * The Users table receives roles inline with the bounded account page. This
 * keeps the role picker responsive without issuing one request per account.
 */
export function collectRolesFromAccounts(accounts: Account[]): Role[] {
  const rolesById = new Map<string, Role>();
  for (const account of accounts) {
    for (const role of account.roles || []) {
      rolesById.set(role.id, role);
    }
  }
  return [...rolesById.values()];
}
