import { describe, it, expect, beforeEach } from 'vitest';

// We test the exported functions by importing the module fresh in each test group
// authSession reads from localStorage, so we clear it in beforeEach

describe('authSession', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
  });

  describe('isLoggedIn / isAdmin', () => {
    it('returns false when no token is stored', async () => {
      const { authSession } = await import('../authSession');
      expect(authSession.isLoggedIn()).toBe(false);
      expect(authSession.isAdmin()).toBe(false);
    });

    it('returns true when token exists', async () => {
      localStorage.setItem('access_token', 'test-token');
      const { authSession } = await import('../authSession');
      expect(authSession.isLoggedIn()).toBe(true);
    });

    it('detects admin role from stored profile', async () => {
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('user_profile', JSON.stringify({ sub: '1', roles: ['admin'] }));
      const { authSession } = await import('../authSession');
      expect(authSession.isAdmin()).toBe(true);
    });

    it('returns false for non-admin profile', async () => {
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('user_profile', JSON.stringify({ sub: '1', roles: ['user'] }));
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
      expect(localStorage.getItem('access_token')).toBe('atoken');
      expect(localStorage.getItem('refresh_token')).toBe('rtoken');
      expect(localStorage.getItem('token_issued_at')).toBeTruthy();
      expect(localStorage.getItem('token_expires_in')).toBe('900');
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
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user_profile')).toBeNull();
      expect(localStorage.getItem('token_issued_at')).toBeNull();
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
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('user_profile', JSON.stringify({ sub: '1', name: 'Admin', roles: ['admin'] }));
      const { authSession } = await import('../authSession');
      const snap = authSession.getSnapshot();
      expect(snap.loggedIn).toBe(true);
      expect(snap.isAdmin).toBe(true);
      expect(snap.accessToken).toBe('test-token');
      expect(snap.profile?.name).toBe('Admin');
    });
  });

  describe('getUserProfile', () => {
    it('returns null when no profile stored', async () => {
      const { authSession } = await import('../authSession');
      expect(authSession.getUserProfile()).toBeNull();
    });

    it('parses stored profile JSON', async () => {
      const profile = { sub: '123', name: 'Test User', email: 'test@example.com' };
      localStorage.setItem('user_profile', JSON.stringify(profile));
      const { authSession } = await import('../authSession');
      expect(authSession.getUserProfile()).toEqual(profile);
    });

    it('returns null for invalid JSON', async () => {
      localStorage.setItem('user_profile', 'not-json');
      const { authSession } = await import('../authSession');
      expect(authSession.getUserProfile()).toBeNull();
    });
  });
});
