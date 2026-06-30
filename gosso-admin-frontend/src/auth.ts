import {
  apiFetch,
  authSession,
  exchangeCodeForToken,
  fetchUserProfile,
  loginWithPassword,
  loginWithPasskey,
  redirectToAuthorize,
  refreshAccessToken,
  verifyMfa,
} from './services/authSession';

export {
  apiFetch,
  authSession,
  exchangeCodeForToken,
  fetchUserProfile,
  loginWithPassword,
  loginWithPasskey,
  redirectToAuthorize,
  refreshAccessToken,
  verifyMfa,
};
export type { TokenResponse, UserProfile } from './services/authSession';

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
