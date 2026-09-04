import type { CSSProperties, FormEventHandler } from 'react';
import { Key, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PublicSiteBranding } from '../../types/api';
import { Badge, Button, Feedback, FormField, Input } from '../ui';

interface LoginSurfaceProps {
  branding: PublicSiteBranding;
  username: string;
  password: string;
  error: string | null;
  loading: boolean;
  passkeyLoading: boolean;
  mfaRequired: boolean;
  mfaCode: string;
  isSudoMode?: boolean;
  sudoAccountName?: string;
  showDevCredentials?: boolean;
  preview?: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onMfaCodeChange: (value: string) => void;
  onLoginSubmit: FormEventHandler<HTMLFormElement>;
  onMfaSubmit: FormEventHandler<HTMLFormElement>;
  onPasskeyLogin: () => void;
  onBackToLogin: () => void;
  onSwitchAccount?: () => void;
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
  isSudoMode = false,
  sudoAccountName = '',
  showDevCredentials = false,
  preview = false,
  onUsernameChange,
  onPasswordChange,
  onMfaCodeChange,
  onLoginSubmit,
  onMfaSubmit,
  onPasskeyLogin,
  onBackToLogin,
  onSwitchAccount,
}: LoginSurfaceProps) {
  const { t } = useTranslation();
  const backgroundImage = branding.login_background_url
    ? `linear-gradient(rgba(15,18,23,.72), rgba(15,18,23,.88)), url(${JSON.stringify(branding.login_background_url)})`
    : undefined;

  return (
    <div
      className="login-surface flex-row items-center justify-center"
      inert={preview}
      aria-hidden={preview || undefined}
      style={{ backgroundImage } as CSSProperties}
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

        {isSudoMode ? (
          <form onSubmit={onMfaSubmit}>
            <div className="notice-card notice-card--info notice-card--stacked mb-md">
              <div className="flex-row items-center justify-between gap-sm">
                <div className="flex-row items-center gap-sm">
                  <Shield size={16} className="shrink-0" style={{ color: 'var(--status-info, #38bdf8)' }} />
                  <strong className="text-sm">{t('login.sudoModeTitle')}</strong>
                </div>
                {sudoAccountName && (
                  <Badge
                    tone="neutral"
                    className="text-xs truncate"
                    style={{ maxWidth: '160px' }}
                    title={sudoAccountName}
                  >
                    {sudoAccountName}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted m-0 leading-relaxed">
                {t('login.sudoModeNotice', {
                  user: sudoAccountName,
                  defaultValue: '您正在执行敏感管理操作，请输入身份验证器动态码或使用通行密钥完成验证。',
                })}
              </p>
            </div>

            <FormField label={t('login.verificationCodeLabel')}>
              <Input
                type="text"
                maxLength={8}
                className="login-card__mfa-code"
                placeholder={t('login.verificationCodePlaceholder')}
                value={mfaCode}
                onChange={(event) => onMfaCodeChange(event.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus={!preview}
              />
            </FormField>

            <Button type="submit" variant="primary" className="login-card__action" loading={loading}>
              {loading ? t('login.verifyLoading') : t('login.verifyButton')}
            </Button>

            <div className="login-card__separator flex-row items-center gap-md">
              <hr />
              <span className="text-sm text-muted">{t('common.or')}</span>
              <hr />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="login-card__action flex-row items-center justify-center gap-sm"
              onClick={onPasskeyLogin}
              loading={passkeyLoading}
              icon={<Key size={16} />}
            >
              {passkeyLoading ? t('login.passkeyLoading') : t('login.passkeyStepUpButton')}
            </Button>

            {onSwitchAccount && (
              <Button
                type="button"
                variant="ghost"
                className="login-card__action login-card__back mt-sm"
                onClick={onSwitchAccount}
                disabled={loading}
              >
                {t('login.switchAccount')}
              </Button>
            )}
          </form>
        ) : !mfaRequired ? (
          <form onSubmit={onLoginSubmit}>
            <FormField label={t('login.usernameLabel')}>
              <Input
                type="text"
                placeholder={t('login.usernamePlaceholder')}
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                disabled={loading}
                autoFocus={!preview}
              />
            </FormField>

            <FormField label={t('login.passwordLabel')}>
              <Input
                type="password"
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

            <Button type="submit" variant="primary" className="login-card__action" loading={loading}>
              {loading ? t('login.signInLoading') : t('login.signInButton')}
            </Button>

            <div className="login-card__separator flex-row items-center gap-md">
              <hr />
              <span className="text-sm text-muted">{t('common.or')}</span>
              <hr />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="login-card__action flex-row items-center justify-center gap-sm"
              onClick={onPasskeyLogin}
              loading={passkeyLoading}
              icon={<Key size={16} />}
            >
              {passkeyLoading ? t('login.passkeyLoading') : t('login.passkeyButton')}
            </Button>
          </form>
        ) : (
          <form onSubmit={onMfaSubmit}>
            <div className="notice-card login-card__mfa-notice">{t('login.mfaRequired')}</div>

            <FormField label={t('login.verificationCodeLabel')}>
              <Input
                type="text"
                maxLength={8}
                className="login-card__mfa-code"
                placeholder={t('login.verificationCodePlaceholder')}
                value={mfaCode}
                onChange={(event) => onMfaCodeChange(event.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus={!preview}
              />
            </FormField>

            <Button type="submit" variant="primary" className="login-card__action" loading={loading}>
              {loading ? t('login.verifyLoading') : t('login.verifyButton')}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="login-card__action login-card__back"
              onClick={onBackToLogin}
              disabled={loading}
            >
              {t('login.backToLogin')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
