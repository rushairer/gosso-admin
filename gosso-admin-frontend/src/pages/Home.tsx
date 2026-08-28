import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight, UserCheck, Key, Settings } from 'lucide-react';
import { useSession } from '@gosso/client/react';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin: userAdmin, profile: user } = useSession();

  const handleAction = () => {
    if (userAdmin) navigate('/system-management');
  };

  return (
    <div className="flex-col gap-2xl">
      <div className="glass-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div className="flex-col gap-xl">
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.12)',
              padding: '12px',
              borderRadius: '8px',
              display: 'inline-flex',
              width: 'fit-content',
              border: '1px solid rgba(59, 130, 246, 0.22)',
            }}
          >
            <ShieldCheck style={{ width: '28px', height: '28px', stroke: 'var(--color-primary)' }} />
          </div>

          <h2 style={{ fontSize: '26px', lineHeight: '1.25', color: 'var(--color-text-main)' }}>{t('home.title')}</h2>

          <p className="text-muted" style={{ fontSize: '15px', maxWidth: '680px', lineHeight: '1.6' }}>
            {t('home.description')}
          </p>

          <div>
            {userAdmin ? (
              <div className="flex-row items-center flex-wrap gap-lg">
                <p
                  className="flex-row items-center gap-xs"
                  style={{
                    color: 'var(--success-color)',
                    fontWeight: '600',
                    fontSize: '15px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success-color)',
                    }}
                  />
                  {t('home.loggedInAs', { name: user?.preferred_username || user?.name || 'Administrator' })}
                </p>
                <button className="btn btn-primary" onClick={handleAction}>
                  {t('home.enterDashboard')}
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            ) : (
              <div className="flex-row items-center flex-wrap gap-lg">
                <p style={{ color: 'var(--warning-color)', fontWeight: '600', fontSize: '15px' }}>
                  {t('home.accessDenied')}
                </p>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                  {t('home.refreshCredentials')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        <div className="glass-card flex-col gap-md" style={{ padding: '24px' }}>
          <div style={{ display: 'inline-flex', color: 'var(--color-primary)' }}>
            <Key style={{ width: '24px', height: '24px' }} />
          </div>
          <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>{t('home.clientRegistry')}</h3>
          <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            {t('home.clientRegistryDescription')}
          </p>
        </div>

        <div className="glass-card flex-col gap-md" style={{ padding: '24px' }}>
          <div style={{ display: 'inline-flex', color: 'var(--color-secondary)' }}>
            <UserCheck style={{ width: '24px', height: '24px' }} />
          </div>
          <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>{t('home.userControl')}</h3>
          <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            {t('home.userControlDescription')}
          </p>
        </div>

        <div className="glass-card flex-col gap-md" style={{ padding: '24px' }}>
          <div style={{ display: 'inline-flex', color: 'var(--color-primary)' }}>
            <Settings style={{ width: '24px', height: '24px' }} />
          </div>
          <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>{t('home.mfaAndPasskeys')}</h3>
          <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            {t('home.mfaAndPasskeysDescription')}
          </p>
        </div>
      </div>
    </div>
  );
}
