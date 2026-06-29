import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { Feedback, FormField } from '../components/ui';
import { logger } from '../utils/logger';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/v1/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error(t('passwordReset.requestFailed'));
      }

      setSuccess(true);
    } catch (err: unknown) {
      logger.error('Password reset request failed', err);
      setError(err instanceof Error ? err.message : t('passwordReset.requestFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-row items-center justify-center" style={{ minHeight: '100vh', padding: '24px' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center" style={{ marginBottom: '28px' }}>
          <h1 style={{ color: 'var(--color-text-main)', fontSize: '28px', marginBottom: '8px' }}>
            {t('passwordReset.forgotTitle')}
          </h1>
          <p className="text-muted" style={{ fontSize: '14.5px', lineHeight: 1.6 }}>
            {t('passwordReset.forgotDescription')}
          </p>
        </div>

        {error && (
          <div className="mb-md">
            <Feedback type="error">{error}</Feedback>
          </div>
        )}

        {success && (
          <div className="mb-md">
            <Feedback type="success">{t('passwordReset.requestSuccess')}</Feedback>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField label={t('passwordReset.emailLabel')} hint={t('passwordReset.emailHint')}>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                aria-label={t('passwordReset.emailLabel')}
                placeholder={t('passwordReset.emailPlaceholder')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
                autoFocus
                style={{ paddingLeft: '38px' }}
              />
              <Mail
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: 'var(--color-text-muted)',
                }}
              />
            </div>
          </FormField>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !email.trim()}>
            {loading ? t('passwordReset.sending') : t('passwordReset.sendLinkButton')}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '18px' }}>
          <Link to="/login" style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            {t('passwordReset.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
