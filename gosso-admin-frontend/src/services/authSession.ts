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
};

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
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
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
  setCookie('access_token', data.access_token, data.expires_in || 900);
}

function clearTokenSet() {
  localStorage.removeItem(storageKeys.accessToken);
  localStorage.removeItem(storageKeys.refreshToken);
  localStorage.removeItem(storageKeys.userProfile);
  deleteCookie('access_token');
}

function readRolesFromAccessToken(accessToken: string): string[] | undefined {
  try {
    const payloadBase64 = accessToken.split('.')[1];
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(decodeURIComponent(escape(atob(padded))));
    return payload.roles;
  } catch (e) {
    console.error('Error parsing token roles', e);
    return undefined;
  }
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
      isAdmin: profile?.roles?.includes('admin') || false,
    };
  },

  isLoggedIn(): boolean {
    return Boolean(this.getAccessToken());
  },

  isAdmin(): boolean {
    return this.getUserProfile()?.roles?.includes('admin') || false;
  },

  saveTokenSet(data: TokenResponse | { access_token: string; refresh_token?: string; expires_in?: number }) {
    persistTokenSet(data);
  },

  clear() {
    clearTokenSet();
  },

  logout(redirectTo = '/') {
    clearTokenSet();
    window.location.href = redirectTo;
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
  authUrl.searchParams.append('scope', 'openid profile email');
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

  localStorage.setItem(storageKeys.userProfile, JSON.stringify(data));
  return data;
}

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = authSession.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await fetch(`${SSO_ISSUER}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || 'Token refresh failed');
      }

      const data = body.data;
      authSession.saveTokenSet(data);
      return data.access_token;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authSession.getAccessToken();
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
      console.error('Failed to auto-refresh token on 401', err);
      authSession.clear();
      window.location.href = '/login';
    }
  }

  return response;
}
