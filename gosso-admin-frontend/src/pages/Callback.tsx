import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthCallback } from '@gosso/client/react';
import { routerPath } from '../config/appPaths';
import { Alert, ButtonLink, Spinner, Text } from '@gouno/ui/core';
import AuthPageSurface from '../components/auth/AuthPageSurface';

export default function Callback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleSuccess = useCallback((redirectTo: string) => navigate(routerPath(redirectTo)), [navigate]);

  return (
    <AuthCallback
      onSuccess={handleSuccess}
      renderError={(error, detail) => (
        <AuthPageSurface title={t('auth.authenticationError')} description={t('auth.codeExchangeFailed')}>
          <div className="flex flex-col gap-4">
            <Alert
              type="error"
              showIcon
              title={
                detail?.code === 'CALLBACK_PARAMS_MISSING'
                  ? t('auth.invalidCallbackParams')
                  : error || t('auth.codeExchangeFailed')
              }
            />
            <ButtonLink to="/" variant="solid" color="primary" block>
              {t('auth.goHome')}
            </ButtonLink>
          </div>
        </AuthPageSurface>
      )}
      renderLoading={() => (
        <AuthPageSurface title={t('auth.authenticating')} description={t('auth.authenticatingDescription')}>
          <div className="flex flex-col items-center gap-4 py-4" role="status">
            <Spinner className="size-6" aria-label={t('auth.authenticating')} />
            <Text size="sm" tone="muted">
              OAuth 2.0 Authorization Code + PKCE
            </Text>
          </div>
        </AuthPageSurface>
      )}
    />
  );
}
