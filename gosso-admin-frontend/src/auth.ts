// OIDC Auth helper using Authorization Code Grant with PKCE

const SSO_ISSUER = window.location.origin;
const CLIENT_ID = 'gosso-admin-spa';
const REDIRECT_URI = `${window.location.origin}/callback`;

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
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=-1; SameSite=Lax`;
}

export async function redirectToAuthorize(customRedirectUri?: string) {
  const verifier = generateRandomString(64);
  const state = generateRandomString(16);
  
  localStorage.setItem('pkce_verifier', verifier);
  localStorage.setItem('auth_state', state);
  if (customRedirectUri) {
    localStorage.setItem('post_login_redirect', customRedirectUri);
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
  const savedState = localStorage.getItem('auth_state');
  const verifier = localStorage.getItem('pkce_verifier');
  
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

  // The OAuth2 /token endpoint returns tokens at the top level (RFC 6749),
  // not wrapped in a "data" field like the /api/v1/auth/* endpoints.
  const data: TokenResponse = await response.json();

  localStorage.setItem('access_token', data.access_token);
  if (data.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token);
  }

  setCookie('access_token', data.access_token, data.expires_in);

  localStorage.removeItem('pkce_verifier');
  localStorage.removeItem('auth_state');

  return data;
}

export async function fetchUserProfile(accessToken: string): Promise<UserProfile> {
  const response = await fetch(`${SSO_ISSUER}/oidc/userinfo`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  const data = await response.json();
  
  try {
    const payloadBase64 = accessToken.split('.')[1];
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(decodeURIComponent(escape(atob(padded))));
    if (payload.roles) {
      data.roles = payload.roles;
    }
  } catch (e) {
    console.error('Error parsing token roles', e);
  }

  localStorage.setItem('user_profile', JSON.stringify(data));
  return data;
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getUserProfile(): UserProfile | null {
  const profile = localStorage.getItem('user_profile');
  if (!profile) return null;
  try {
    return JSON.parse(profile);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}

export function isAdmin(): boolean {
  const profile = getUserProfile();
  return profile?.roles?.includes('admin') || false;
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_profile');
  deleteCookie('access_token');
  window.location.href = '/';
}

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await fetch(`${SSO_ISSUER}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      const body = await response.json();
      if (!response.ok) {
        // Do NOT call logout() here — let the caller decide how to handle
        // refresh failures. Calling logout() causes a page redirect that
        // interrupts the calling code's error handling (e.g. fetchSessions),
        // leading to a 401 → refresh fail → logout cascade with no error UI.
        throw new Error(body.message || 'Token refresh failed');
      }

      const data = body.data;
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setCookie('access_token', data.access_token, data.expires_in);

      return data.access_token;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();
  
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const config = { ...options, headers };
  let response = await fetch(url, config);
  
  if (response.status === 401 && localStorage.getItem('refresh_token')) {
    try {
      await refreshAccessToken();
      // Re-read the fresh token from localStorage (refreshAccessToken updates it)
      const freshToken = getAccessToken();
      if (freshToken) {
        headers.set('Authorization', `Bearer ${freshToken}`);
      }
      response = await fetch(url, { ...options, headers });
    } catch (err) {
      // Refresh failed (token expired, session revoked, etc.) — redirect to login.
      // Do NOT call logout() here as it triggers window.location.href = '/' which
      // can race with the caller's error handling.
      console.error('Failed to auto-refresh token on 401', err);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_profile');
      window.location.href = '/login';
    }
  }
  
  return response;
}


