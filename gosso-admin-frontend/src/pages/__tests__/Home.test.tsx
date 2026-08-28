import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { GossoProvider, RequireAuth } from '@gosso/client/react';
import Home from '../Home';

const { redirectToAuthorize, subscribe, getSnapshot, mockClient } = vi.hoisted(() => {
  const defaultSnapshot = { loggedIn: false, isAdmin: false, profile: null };
  const redirectToAuthorize = vi.fn().mockResolvedValue(undefined);
  const subscribe = vi.fn(() => () => {});
  const getSnapshot = vi.fn(() => defaultSnapshot);
  const mockClient = {
    redirectToAuthorize,
    subscribe,
    getSnapshot,
  } as any;
  return { redirectToAuthorize, subscribe, getSnapshot, mockClient };
});

vi.mock('../../auth', () => ({
  gossoClient: mockClient,
  redirectToAuthorize,
}));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('management overview authentication', () => {
  it('returns root-entry authentication to the overview, not system management', async () => {
    render(
      <GossoProvider client={mockClient}>
        <MemoryRouter>
          <RequireAuth redirectTo="/" fallback={<div>checking</div>}>
            <Home />
          </RequireAuth>
        </MemoryRouter>
      </GossoProvider>
    );

    await waitFor(() => expect(redirectToAuthorize).toHaveBeenCalledWith('/'));
    expect(redirectToAuthorize).not.toHaveBeenCalledWith('/system-management');
  });
});
