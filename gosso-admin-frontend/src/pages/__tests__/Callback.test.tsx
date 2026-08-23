import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { handleRedirectCallback } = vi.hoisted(() => ({
  handleRedirectCallback: vi.fn().mockResolvedValue({ tokenSet: {}, redirectTo: '/identity-admin/' }),
}));

vi.mock('../../auth', () => ({
  gossoClient: {
    handleRedirectCallback,
  },
}));

vi.mock('../../utils/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('OAuth callback routing', () => {
  it('returns a root-entry login to the management overview', async () => {
    vi.stubEnv('VITE_APP_BASE_PATH', '/identity-admin');
    const { default: Callback } = await import('../Callback');

    render(
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
    );

    expect(await screen.findByRole('heading', { name: 'Management overview' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Not found' })).not.toBeInTheDocument();
    expect(handleRedirectCallback).toHaveBeenCalledWith('oauth-code', 'oauth-state');
  });
});
