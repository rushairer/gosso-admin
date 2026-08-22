import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearPostLoginRedirect, getPostLoginRedirect, gossoClient } from '../auth';
import { routerPath } from '../config/appPaths';
import { logger } from '../utils/logger';
import { LoadingSpinner } from '../components/ui';

export default function Callback() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      setError(t('auth.invalidCallbackParams'));
      return;
    }

    async function handleCallback() {
      try {
        await gossoClient.exchangeCodeForToken(code!, state!);
        await gossoClient.fetchUserProfile();

        // Redirect back to the post-login destination or default to admin panel
        const postLoginRedirect = getPostLoginRedirect('/admin');
        clearPostLoginRedirect();
        navigate(routerPath(postLoginRedirect));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('Auth callback error', err);
        setError(message || t('auth.codeExchangeFailed'));
      }
    }

    handleCallback();
  }, [searchParams, navigate, t]);

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{t('auth.authenticationError')}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '14.5px' }}>{error}</p>
          <a href="/" className="btn btn-primary" style={{ display: 'inline-block' }}>
            {t('auth.goHome')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px' }}>{t('auth.authenticating')}</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14.5px' }}>{t('auth.authenticatingDescription')}</p>
        <LoadingSpinner size="md" style={{ margin: '24px auto 0 auto' }} />
      </div>
    </div>
  );
}
