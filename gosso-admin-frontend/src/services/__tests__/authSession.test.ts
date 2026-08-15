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
    localStorage.clear();
    document.cookie = '__Host-csrf_token=; path=/; max-age=0; Secure';
    document.cookie = 'blog_csrf_token=; path=/; max-age=0; Secure';
    document.cookie = '__Host-csrf_token=csrf-value; path=/; Secure';
    Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true });
  });

  it('does not persist credentials in web storage', async () => {
    const { authSession } = await import('../../auth');
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
    const { authSession, fetchUserProfile } = await import('../../auth');
    await expect(fetchUserProfile()).resolves.toMatchObject({ sub: '1' });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'same-origin' });
    expect(authSession.isLoggedIn()).toBe(true);
    expect(authSession.isAdmin()).toBe(true);
  });

  it('adds the CSRF header to unsafe cookie-authenticated API calls', async () => {
    fetchMock.mockResolvedValueOnce(envelope('ok'));
    const { apiFetch } = await import('../../auth');
    await apiFetch('/api/v1/auth/profile', { method: 'PUT' });
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('X-CSRF-Token')).toBe('csrf-value');
  });

  it('refreshes through the HttpOnly refresh cookie after a 401', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockResolvedValueOnce(envelope({}));
    fetchMock.mockResolvedValueOnce(envelope('ok'));
    const { apiFetch } = await import('../../auth');
    await expect(apiFetch('/api/v1/admin/accounts')).resolves.toMatchObject({ status: 200 });
    expect(fetchMock.mock.calls[1][0]).toContain('/api/v1/auth/refresh');
  });

  it('renews an expired CSRF cookie before refreshing a long-idle session', async () => {
    document.cookie = '__Host-csrf_token=; path=/; max-age=0; Secure';
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    fetchMock.mockImplementationOnce(async () => {
      document.cookie = '__Host-csrf_token=renewed-csrf; path=/; Secure';
      return new Response(null, { status: 401 });
    });
    fetchMock.mockResolvedValueOnce(envelope({}));
    fetchMock.mockResolvedValueOnce(envelope('ok'));
    const { apiFetch } = await import('../../auth');

    await expect(apiFetch('/api/v1/admin/accounts')).resolves.toMatchObject({ status: 200 });
    expect(fetchMock.mock.calls[1][0]).toContain('/api/v1/auth/session');
    expect(new Headers(fetchMock.mock.calls[2][1].headers).get('X-CSRF-Token')).toBe('renewed-csrf');
  });

  it('logs in without retaining either token in browser storage', async () => {
    fetchMock.mockResolvedValueOnce(envelope({ expires_in: 900 }));
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ sub: '1', roles: ['admin'], scope: 'openid admin' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const { authSession, loginWithPassword } = await import('../../auth');
    await expect(loginWithPassword('admin', 'correct horse battery staple')).resolves.toMatchObject({
      expires_in: 900,
    });
    expect(authSession.getSnapshot()).toMatchObject({ loggedIn: true, accessToken: null, refreshToken: null });
  });

  it('uses only the GOSSO CSRF token and clears state only after server logout succeeds', async () => {
    document.cookie = 'blog_csrf_token=blog-value; path=/; Secure';
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sub: '1', roles: ['admin'], scope: 'openid admin' }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const { authSession, fetchUserProfile } = await import('../../auth');
    await fetchUserProfile();

    await expect(authSession.logout('/')).rejects.toThrow('Logout failed (403)');
    expect(authSession.isLoggedIn()).toBe(true);
    await expect(authSession.logout('/')).resolves.toBeUndefined();
    expect(authSession.isLoggedIn()).toBe(false);
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('X-CSRF-Token')).toBe('csrf-value');
  });

  it('coalesces concurrent 401 responses into one refresh', async () => {
    let protectedCalls = 0;
    let refreshCalls = 0;
    let releaseRefresh!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/v1/admin/accounts') {
        protectedCalls += 1;
        return protectedCalls <= 2 ? new Response(null, { status: 401 }) : envelope('ok');
      }
      refreshCalls += 1;
      await gate;
      return envelope({});
    });
    const { apiFetch } = await import('../../auth');

    const first = apiFetch('/api/v1/admin/accounts');
    const second = apiFetch('/api/v1/admin/accounts');
    await vi.waitFor(() => expect(refreshCalls).toBe(1));
    releaseRefresh();
    const responses = await Promise.all([first, second]);

    expect(responses.every((response) => response.ok)).toBe(true);
    expect(refreshCalls).toBe(1);
  });

  it('coordinates refresh-token rotation across tabs with Web Locks', async () => {
    let queue = Promise.resolve();
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: <T>(_name: string, _options: { mode: 'exclusive' }, callback: () => T | Promise<T>): Promise<T> => {
          const result = queue.then(callback);
          queue = result.then(
            () => undefined,
            () => undefined
          );
          return result;
        },
      },
    });
    let refreshCalls = 0;
    let protectedCalls = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/v1/admin/accounts') {
        protectedCalls += 1;
        return protectedCalls <= 2 ? new Response(null, { status: 401 }) : envelope('ok');
      }
      refreshCalls += 1;
      return envelope({});
    });
    const firstTab = await import('../../auth');
    vi.resetModules();
    const secondTab = await import('../../auth');

    const responses = await Promise.all([
      firstTab.apiFetch('/api/v1/admin/accounts'),
      secondTab.apiFetch('/api/v1/admin/accounts'),
    ]);

    expect(responses.every((response) => response.ok)).toBe(true);
    expect(refreshCalls).toBe(1);
  });
});
