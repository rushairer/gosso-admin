import {
  apiFetch,
  authSession,
  exchangeCodeForToken,
  fetchUserProfile,
  redirectToAuthorize,
  refreshAccessToken,
} from './services/authSession';

export { apiFetch, authSession, exchangeCodeForToken, fetchUserProfile, redirectToAuthorize, refreshAccessToken };
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
  authSession.logout('/');
}
