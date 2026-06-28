import { logger } from '../utils/logger';

const SSO_ISSUER = window.location.origin;
const CLIENT_ID = 'gosso-admin-spa';
const REDIRECT_URI = `${window.location.origin}/callback`;

const storageKeys = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  userProfile: 'user_profile',
  pkceVerifier: 'pkce_verifier',
  authState: 'auth_state',
  postLoginRedirect: 'post_login_redirect',
  tokenIssuedAt: 'token_issued_at',
  tokenExpiresIn: 'token_expires_in',
  refreshLock: 'auth_refresh_lock',
};

const REFRESH_LOCK_TTL_MS = 15_000;
const REFRESH_WAIT_TIMEOUT_MS = 20_000;
const REFRESH_WAIT_POLL_MS = 100;
const REFRESH_WEB_LOCK_NAME = 'gosso-auth-refresh';

interface RefreshLock {
  owner: string;
  expiresAt: number;
}

interface BrowserLockManager {
  request<T>(name: string, options: { mode: 'exclusive' }, callback: () => T | Promise<T>): Promise<T>;
}

type NavigatorWithLocks = Navigator & { locks?: BrowserLockManager };

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
}

export interface UserProfile {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  roles?: string[];
  scope?: string;
}

export interface SessionSnapshot {
  accessToken: string | null;
  refreshToken: string | null;
  profile: UserProfile | null;
  loggedIn: boolean;
  isAdmin: boolean;
}

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=-1; SameSite=Lax`;
}

function readProfile(): UserProfile | null {
  const profile = localStorage.getItem(storageKeys.userProfile);
  if (!profile) return null;
  try {
    return JSON.parse(profile);
  } catch {
    return null;
  }
}

function persistTokenSet(data: TokenResponse | { access_token: string; refresh_token?: string; expires_in?: number }) {
  localStorage.setItem(storageKeys.accessToken, data.access_token);
  if (data.refresh_token) {
    localStorage.setItem(storageKeys.refreshToken, data.refresh_token);
  }
  localStorage.setItem(storageKeys.tokenIssuedAt, String(Date.now()));
  localStorage.setItem(storageKeys.tokenExpiresIn, String(data.expires_in || 900));
  setCookie('access_token', data.access_token, data.expires_in || 900);
}

function clearTokenSet() {
  localStorage.removeItem(storageKeys.accessToken);
  localStorage.removeItem(storageKeys.refreshToken);
  localStorage.removeItem(storageKeys.userProfile);
  localStorage.removeItem(storageKeys.tokenIssuedAt);
  localStorage.removeItem(storageKeys.tokenExpiresIn);
  localStorage.removeItem(storageKeys.refreshLock);
  deleteCookie('access_token');
}

async function revokeCurrentSession(): Promise<void> {
  const accessToken = localStorage.getItem(storageKeys.accessToken);
  if (!accessToken) return;

  try {
    await fetch(`${SSO_ISSUER}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'same-origin',
      keepalive: true,
    });
  } catch (err) {
    logger.warn('Failed to revoke session during logout', err);
  }
}

