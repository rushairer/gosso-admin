import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button, Card, Feedback, FormField, IconButton, Input } from '../components/ui';
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

  const handleSubmit = async (event: React.FormEvent) => {
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
    <div className="login-surface flex-row items-center justify-center">
      <Card className="login-card">
        <div className="text-center mb-md">
          <h1 className="login-card__title">{t('passwordReset.resetTitle')}</h1>
          <p className="text-muted login-card__description">{t('passwordReset.resetDescription')}</p>
        </div>

        {error && (
          <div className="mb-md">
            <Feedback type="error">{error}</Feedback>
          </div>
        )}

        {success && (
          <div className="mb-md">
            <Feedback type="success">{t('passwordReset.resetSuccess')}</Feedback>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <FormField label={t('passwordReset.newPasswordLabel')}>
              <Input
                type={showPassword ? 'text' : 'password'}
                aria-label={t('passwordReset.newPasswordLabel')}
                placeholder={t('passwordReset.newPasswordPlaceholder')}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={loading || !token}
                required
                autoFocus={Boolean(token)}
                suffixIcon={
                  <IconButton
                    label={showPassword ? t('passwordReset.hidePassword') : t('passwordReset.showPassword')}
                    icon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    variant="ghost"
                    size="sm"
                    disabled={!token}
                    onClick={() => setShowPassword(!showPassword)}
                  />
                }
              />
            </FormField>

            <FormField label={t('passwordReset.confirmPasswordLabel')}>
              <Input
                type="password"
                aria-label={t('passwordReset.confirmPasswordLabel')}
                placeholder={t('passwordReset.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={loading || !token}
                required
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              className="login-card__action"
              loading={loading}
              disabled={loading || !token}
              icon={<Lock size={16} />}
            >
              {t('passwordReset.resetButton')}
            </Button>
          </form>
        )}

        <div className="text-center mt-md">
          <Link to="/login" className="btn-link">
            {t('passwordReset.backToLogin')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
