import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { Button, Card, Feedback, FormField, Input } from '@gouno/ui';
import { gossoClient } from '../auth';
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
      await gossoClient.requestPasswordReset(email.trim());
      setSuccess(true);
    } catch (err: unknown) {
      logger.error('Password reset request failed', err);
      setError(err instanceof Error ? err.message : t('passwordReset.requestFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-surface flex-row items-center justify-center">
      <Card className="login-card">
        <div className="text-center mb-md">
          <h1 className="login-card__title">{t('passwordReset.forgotTitle')}</h1>
          <p className="text-muted login-card__description">{t('passwordReset.forgotDescription')}</p>
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
            <Input
              type="email"
              prefixIcon={<Mail size={16} />}
              aria-label={t('passwordReset.emailLabel')}
              placeholder={t('passwordReset.emailPlaceholder')}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            className="login-card__action"
            loading={loading}
            disabled={!email.trim()}
          >
            {t('passwordReset.sendLinkButton')}
          </Button>
        </form>

        <div className="text-center mt-md">
          <Link to="/login" className="btn-link">
            {t('passwordReset.backToLogin')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
