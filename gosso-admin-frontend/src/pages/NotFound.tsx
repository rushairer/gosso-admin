import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Home } from 'lucide-react';
import { Button, Card, Result, Text } from '@gouno/ui/core';

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[520px] items-center justify-center py-8">
      <Card padding="none" variant="elevated" className="w-full max-w-lg">
        <Result
          status="info"
          headingLevel={1}
          title={t('notFound.title')}
          description={t('notFound.description')}
          extra={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="solid" color="primary" icon={<Home />} onClick={() => navigate('/')}>
                {t('notFound.goHome')}
              </Button>
              <Button icon={<ArrowLeft />} onClick={() => navigate(-1)}>
                {t('notFound.goBack')}
              </Button>
            </div>
          }
        >
          <Text as="div" size="sm" tone="muted" className="font-mono">
            {window.location.pathname}
          </Text>
        </Result>
      </Card>
    </div>
  );
}
