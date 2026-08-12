import { appPath } from '../config/appPaths';
import { base64URLToBuffer, bufferToBase64URL } from '../utils/webauthn';

const SSO_ISSUER = window.location.origin;
const CLIENT_ID = 'gosso-admin-spa';
const REDIRECT_URI = `${window.location.origin}${appPath('/callback')}`;
const storagePrefix = 'gosso-admin';
const cookieSessionHeaders = { 'X-Gosso-Cookie-Session': '1' };

export interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
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
  accessToken: null;
  refreshToken: null;
  profile: UserProfile | null;
  loggedIn: boolean;
  isAdmin: boolean;
}

export interface LoginResult extends TokenResponse {
  requires_mfa?: boolean;
  mfa_token?: string;
  mfa_types?: string[];
}

type SessionListener = (snapshot: SessionSnapshot) => void;

const storageKeys = {
  pkceVerifier: `${storagePrefix}:pkce_verifier`,
  authState: `${storagePrefix}:auth_state`,
  postLoginRedirect: `${storagePrefix}:post_login_redirect`,
};
const listeners = new Set<SessionListener>();
let profile: UserProfile | null = null;

function snapshot(): SessionSnapshot {
  const isAdmin = Boolean(profile?.roles?.includes('admin') && profile?.scope?.split(/\s+/).includes('admin'));
  return { accessToken: null, refreshToken: null, profile, loggedIn: profile !== null, isAdmin };
}

function notify() {
  const value = snapshot();
  listeners.forEach((listener) => listener(value));
}

function csrfToken(): string | null {
  const names = ['__Host-csrf_token', 'csrf_token'];
  for (const cookie of document.cookie.split(';')) {
    const [name, ...value] = cookie.trim().split('=');
    if (names.includes(name)) return decodeURIComponent(value.join('='));
  }
  return null;
}

function isUnsafe(method?: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes((method || 'GET').toUpperCase());
}

async function parseEnvelope<T>(response: Response, fallback: string): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.error_description || fallback);
  return body.data as T;
}

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (byte) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[byte % 66]
  ).join('');
}

async function codeChallenge(verifier: string): Promise<string> {
  return bufferToBase64URL(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const request = () => {
    const headers = new Headers(options.headers);
    if (isUnsafe(options.method) && !headers.has('X-CSRF-Token')) {
      const token = csrfToken();
      if (token) headers.set('X-CSRF-Token', token);
    }
    return fetch(url, { ...options, headers, credentials: 'same-origin' });
  };
  let response = await request();
  if (response.status === 401 && !url.endsWith('/api/v1/auth/refresh')) {
    const token = csrfToken();
    const refreshed = await fetch(`${SSO_ISSUER}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { ...cookieSessionHeaders, ...(token ? { 'X-CSRF-Token': token } : {}) },
      credentials: 'same-origin',
    });
    if (refreshed.ok) response = await request();
  }
  return response;
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const response = await apiFetch(`${SSO_ISSUER}/oidc/userinfo`);
  if (!response.ok) throw new Error('Failed to fetch user profile');
  const next = (await response.json()) as UserProfile;
  profile = next;
  notify();
  return next;
}

export async function redirectToAuthorize(destination = '/admin'): Promise<void> {
  const verifier = randomString(64);
  const state = randomString(32);
  sessionStorage.setItem(storageKeys.pkceVerifier, verifier);
  sessionStorage.setItem(storageKeys.authState, state);
  sessionStorage.setItem(storageKeys.postLoginRedirect, appPath(destination));
  const url = new URL(`${SSO_ISSUER}/oauth2/authorize`);
  url.search = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile email admin',
    code_challenge: await codeChallenge(verifier),
    code_challenge_method: 'S256',
    state,
  }).toString();
  window.location.assign(url);
}

export async function exchangeCodeForToken(code: string, state: string): Promise<TokenResponse> {
  const savedState = sessionStorage.getItem(storageKeys.authState);
  const verifier = sessionStorage.getItem(storageKeys.pkceVerifier);
  if (!verifier || state !== savedState) throw new Error('Invalid OAuth callback state');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    code_verifier: verifier,
    redirect_uri: REDIRECT_URI,
  });
  const response = await fetch(`${SSO_ISSUER}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...cookieSessionHeaders },
    body,
    credentials: 'same-origin',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error_description || 'Token exchange failed');
  sessionStorage.removeItem(storageKeys.pkceVerifier);
  sessionStorage.removeItem(storageKeys.authState);
  return {};
}

export async function loginWithPassword(username: string, password: string): Promise<LoginResult> {
  const response = await fetch(`${SSO_ISSUER}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cookieSessionHeaders },
    body: JSON.stringify({ username, password }),
    credentials: 'same-origin',
  });
  const result = await parseEnvelope<LoginResult>(response, 'Login failed');
  if (!result.requires_mfa) await fetchUserProfile();
  return result;
}

export async function verifyMfa(mfaToken: string, code: string): Promise<TokenResponse> {
  const response = await fetch(`${SSO_ISSUER}/api/v1/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cookieSessionHeaders },
    body: JSON.stringify({ mfa_token: mfaToken, code }),
    credentials: 'same-origin',
  });
  await parseEnvelope<TokenResponse>(response, 'MFA verification failed');
  await fetchUserProfile();
  return {};
}

