import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, HelpCircle, Home } from 'lucide-react';
import { Button, Card, Heading, Text } from '@gouno/ui/core';

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[520px] items-center justify-center py-8">
      <Card padding="lg" variant="elevated" className="w-full max-w-lg text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <HelpCircle aria-hidden="true" className="size-7" />
        </div>
        <Heading level={1} className="text-2xl tracking-tight">
          {t('notFound.title')}
        </Heading>
        <Text size="sm" tone="muted" className="mx-auto mt-2 max-w-md leading-relaxed">
          {t('notFound.description')}
        </Text>
        <Text size="sm" tone="muted" className="mt-3 font-mono">
          {window.location.pathname}
        </Text>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="solid" color="primary" icon={<Home />} onClick={() => navigate('/')}>
            {t('notFound.goHome')}
          </Button>
          <Button icon={<ArrowLeft />} onClick={() => navigate(-1)}>
            {t('notFound.goBack')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
