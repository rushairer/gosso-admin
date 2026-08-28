import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { GossoProvider } from '@gosso/client/react';

const { handleRedirectCallback, subscribe, getSnapshot, mockClient } = vi.hoisted(() => {
  const defaultSnapshot = { loggedIn: false, isAdmin: false, profile: null };
  const handleRedirectCallback = vi.fn().mockResolvedValue({ tokenSet: {}, redirectTo: '/identity-admin/' });
  const subscribe = vi.fn(() => () => {});
  const getSnapshot = vi.fn(() => defaultSnapshot);
  const mockClient = {
    handleRedirectCallback,
    subscribe,
    getSnapshot,
  } as any;
  return { handleRedirectCallback, subscribe, getSnapshot, mockClient };
});

vi.mock('../../auth', () => ({
  gossoClient: mockClient,
}));

vi.mock('../../utils/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('OAuth callback routing', () => {
  it('returns a root-entry login to the management overview', async () => {
    vi.stubEnv('VITE_APP_BASE_PATH', '/identity-admin');
    window.history.replaceState({}, '', '/identity-admin/callback?code=oauth-code&state=oauth-state');
    const { default: Callback } = await import('../Callback');

    render(
      <GossoProvider client={mockClient}>
        <MemoryRouter
          basename="/identity-admin"
          initialEntries={['/identity-admin/callback?code=oauth-code&state=oauth-state']}
        >
          <Routes>
            <Route path="/callback" element={<Callback />} />
            <Route path="/" element={<h1>Management overview</h1>} />
            <Route path="*" element={<h1>Not found</h1>} />
          </Routes>
        </MemoryRouter>
      </GossoProvider>
    );

    expect(await screen.findByRole('heading', { name: 'Management overview' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Not found' })).not.toBeInTheDocument();
    expect(handleRedirectCallback).toHaveBeenCalledWith('oauth-code', 'oauth-state');
  });
});
