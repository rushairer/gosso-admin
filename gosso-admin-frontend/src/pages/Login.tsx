import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Key } from 'lucide-react';
import { gossoClient, redirectToAuthorize } from '../auth';
import { Feedback, FormField } from '../components/ui';
import { logger } from '../utils/logger';
import { appPath } from '../config/appPaths';
import { instanceSettingsService } from '../services';
import type { PublicInstanceBranding } from '../types/api';

const defaultBranding: PublicInstanceBranding = {
  product_name: 'GOSSO',
  logo_url: '',
  favicon_url: '',
  login_title: '',
  login_description: '',
  login_background_url: '',
};

export default function Login() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const showDevCredentials = import.meta.env.DEV && import.meta.env.VITE_SHOW_DEV_CREDENTIALS === 'true';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [branding, setBranding] = useState(defaultBranding);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  useEffect(() => {
    let active = true;
    void instanceSettingsService
      .getPublicBranding()
      .then((next) => {
        if (!active) return;
        setBranding(next);
        document.title = next.product_name;
        if (next.favicon_url) {
          const icon =
            document.querySelector<HTMLLinkElement>('link[rel="icon"]') ||
            document.head.appendChild(document.createElement('link'));
          icon.rel = 'icon';
          icon.href = next.favicon_url;
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Capture where we should redirect back to (e.g. GOSSO authorize URL)
  const hasAuthorizeRedirect = searchParams.has('redirect_uri');
  const redirectUri = searchParams.get('redirect_uri') || '/admin';

  const doRedirect = () => {
    // The backend only supplies a relative OAuth authorize URL. Do not turn
    // this login page into an open redirect when it is reached directly.
    if (!redirectUri.startsWith('/') || redirectUri.startsWith('//')) {
      window.location.href = appPath('/admin');
      return;
    }
    window.location.href = `${window.location.origin}${redirectUri}`;
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setError(null);

    try {
      await gossoClient.loginWithPasskey();
      await storeTokensAndRedirect();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Passkey login error', err);
      setError(message || t('login.passkeyLoginFailed'));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const storeTokensAndRedirect = async () => {
    if (hasAuthorizeRedirect) {
      doRedirect();
      return;
    }

    await redirectToAuthorize('/admin');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t('login.enterBothFields'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await gossoClient.loginWithPassword(username, password);

      // Check if MFA is required
      if (result.requires_mfa) {
        setMfaRequired(true);
        setMfaToken(String(result.mfa_token || ''));
        setMfaCode('');
        setLoading(false);
        return;
      }

      await storeTokensAndRedirect();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Login error', err);
      setError(message || t('login.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim()) {
      setError(t('login.mfaCodeRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await gossoClient.verifyMfa(mfaToken, mfaCode.trim());
      await storeTokensAndRedirect();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('MFA verification error', err);
      setError(message || t('login.mfaVerificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex-row items-center justify-center"
      style={
        {
          height: '100vh',
          padding: '24px',
          backgroundImage: branding.login_background_url
            ? `linear-gradient(rgba(15,18,23,.72), rgba(15,18,23,.88)), url(${branding.login_background_url})`
            : undefined,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        } as React.CSSProperties
      }
    >
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center" style={{ marginBottom: '32px' }}>
          {branding.logo_url ? (
            <img
              src={branding.logo_url}
              alt=""
              style={{ maxWidth: '160px', maxHeight: '56px', objectFit: 'contain', marginBottom: '16px' }}
            />
          ) : null}
          <h1 style={{ color: 'var(--color-text-main)', fontSize: '32px', marginBottom: '8px' }}>
            {branding.login_title || branding.product_name || t('login.title')}
          </h1>
          <p className="text-muted" style={{ fontSize: '14.5px' }}>
            {branding.login_description || t('login.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-md">
            <Feedback type="error">{error}</Feedback>
          </div>
        )}

        {!mfaRequired ? (
          <form onSubmit={handleLogin}>
            <FormField label={t('login.usernameLabel')}>
              <input
                type="text"
                className="input-field"
                placeholder={t('login.usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </FormField>

            <FormField label={t('login.passwordLabel')}>
              <input
                type="password"
                className="input-field"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </FormField>

            <div style={{ margin: '-8px 0 18px', textAlign: 'right' }}>
              <Link
                to="/forgot-password"
                style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
              >
                {t('login.forgotPasswordLink')}
              </Link>
            </div>

            {showDevCredentials && !username && !password && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                  lineHeight: '1.5',
                }}
              >
                <strong style={{ color: 'var(--color-primary)' }}>{t('login.devCredentialsTitle')}</strong>{' '}
                {t('login.devCredentialsPrefix')} <code style={{ color: 'var(--color-secondary)' }}>admin</code> /{' '}
                <code style={{ color: 'var(--color-secondary)' }}>admin123</code>. {t('login.devCredentialsSuffix')}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? t('login.signInLoading') : t('login.signInButton')}
            </button>

            <div className="flex-row items-center gap-md" style={{ margin: '16px 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color, #374151)' }} />
              <span className="text-sm text-muted">{t('common.or')}</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color, #374151)' }} />
            </div>

            <button
              type="button"
              className="btn btn-secondary flex-row items-center justify-center gap-sm"
              style={{ width: '100%' }}
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading}
            >
              <Key size={16} />
              {passkeyLoading ? t('login.passkeyLoading') : t('login.passkeyButton')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaVerify}>
            <div
              className="notice-card"
              style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--color-primary)' }}
            >
              {t('login.mfaRequired')}
            </div>

            <FormField label={t('login.verificationCodeLabel')}>
              <input
                type="text"
                maxLength={8}
                className="input-field"
                placeholder={t('login.verificationCodePlaceholder')}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus
                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '0.15em', fontWeight: 'bold' }}
              />
            </FormField>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? t('login.verifyLoading') : t('login.verifyButton')}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() => {
                setMfaRequired(false);
                setError(null);
                setMfaCode('');
              }}
              disabled={loading}
            >
              {t('login.backToLogin')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
