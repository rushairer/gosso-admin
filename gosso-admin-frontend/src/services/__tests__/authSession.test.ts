import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function envelope(data: unknown, ok = true) {
  return new Response(JSON.stringify(ok ? { data } : { message: 'request failed' }), {
    status: ok ? 200 : 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('cookie-backed authSession', () => {
  beforeEach(async () => {
    vi.resetModules();
    fetchMock.mockReset();
    sessionStorage.clear();
    document.cookie = 'csrf_token=csrf-value; path=/';
  });

  it('does not persist credentials in web storage', async () => {
    const { authSession } = await import('../authSession');
    authSession.saveTokenSet({ access_token: 'access', refresh_token: 'refresh' });
    expect(localStorage.getItem('gosso-admin:access_token')).toBeNull();
    expect(localStorage.getItem('gosso-admin:refresh_token')).toBeNull();
    expect(authSession.getAccessToken()).toBeNull();
    expect(authSession.getRefreshToken()).toBeNull();
  });

  it('uses HttpOnly cookie authentication to load the profile', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ sub: '1', roles: ['admin'], scope: 'openid admin' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const { authSession, fetchUserProfile } = await import('../authSession');
    await expect(fetchUserProfile()).resolves.toMatchObject({ sub: '1' });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'same-origin' });
    expect(authSession.isLoggedIn()).toBe(true);
    expect(authSession.isAdmin()).toBe(true);
  });

  it('adds the CSRF header to unsafe cookie-authenticated API calls', async () => {
    fetchMock.mockResolvedValueOnce(envelope('ok'));
    const { apiFetch } = await import('../authSession');
    await apiFetch('/api/v1/auth/profile', { method: 'PUT' });
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('X-CSRF-Token')).toBe('csrf-value');
  });

  it('refreshes through the HttpOnly refresh cookie after a 401', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(envelope({}));
    fetchMock.mockResolvedValueOnce(envelope('ok'));
    const { apiFetch } = await import('../authSession');
    await expect(apiFetch('/api/v1/admin/accounts')).resolves.toMatchObject({ status: 200 });
    expect(fetchMock.mock.calls[1][0]).toContain('/api/v1/auth/refresh');
  });

  it('logs in without retaining either token in browser storage', async () => {
    fetchMock.mockResolvedValueOnce(envelope({ expires_in: 900 }));
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ sub: '1', roles: ['admin'], scope: 'openid admin' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const { authSession, loginWithPassword } = await import('../authSession');
    await expect(loginWithPassword('admin', 'correct horse battery staple')).resolves.toMatchObject({
      expires_in: 900,
    });
    expect(authSession.getSnapshot()).toMatchObject({ loggedIn: true, accessToken: null, refreshToken: null });
  });

  it('clears in-memory state before redirecting on logout', async () => {
    fetchMock.mockResolvedValueOnce(envelope('logged out'));
    const { authSession } = await import('../authSession');
    authSession.clear();
    expect(authSession.getSnapshot()).toMatchObject({ loggedIn: false, profile: null });
  });
});