function readClaimsFromAccessToken(accessToken: string): Record<string, unknown> | null {
  try {
    const payloadBase64 = accessToken.split('.')[1];
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch (e) {
    logger.error('Error parsing access token claims', e);
    return null;
  }
}

function readRolesFromAccessToken(accessToken: string): string[] | undefined {
  const payload = readClaimsFromAccessToken(accessToken);
  return Array.isArray(payload?.roles) ? (payload.roles as string[]) : undefined;
}

function readScopeFromAccessToken(accessToken: string): string | undefined {
  const payload = readClaimsFromAccessToken(accessToken);
  return typeof payload?.scope === 'string' ? payload.scope : undefined;
}

function hasAdminAccess(profile: UserProfile | null, accessToken: string | null): boolean {
  const hasAdminRole = profile?.roles?.includes('admin') || false;
  const scope = accessToken ? readScopeFromAccessToken(accessToken) : profile?.scope;
  const hasAdminScope = scope?.split(/\s+/).includes('admin') || false;
  return hasAdminRole && hasAdminScope;
}

export const authSession = {
  storageKeys,

  getAccessToken(): string | null {
    return localStorage.getItem(storageKeys.accessToken);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(storageKeys.refreshToken);
  },

  getUserProfile(): UserProfile | null {
    return readProfile();
  },

  getSnapshot(): SessionSnapshot {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const profile = this.getUserProfile();
    return {
      accessToken,
      refreshToken,
      profile,
      loggedIn: Boolean(accessToken),
      isAdmin: hasAdminAccess(profile, accessToken),
    };
  },

  isLoggedIn(): boolean {
    return Boolean(this.getAccessToken());
  },

  isAdmin(): boolean {
    return hasAdminAccess(this.getUserProfile(), this.getAccessToken());
  },

  saveTokenSet(data: TokenResponse | { access_token: string; refresh_token?: string; expires_in?: number }) {
    persistTokenSet(data);
  },

  clear() {
    clearTokenSet();
  },

  async logout(redirectTo = '/') {
    try {
      await revokeCurrentSession();
    } finally {
      clearTokenSet();
      window.location.href = redirectTo;
    }
  },

  getPostLoginRedirect(defaultPath = '/admin'): string {
    return localStorage.getItem(storageKeys.postLoginRedirect) || defaultPath;
  },

  clearPostLoginRedirect() {
    localStorage.removeItem(storageKeys.postLoginRedirect);
  },
};

export async function redirectToAuthorize(customRedirectUri?: string) {
  const verifier = generateRandomString(64);
  const state = generateRandomString(16);

  localStorage.setItem(storageKeys.pkceVerifier, verifier);
  localStorage.setItem(storageKeys.authState, state);
  if (customRedirectUri) {
    localStorage.setItem(storageKeys.postLoginRedirect, customRedirectUri);
  }

  const challenge = await generateCodeChallenge(verifier);

  const authUrl = new URL(`${SSO_ISSUER}/oauth2/authorize`);
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', 'openid profile email admin');
  authUrl.searchParams.append('code_challenge', challenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('state', state);

  window.location.href = authUrl.toString();
}

export async function exchangeCodeForToken(code: string, state: string): Promise<TokenResponse> {
  const savedState = localStorage.getItem(storageKeys.authState);
  const verifier = localStorage.getItem(storageKeys.pkceVerifier);

  if (state !== savedState) {
    throw new Error('State mismatch. Potential CSRF attack.');
  }
  if (!verifier) {
    throw new Error('PKCE verifier not found. Authentication flow expired.');
  }

  const body = new URLSearchParams();
  body.append('grant_type', 'authorization_code');
  body.append('client_id', CLIENT_ID);
  body.append('code', code);
  body.append('code_verifier', verifier);
  body.append('redirect_uri', REDIRECT_URI);

  const response = await fetch(`${SSO_ISSUER}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Token exchange failed: ${errText}`);
  }

  const data: TokenResponse = await response.json();
  authSession.saveTokenSet(data);
  localStorage.removeItem(storageKeys.pkceVerifier);
  localStorage.removeItem(storageKeys.authState);
  return data;
}

export async function fetchUserProfile(accessToken: string): Promise<UserProfile> {
  const response = await fetch(`${SSO_ISSUER}/oidc/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  const data = await response.json();
  const roles = readRolesFromAccessToken(accessToken);
  if (roles) {
    data.roles = roles;
  }
  const scope = readScopeFromAccessToken(accessToken);
  if (scope) {
    data.scope = scope;
  }

  localStorage.setItem(storageKeys.userProfile, JSON.stringify(data));
  return data;
}

let refreshPromise: Promise<string> | null = null;

function parseRefreshLock(raw: string | null): RefreshLock | null {
  if (!raw) return null;
  try {
    const lock = JSON.parse(raw) as Partial<RefreshLock>;
    if (typeof lock.owner !== 'string' || typeof lock.expiresAt !== 'number') {
      return null;
    }
    return { owner: lock.owner, expiresAt: lock.expiresAt };
  } catch {
    return null;
  }
}

function generateRefreshOwner(): string {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function tryAcquireRefreshLock(owner: string): boolean {
  const now = Date.now();
  const current = parseRefreshLock(localStorage.getItem(storageKeys.refreshLock));
  if (current && current.expiresAt > now && current.owner !== owner) {
    return false;
  }

  const nextLock: RefreshLock = { owner, expiresAt: now + REFRESH_LOCK_TTL_MS };
  localStorage.setItem(storageKeys.refreshLock, JSON.stringify(nextLock));
  return parseRefreshLock(localStorage.getItem(storageKeys.refreshLock))?.owner === owner;
}

function releaseRefreshLock(owner: string) {
  const current = parseRefreshLock(localStorage.getItem(storageKeys.refreshLock));
  if (!current || current.owner === owner || current.expiresAt <= Date.now()) {
    localStorage.removeItem(storageKeys.refreshLock);
  }
}

async function waitForRefreshFromAnotherContext(previousRefreshToken: string): Promise<string | null> {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    let settled = false;
    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    const finish = (token: string | null) => {
      if (settled) return;
      settled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      window.removeEventListener('storage', check);
      resolve(token);
    };

    const check = () => {
      const accessToken = authSession.getAccessToken();
      const refreshToken = authSession.getRefreshToken();
      const issuedAt = Number(localStorage.getItem(storageKeys.tokenIssuedAt));
      if (accessToken && refreshToken && refreshToken !== previousRefreshToken && issuedAt >= startedAt) {
        finish(accessToken);
        return;
      }

      const lock = parseRefreshLock(localStorage.getItem(storageKeys.refreshLock));
      if (!lock || lock.expiresAt <= Date.now()) {
        finish(null);
      }
    };

    window.addEventListener('storage', check);
    intervalId = window.setInterval(check, REFRESH_WAIT_POLL_MS);
    timeoutId = window.setTimeout(() => finish(null), REFRESH_WAIT_TIMEOUT_MS);
    check();
  });
}

async function requestBrowserRefreshLock(callback: () => Promise<string>): Promise<string> {
  const locks = (navigator as NavigatorWithLocks).locks;
  if (!locks) {
    return callback();
  }
  return locks.request(REFRESH_WEB_LOCK_NAME, { mode: 'exclusive' }, callback);
}

async function performTokenRefresh(previousRefreshToken: string): Promise<string> {
  const latestRefreshToken = authSession.getRefreshToken();
  if (!latestRefreshToken) {
    throw new Error('No refresh token found');
  }
  if (latestRefreshToken !== previousRefreshToken) {
    const latestAccessToken = authSession.getAccessToken();
    if (latestAccessToken) {
      return latestAccessToken;
    }
  }

  const response = await fetch(`${SSO_ISSUER}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: latestRefreshToken }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || 'Token refresh failed');
  }

  const data = body.data;
  authSession.saveTokenSet(data);
  return data.access_token;
}

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const owner = generateRefreshOwner();
    let lockAcquired = false;
    try {
      const refreshToken = authSession.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      if ((navigator as NavigatorWithLocks).locks) {
        const token = await requestBrowserRefreshLock(() => performTokenRefresh(refreshToken));
        return token;
      }

      lockAcquired = tryAcquireRefreshLock(owner);
      if (!lockAcquired) {
        const tokenFromPeer = await waitForRefreshFromAnotherContext(refreshToken);
        if (tokenFromPeer) {
          return tokenFromPeer;
        }

        lockAcquired = tryAcquireRefreshLock(owner);
        if (!lockAcquired) {
          throw new Error('Token refresh is already in progress');
        }
      }

      const token = await performTokenRefresh(refreshToken);
      return token;
    } finally {
      if (lockAcquired) {
        releaseRefreshLock(owner);
      }
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = authSession.getAccessToken();

  if (!token) {
    window.location.href = '/login';
    return new Response(null, { status: 401 });
  }

  // Client-side token expiry pre-check
  const issuedAt = Number(localStorage.getItem(storageKeys.tokenIssuedAt));
  const expiresIn = Number(localStorage.getItem(storageKeys.tokenExpiresIn)) || 900;
  if (issuedAt && Date.now() - issuedAt > expiresIn * 1000) {
    try {
      token = await refreshAccessToken();
    } catch {
      authSession.clear();
      window.location.href = '/login';
      return new Response(null, { status: 401 });
    }
  }

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && authSession.getRefreshToken()) {
    try {
      const freshToken = await refreshAccessToken();
      headers.set('Authorization', `Bearer ${freshToken}`);
      response = await fetch(url, { ...options, headers });
    } catch (err) {
      logger.error('Failed to auto-refresh token on 401', err);
      authSession.clear();
      window.location.href = '/login';
    }
  }

  return response;
}
