import { createGossoClient } from '@gosso/client';
import { appPath } from './config/appPaths';

export type {
  SessionSnapshot,
  TokenResponse,
  UserProfile,
  PasskeyInfo,
  MfaStatus,
  MfaEnrollment,
  SessionInfo,
} from '@gosso/client';

export const gossoClient = createGossoClient({
  issuer: window.location.origin,
  clientId: 'gosso-admin-spa',
  redirectUri: `${window.location.origin}${appPath('/callback')}`,
  scope: 'openid profile email admin',
  postLoginDefaultPath: appPath('/system-management'),
  loginPath: appPath('/login'),
  storagePrefix: 'gosso-admin',
  sessionMode: 'cookie',
  refreshIdentityRequests: true,
});

export const apiFetch = gossoClient.apiFetch;

export async function redirectToAuthorize(destination = '/system-management') {
  return gossoClient.redirectToAuthorize(appPath(destination));
}

export function logout(redirectTo = '/') {
  return gossoClient.logout(appPath(redirectTo));
}
