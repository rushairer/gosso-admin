import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthCallback } from '@gosso/client/react';
import { routerPath } from '../config/appPaths';
import { Alert, ButtonLink, Card, Spinner, Text } from '@gouno/ui/core';

export default function Callback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleSuccess = useCallback((redirectTo: string) => navigate(routerPath(redirectTo)), [navigate]);

  return (
    <AuthCallback
      onSuccess={handleSuccess}
      renderError={(error, detail) => (
        <div className="flex min-h-screen items-center justify-center bg-canvas p-4 md:p-8">
          <Card variant="elevated" padding="base" className="w-full max-w-md text-center">
            <h1 className="text-2xl font-bold tracking-tight">{t('auth.authenticationError')}</h1>
            <Text size="sm" tone="muted" className="mt-2 leading-relaxed">
              {t('auth.authenticationErrorDescription', {
                defaultValue: '授权回调参数无效或授权码交换失败。',
              })}
            </Text>
            <Alert
              type="error"
              showIcon
              className="mt-5 text-left"
              title={
                detail?.code === 'CALLBACK_PARAMS_MISSING'
                  ? t('auth.invalidCallbackParams')
                  : error || t('auth.codeExchangeFailed')
              }
            />
            <div className="mt-5">
              <ButtonLink to="/" variant="solid" color="primary" block>
                {t('auth.goHome')}
              </ButtonLink>
            </div>
          </Card>
        </div>
      )}
      renderLoading={() => (
        <div className="flex min-h-screen items-center justify-center bg-canvas p-4 md:p-8">
          <Card variant="elevated" padding="base" className="w-full max-w-md text-center">
            <h1 className="text-2xl font-bold tracking-tight">{t('auth.authenticating')}</h1>
            <Text size="sm" tone="muted" className="mt-2 leading-relaxed">
              {t('auth.authenticatingDescription')}
            </Text>
            <div className="mt-6 flex flex-col items-center gap-4 py-2" role="status">
              <Spinner className="size-6" aria-label={t('auth.authenticating')} />
              <Text size="sm" tone="muted">
                OAuth 2.0 Authorization Code + PKCE
              </Text>
            </div>
          </Card>
        </div>
      )}
    />
  );
}
