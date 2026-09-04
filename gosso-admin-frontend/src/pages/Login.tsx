import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '@gosso/client/react';
import { gossoClient, logout, redirectToAuthorize } from '../auth';
import LoginSurface from '../components/auth/LoginSurface';
import { logger } from '../utils/logger';
import { appPath } from '../config/appPaths';
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings } from '../config/site-defaults';
import { siteSettingsService } from '../services';
import type { PublicSiteBranding } from '../types/api';
import { AuthenticationError, safeLocalPath } from '@gosso/client';

export default function Login() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const showDevCredentials = import.meta.env.DEV && import.meta.env.VITE_SHOW_DEV_CREDENTIALS === 'true';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [branding, setBranding] = useState<PublicSiteBranding>(DEFAULT_SITE_SETTINGS);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const loginErrorMessage = (reason: unknown, fallback: string) => {
    if (
      (reason instanceof AuthenticationError && reason.code === 'USER_PROFILE_FAILED') ||
      (reason instanceof Error && reason.message === 'Failed to fetch user profile')
    ) {
      return t('login.failedLoadProfile');
    }
    return reason instanceof Error ? reason.message : fallback;
  };

  useEffect(() => {
    let active = true;
    void siteSettingsService
      .getPublicSiteBranding()
      .then((next) => {
        if (!active) return;
        const resolved = mergeSiteSettings(next);
        setBranding(resolved);
        document.title = `${t('login.signInButton')} - ${resolved.product_name}`;
        if (resolved.favicon_url) {
          const icon =
            document.querySelector<HTMLLinkElement>('link[rel="icon"]') ||
            document.head.appendChild(document.createElement('link'));
          icon.rel = 'icon';
          icon.href = resolved.favicon_url;
        }
      })
      .catch(() => {
        document.title = `${t('login.signInButton')} - ${DEFAULT_SITE_SETTINGS.product_name}`;
      });
    return () => {
      active = false;
    };
  }, [t]);

  const hasAuthorizeRedirect = searchParams.has('redirect_uri');
  const redirectUri = searchParams.get('redirect_uri') || '/system-management';
  const requiresStrongAuth = searchParams.get('reason') === 'mfa';
  const session = useSession();
  const isSudoMode = requiresStrongAuth && session.loggedIn;
  const sudoAccountName = session.profile?.preferred_username || session.profile?.name || session.profile?.sub || '';

  const doRedirect = () => {
    window.location.href = safeLocalPath(redirectUri, appPath('/system-management'));
  };

  const storeTokensAndRedirect = async () => {
    if (hasAuthorizeRedirect) {
      doRedirect();
      return;
    }
    await redirectToAuthorize('/system-management');
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setError(null);
    try {
      await gossoClient.loginWithPasskey();
      await storeTokensAndRedirect();
    } catch (reason: unknown) {
      logger.error('Passkey login error', reason);
      setError(loginErrorMessage(reason, t('login.passkeyLoginFailed')));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username || !password) {
      setError(t('login.enterBothFields'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await gossoClient.loginWithPassword(username, password);
      if (result.requires_mfa) {
        setMfaRequired(true);
        setMfaToken(String(result.mfa_token || ''));
        setMfaCode('');
        return;
      }
      if (requiresStrongAuth) {
        setError(t('login.strongAuthenticationUnavailable'));
        return;
      }
      await storeTokensAndRedirect();
    } catch (reason: unknown) {
      logger.error('Login error', reason);
      setError(loginErrorMessage(reason, t('login.networkError')));
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mfaCode.trim()) {
      setError(t('login.mfaCodeRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isSudoMode) {
        await gossoClient.stepUpMfa(mfaCode.trim());
      } else {
        await gossoClient.verifyMfa(mfaToken, mfaCode.trim());
      }
      await storeTokensAndRedirect();
    } catch (reason: unknown) {
      logger.error('MFA verification error', reason);
      setError(loginErrorMessage(reason, t('login.mfaVerificationFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    logout(appPath('/login'));
  };

  const handleBackToLogin = () => {
    setMfaRequired(false);
    setError(null);
    setMfaCode('');
  };

  return (
    <LoginSurface
      branding={branding}
      username={username}
      password={password}
      error={error}
      loading={loading}
      passkeyLoading={passkeyLoading}
      mfaRequired={mfaRequired}
      mfaCode={mfaCode}
      isSudoMode={isSudoMode}
      sudoAccountName={sudoAccountName}
      showDevCredentials={showDevCredentials}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onMfaCodeChange={setMfaCode}
      onLoginSubmit={handleLogin}
      onMfaSubmit={handleMfaVerify}
      onPasskeyLogin={() => void handlePasskeyLogin()}
      onBackToLogin={handleBackToLogin}
      onSwitchAccount={handleSwitchAccount}
    />
  );
}
