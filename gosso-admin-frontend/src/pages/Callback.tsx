import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authSession, exchangeCodeForToken, fetchUserProfile } from '../auth';
import { logger } from '../utils/logger';

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
        const tokenSet = await exchangeCodeForToken(code!, state!);
        await fetchUserProfile(tokenSet.access_token);

        // Redirect back to the post-login destination or default to admin panel
        const postLoginRedirect = authSession.getPostLoginRedirect('/admin');
        authSession.clearPostLoginRedirect();
        navigate(postLoginRedirect);
      } catch (err: any) {
        logger.error('Auth callback error', err);
        setError(err.message || t('auth.codeExchangeFailed'));
      }
    }

    handleCallback();
  }, [searchParams, navigate]);

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
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14.5px' }}>
          {t('auth.authenticatingDescription')}
        </p>
        <div
          style={{
            margin: '24px auto 0 auto',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--color-primary)',
            animation: 'spin 1s linear infinite',
          }}
        ></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
