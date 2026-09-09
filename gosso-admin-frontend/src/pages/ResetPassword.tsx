import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Alert, Button, Card, FormField, IconButton, Input } from '@gouno/ui/core';
import { gossoClient } from '../auth';
import { logger } from '../utils/logger';

function readTokenFromHash(hash: string): string {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  return (params.get('token') || '').trim();
}

export default function ResetPassword() {
  const { t } = useTranslation();
  const location = useLocation();
  const token = useMemo(() => readTokenFromHash(location.hash), [location.hash]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : t('passwordReset.invalidLink'));
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    if (!token) {
      setError(t('passwordReset.invalidLink'));
      return;
    }
    if (newPassword.length < 12) {
      setError(t('passwordReset.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwordReset.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    try {
      await gossoClient.resetPassword(token, newPassword);
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      logger.error('Password reset failed', err);
      setError(err instanceof Error ? err.message : t('passwordReset.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 md:p-8">
      <Card variant="elevated" padding="base" className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t('passwordReset.resetTitle')}</h1>
          <p className="mb-0 mt-2 text-sm leading-relaxed text-muted-foreground">
            {t('passwordReset.resetDescription')}
          </p>
        </div>

        {error ? <Alert type="error" showIcon title={error} className="mb-5" /> : null}
        {success ? (
          <Alert type="success" showIcon title={t('passwordReset.resetSuccess')} className="mb-5" />
        ) : null}

        {!success ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label={t('passwordReset.newPasswordLabel')} required hint={t('passwordReset.passwordHint')}>
              <Input
                type={showPassword ? 'text' : 'password'}
                aria-label={t('passwordReset.newPasswordLabel')}
                placeholder={t('passwordReset.newPasswordPlaceholder')}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={loading || !token}
                required
                autoComplete="new-password"
                autoFocus={Boolean(token)}
                suffix={
                  <IconButton
                    label={showPassword ? t('passwordReset.hidePassword') : t('passwordReset.showPassword')}
                    icon={showPassword ? <EyeOff /> : <Eye />}
                    variant="ghost"
                    size="small"
                    disabled={!token}
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                  />
                }
              />
            </FormField>
            <FormField label={t('passwordReset.confirmPasswordLabel')} required>
              <Input
                type="password"
                aria-label={t('passwordReset.confirmPasswordLabel')}
                placeholder={t('passwordReset.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={loading || !token}
                required
                autoComplete="new-password"
              />
            </FormField>
            <Button
              type="submit"
              variant="solid"
              color="primary"
              className="w-full"
              loading={loading}
              disabled={loading || !token}
              icon={<Lock />}
            >
              {t('passwordReset.resetButton')}
            </Button>
          </form>
        ) : null}

        <div className="mt-5 text-center">
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">
            {t('passwordReset.backToLogin')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
