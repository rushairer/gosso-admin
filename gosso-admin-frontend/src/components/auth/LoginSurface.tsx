import type { CSSProperties, FormEventHandler, ReactNode } from 'react';
import { KeyRound, Shield, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import type { PublicSiteBranding } from '../../types/api';
import { Alert, Button, Card, FormField, Heading, Input, Tag, Text } from '@gouno/ui/core';

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

function DividerLabel({ children }: { children: ReactNode }) {
  return (
    <div className="relative my-5 flex items-center justify-center">
      <div className="absolute inset-x-0 border-t" />
      <span className="relative bg-card px-2 text-xs uppercase text-muted-foreground">{children}</span>
    </div>
  );
}

function LoginForm({
  preview,
  onSubmit,
  children,
}: {
  preview: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}) {
  const className = 'flex flex-col gap-4';
  if (preview) return <div className={className}>{children}</div>;
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
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
      data-slot="login-surface"
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background bg-cover bg-center p-4 sm:p-8"
      inert={preview}
      aria-hidden={preview || undefined}
      style={{ backgroundImage } as CSSProperties}
    >
      {!backgroundImage ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_38%),radial-gradient(circle_at_90%_90%,color-mix(in_srgb,var(--muted-foreground)_10%,transparent),transparent_42%)]"
        />
      ) : null}
      <Card
        variant="elevated"
        padding="lg"
        className="relative w-full max-w-md border-border/80 bg-raised/95 backdrop-blur"
      >
        <div className="mb-7 text-center">
          {branding.logo_url ? (
            <img
              className="mx-auto mb-4 max-h-14 max-w-40 object-contain"
              src={branding.logo_url}
              alt={branding.product_name}
            />
          ) : (
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck aria-hidden="true" className="size-6" />
            </div>
          )}
          <Heading level={1} className="text-2xl font-bold tracking-tight">
            {branding.login_title || branding.product_name || t('login.title')}
          </Heading>
          <Text tone="muted" size="sm" className="mt-2 leading-relaxed">
            {branding.login_description || t('login.subtitle')}
          </Text>
        </div>

        {error ? <Alert type="error" showIcon title={error} className="mb-5" /> : null}

        {isSudoMode ? (
          <LoginForm preview={preview} onSubmit={onMfaSubmit}>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Shield aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  <strong className="text-sm font-semibold">{t('login.sudoModeTitle')}</strong>
                </div>
                {sudoAccountName ? (
                  <Tag className="max-w-40 truncate" title={sudoAccountName}>
                    {sudoAccountName}
                  </Tag>
                ) : null}
              </div>
              <p className="mb-0 mt-2 text-sm leading-relaxed text-muted-foreground">
                {t('login.sudoModeNotice', {
                  user: sudoAccountName,
                  defaultValue: '您正在执行敏感管理操作，请输入身份验证器动态码或使用通行密钥完成验证。',
                })}
              </p>
            </div>

            <FormField label={t('login.verificationCodeLabel')} required>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={8}
                className="text-center text-xl font-bold tracking-[0.28em]"
                placeholder={t('login.verificationCodePlaceholder')}
                value={mfaCode}
                onChange={(event) => onMfaCodeChange(event.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus={!preview}
              />
            </FormField>

            <Button type="submit" variant="solid" color="primary" className="w-full" loading={loading}>
              {loading ? t('login.verifyLoading') : t('login.verifyButton')}
            </Button>
            <DividerLabel>{t('common.or')}</DividerLabel>
            <Button
              type="button"
              className="w-full"
              onClick={onPasskeyLogin}
              loading={passkeyLoading}
              icon={<KeyRound />}
            >
              {passkeyLoading ? t('login.passkeyLoading') : t('login.passkeyStepUpButton')}
            </Button>
            {onSwitchAccount ? (
              <Button type="button" variant="ghost" className="w-full" onClick={onSwitchAccount} disabled={loading}>
                {t('login.switchAccount')}
              </Button>
            ) : null}
          </LoginForm>
        ) : !mfaRequired ? (
          <LoginForm preview={preview} onSubmit={onLoginSubmit}>
            {accountMismatch ? (
              <Alert
                type="warning"
                showIcon
                title={t('login.accountMismatchTitle')}
                description={
                  <Trans
                    i18nKey="login.accountMismatchNotice"
                    values={{ target: accountMismatch.target, current: accountMismatch.current }}
                    components={{ strong: <strong /> }}
                  />
                }
                action={
                  onSwitchAccount ? (
                    <Button type="button" size="small" onClick={onSwitchAccount} disabled={loading}>
                      {t('login.switchAccount')}
                    </Button>
                  ) : undefined
                }
              />
            ) : null}

            <FormField label={t('login.usernameLabel')} required>
              <Input
                type="text"
                placeholder={t('login.usernamePlaceholder')}
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                disabled={loading}
                autoFocus={!preview}
              />
            </FormField>
            <FormField label={t('login.passwordLabel')} required>
              <Input
                type="password"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                disabled={loading}
              />
            </FormField>
            <div className="-mt-2 text-right text-xs">
              <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                {t('login.forgotPasswordLink')}
              </Link>
            </div>

            {showDevCredentials && !username && !password ? (
              <Alert
                type="info"
                title={t('login.devCredentialsTitle')}
                description={
                  <>
                    {t('login.devCredentialsPrefix')} <code className="font-mono">admin</code> /{' '}
                    <code className="font-mono">admin123</code>. {t('login.devCredentialsSuffix')}
                  </>
                }
              />
            ) : null}

            <Button type="submit" variant="solid" color="primary" className="w-full" loading={loading}>
              {loading ? t('login.signInLoading') : t('login.signInButton')}
            </Button>
            <DividerLabel>{t('common.or')}</DividerLabel>
            <Button
              type="button"
              className="w-full"
              onClick={onPasskeyLogin}
              loading={passkeyLoading}
              icon={<KeyRound />}
            >
              {passkeyLoading ? t('login.passkeyLoading') : t('login.passkeyButton')}
            </Button>
          </LoginForm>
        ) : (
          <LoginForm preview={preview} onSubmit={onMfaSubmit}>
            <Alert type="info" showIcon title={t('login.mfaRequired')} />
            <FormField label={t('login.verificationCodeLabel')} required>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={8}
                className="text-center text-xl font-bold tracking-[0.28em]"
                placeholder={t('login.verificationCodePlaceholder')}
                value={mfaCode}
                onChange={(event) => onMfaCodeChange(event.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus={!preview}
              />
            </FormField>
            <Button type="submit" variant="solid" color="primary" className="w-full" loading={loading}>
              {loading ? t('login.verifyLoading') : t('login.verifyButton')}
            </Button>
            <Button type="button" className="w-full" onClick={onBackToLogin} disabled={loading}>
              {t('login.backToLogin')}
            </Button>
          </LoginForm>
        )}
      </Card>
    </div>
  );
}
