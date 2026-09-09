import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { Alert, Button, Card, FormField, Input } from '@gouno/ui/core';
import { gossoClient } from '../auth';
import { logger } from '../utils/logger';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
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
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 md:p-8">
      <Card variant="elevated" padding="base" className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t('passwordReset.forgotTitle')}</h1>
          <p className="mb-0 mt-2 text-sm leading-relaxed text-muted-foreground">
            {t('passwordReset.forgotDescription')}
          </p>
        </div>

        {error ? <Alert type="error" showIcon title={error} className="mb-5" /> : null}
        {success ? <Alert type="success" showIcon title={t('passwordReset.requestSuccess')} className="mb-5" /> : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label={t('passwordReset.emailLabel')} hint={t('passwordReset.emailHint')} required>
            <Input
              type="email"
              prefix={<Mail />}
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
            variant="solid"
            color="primary"
            className="w-full"
            loading={loading}
            disabled={!email.trim()}
          >
            {t('passwordReset.sendLinkButton')}
          </Button>
        </form>

        <div className="mt-5 text-center">
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">
            {t('passwordReset.backToLogin')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
