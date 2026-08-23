import type { CSSProperties, FormEventHandler } from 'react';
import { Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PublicSiteBranding } from '../../types/api';
import { Feedback, FormField } from '../ui';

interface LoginSurfaceProps {
  branding: PublicSiteBranding;
  username: string;
  password: string;
  error: string | null;
  loading: boolean;
  passkeyLoading: boolean;
  mfaRequired: boolean;
  mfaCode: string;
  showDevCredentials?: boolean;
  preview?: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onMfaCodeChange: (value: string) => void;
  onLoginSubmit: FormEventHandler<HTMLFormElement>;
  onMfaSubmit: FormEventHandler<HTMLFormElement>;
  onPasskeyLogin: () => void;
  onBackToLogin: () => void;
}

export default function LoginSurface({
  branding,
  username,
  password,
  error,
  loading,
  passkeyLoading,
  mfaRequired,
  mfaCode,
  showDevCredentials = false,
  preview = false,
  onUsernameChange,
  onPasswordChange,
  onMfaCodeChange,
  onLoginSubmit,
  onMfaSubmit,
  onPasskeyLogin,
  onBackToLogin,
}: LoginSurfaceProps) {
  const { t } = useTranslation();

  return (
    <div
      className="login-surface flex-row items-center justify-center"
      inert={preview}
      aria-hidden={preview || undefined}
      style={
        {
          backgroundImage: branding.login_background_url
            ? `linear-gradient(rgba(15,18,23,.72), rgba(15,18,23,.88)), url(${branding.login_background_url})`
            : undefined,
        } as CSSProperties
      }
    >
      <div className="glass-card login-card">
        <div className="text-center login-card__header">
          {branding.logo_url ? (
            <img className="login-card__logo" src={branding.logo_url} alt={branding.product_name} />
          ) : null}
          <h1 className="login-card__title">{branding.login_title || branding.product_name || t('login.title')}</h1>
          <p className="text-muted login-card__description">{branding.login_description || t('login.subtitle')}</p>
        </div>

        {error ? (
          <div className="mb-md">
            <Feedback type="error">{error}</Feedback>
          </div>
        ) : null}

        {!mfaRequired ? (
          <form onSubmit={onLoginSubmit}>
            <FormField label={t('login.usernameLabel')}>
              <input
                type="text"
                className="input-field"
                placeholder={t('login.usernamePlaceholder')}
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                disabled={loading}
                autoFocus={!preview}
              />
            </FormField>

            <FormField label={t('login.passwordLabel')}>
              <input
                type="password"
                className="input-field"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                disabled={loading}
              />
            </FormField>

            <div className="login-card__forgot-password">
              <Link to="/forgot-password">{t('login.forgotPasswordLink')}</Link>
            </div>

            {showDevCredentials && !username && !password ? (
              <div className="login-card__dev-credentials">
                <strong>{t('login.devCredentialsTitle')}</strong> {t('login.devCredentialsPrefix')} <code>admin</code> /{' '}
                <code>admin123</code>. {t('login.devCredentialsSuffix')}
              </div>
            ) : null}

            <button type="submit" className="btn btn-primary login-card__action" disabled={loading}>
              {loading ? t('login.signInLoading') : t('login.signInButton')}
            </button>

            <div className="login-card__separator flex-row items-center gap-md">
              <hr />
              <span className="text-sm text-muted">{t('common.or')}</span>
              <hr />
            </div>

            <button
              type="button"
              className="btn btn-secondary login-card__action flex-row items-center justify-center gap-sm"
              onClick={onPasskeyLogin}
              disabled={passkeyLoading}
            >
              <Key size={16} />
              {passkeyLoading ? t('login.passkeyLoading') : t('login.passkeyButton')}
            </button>
          </form>
        ) : (
          <form onSubmit={onMfaSubmit}>
            <div className="notice-card login-card__mfa-notice">{t('login.mfaRequired')}</div>

            <FormField label={t('login.verificationCodeLabel')}>
              <input
                type="text"
                maxLength={8}
                className="input-field login-card__mfa-code"
                placeholder={t('login.verificationCodePlaceholder')}
                value={mfaCode}
                onChange={(event) => onMfaCodeChange(event.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus={!preview}
              />
            </FormField>

            <button type="submit" className="btn btn-primary login-card__action" disabled={loading}>
              {loading ? t('login.verifyLoading') : t('login.verifyButton')}
            </button>

            <button
              type="button"
              className="btn btn-secondary login-card__action login-card__back"
              onClick={onBackToLogin}
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
