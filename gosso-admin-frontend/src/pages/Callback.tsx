import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthCallback } from '@gosso/client/react';
import { routerPath } from '../config/appPaths';
import { LoadingSpinner } from '../components/ui';

export default function Callback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleSuccess = useCallback((redirectTo: string) => navigate(routerPath(redirectTo)), [navigate]);

  return (
    <AuthCallback
      onSuccess={handleSuccess}
      renderError={(error, detail) => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{t('auth.authenticationError')}</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '14.5px' }}>
              {detail?.code === 'CALLBACK_PARAMS_MISSING'
                ? t('auth.invalidCallbackParams')
                : error || t('auth.codeExchangeFailed')}
            </p>
            <a href="/" className="btn btn-primary">
              {t('auth.goHome')}
            </a>
          </div>
        </div>
      )}
      renderLoading={() => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '16px' }}>{t('auth.authenticating')}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14.5px' }}>
              {t('auth.authenticatingDescription')}
            </p>
            <LoadingSpinner size="md" style={{ margin: '24px auto 0 auto' }} />
          </div>
        </div>
      )}
    />
  );
}
