import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Key } from 'lucide-react';
import { authSession, fetchUserProfile, redirectToAuthorize } from '../auth';
import { Feedback, FormField } from '../components/ui';
import { bufferToBase64URL, base64URLToBuffer } from '../utils/webauthn';
import { logger } from '../utils/logger';
import type { WebAuthnCredential } from '../types/api';

export default function Login() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const showDevCredentials = import.meta.env.DEV && import.meta.env.VITE_SHOW_DEV_CREDENTIALS === 'true';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // Capture where we should redirect back to (e.g. GOSSO authorize URL)
  const hasAuthorizeRedirect = searchParams.has('redirect_uri');
  const redirectUri = searchParams.get('redirect_uri') || '/admin';

  const doRedirect = () => {
    if (redirectUri.startsWith('/')) {
      window.location.href = `${window.location.origin}${redirectUri}`;
    } else {
      window.location.href = redirectUri;
    }
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setError(null);

    try {
      // Step 1: Begin passkey login (discoverable — no account_id)
      const beginRes = await fetch('/api/v1/passkey/login/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const beginBody = await beginRes.json();
      if (!beginRes.ok) throw new Error(beginBody.message || 'Failed to begin passkey login');

      const { options, request_id } = beginBody.data;
      if (!options?.challenge) throw new Error('Server returned invalid WebAuthn options');

      // Step 2: Browser WebAuthn assertion
      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        ...options,
        challenge: base64URLToBuffer(options.challenge),
        allowCredentials: (options.allowCredentials || []).map((cred: WebAuthnCredential) => ({
          ...cred,
          id: base64URLToBuffer(cred.id),
        })),
      };
      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyOptions,
      })) as PublicKeyCredential | null;
      if (!assertion?.response) throw new Error('Passkey authentication cancelled or failed');

      // Step 3: Complete login
      const assertionResponse = assertion.response as AuthenticatorAssertionResponse;
      const completeBody = {
        request_id,
        id: assertion.id,
        rawId: bufferToBase64URL(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: bufferToBase64URL(assertionResponse.clientDataJSON),
          authenticatorData: bufferToBase64URL(assertionResponse.authenticatorData),
          signature: bufferToBase64URL(assertionResponse.signature),
          userHandle: assertionResponse.userHandle ? bufferToBase64URL(assertionResponse.userHandle) : null,
        },
      };
      const completeRes = await fetch('/api/v1/passkey/login/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeBody),
      });
      const completeRespBody = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeRespBody.message || 'Passkey login failed');

      await storeTokensAndRedirect(completeRespBody.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Passkey login error', err);
      setError(message || t('login.passkeyLoginFailed'));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const storeTokensAndRedirect = async (data: { access_token: string; refresh_token: string; expires_in: number }) => {
    authSession.saveTokenSet(data);

    try {
      await fetchUserProfile(data.access_token);
    } catch (profileErr) {
      logger.warn('Failed to fetch user profile after login', profileErr);
    }

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
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || t('login.loginFailed'));
      }

      // Check if MFA is required
      if (body.data?.requires_mfa) {
        setMfaRequired(true);
        setMfaToken(body.data.mfa_token);
        setMfaCode('');
        setLoading(false);
        return;
      }

      await storeTokensAndRedirect(body.data);
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
      const response = await fetch('/api/v1/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfa_token: mfaToken,
          code: mfaCode.trim(),
          type: 'totp',
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || t('login.mfaVerificationFailed'));
      }

      await storeTokensAndRedirect(body.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('MFA verification error', err);
      setError(message || t('login.mfaVerificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-row items-center justify-center" style={{ height: '100vh' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center" style={{ marginBottom: '32px' }}>
          <h1 style={{ color: 'var(--color-text-main)', fontSize: '32px', marginBottom: '8px' }}>{t('login.title')}</h1>
          <p className="text-muted" style={{ fontSize: '14.5px' }}>
            {t('login.subtitle')}
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
