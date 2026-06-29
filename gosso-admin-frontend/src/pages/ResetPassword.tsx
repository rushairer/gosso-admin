import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Feedback, FormField } from '../components/ui';
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
      const response = await fetch('/api/v1/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!response.ok) {
        throw new Error(t('passwordReset.resetFailed'));
      }

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
    <div className="flex-row items-center justify-center" style={{ minHeight: '100vh', padding: '24px' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center" style={{ marginBottom: '28px' }}>
          <h1 style={{ color: 'var(--color-text-main)', fontSize: '28px', marginBottom: '8px' }}>
            {t('passwordReset.resetTitle')}
          </h1>
          <p className="text-muted" style={{ fontSize: '14.5px', lineHeight: 1.6 }}>
            {t('passwordReset.resetDescription')}
          </p>
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
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  aria-label={t('passwordReset.newPasswordLabel')}
                  placeholder={t('passwordReset.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={loading || !token}
                  required
                  autoFocus={Boolean(token)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={!token}
                  aria-label={showPassword ? t('passwordReset.hidePassword') : t('passwordReset.showPassword')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </FormField>

            <FormField label={t('passwordReset.confirmPasswordLabel')}>
              <input
                type="password"
                className="input-field"
                aria-label={t('passwordReset.confirmPasswordLabel')}
                placeholder={t('passwordReset.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={loading || !token}
                required
              />
            </FormField>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !token}>
              <Lock style={{ width: '16px', height: '16px' }} />
              {loading ? t('passwordReset.resetting') : t('passwordReset.resetButton')}
            </button>
          </form>
        )}

        <div className="text-center" style={{ marginTop: '18px' }}>
          <Link to="/login" style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            {t('passwordReset.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
