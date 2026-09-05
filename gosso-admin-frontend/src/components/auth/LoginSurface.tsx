import type { CSSProperties, FormEventHandler } from 'react';
import { Key, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
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
  accountMismatch?: { target: string; current: string };
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
  accountMismatch,
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
    ? `linear-gradient(rgba(15,18,23,.75), rgba(15,18,23,.90)), url(${JSON.stringify(branding.login_background_url)})`
    : undefined;

  return (
    <div
      className="login-surface flex min-h-screen w-full items-center justify-center bg-background bg-cover bg-center p-4 md:p-8"
      inert={preview}
      aria-hidden={preview || undefined}
      style={{ backgroundImage } as CSSProperties}
    >
      <div className="login-card w-full max-w-md rounded-2xl border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-xl transition-all">
        {/* Header */}
        <div className="text-center mb-8">
          {branding.logo_url ? (
            <img
              className="mx-auto mb-4 max-h-14 max-w-[160px] object-contain"
              src={branding.logo_url}
              alt={branding.product_name}
            />
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {branding.login_title || branding.product_name || t('login.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{branding.login_description || t('login.subtitle')}</p>
        </div>

        {error ? (
          <div className="mb-6">
            <Feedback type="error">{error}</Feedback>
          </div>
        ) : null}

        {isSudoMode ? (
          <form onSubmit={onMfaSubmit} className="space-y-4">
            <div className="rounded-lg border border-sky-500/30 bg-sky-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="shrink-0 text-sky-400" />
                  <strong className="text-sm font-semibold text-foreground">{t('login.sudoModeTitle')}</strong>
                </div>
                {sudoAccountName && (
                  <Badge tone="neutral" className="text-xs truncate max-w-[160px]" title={sudoAccountName}>
                    {sudoAccountName}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground m-0 leading-relaxed">
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
                className="text-center text-xl font-bold tracking-widest"
                placeholder={t('login.verificationCodePlaceholder')}
                value={mfaCode}
                onChange={(event) => onMfaCodeChange(event.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus={!preview}
              />
            </FormField>

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              {loading ? t('login.verifyLoading') : t('login.verifyButton')}
            </Button>

            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase bg-card px-2 text-muted-foreground font-medium">
                {t('common.or')}
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
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
                className="w-full mt-2"
                onClick={onSwitchAccount}
                disabled={loading}
              >
                {t('login.switchAccount')}
              </Button>
            )}
          </form>
        ) : !mfaRequired ? (
          <form onSubmit={onLoginSubmit} className="space-y-4">
            {accountMismatch && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 space-y-2 mb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="shrink-0 text-amber-400" />
                    <strong className="text-sm font-semibold text-foreground">{t('login.accountMismatchTitle')}</strong>
                  </div>
                  <Badge tone="warning" className="text-xs truncate max-w-[160px]" title={accountMismatch.target}>
                    {accountMismatch.target}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground m-0 leading-relaxed">
                  <Trans
                    i18nKey="login.accountMismatchNotice"
                    values={{
                      target: accountMismatch.target,
                      current: accountMismatch.current,
                    }}
                    components={{ strong: <strong /> }}
                  />
                </p>
                {onSwitchAccount && (
                  <div className="mt-2">
                    <Button type="button" variant="secondary" size="sm" onClick={onSwitchAccount} disabled={loading}>
                      {t('login.switchAccount')}
                    </Button>
                  </div>
                )}
              </div>
            )}

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

            <div className="text-right text-xs -mt-2 mb-4">
              <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                {t('login.forgotPasswordLink')}
              </Link>
            </div>

            {showDevCredentials && !username && !password ? (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-primary">{t('login.devCredentialsTitle')}</strong>{' '}
                {t('login.devCredentialsPrefix')} <code className="text-primary font-mono">admin</code> /{' '}
                <code className="text-sky-300 font-mono">admin123</code>. {t('login.devCredentialsSuffix')}
              </div>
            ) : null}

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              {loading ? t('login.signInLoading') : t('login.signInButton')}
            </Button>

            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase bg-card px-2 text-muted-foreground font-medium">
                {t('common.or')}
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
              onClick={onPasskeyLogin}
              loading={passkeyLoading}
              icon={<Key size={16} />}
            >
              {passkeyLoading ? t('login.passkeyLoading') : t('login.passkeyButton')}
            </Button>
          </form>
        ) : (
          <form onSubmit={onMfaSubmit} className="space-y-4">
            <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-4 text-sm text-primary font-medium">
              {t('login.mfaRequired')}
            </div>

            <FormField label={t('login.verificationCodeLabel')}>
              <Input
                type="text"
                maxLength={8}
                className="text-center text-xl font-bold tracking-widest"
                placeholder={t('login.verificationCodePlaceholder')}
                value={mfaCode}
                onChange={(event) => onMfaCodeChange(event.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus={!preview}
              />
            </FormField>

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              {loading ? t('login.verifyLoading') : t('login.verifyButton')}
            </Button>

            <Button type="button" variant="secondary" className="w-full" onClick={onBackToLogin} disabled={loading}>
              {t('login.backToLogin')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
