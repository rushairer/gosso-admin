import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        padding: '32px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <HelpCircle
          style={{
            width: '64px',
            height: '64px',
            color: 'var(--color-text-dark)',
            marginBottom: '24px',
            display: 'inline-block',
          }}
        />
        <h2 style={{ color: 'var(--color-text-main)', marginBottom: '8px', fontSize: '24px' }}>
          {t('notFound.title')}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginBottom: '24px' }}>
          {t('notFound.description')}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            {t('notFound.goHome')}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            {t('notFound.goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}
