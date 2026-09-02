import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthCallback } from '@gosso/client/react';
import { routerPath } from '../config/appPaths';
import { ButtonLink, Card, LoadingSpinner } from '../components/ui';

export default function Callback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleSuccess = useCallback((redirectTo: string) => navigate(routerPath(redirectTo)), [navigate]);

  return (
    <AuthCallback
      onSuccess={handleSuccess}
      renderError={(error, detail) => (
        <div className="login-surface flex-row items-center justify-center">
          <Card className="login-card text-center">
            <h2 className="login-card__title" style={{ color: 'var(--status-danger)' }}>
              {t('auth.authenticationError')}
            </h2>
            <p className="text-muted login-card__description mb-md">
              {detail?.code === 'CALLBACK_PARAMS_MISSING'
                ? t('auth.invalidCallbackParams')
                : error || t('auth.codeExchangeFailed')}
            </p>
            <ButtonLink to="/" variant="primary">
              {t('auth.goHome')}
            </ButtonLink>
          </Card>
        </div>
      )}
      renderLoading={() => (
        <div className="login-surface flex-row items-center justify-center">
          <Card className="login-card text-center">
            <h2 className="login-card__title">{t('auth.authenticating')}</h2>
            <p className="text-muted login-card__description mb-md">{t('auth.authenticatingDescription')}</p>
            <LoadingSpinner size="md" />
          </Card>
        </div>
      )}
    />
  );
}
