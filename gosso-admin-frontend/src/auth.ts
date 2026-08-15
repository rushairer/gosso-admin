import { createGossoClient } from '@gosso/client';
import type { SessionSnapshot } from '@gosso/client';
import { appPath } from './config/appPaths';

export type { SessionSnapshot, TokenResponse, UserProfile } from '@gosso/client';

const listeners = new Set<(snapshot: SessionSnapshot) => void>();

export const gossoClient = createGossoClient({
  issuer: window.location.origin,
  clientId: 'gosso-admin-spa',
  redirectUri: `${window.location.origin}${appPath('/callback')}`,
  scope: 'openid profile email admin',
  postLoginDefaultPath: appPath('/admin'),
  loginPath: appPath('/login'),
  storagePrefix: 'gosso-admin',
  sessionMode: 'cookie',
  refreshIdentityRequests: true,
  onSessionChanged(snapshot) {
    listeners.forEach((listener) => listener(snapshot));
  },
});

export const apiFetch = gossoClient.apiFetch;
export const exchangeCodeForToken = gossoClient.exchangeCodeForToken;
export const fetchUserProfile = gossoClient.fetchUserProfile;
export const loginWithPassword = gossoClient.loginWithPassword;
export const loginWithPasskey = gossoClient.loginWithPasskey;
export const refreshAccessToken = gossoClient.refreshAccessToken;
export const verifyMfa = gossoClient.verifyMfa;

export async function redirectToAuthorize(destination = '/admin') {
  return gossoClient.redirectToAuthorize(appPath(destination));
}

export const authSession = {
  storageKeys: gossoClient.storageKeys,
  getAccessToken: gossoClient.getAccessToken,
  getRefreshToken: gossoClient.getRefreshToken,
  getUserProfile: gossoClient.getUserProfile,
  getSnapshot: gossoClient.getSnapshot,
  isLoggedIn: gossoClient.isLoggedIn,
  isAdmin: gossoClient.isAdmin,
  saveTokenSet: gossoClient.saveTokenSet,
  clear: gossoClient.clear,
  subscribe(listener: (snapshot: SessionSnapshot) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  async logout(redirectTo = '/') {
    return gossoClient.logout(appPath(redirectTo));
  },
  getPostLoginRedirect(defaultPath = '/admin') {
    return sessionStorage.getItem(gossoClient.storageKeys.postLoginRedirect) || appPath(defaultPath);
  },
  clearPostLoginRedirect() {
    sessionStorage.removeItem(gossoClient.storageKeys.postLoginRedirect);
  },
};

export function getAccessToken(): string | null {
  return authSession.getAccessToken();
}

export function getUserProfile() {
  return authSession.getUserProfile();
}

export function isLoggedIn(): boolean {
  return authSession.isLoggedIn();
}

export function isAdmin(): boolean {
  return authSession.isAdmin();
}

export function logout() {
  return authSession.logout('/');
}
