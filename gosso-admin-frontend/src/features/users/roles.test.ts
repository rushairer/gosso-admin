import { describe, expect, it } from 'vitest';
import { collectRolesFromAccounts } from './roles';

describe('collectRolesFromAccounts', () => {
  it('returns each role once while preserving first-seen order', () => {
    expect(
      collectRolesFromAccounts([
        {
          id: '1',
          username: 'one',
          display_name: 'One',
          status: 'active',
          roles: [{ id: 'support', name: 'Support' }],
        },
        {
          id: '2',
          username: 'two',
          display_name: 'Two',
          status: 'active',
          roles: [
            { id: 'support', name: 'Support' },
            { id: 'admin', name: 'Admin' },
          ],
        },
      ])
    ).toEqual([
      { id: 'support', name: 'Support' },
      { id: 'admin', name: 'Admin' },
    ]);
  });
});
