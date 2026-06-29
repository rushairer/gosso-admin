import { createGossoClient } from '@gosso/client';
import type { LoginResult, TokenResponse, UserProfile, SessionSnapshot } from '@gosso/client';
import { appPath } from '../config/appPaths';

const SSO_ISSUER = window.location.origin;
const CLIENT_ID = 'gosso-admin-spa';
const REDIRECT_URI = `${window.location.origin}${appPath('/callback')}`;

const gossoClient = createGossoClient({
  issuer: SSO_ISSUER,
  clientId: CLIENT_ID,
  redirectUri: REDIRECT_URI,
  scope: 'openid profile email admin',
  postLoginDefaultPath: appPath('/admin'),
  loginPath: appPath('/login'),
  storagePrefix: 'gosso-admin',
});

const legacyStorageKeys = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  userProfile: 'user_profile',
  pkceVerifier: 'pkce_verifier',
  authState: 'auth_state',
  postLoginRedirect: 'post_login_redirect',
  tokenIssuedAt: 'token_issued_at',
  tokenExpiresIn: 'token_expires_in',
  refreshLock: 'auth_refresh_lock',
} satisfies Record<keyof typeof gossoClient.storageKeys, string>;

function migrateLegacyStorageKeys() {
  Object.entries(legacyStorageKeys).forEach(([name, legacyKey]) => {
    const nextKey = gossoClient.storageKeys[name as keyof typeof gossoClient.storageKeys];
    const legacyValue = localStorage.getItem(legacyKey);
    if (legacyValue && !localStorage.getItem(nextKey)) {
      localStorage.setItem(nextKey, legacyValue);
    }
  });
}

migrateLegacyStorageKeys();

export type { LoginResult, TokenResponse, UserProfile, SessionSnapshot };

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
  logout(redirectTo = '/') {
    return gossoClient.logout(appPath(redirectTo));
  },

  getPostLoginRedirect(defaultPath = '/admin'): string {
    return localStorage.getItem(gossoClient.storageKeys.postLoginRedirect) || defaultPath;
  },

  clearPostLoginRedirect() {
    localStorage.removeItem(gossoClient.storageKeys.postLoginRedirect);
  },
};

export const redirectToAuthorize = gossoClient.redirectToAuthorize;
export const exchangeCodeForToken = gossoClient.exchangeCodeForToken;
export const fetchUserProfile = gossoClient.fetchUserProfile;
export const refreshAccessToken = gossoClient.refreshAccessToken;
export const apiFetch = gossoClient.apiFetch;
export const loginWithPassword = gossoClient.loginWithPassword;
export const verifyMfa = gossoClient.verifyMfa;
export const loginWithPasskey = gossoClient.loginWithPasskey;