export async function loginWithPasskey(): Promise<TokenResponse> {
  const begin = await parseEnvelope<{ request_id: string; options: PublicKeyCredentialRequestOptions }>(
    await fetch(`${SSO_ISSUER}/api/v1/passkey/login/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      credentials: 'same-origin',
    }),
    'Failed to begin passkey login'
  );
  const options = {
    ...begin.options,
    challenge: base64URLToBuffer(String(begin.options.challenge)),
    allowCredentials: begin.options.allowCredentials?.map((credential) => ({
      ...credential,
      id: base64URLToBuffer(String(credential.id)),
    })),
  } as PublicKeyCredentialRequestOptions;
  const assertion = (await navigator.credentials.get({ publicKey: options })) as PublicKeyCredential | null;
  if (!assertion?.response) throw new Error('Passkey authentication cancelled or failed');
  const response = assertion.response as AuthenticatorAssertionResponse;
  const complete = await fetch(`${SSO_ISSUER}/api/v1/passkey/login/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cookieSessionHeaders },
    credentials: 'same-origin',
    body: JSON.stringify({
      request_id: begin.request_id,
      id: assertion.id,
      rawId: bufferToBase64URL(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: bufferToBase64URL(response.clientDataJSON),
        authenticatorData: bufferToBase64URL(response.authenticatorData),
        signature: bufferToBase64URL(response.signature),
        userHandle: response.userHandle ? bufferToBase64URL(response.userHandle) : null,
      },
    }),
  });
  await parseEnvelope<TokenResponse>(complete, 'Passkey login failed');
  await fetchUserProfile();
  return {};
}

export const authSession = {
  storageKeys,
  getAccessToken: () => null,
  getRefreshToken: () => null,
  getUserProfile: () => profile,
  getSnapshot: snapshot,
  isLoggedIn: () => snapshot().loggedIn,
  isAdmin: () => snapshot().isAdmin,
  saveTokenSet: (_: TokenResponse) => undefined,
  clear: () => {
    profile = null;
    Object.values(storageKeys).forEach((key) => sessionStorage.removeItem(key));
    notify();
  },
  subscribe(listener: SessionListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  async logout(redirectTo = '/') {
    await apiFetch(`${SSO_ISSUER}/api/v1/auth/logout`, { method: 'POST', keepalive: true });
    profile = null;
    Object.values(storageKeys).forEach((key) => sessionStorage.removeItem(key));
    notify();
    window.location.assign(appPath(redirectTo));
  },
  getPostLoginRedirect(defaultPath = '/admin') {
    return sessionStorage.getItem(storageKeys.postLoginRedirect) || appPath(defaultPath);
  },
  clearPostLoginRedirect() {
    sessionStorage.removeItem(storageKeys.postLoginRedirect);
  },
};

export async function refreshAccessToken(): Promise<string> {
  const response = await apiFetch(`${SSO_ISSUER}/api/v1/auth/refresh`, { method: 'POST', headers: cookieSessionHeaders });
  if (!response.ok) throw new Error('Token refresh failed');
  return '';
}
