import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We test the exported functions by importing the module fresh in each test group
// authSession reads from localStorage, so we clear it in beforeEach

function accessTokenWithClaims(claims: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(claims)}.signature`;
}

const keys = {
  accessToken: 'gosso-admin:access_token',
  refreshToken: 'gosso-admin:refresh_token',
  userProfile: 'gosso-admin:user_profile',
  tokenIssuedAt: 'gosso-admin:token_issued_at',
  tokenExpiresIn: 'gosso-admin:token_expires_in',
  refreshLock: 'gosso-admin:auth_refresh_lock',
};

describe('authSession', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    localStorage.clear();
    document.cookie = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (navigator as Navigator & { locks?: unknown }).locks;
  });

  describe('isLoggedIn / isAdmin', () => {
    it('returns false when no token is stored', async () => {
      const { authSession } = await import('../authSession');
      expect(authSession.isLoggedIn()).toBe(false);
      expect(authSession.isAdmin()).toBe(false);
    });

    it('returns true when token exists', async () => {
      localStorage.setItem(keys.accessToken, 'test-token');
      const { authSession } = await import('../authSession');
      expect(authSession.isLoggedIn()).toBe(true);
    });

    it('detects admin access from stored profile and token scope', async () => {
      localStorage.setItem(keys.accessToken, accessTokenWithClaims({ scope: 'openid admin' }));
      localStorage.setItem(keys.userProfile, JSON.stringify({ sub: '1', roles: ['admin'] }));
      const { authSession } = await import('../authSession');
      expect(authSession.isAdmin()).toBe(true);
    });

    it('returns false for admin role without admin token scope', async () => {
      localStorage.setItem(keys.accessToken, accessTokenWithClaims({ scope: 'openid profile' }));
      localStorage.setItem(keys.userProfile, JSON.stringify({ sub: '1', roles: ['admin'] }));
      const { authSession } = await import('../authSession');
      expect(authSession.isAdmin()).toBe(false);
    });

    it('returns false for non-admin profile', async () => {
      localStorage.setItem(keys.accessToken, 'test-token');
      localStorage.setItem(keys.userProfile, JSON.stringify({ sub: '1', roles: ['user'] }));
      const { authSession } = await import('../authSession');
      expect(authSession.isAdmin()).toBe(false);
    });
  });

  describe('saveTokenSet / clear', () => {
    it('persists tokens to localStorage', async () => {
      const { authSession } = await import('../authSession');
      authSession.saveTokenSet({
        access_token: 'atoken',
        refresh_token: 'rtoken',
        expires_in: 900,
      });
      expect(localStorage.getItem(keys.accessToken)).toBe('atoken');
      expect(localStorage.getItem(keys.refreshToken)).toBe('rtoken');
      expect(localStorage.getItem(keys.tokenIssuedAt)).toBeTruthy();
      expect(localStorage.getItem(keys.tokenExpiresIn)).toBe('900');
    });

    it('sets access_token cookie', async () => {
      const { authSession } = await import('../authSession');
      authSession.saveTokenSet({
        access_token: 'atoken',
        refresh_token: 'rtoken',
        expires_in: 900,
      });
      expect(document.cookie).toContain('access_token=atoken');
    });

    it('clears all tokens on clear()', async () => {
      const { authSession } = await import('../authSession');
      authSession.saveTokenSet({
        access_token: 'atoken',
        refresh_token: 'rtoken',
        expires_in: 900,
      });
      authSession.clear();
      expect(localStorage.getItem(keys.accessToken)).toBeNull();
      expect(localStorage.getItem(keys.refreshToken)).toBeNull();
      expect(localStorage.getItem(keys.userProfile)).toBeNull();
      expect(localStorage.getItem(keys.tokenIssuedAt)).toBeNull();
    });
  });

  describe('getSnapshot', () => {
    it('returns empty snapshot when not logged in', async () => {
      const { authSession } = await import('../authSession');
      const snap = authSession.getSnapshot();
      expect(snap.loggedIn).toBe(false);
      expect(snap.isAdmin).toBe(false);
      expect(snap.accessToken).toBeNull();
      expect(snap.profile).toBeNull();
    });

    it('returns populated snapshot when logged in as admin', async () => {
      const token = accessTokenWithClaims({ scope: 'openid admin' });
      localStorage.setItem(keys.accessToken, token);
      localStorage.setItem(keys.userProfile, JSON.stringify({ sub: '1', name: 'Admin', roles: ['admin'] }));
      const { authSession } = await import('../authSession');
      const snap = authSession.getSnapshot();
      expect(snap.loggedIn).toBe(true);
      expect(snap.isAdmin).toBe(true);
      expect(snap.accessToken).toBe(token);
      expect(snap.profile?.name).toBe('Admin');
    });
  });

  describe('subscribe', () => {
    it('notifies subscribers when the current tab changes session state', async () => {
      const { authSession } = await import('../authSession');
      const listener = vi.fn();
      const unsubscribe = authSession.subscribe(listener);

      authSession.saveTokenSet({
        access_token: 'atoken',
        refresh_token: 'rtoken',
        expires_in: 900,
      });
      authSession.clear();

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener.mock.calls[0][0]).toMatchObject({ loggedIn: true, accessToken: 'atoken' });
      expect(listener.mock.calls[1][0]).toMatchObject({ loggedIn: false, accessToken: null });

      unsubscribe();
      authSession.saveTokenSet({
        access_token: 'next-token',
        expires_in: 900,
      });
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('notifies subscribers when auth storage changes in another context', async () => {
      const { authSession } = await import('../authSession');
      const listener = vi.fn();
      const unsubscribe = authSession.subscribe(listener);

      localStorage.setItem(keys.accessToken, 'peer-token');
      window.dispatchEvent(new StorageEvent('storage', { key: keys.accessToken, newValue: 'peer-token' }));

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0]).toMatchObject({ loggedIn: true, accessToken: 'peer-token' });

      unsubscribe();
    });
  });

  describe('logout', () => {
    it('clears local session state before the logout request finishes', async () => {
      localStorage.setItem(keys.accessToken, 'token-before-logout');
      localStorage.setItem(keys.refreshToken, 'refresh-before-logout');
      const fetchMock = vi.spyOn(window, 'fetch').mockReturnValue(new Promise<Response>(() => {}));

      const { authSession } = await import('../authSession');
      const listener = vi.fn();
      authSession.subscribe(listener);

      void authSession.logout('/');

      expect(localStorage.getItem(keys.accessToken)).toBeNull();
      expect(localStorage.getItem(keys.refreshToken)).toBeNull();
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ loggedIn: false, accessToken: null }));
      expect(fetchMock).toHaveBeenCalledWith(
        `${window.location.origin}/api/v1/auth/logout`,
        expect.objectContaining({
          method: 'POST',
          headers: { Authorization: 'Bearer token-before-logout' },
          credentials: 'same-origin',
          keepalive: true,
        })
      );
    });
  });

  describe('getUserProfile', () => {
    it('returns null when no profile stored', async () => {
      const { authSession } = await import('../authSession');
      expect(authSession.getUserProfile()).toBeNull();
    });

    it('parses stored profile JSON', async () => {
      const profile = { sub: '123', name: 'Test User', email: 'test@example.com' };
      localStorage.setItem(keys.userProfile, JSON.stringify(profile));
      const { authSession } = await import('../authSession');
      expect(authSession.getUserProfile()).toEqual(profile);
    });

    it('returns null for invalid JSON', async () => {
      localStorage.setItem(keys.userProfile, 'not-json');
      const { authSession } = await import('../authSession');
      expect(authSession.getUserProfile()).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    it('persists rotated refresh token returned by the refresh endpoint', async () => {
      localStorage.setItem(keys.refreshToken, 'old-refresh');
      const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              access_token: 'new-access',
              refresh_token: 'new-refresh',
              expires_in: 900,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const { refreshAccessToken } = await import('../authSession');

      await expect(refreshAccessToken()).resolves.toBe('new-access');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({ refresh_token: 'old-refresh' });
      expect(localStorage.getItem(keys.accessToken)).toBe('new-access');
      expect(localStorage.getItem(keys.refreshToken)).toBe('new-refresh');
      expect(localStorage.getItem(keys.refreshLock)).toBeNull();
    });

    it('waits for another tab to finish refresh and reuses the rotated token set', async () => {
      vi.useFakeTimers();
      localStorage.setItem(keys.refreshToken, 'old-refresh');
      localStorage.setItem(keys.refreshLock, JSON.stringify({ owner: 'other-tab', expiresAt: Date.now() + 15_000 }));
      const fetchMock = vi.spyOn(window, 'fetch');

      const { refreshAccessToken, authSession } = await import('../authSession');
      const refreshPromise = refreshAccessToken();

      await vi.advanceTimersByTimeAsync(100);
      authSession.saveTokenSet({
        access_token: 'peer-access',
        refresh_token: 'peer-refresh',
        expires_in: 900,
      });
      localStorage.removeItem(keys.refreshLock);
      window.dispatchEvent(new StorageEvent('storage', { key: keys.refreshToken, newValue: 'peer-refresh' }));

      await expect(refreshPromise).resolves.toBe('peer-access');
      expect(fetchMock).not.toHaveBeenCalled();
      expect(localStorage.getItem(keys.refreshToken)).toBe('peer-refresh');
    });

    it('takes over a stale refresh lock and uses the latest refresh token from storage', async () => {
      vi.useFakeTimers();
      localStorage.setItem(keys.refreshToken, 'old-refresh');
      localStorage.setItem(keys.refreshLock, JSON.stringify({ owner: 'other-tab', expiresAt: Date.now() + 15_000 }));
      const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              access_token: 'new-access',
              refresh_token: 'newer-refresh',
              expires_in: 900,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const { refreshAccessToken } = await import('../authSession');
      const refreshPromise = refreshAccessToken();

      localStorage.setItem(keys.refreshToken, 'peer-refresh');
      await vi.advanceTimersByTimeAsync(15_100);

      await expect(refreshPromise).resolves.toBe('new-access');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({ refresh_token: 'peer-refresh' });
      expect(localStorage.getItem(keys.refreshToken)).toBe('newer-refresh');
    });

    it('uses the browser Web Lock and rechecks token storage before refreshing', async () => {
      localStorage.setItem(keys.refreshToken, 'old-refresh');
      const fetchMock = vi.spyOn(window, 'fetch');
      const lockRequest = vi.fn(
        async (_name: string, _options: { mode: 'exclusive' }, callback: () => Promise<string>) => {
          localStorage.setItem(keys.accessToken, 'peer-access');
          localStorage.setItem(keys.refreshToken, 'peer-refresh');
          return callback();
        }
      );
      Object.defineProperty(navigator, 'locks', {
        configurable: true,
        value: { request: lockRequest },
      });

      const { refreshAccessToken } = await import('../authSession');

      await expect(refreshAccessToken()).resolves.toBe('peer-access');
      expect(lockRequest).toHaveBeenCalledWith('gosso-auth-refresh', { mode: 'exclusive' }, expect.any(Function));
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
