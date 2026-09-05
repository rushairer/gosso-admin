import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import { Button, Card } from '@gouno/ui';

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex-row items-center justify-center p-md not-found-page">
      <Card className="login-card text-center">
        <HelpCircle size={56} color="var(--text-tertiary)" className="mb-md" />
        <h2 className="login-card__title">{t('notFound.title')}</h2>
        <p className="text-muted login-card__description mb-md">{t('notFound.description')}</p>
        <div className="flex-row justify-center gap-md">
          <Button variant="primary" onClick={() => navigate('/')}>
            {t('notFound.goHome')}
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            {t('notFound.goBack')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
